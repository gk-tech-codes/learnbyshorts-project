#!/usr/bin/env bash
set -euo pipefail

EXPECTED_ACCOUNT_ID="${EXPECTED_ACCOUNT_ID:-464994449735}"
AWS_PROFILE_NAME="${AWS_PROFILE_NAME:-learnbyshorts-deployer}"
AWS_REGION_NAME="${AWS_REGION_NAME:-us-east-1}"
USER_POOL_ID="${USER_POOL_ID:-us-east-1_a6XkchTUa}"
USER_POOL_CLIENT_ID="${USER_POOL_CLIENT_ID:-2bvm2h0pcvs015mctgv92uhbdm}"
USER_POOL_DOMAIN="${USER_POOL_DOMAIN:-learnbyshorts-v3-464994449735}"
API_ID="${API_ID:-iheztk69z7}"
FUNCTION_NAME="${FUNCTION_NAME:-learnbyshorts-api}"
FUNCTION_ROLE="${FUNCTION_ROLE:-learnbyshorts-api-role}"
TABLE_NAME="${TABLE_NAME:-learnbyshorts-data}"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
elif [[ -n "${1:-}" ]]; then
  echo "Usage: tools/deploy-secure-auth.sh [--apply]" >&2
  exit 2
fi

account_id="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws sts get-caller-identity --query Account --output text
)"
if [[ "$account_id" != "$EXPECTED_ACCOUNT_ID" ]]; then
  echo "Refusing deployment: expected AWS account $EXPECTED_ACCOUNT_ID." >&2
  exit 1
fi

if [[ "$APPLY" != "true" ]]; then
  cat <<EOF
Dry run only. Secure auth deployment would update existing resources in account $account_id:
- Cognito client $USER_POOL_CLIENT_ID: Authorization Code flow, PKCE-compatible callbacks, no client secret
- Cognito domain $USER_POOL_DOMAIN: verify and reuse the existing domain
- API Gateway $API_ID: narrow CORS and require the openid scope on JWT routes
- Lambda $FUNCTION_NAME: deploy backend/cognito-api/index.mjs with strict validation
- IAM role $FUNCTION_ROLE: add least-privilege DynamoDB access to $TABLE_NAME
- DynamoDB $TABLE_NAME: enable TTL and deletion protection
No duplicate service, user pool, table, API, or always-on server will be created.
EOF
  exit 0
fi

temp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$temp_dir"
}
trap cleanup EXIT

cp backend/cognito-api/index.mjs "$temp_dir/index.mjs"
(
  cd "$temp_dir"
  zip -q deployment.zip index.mjs
)

policy_document="$temp_dir/dynamodb-policy.json"
environment_document="$temp_dir/lambda-environment.json"
printf '%s\n' \
  '{"Version":"2012-10-17","Statement":[{"Sid":"LearnerProgressOnly","Effect":"Allow","Action":["dynamodb:GetItem","dynamodb:PutItem","dynamodb:Query"],"Resource":["arn:aws:dynamodb:'"$AWS_REGION_NAME"':'"$account_id"':table/'"$TABLE_NAME"'","arn:aws:dynamodb:'"$AWS_REGION_NAME"':'"$account_id"':table/'"$TABLE_NAME"'/index/*"]}]}' \
  > "$policy_document"
printf '%s\n' \
  '{"Variables":{"TABLE_NAME":"'"$TABLE_NAME"'","ALLOWED_ORIGINS":"https://www.learnbyshorts.com,http://127.0.0.1:4173,http://localhost:4173","MAX_BODY_BYTES":"131072"}}' \
  > "$environment_document"

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws iam put-role-policy \
    --role-name "$FUNCTION_ROLE" \
    --policy-name learnbyshorts-api-dynamodb \
    --policy-document "file://$policy_document"

domain_pool="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws cognito-idp describe-user-pool-domain \
      --domain "$USER_POOL_DOMAIN" \
      --query 'DomainDescription.UserPoolId' \
      --output text 2>/dev/null || true
)"
if [[ "$domain_pool" != "$USER_POOL_ID" ]]; then
  echo "Refusing deployment: Cognito domain belongs to another user pool." >&2
  exit 1
fi

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws cognito-idp update-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-id "$USER_POOL_CLIENT_ID" \
    --client-name learnbyshorts-web \
    --refresh-token-validity 30 \
    --access-token-validity 60 \
    --id-token-validity 60 \
    --token-validity-units AccessToken=minutes,IdToken=minutes,RefreshToken=days \
    --explicit-auth-flows ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
    --supported-identity-providers COGNITO \
    --callback-urls \
      https://www.learnbyshorts.com/auth/callback.html \
      http://127.0.0.1:4173/auth/callback.html \
      http://localhost:4173/auth/callback.html \
      http://localhost:3000/auth/callback \
      http://localhost:3001/auth/callback \
    --logout-urls \
      https://www.learnbyshorts.com/ \
      http://127.0.0.1:4173/ \
      http://localhost:4173/ \
      http://localhost:3000 \
      http://localhost:3001 \
    --allowed-o-auth-flows code \
    --allowed-o-auth-scopes openid email profile \
    --allowed-o-auth-flows-user-pool-client \
    --prevent-user-existence-errors ENABLED \
    --enable-token-revocation >/dev/null

authorizer_id="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws apigatewayv2 get-authorizers \
      --api-id "$API_ID" \
      --query 'Items[?AuthorizerType==`JWT`].AuthorizerId | [0]' \
      --output text
)"
if [[ -z "$authorizer_id" || "$authorizer_id" == "None" ]]; then
  echo "Refusing deployment: JWT authorizer was not found." >&2
  exit 1
fi

route_ids="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws apigatewayv2 get-routes \
      --api-id "$API_ID" \
      --query 'Items[?AuthorizationType==`JWT`].RouteId' \
      --output text
)"
for route_id in $route_ids; do
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws apigatewayv2 update-route \
      --api-id "$API_ID" \
      --route-id "$route_id" \
      --authorization-type JWT \
      --authorizer-id "$authorizer_id" \
      --authorization-scopes openid >/dev/null
done

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws apigatewayv2 update-api \
    --api-id "$API_ID" \
    --cors-configuration \
      'AllowOrigins=["https://www.learnbyshorts.com","http://127.0.0.1:4173","http://localhost:4173","http://localhost:3000","http://localhost:3001"],AllowMethods=["GET","POST","PUT","OPTIONS"],AllowHeaders=["authorization","content-type"],MaxAge=3600' >/dev/null

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$temp_dir/deployment.zip" >/dev/null
AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws lambda wait function-updated-v2 --function-name "$FUNCTION_NAME"

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --handler index.handler \
    --environment "file://$environment_document" >/dev/null
AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws lambda wait function-updated-v2 --function-name "$FUNCTION_NAME"

AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
  aws dynamodb update-table \
    --table-name "$TABLE_NAME" \
    --deletion-protection-enabled >/dev/null

ttl_status="$(
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws dynamodb describe-time-to-live \
      --table-name "$TABLE_NAME" \
      --query 'TimeToLiveDescription.TimeToLiveStatus' \
      --output text
)"
if [[ "$ttl_status" == "DISABLED" ]]; then
  AWS_PROFILE="$AWS_PROFILE_NAME" AWS_REGION="$AWS_REGION_NAME" \
    aws dynamodb update-time-to-live \
      --table-name "$TABLE_NAME" \
      --time-to-live-specification Enabled=true,AttributeName=TTL >/dev/null
fi

echo "Secure Cognito, API Gateway, Lambda, IAM, and DynamoDB updates completed."
