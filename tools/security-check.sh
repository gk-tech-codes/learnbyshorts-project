#!/usr/bin/env bash
set -euo pipefail

tracked_secret_files="$(
  git grep -Il -E \
    '(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|AWS_SECRET_ACCESS_KEY[[:space:]]*=.+|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY)' \
    -- ':!backend/boto3/**' ':!backend/botocore/**' ':!backend/google/**' \
       ':!backend/rsa/**' ':!backend/*.dist-info/**' || true
)"

if [[ -n "$tracked_secret_files" ]]; then
  echo "Potential secrets found in tracked files:" >&2
  echo "$tracked_secret_files" >&2
  exit 1
fi

if rg -n \
  '(mock_token_|prod_token_|learnbyshorts-jwt-secret|Access-Control-Allow-Origin.{0,30}\*|client_secret[[:space:]]*[:=][[:space:]]*["'\''][^"'\'']+)' \
  frontend/js backend/cognito-api backend/lambda_auth.py >/dev/null; then
  echo "Insecure authentication fallback or wildcard CORS found." >&2
  exit 1
fi

while IFS= read -r file; do
  case "$file" in
    frontend/course-detail.html|frontend/course-story.html)
      ;;
    *)
      echo "Unexpected unsafe-inline policy found in $file." >&2
      exit 1
      ;;
  esac
done < <(rg -l "'unsafe-inline'" frontend --glob '*.html' || true)

if rg -n \
  '(emailjs\.init|api\.emailjs\.com|cdn\.jsdelivr\.net/npm/@emailjs|console\.log\(.{0,80}(email|message|templateParams))' \
  frontend/*.html frontend/js >/dev/null; then
  echo "Client-side contact transmission or sensitive contact logging found." >&2
  exit 1
fi

echo "Security checks passed."
