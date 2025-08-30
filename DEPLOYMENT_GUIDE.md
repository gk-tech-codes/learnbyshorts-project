# Google OAuth Login Deployment Guide

## Overview
Your LearnByShorts platform has a complete Google OAuth login system with:
- Frontend: Google Sign-In integration
- Backend: AWS Lambda with Google OAuth verification
- Database: DynamoDB for user data and progress tracking

## Prerequisites
- AWS Account with appropriate permissions
- Google Cloud Console project with OAuth configured
- Domain name (for production)

## Step 1: Google OAuth Setup

1. **Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create/select project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized domains

2. **Update Client ID:**
   - Replace the client ID in `frontend/js/auth-service.js`
   - Current: `1029422633354-g3po2rrk765unqn98fsirmod4muipt4l.apps.googleusercontent.com`

## Step 2: DynamoDB Setup

```bash
# Create the DynamoDB table
aws dynamodb create-table --cli-input-json file://backend/dynamodb-table.json
```

## Step 3: Lambda Deployment

1. **Create deployment package:**
```bash
cd backend
pip install -r requirements.txt -t .
zip -r lambda-auth.zip . -x "*.pyc" "__pycache__/*"
```

2. **Create Lambda function:**
```bash
aws lambda create-function \
  --function-name learnbyshorts-auth \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_auth.lambda_handler \
  --zip-file fileb://lambda-auth.zip \
  --environment Variables='{
    "GOOGLE_CLIENT_ID":"YOUR_GOOGLE_CLIENT_ID",
    "JWT_SECRET":"your-secure-jwt-secret-key"
  }'
```

3. **Create API Gateway:**
```bash
# Create REST API
aws apigateway create-rest-api --name learnbyshorts-api

# Configure routes:
# POST /auth/google
# POST /auth/verify  
# POST /auth/logout
# GET /user/profile
# GET /user/progress
# POST /user/progress
```

## Step 4: Environment Variables

Set these in Lambda:
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `JWT_SECRET`: Secure random string for JWT signing

## Step 5: IAM Permissions

Lambda needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/learnbyshorts-data*"
    }
  ]
}
```

## Step 6: Frontend Configuration

Update API endpoint in `frontend/js/auth-service.js`:
```javascript
getApiBaseUrl() {
    return 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod';
}
```

## Testing

1. **Local Testing:**
   - Serve frontend: `python3 -m http.server 8080`
   - Test Google login flow

2. **Production Testing:**
   - Deploy to your domain
   - Test all auth flows
   - Verify progress tracking

## Security Notes

- Use HTTPS in production
- Rotate JWT secrets regularly
- Monitor DynamoDB access patterns
- Set up CloudWatch logging

## Current Status

✅ **Complete:** Frontend, Lambda, DynamoDB schema
❌ **Needs Setup:** AWS deployment, Google OAuth config
