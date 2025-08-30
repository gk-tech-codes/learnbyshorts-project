#!/bin/bash

# Upload login page to S3 for production OAuth testing
# This uploads only the login page and required assets

set -e

BUCKET_NAME="learnbyshorts-app-464994449735"
REGION="us-east-1"

echo "🚀 Uploading login page to S3 for production OAuth testing..."

# Upload login.html
echo "📄 Uploading login.html..."
aws s3 cp frontend/login.html s3://$BUCKET_NAME/login.html \
    --content-type "text/html" \
    --cache-control "no-cache" \
    --region $REGION

# Upload required CSS files
echo "🎨 Uploading CSS files..."
aws s3 cp frontend/css/styles.css s3://$BUCKET_NAME/css/styles.css \
    --content-type "text/css" \
    --region $REGION

# Check if auth.css exists and upload
if [ -f "frontend/css/auth.css" ]; then
    aws s3 cp frontend/css/auth.css s3://$BUCKET_NAME/css/auth.css \
        --content-type "text/css" \
        --region $REGION
fi

# Upload required JS files
echo "📜 Uploading JavaScript files..."
aws s3 cp frontend/js/auth-service.js s3://$BUCKET_NAME/js/auth-service.js \
    --content-type "application/javascript" \
    --region $REGION

aws s3 cp frontend/js/mock-auth.js s3://$BUCKET_NAME/js/mock-auth.js \
    --content-type "application/javascript" \
    --region $REGION

# Upload logo if it exists
if [ -f "frontend/assets/logo.svg" ]; then
    echo "🖼️ Uploading logo..."
    aws s3 cp frontend/assets/logo.svg s3://$BUCKET_NAME/assets/logo.svg \
        --content-type "image/svg+xml" \
        --region $REGION
fi

# Get CloudFront distribution ID and invalidate cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[0].DomainName=='$BUCKET_NAME.s3.amazonaws.com'].Id" \
    --output text --region $REGION 2>/dev/null || echo "")

if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/login.html" "/css/*" "/js/*" "/assets/*" \
        --region $REGION >/dev/null
    echo "✅ Cache invalidated"
fi

echo ""
echo "✅ Login page uploaded successfully!"
echo ""
echo "🌐 Test URLs:"
echo "Direct S3: https://$BUCKET_NAME.s3.amazonaws.com/login.html"
if [ ! -z "$DISTRIBUTION_ID" ]; then
    DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID \
        --query "Distribution.DomainName" --output text --region $REGION 2>/dev/null || echo "")
    if [ ! -z "$DOMAIN" ]; then
        echo "CloudFront: https://$DOMAIN/login.html"
    fi
fi
echo ""
echo "📝 Note: Production OAuth should work without the 'Development Mode' message"
echo ""
