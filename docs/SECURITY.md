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

As of 2026-11-08, the plaintext key was removed from the ignored local
deployment scripts and those scripts use the named AWS profile with an account
guard. The exposed key still must be deactivated, verified unused, and deleted;
file cleanup is not credential revocation.

The legacy wildcard Lambda/IAM/API Gateway deployment-policy example was
removed from the repository. Any future deployment role must be generated from
the exact existing resource ARNs and actions required by the reviewed rollout.

## Current authentication architecture

The supported account path uses Amazon Cognito Authorization Code flow with
PKCE. LearnByShorts does not receive, hash, log, or store learner passwords.

- Cognito owns account creation, email verification, password policy, recovery,
  token issuance, and token revocation.
- The static frontend stores only the short-lived access token in
  `sessionStorage`, not persistent `localStorage`. It does not persist ID or
  refresh tokens; an expired session requires a new sign-in.
- API Gateway validates the Cognito access token and required OAuth scope before
  invoking Lambda.
- Lambda trusts only verified API Gateway JWT claims and rejects missing or
  non-access tokens.
- DynamoDB stores non-secret learner profile and course-progress records only.
- Browser origins are allowlisted explicitly; wildcard credentialed CORS is not
  permitted.
- Request bodies, course identifiers, nested values, and maximum sizes are
  validated before DynamoDB writes.

Never store passwords, OAuth client secrets, refresh tokens, or provider API
keys in S3, DynamoDB, frontend JavaScript, analytics, or Git.

Google federation can be added through Cognito only after a Google OAuth client
is created and its secret is stored in Cognito. Do not add a decorative Google
button that bypasses the configured identity provider.

## Production auth rollout

Use `tools/deploy-secure-auth.sh` only after reviewing the dry-run description
and confirming the account ID. The script updates existing frugal resources; it
does not create a second user pool, API, Lambda function, or DynamoDB table.

Required verification after deployment:

1. An anonymous request to every `/v1/*` route returns `401`.
2. Cognito callback and logout URLs exactly match the production and approved
   local preview origins (`127.0.0.1:4173` and `localhost:4173` only).
3. A new verified account can sign in with Authorization Code + PKCE.
4. The access token can read and update only that learner's progress.
5. A second account cannot read the first account's records.
6. CORS rejects an unlisted origin.
7. No token, email, progress body, or secret appears in application logs.

Run `tools/verify-production-security.sh` after an auth or hosting deployment.
It is read-only, refuses to inspect an unexpected AWS account, verifies the
approved Cognito and CORS origins, checks DynamoDB retention safeguards, and
confirms anonymous API and direct S3 access remain denied.

The legacy `learnbyshorts-auth` Lambda and API must be retired only after this
path is verified. Until retirement, narrow its CORS and DynamoDB permissions
and do not expand its custom JWT design.

## Hosting baseline

The S3 origin should be private:

- Turn on all four S3 Block Public Access settings.
- Use a CloudFront Origin Access Control (OAC).
- Restrict the bucket policy to the exact CloudFront distribution ARN.
- Redirect viewers to HTTPS.
- Attach a response headers policy with HSTS, nosniff, referrer policy, frame
  protection, and a restrictive permissions policy.
- Keep page-specific CSP policies in HTML until legacy inline scripts and style
  blocks have been removed. A second CSP response header intersects with the
  page policy and can break working pages if deployed as a broad global rule.

Change the origin before blocking public S3 access, then verify CloudFront
returns the site and direct anonymous S3 requests are denied.

## Deployment

Use `tools/publish-static-site.sh`. It never stores credentials, verifies the
AWS account, defaults to a dry run, and refuses to publish through a public S3
origin unless explicitly overridden during the migration window. The publisher
also creates exact nested-path aliases, so canonical trailing-slash URLs work
with the private S3 REST origin.

Production apply additionally requires:

- the complete Cognito Authorization Code + PKCE frontend source;
- a passing repository-wide security check;
- a clean working tree;
- local `HEAD` matching a freshly fetched `origin/main`;
- publishing from a temporary archive of tracked files in `HEAD`, so ignored
  or untracked frontend files cannot enter the S3 sync;
- both `--prune` and `--confirm-prune` before any remote deletion.

On 2026-11-08, a stale checkout at commit `6bcae5a` was found alongside the
production-aligned GitHub main branch at `9f9b9a8`. A destructive dry run from
the stale checkout would have deleted the Cognito callback, modern courses,
Learning OS, styles, data, and other production assets. Its ignored
`deploy-to-s3.sh` is now a fail-closed wrapper that refuses to run without the
reviewed publisher. Do not deploy from that checkout until its preserved local
changes are reconciled with current main.

The legacy Express service also fails closed when `JWT_SECRET` is absent,
short, or a known placeholder. Production CORS requires exact HTTPS origins,
request bodies are capped at 128 KiB, no shared demo account is seeded, reset
tokens are never logged, and incomplete ownership authorization denies access.

Legacy course-story rendering escapes dynamic content and uses a script policy
limited to same-origin code. Third-party syntax-highlighting JavaScript and
inline script execution were removed from that page.

Use `tools/configure-cloudfront-edge.sh` for the separate edge hardening. It
defaults to a no-write plan, targets one fixed distribution, refuses to replace
an unknown viewer-request function, and requires only the CloudFront actions
listed by its help output.

## Production edge status

As of 2026-11-07, distribution `E1A3IB2N57BAED` is deployed with:

- CloudFront Function `learnbyshorts-viewer-request` on viewer requests;
- response-headers policy `301abbbd-d809-4dac-a9b0-397b7d688de7`;
- permanent apex-to-`www` and reviewed legacy-route redirects that preserve
  query parameters;
- nested trailing-slash URI rewriting for the private S3 REST origin;
- HSTS, `nosniff`, frame denial, strict-origin referrer policy, restricted
  camera/microphone/geolocation permissions, and opener isolation.

Live QA confirmed both tested redirects, all expected headers, and `200`
responses for all 25 sitemap URLs.

Never seed a shared administrator password in a database initializer. Privileged
accounts must be provisioned through the approved identity provider and an
auditable role-assignment workflow.
