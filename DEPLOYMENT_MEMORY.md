# DEPLOYMENT MEMORY - ALWAYS READ FIRST

## 🚨 CRITICAL INSTRUCTIONS

### DO NOT COMMIT OR DEPLOY WITHOUT EXPLICIT PERMISSION

1. **NO COMMITS** - Do not run `git commit` until explicitly asked
2. **NO PRODUCTION DEPLOYMENTS** - Do not upload to S3 or invalidate cache until asked
3. **LOCAL TESTING ONLY** - Test changes on localhost:3000 first
4. **ASK BEFORE PUSHING** - Always confirm before any production changes

### CURRENT STATUS
- Working on: Header authentication and hamburger menu conflict fix
- Issue: mobile-menu.js and header-auth.js both handling hamburger menu
- Fix: Removed duplicate mobile menu code from header-auth.js
- Missing file: Downloaded rate-limiter.js from S3 bucket (was causing 404 error)
- Login page fix: Added missing mobile-menu.css and mobile-menu.js to login.html
- Loading circle fix: Added 10-second timeout and better error handling for Google Sign-In
- Dashboard removal: Removed Dashboard link from user dropdown (no endpoint yet)
- OAuth fix: Made fallback button trigger mock auth directly on localhost (bypasses Google OAuth errors)
- Last commit: fa5311c (Standard sign-in redirect pattern)
- Production status: Previous version deployed
- Local changes: All fixes applied, direct mock auth for localhost testing

### WORKFLOW
1. Make changes locally
2. Test on localhost:3000
3. Get user approval
4. THEN commit if asked
5. THEN deploy if asked

### REMEMBER
- User wants to test features fully before any commits/deployments
- Always ask permission before production changes
- Keep this file updated with current status
