#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="${EXPECTED_ACCOUNT_ID:-464994449735}"
AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-learnbyshorts-deployer}"
AWS_REGION_NAME="${AWS_REGION_NAME:-us-east-1}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-learnbyshorts-app-464994449735}"
APPLY=false
ALLOW_PUBLIC_ORIGIN=false
PRUNE=false
CONFIRM_PRUNE=false

usage() {
  cat <<'EOF'
Usage: tools/publish-static-site.sh [--apply] [--prune --confirm-prune] [--allow-public-origin]

The default is a safe S3 sync dry run. --apply uploads files. Destructive
pruning requires both --prune and --confirm-prune. Production apply also
requires a clean checkout whose HEAD matches origin/main.

The publisher also creates tiny HTML aliases for every nested index page. This
allows canonical URLs such as /modern-skills/ and /courses/ai-fluency/ to work
with a private S3 REST origin even before a CloudFront URI rewrite is attached.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --prune) PRUNE=true ;;
    --confirm-prune) CONFIRM_PRUNE=true ;;
    --allow-public-origin) ALLOW_PUBLIC_ORIGIN=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; usage >&2; exit 2 ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ "$PRUNE" == "true" && "$CONFIRM_PRUNE" != "true" ]]; then
  echo "Refusing prune: pass --confirm-prune after reviewing the dry run." >&2
  exit 1
fi

tools/security-check.sh

if [[ "$APPLY" == "true" ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Refusing deployment: commit or remove all working-tree changes first." >&2
    exit 1
  fi

  local_head="$(git rev-parse HEAD)"
  remote_main="$(git rev-parse --verify refs/remotes/origin/main 2>/dev/null || true)"
  if [[ -z "$remote_main" || "$local_head" != "$remote_main" ]]; then
    echo "Refusing deployment: HEAD must match the locally fetched origin/main." >&2
    echo "Fetch origin/main, verify the commit, and retry." >&2
    exit 1
  fi
fi

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

alias_count=0
while IFS= read -r -d '' index_file; do
  alias_key="${index_file#frontend/}"
  alias_key="${alias_key%index.html}"
  alias_count=$((alias_count + 1))

  if [[ "$APPLY" == "true" ]]; then
    AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
      aws s3api put-object \
        --bucket "$S3_BUCKET_NAME" \
        --key "$alias_key" \
        --body "$index_file" \
        --content-type "text/html; charset=utf-8" \
        --cache-control "public, max-age=300, must-revalidate" \
        --region "$AWS_REGION_NAME" >/dev/null
  else
    echo "(dryrun) alias: $index_file -> s3://$S3_BUCKET_NAME/$alias_key"
  fi
done < <(find frontend -mindepth 2 -type f -name index.html -print0 | sort -z)

if [[ "$APPLY" == "true" ]]; then
  echo "Upload complete with $alias_count clean-URL aliases."
  echo "Invalidate CloudFront separately after verifying the origin."
else
  echo "Dry run complete with $alias_count planned clean-URL aliases."
  echo "Re-run with --apply after reviewing the changes."
fi
