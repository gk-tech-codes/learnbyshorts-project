# LearnByShorts security baseline

## Immediate credential actions

The legacy local deployment scripts contained a long-lived AWS access key, and
the Git remote URL contained a GitHub personal access token. Treat both as
exposed:

1. Rotate the `learnbyshorts-deployer` access key in IAM.
2. Revoke the GitHub personal access token and use SSH or a credential helper.
3. Search Git history and GitHub secret-scanning alerts before assuming either
   credential was private.

Never place replacement credentials in this repository or in shell scripts.

## Required production configuration

Authentication fails closed unless all of these are configured:

- `JWT_SECRET`: at least 32 random characters, stored outside Git.
- `GOOGLE_CLIENT_ID`: the public Google OAuth client ID.
- `ALLOWED_ORIGINS`: comma-separated HTTPS origins for the production site.
- `TABLE_NAME`: DynamoDB table name.
- A real HTTPS API base URL supplied to the frontend.

Do not re-enable email/password fields until a complete password-reset,
verification, rate-limiting, and secure password-hashing flow exists.

## Hosting baseline

The S3 origin should be private:

- Turn on all four S3 Block Public Access settings.
- Use a CloudFront Origin Access Control (OAC).
- Restrict the bucket policy to the exact CloudFront distribution ARN.
- Redirect viewers to HTTPS.
- Attach a response headers policy with CSP, HSTS, nosniff, referrer policy,
  frame protection, and a restrictive permissions policy.

Change the origin before blocking public S3 access, then verify CloudFront
returns the site and direct anonymous S3 requests are denied.

## Deployment

Use `tools/publish-static-site.sh`. It never stores credentials, verifies the
AWS account, defaults to a dry run, and refuses to publish through a public S3
origin unless explicitly overridden during the migration window.
