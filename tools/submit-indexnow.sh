#!/usr/bin/env bash
set -euo pipefail

INDEXNOW_KEY="ac21566ddd54a8c334d194f6d703ca56"
INDEXNOW_HOST="www.learnbyshorts.com"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
elif [[ -n "${1:-}" ]]; then
  echo "Usage: tools/submit-indexnow.sh [--apply]" >&2
  exit 2
fi

payload="$(cat <<EOF
{
  "host": "$INDEXNOW_HOST",
  "key": "$INDEXNOW_KEY",
  "keyLocation": "https://$INDEXNOW_HOST/$INDEXNOW_KEY.txt",
  "urlList": [
    "https://$INDEXNOW_HOST/",
    "https://$INDEXNOW_HOST/learning-os/",
    "https://$INDEXNOW_HOST/modern-skills/",
    "https://$INDEXNOW_HOST/learn-v2/index.html",
    "https://$INDEXNOW_HOST/interview-lab/index.html",
    "https://$INDEXNOW_HOST/interview-companies.html",
    "https://$INDEXNOW_HOST/job-paths/amazon-sde-ii/",
    "https://$INDEXNOW_HOST/ai-era-lab/index.html"
  ]
}
EOF
)"

if [[ "$APPLY" != "true" ]]; then
  echo "Dry run: would notify IndexNow about the homepage, Learning OS, Modern Skills Lab, Amazon SDE II job path, Java OOP lab, interview pages, and AI fluency lab."
  echo "Re-run with --apply after those URLs and the key file are deployed."
  exit 0
fi

status="$(
  curl --silent --show-error \
    --output /dev/null \
    --write-out '%{http_code}' \
    --header 'Content-Type: application/json; charset=utf-8' \
    --data "$payload" \
    https://api.indexnow.org/indexnow
)"

case "$status" in
  200|202)
    echo "IndexNow accepted the updated production URLs (HTTP $status)."
    ;;
  *)
    echo "IndexNow submission failed with HTTP $status." >&2
    exit 1
    ;;
esac
