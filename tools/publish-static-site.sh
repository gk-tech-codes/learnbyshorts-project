#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="${EXPECTED_ACCOUNT_ID:-464994449735}"
AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-learnbyshorts-deployer}"
AWS_REGION_NAME="${AWS_REGION_NAME:-us-east-1}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-learnbyshorts-app-464994449735}"
APPLY=false
ALLOW_PUBLIC_ORIGIN=false
PRUNE=false

usage() {
  cat <<'EOF'
Usage: tools/publish-static-site.sh [--apply] [--prune] [--allow-public-origin]

The default is a safe S3 sync dry run. --apply uploads files. --prune also
removes remote objects not present locally. --allow-public-origin is temporary
and should be removed after CloudFront OAC migration.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --prune) PRUNE=true ;;
    --allow-public-origin) ALLOW_PUBLIC_ORIGIN=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

account_id="$(AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws sts get-caller-identity --query Account --output text)"
if [[ "$account_id" != "$EXPECTED_ACCOUNT_ID" ]]; then
  echo "Refusing deployment: expected AWS account $EXPECTED_ACCOUNT_ID." >&2
  exit 1
fi

public_status="$(AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws s3api get-bucket-policy-status --bucket "$S3_BUCKET_NAME" \
  --query 'PolicyStatus.IsPublic' --output text 2>/dev/null || echo UNKNOWN)"
if [[ "$public_status" == "True" && "$ALLOW_PUBLIC_ORIGIN" != "true" ]]; then
  echo "Refusing deployment: S3 origin is public. Migrate CloudFront to OAC first." >&2
  exit 1
fi

sync_args=(s3 sync frontend/ "s3://$S3_BUCKET_NAME/" --region "$AWS_REGION_NAME")
if [[ "$PRUNE" == "true" ]]; then
  sync_args+=(--delete)
fi
if [[ "$APPLY" != "true" ]]; then
  sync_args+=(--dryrun)
fi

echo "Publishing with profile $AWS_PROFILE_NAME to account $account_id."
AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" aws "${sync_args[@]}"

if [[ "$APPLY" == "true" ]]; then
  echo "Upload complete. Invalidate CloudFront separately after verifying the origin."
else
  echo "Dry run complete. Re-run with --apply after reviewing the changes."
fi
