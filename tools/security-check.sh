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

frontend_secret_files="$(
  rg --hidden -Il \
    '(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|AWS_SECRET_ACCESS_KEY[[:space:]]*=.+|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY)' \
    frontend || true
)"

if [[ -n "$frontend_secret_files" ]]; then
  echo "Potential secrets found in frontend files, including ignored files:" >&2
  echo "$frontend_secret_files" >&2
  exit 1
fi

risky_frontend_files="$(
  find frontend -type f \
    \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' \
       -o -name '*.p12' -o -name '*.pfx' -o -name '*.jks' -o -name '*.zip' \
       -o -name '*.tar' -o -name '*.tar.gz' \) -print
)"

if [[ -n "$risky_frontend_files" ]]; then
  echo "Credential or archive file type found under frontend:" >&2
  echo "$risky_frontend_files" >&2
  exit 1
fi

frontend_symlinks="$(find frontend -type l -print)"
if [[ -n "$frontend_symlinks" ]]; then
  echo "Symlinks are not allowed in the static publish tree:" >&2
  echo "$frontend_symlinks" >&2
  exit 1
fi

if rg -n \
  '(mock_token_|prod_token_|learnbyshorts-jwt-secret|your-secret-key|process\.env\.JWT_SECRET[[:space:]]*\|\||Access-Control-Allow-Origin.{0,30}\*|client_secret[[:space:]]*[:=][[:space:]]*["'\''][^"'\'']+)' \
  frontend/js backend \
  --glob '!backend/boto3/**' --glob '!backend/botocore/**' \
  --glob '!backend/google/**' --glob '!backend/google_auth_oauthlib/**' \
  --glob '!backend/oauthlib/**' --glob '!backend/requests_oauthlib/**' \
  --glob '!backend/rsa/**' --glob '!backend/urllib3/**' \
  --glob '!backend/*.dist-info/**' >/dev/null; then
  echo "Insecure authentication fallback or wildcard CORS found." >&2
  exit 1
fi

if rg -n \
  '(password:[[:space:]]*Admin|admin@learnbyshorts\.com|demo@learnbyshorts\.com|INSERT[^;]*INTO[[:space:]]+users[^;]*(admin|password_hash))' \
  backend --glob '!backend/boto3/**' --glob '!backend/botocore/**' \
  --glob '!backend/google/**' --glob '!backend/*.dist-info/**' >/dev/null; then
  echo "A seeded or documented default administrator credential was found." >&2
  exit 1
fi

if rg -n \
  'console\.(log|error)\([^)]*(resetToken|credential|access_token|refresh_token|id_token|Authorization)' \
  backend frontend/js >/dev/null; then
  echo "Sensitive authentication material is written to logs." >&2
  exit 1
fi

required_auth_files=(
  frontend/auth/callback.html
  frontend/css/account-v2.css
  frontend/js/auth-config.js
  frontend/js/auth-page.js
  frontend/js/auth-service.js
  frontend/login.html
  frontend/signup.html
)
for auth_file in "${required_auth_files[@]}"; do
  if [[ ! -s "$auth_file" ]]; then
    echo "Required secure authentication asset is missing: $auth_file" >&2
    exit 1
  fi
done

if ! rg -q 'code_challenge_method:[[:space:]]*'\''S256'\''' \
  frontend/js/auth-service.js; then
  echo "Cognito Authorization Code + PKCE enforcement was not found." >&2
  exit 1
fi

if rg -n "script-src[^;]*'unsafe-inline'" frontend --glob '*.html' >/dev/null; then
  echo "unsafe-inline is not permitted for frontend scripts." >&2
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
  '(lbs:auth:(id|refresh)|this\.keys\.(id|refresh)|grant_type:[[:space:]]*'\''refresh_token'\''|refreshSession\()' \
  frontend/js/auth-service.js >/dev/null; then
  echo "Long-lived or unnecessary identity tokens are persisted by the browser client." >&2
  exit 1
fi

if rg -n \
  '(emailjs\.init|api\.emailjs\.com|cdn\.jsdelivr\.net/npm/@emailjs|console\.log\(.{0,80}(email|message|templateParams))' \
  frontend/*.html frontend/js >/dev/null; then
  echo "Client-side contact transmission or sensitive contact logging found." >&2
  exit 1
fi

if rg -n \
  'localhost:(3000|3001)' \
  tools/deploy-secure-auth.sh >/dev/null; then
  echo "Obsolete Cognito callback or API CORS origins found." >&2
  exit 1
fi

if ! rg -q -- '--supported-identity-providers COGNITO' \
  tools/deploy-secure-auth.sh; then
  echo "The reviewed Cognito provider allowlist was not found." >&2
  exit 1
fi

echo "Security checks passed."
