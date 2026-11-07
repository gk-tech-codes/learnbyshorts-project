#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="${EXPECTED_ACCOUNT_ID:-464994449735}"
AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-learnbyshorts-deployer}"
AWS_REGION_NAME="${AWS_REGION_NAME:-us-east-1}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-E1A3IB2N57BAED}"
FUNCTION_NAME="${FUNCTION_NAME:-learnbyshorts-viewer-request}"
POLICY_NAME="${POLICY_NAME:-learnbyshorts-security-headers}"
FUNCTION_CODE="infra/cloudfront-viewer-request.js"
POLICY_CONFIG="infra/response-headers-policy.json"
APPLY=false

usage() {
  cat <<'EOF'
Usage: tools/configure-cloudfront-edge.sh [--apply]

The default is a no-write plan. --apply publishes the LearnByShorts
viewer-request function, creates or reuses the named response-headers policy,
and associates both with the exact configured distribution.

Required least-privilege actions:
  cloudfront:CreateFunction
  cloudfront:DescribeFunction
  cloudfront:UpdateFunction
  cloudfront:PublishFunction
  cloudfront:ListResponseHeadersPolicies
  cloudfront:CreateResponseHeadersPolicy
  cloudfront:GetDistributionConfig
  cloudfront:UpdateDistribution
EOF
}

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

for required in aws jq; do
  if ! command -v "$required" >/dev/null; then
    echo "Missing required command: $required" >&2
    exit 1
  fi
done

for required_file in "$FUNCTION_CODE" "$POLICY_CONFIG"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Missing $required_file; run this script from the repository root." >&2
    exit 1
  fi
done

account_id="$(AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws sts get-caller-identity --query Account --output text)"
if [[ "$account_id" != "$EXPECTED_ACCOUNT_ID" ]]; then
  echo "Refusing configuration: expected AWS account $EXPECTED_ACCOUNT_ID." >&2
  exit 1
fi

if [[ "$APPLY" != "true" ]]; then
  echo "Dry run for account $account_id, distribution $DISTRIBUTION_ID:"
  echo "- publish CloudFront Function $FUNCTION_NAME"
  echo "- create or reuse response policy $POLICY_NAME"
  echo "- preserve the distribution config and refuse to replace an unknown viewer-request function"
  echo "- attach canonical-host redirects, legacy redirects, nested URI rewrites, and security headers"
  echo "Re-run with --apply using a principal with the listed least-privilege actions."
  exit 0
fi

edge_tmp="$(mktemp -d "${TMPDIR:-/tmp}/learnbyshorts-edge.XXXXXX")"
trap 'rm -rf "$edge_tmp"' EXIT

function_description="$edge_tmp/function-description.json"
if AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws cloudfront describe-function \
    --name "$FUNCTION_NAME" \
    --stage DEVELOPMENT >"$function_description" 2>/dev/null; then
  function_etag="$(jq -r '.ETag' "$function_description")"
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cloudfront update-function \
      --name "$FUNCTION_NAME" \
      --if-match "$function_etag" \
      --function-config "Comment=Canonical host and route rewrites,Runtime=cloudfront-js-2.0" \
      --function-code "fileb://$FUNCTION_CODE" >"$function_description"
else
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cloudfront create-function \
      --name "$FUNCTION_NAME" \
      --function-config "Comment=Canonical host and route rewrites,Runtime=cloudfront-js-2.0" \
      --function-code "fileb://$FUNCTION_CODE" >"$function_description"
fi

function_etag="$(jq -r '.ETag' "$function_description")"
AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws cloudfront publish-function \
    --name "$FUNCTION_NAME" \
    --if-match "$function_etag" >"$function_description"
function_arn="$(jq -r '.FunctionSummary.FunctionMetadata.FunctionARN' "$function_description")"

policy_id="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cloudfront list-response-headers-policies \
      --type custom \
      --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='$POLICY_NAME'].ResponseHeadersPolicy.Id | [0]" \
      --output text
)"
if [[ -z "$policy_id" || "$policy_id" == "None" ]]; then
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cloudfront create-response-headers-policy \
      --response-headers-policy-config "file://$POLICY_CONFIG" >"$edge_tmp/policy.json"
  policy_id="$(jq -r '.ResponseHeadersPolicy.Id' "$edge_tmp/policy.json")"
fi

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws cloudfront get-distribution-config \
    --id "$DISTRIBUTION_ID" >"$edge_tmp/distribution.json"
distribution_etag="$(jq -r '.ETag' "$edge_tmp/distribution.json")"

jq \
  --arg function_arn "$function_arn" \
  --arg policy_id "$policy_id" \
  '
    .DistributionConfig
    | .DefaultCacheBehavior.ResponseHeadersPolicyId = $policy_id
    | (.DefaultCacheBehavior.FunctionAssociations.Items // []) as $items
    | if any($items[]?; .EventType == "viewer-request" and .FunctionARN != $function_arn)
      then error("Refusing to replace an unknown viewer-request function")
      else
        ($items | map(select(.EventType != "viewer-request"))
          + [{FunctionARN: $function_arn, EventType: "viewer-request"}]) as $updated
        | .DefaultCacheBehavior.FunctionAssociations = {
            Quantity: ($updated | length),
            Items: $updated
          }
      end
  ' "$edge_tmp/distribution.json" >"$edge_tmp/distribution-config.json"

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --if-match "$distribution_etag" \
    --distribution-config "file://$edge_tmp/distribution-config.json" >/dev/null

echo "CloudFront edge hardening submitted for distribution $DISTRIBUTION_ID."
echo "Wait for deployment, invalidate cached HTML, then run live header and redirect QA."
