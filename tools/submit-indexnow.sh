#!/usr/bin/env bash
set -euo pipefail

INDEXNOW_KEY="ac21566ddd54a8c334d194f6d703ca56"
INDEXNOW_HOST="www.learnbyshorts.com"
SITEMAP_PATH="frontend/sitemap.xml"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
elif [[ -n "${1:-}" ]]; then
  echo "Usage: tools/submit-indexnow.sh [--apply]" >&2
  exit 2
fi

if [[ ! -f "$SITEMAP_PATH" ]]; then
  echo "Missing $SITEMAP_PATH; run this script from the repository root." >&2
  exit 1
fi

url_list="$(
  sed -n 's:.*<loc>\(.*\)</loc>.*:\1:p' "$SITEMAP_PATH" |
    awk 'BEGIN { first = 1 } {
      if (!first) printf ",\n";
      printf "    \"%s\"", $0;
      first = 0
    } END { printf "\n" }'
)"
url_count="$(sed -n 's:.*<loc>\(.*\)</loc>.*:\1:p' "$SITEMAP_PATH" | wc -l | tr -d ' ')"

if [[ "$url_count" -eq 0 ]]; then
  echo "No URLs found in $SITEMAP_PATH." >&2
  exit 1
fi

payload="$(cat <<EOF
{
  "host": "$INDEXNOW_HOST",
  "key": "$INDEXNOW_KEY",
  "keyLocation": "https://$INDEXNOW_HOST/$INDEXNOW_KEY.txt",
  "urlList": [
$url_list
  ]
}
EOF
)"

if [[ "$APPLY" != "true" ]]; then
  echo "Dry run: would notify IndexNow about $url_count canonical sitemap URLs."
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
    echo "IndexNow accepted $url_count updated production URLs (HTTP $status)."
    ;;
  *)
    echo "IndexNow submission failed with HTTP $status." >&2
    exit 1
    ;;
esac
