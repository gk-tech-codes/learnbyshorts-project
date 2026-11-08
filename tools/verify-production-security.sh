#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="${EXPECTED_ACCOUNT_ID:-464994449735}"
AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-learnbyshorts-deployer}"
AWS_REGION_NAME="${AWS_REGION_NAME:-us-east-1}"
USER_POOL_ID="${USER_POOL_ID:-us-east-1_a6XkchTUa}"
USER_POOL_CLIENT_ID="${USER_POOL_CLIENT_ID:-2bvm2h0pcvs015mctgv92uhbdm}"
API_ID="${API_ID:-iheztk69z7}"
API_ORIGIN="${API_ORIGIN:-https://iheztk69z7.execute-api.us-east-1.amazonaws.com}"
TABLE_NAME="${TABLE_NAME:-learnbyshorts-data}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-learnbyshorts-app-464994449735}"

curl_bin="${CURL_BIN:-$(command -v curl || true)}"
if [[ -z "$curl_bin" && -x /usr/bin/curl ]]; then
  curl_bin=/usr/bin/curl
fi
if [[ -z "$curl_bin" ]]; then
  echo "curl is required for production security verification." >&2
  exit 1
fi

account_id="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws sts get-caller-identity --query Account --output text
)"
if [[ "$account_id" != "$EXPECTED_ACCOUNT_ID" ]]; then
  echo "Refusing verification: expected AWS account $EXPECTED_ACCOUNT_ID." >&2
  exit 1
fi

client="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cognito-idp describe-user-pool-client \
      --user-pool-id "$USER_POOL_ID" \
      --client-id "$USER_POOL_CLIENT_ID" \
      --output json
)"
for required in \
  https://www.learnbyshorts.com/auth/callback.html \
  http://127.0.0.1:4173/auth/callback.html \
  http://localhost:4173/auth/callback.html \
  https://www.learnbyshorts.com/ \
  http://127.0.0.1:4173/ \
  http://localhost:4173/; do
  if [[ "$client" != *"\"$required\""* ]]; then
    echo "Required Cognito URL is missing: $required" >&2
    exit 1
  fi
done
for forbidden in localhost:3000 localhost:3001; do
  if [[ "$client" == *"$forbidden"* ]]; then
    echo "Obsolete Cognito URL is still allowed: $forbidden" >&2
    exit 1
  fi
done

provider_count="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cognito-idp describe-user-pool-client \
      --user-pool-id "$USER_POOL_ID" \
      --client-id "$USER_POOL_CLIENT_ID" \
      --query 'length(UserPoolClient.SupportedIdentityProviders)' \
      --output text
)"
provider="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cognito-idp describe-user-pool-client \
      --user-pool-id "$USER_POOL_ID" \
      --client-id "$USER_POOL_CLIENT_ID" \
      --query 'UserPoolClient.SupportedIdentityProviders[0]' \
      --output text
)"
if [[ "$provider_count" != "1" || "$provider" != "COGNITO" ]]; then
  echo "Unexpected Cognito identity provider configuration." >&2
  exit 1
fi

cors_origins="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws apigatewayv2 get-api \
      --api-id "$API_ID" \
      --query 'CorsConfiguration.AllowOrigins' \
      --output text
)"
for required in \
  https://www.learnbyshorts.com \
  http://127.0.0.1:4173 \
  http://localhost:4173; do
  if [[ "$cors_origins" != *"$required"* ]]; then
    echo "Required API CORS origin is missing: $required" >&2
    exit 1
  fi
done
if [[ "$cors_origins" == *"localhost:3000"* || "$cors_origins" == *"localhost:3001"* ]]; then
  echo "Obsolete API CORS origin is still allowed." >&2
  exit 1
fi

deletion_protection="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws dynamodb describe-table \
      --table-name "$TABLE_NAME" \
      --query 'Table.DeletionProtectionEnabled' \
      --output text
)"
billing_mode="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws dynamodb describe-table \
      --table-name "$TABLE_NAME" \
      --query 'Table.BillingModeSummary.BillingMode' \
      --output text
)"
ttl_status="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws dynamodb describe-time-to-live \
      --table-name "$TABLE_NAME" \
      --query 'TimeToLiveDescription.TimeToLiveStatus' \
      --output text
)"
if [[ "$deletion_protection" != "True" || "$billing_mode" != "PAY_PER_REQUEST" ]]; then
  echo "Unexpected DynamoDB protection or billing configuration." >&2
  exit 1
fi
if [[ "$ttl_status" != "ENABLED" && "$ttl_status" != "ENABLING" ]]; then
  echo "DynamoDB TTL is not enabled." >&2
  exit 1
fi

assert_status() {
  local method="$1"
  local path="$2"
  local expected="$3"
  local actual
  actual="$(
    "$curl_bin" -sS -o /dev/null -w '%{http_code}' \
      -X "$method" \
      -H 'Origin: https://untrusted.example' \
      -H 'Content-Type: application/json' \
      --data '{}' \
      "${API_ORIGIN}${path}"
  )"
  if [[ "$actual" != "$expected" ]]; then
    echo "$method $path returned $actual; expected $expected." >&2
    exit 1
  fi
}

assert_status GET /v1/me 401
assert_status GET /v1/progress 401
assert_status GET /v1/progress/production-security-check 401
assert_status PUT /v1/progress/production-security-check 401
assert_status POST /v1/sync 401

s3_status="$(
  "$curl_bin" -sS -o /dev/null -w '%{http_code}' \
    "https://${S3_BUCKET_NAME}.s3.${AWS_REGION_NAME}.amazonaws.com/index.html"
)"
if [[ "$s3_status" != "403" ]]; then
  echo "Direct S3 access returned $s3_status; expected 403." >&2
  exit 1
fi

echo "Production security verification passed for AWS account $account_id."
