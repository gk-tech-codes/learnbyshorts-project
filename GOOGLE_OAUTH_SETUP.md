# Google OAuth Setup for LearnByShorts

## Current Error: origin_mismatch

The error occurs because `http://localhost:8080` is not registered as an authorized JavaScript origin in your Google Cloud Console.

## Quick Fix Options:

### Option 1: Add Localhost to Existing OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID: `1029422633354-g3po2rrk765unqn98fsirmod4muipt4l`
4. Click **Edit**
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://localhost:8000`
   - `http://localhost:8080`
   - `http://127.0.0.1:3000`
6. Click **Save**

### Option 2: Create New OAuth Client for Development

1. In Google Cloud Console > **Credentials**
2. Click **+ CREATE CREDENTIALS > OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `LearnByShorts Development`
5. Authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`
6. Copy the new Client ID
7. Update `frontend/js/auth-service.js` with new Client ID

### Option 3: Use Different Port (Quick Test)

```bash
# Stop current server
pkill -f "python3 -m http.server"

# Start on port 3000 (if already authorized)
cd frontend && python3 -m http.server 3000
```

## Production Setup

For production deployment, add your domain:
- `https://yourdomain.com`
- `https://www.yourdomain.com`

## Current Client ID Status

Your current Client ID: `1029422633354-g3po2rrk765unqn98fsirmod4muipt4l`

**Authorized Origins Needed:**
- Development: `http://localhost:8080`
- Production: `https://yourdomain.com`

## Test After Setup

1. Update origins in Google Console
2. Wait 5-10 minutes for changes to propagate
3. Clear browser cache
4. Test login again

## Alternative: Mock Login for Development

If you want to test the UI without Google OAuth, I can create a mock login system for development.
