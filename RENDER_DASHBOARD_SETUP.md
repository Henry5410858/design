# 🖥️ Render Dashboard Setup - Step-by-Step Visual Guide

## ⚠️ Important: Do These Steps AFTER Pushing Code to GitHub

---

## Step 1️⃣: Access Render Dashboard

**URL**: https://dashboard.render.com

```
┌────────────────────────────────────────────────────────┐
│  Render Dashboard                                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │  🔐 Sign in with your account                    │ │
│  │  (GitHub recommended for auto-deploy)           │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**What you'll see**: List of services (design-center-backend, design-center-frontend)

---

## Step 2️⃣: Select Backend Service

```
┌─────────────────────────────────────────────────────┐
│  Render Dashboard - Services                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✅ design-center-backend                          │  ← Click this
│     Status: LIVE                                    │
│     Region: oregon                                  │
│     Last deploy: 3 hours ago                        │
│                                                     │
│  ⚪ design-center-frontend                         │
│     Status: LIVE                                    │
│                                                     │
│  ⚪ design-center-db (PostgreSQL)                  │
│     Status: LIVE                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Click**: `design-center-backend`

---

## Step 3️⃣: Open Environment Variables

```
┌──────────────────────────────────────────────────┐
│  design-center-backend                           │
├──────────────────────────────────────────────────┤
│                                                  │
│  Tabs: ┌─────────┬──────────┬──────────┐       │
│        │Overview │ Settings │ Metrics  │       │
│        └─────────┴──────────┴──────────┘       │
│                                                  │
│  Click: Settings tab (middle tab)               │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Then in Settings**:

```
┌──────────────────────────────────────────────────┐
│  Settings                                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  Sections: ┌────────────┐  ┌────────────┐     │
│            │ General    │  │ Environment│     │
│            └────────────┘  └────────────┘     │
│                                                  │
│            ┌────────────┐  ┌────────────┐     │
│            │ Redirects  │  │ Deploy     │     │
│            └────────────┘  └────────────┘     │
│                                                  │
│  Click: Environment tab (top right)             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Step 4️⃣: Add/Update Environment Variables

```
┌──────────────────────────────────────────────────────────────┐
│  Environment Variables                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Existing Variables:                                      │
│                                                              │
│  MONGODB_URI                                                │
│  └─ mongodb+srv://tonyklassen496:...@designflow...         │
│                                                              │
│  JWT_SECRET                                                 │
│  └─ ●●●●●●●●●●●●●●●●●●●●●●●●●●●                         │
│                                                              │
│  CLOUDINARY_CLOUD_NAME                                      │
│  └─ dbk9b78qf                                               │
│                                                              │
│  NODE_ENV                                                   │
│  └─ production                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔴 NEED TO ADD (Scroll down and find "Add" button)        │
│                                                              │
│  [ + Add Environment Variable ]  ← Click to add new        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 5️⃣: Add Required Environment Variables

### Variable 1: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD

```
┌─────────────────────────────────────────────┐
│  Add Environment Variable                   │
├─────────────────────────────────────────────┤
│                                             │
│  Key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD     │
│  Value: false                              │
│                                             │
│  [ Save ]                                   │
│                                             │
└─────────────────────────────────────────────┘
```

**Purpose**: Tell Puppeteer to use system Chromium

---

### Variable 2: PUPPETEER_EXECUTABLE_PATH

```
┌──────────────────────────────────────────────────┐
│  Add Environment Variable                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  Key: PUPPETEER_EXECUTABLE_PATH                 │
│  Value: /usr/bin/chromium-browser               │
│                                                  │
│  [ Save ]                                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Purpose**: Path where system Chromium is installed

---

### Variable 3: CHROME_PATH

```
┌──────────────────────────────────────────────────┐
│  Add Environment Variable                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  Key: CHROME_PATH                               │
│  Value: /usr/bin/chromium-browser               │
│                                                  │
│  [ Save ]                                        │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Purpose**: Fallback path for Chrome (same as Puppeteer)

---

### Variable 4: FRONTEND_URL

```
┌──────────────────────────────────────────────┐
│  Add Environment Variable                    │
├──────────────────────────────────────────────┤
│                                              │
│  Key: FRONTEND_URL                          │
│  Value: https://design-dispute.netlify.app  │
│                                              │
│  [ Save ]                                    │
│                                              │
└──────────────────────────────────────────────┘
```

**Purpose**: Frontend URL for CORS whitelisting

---

### Variable 5: CORS_ORIGINS

```
┌──────────────────────────────────────────────┐
│  Add Environment Variable                    │
├──────────────────────────────────────────────┤
│                                              │
│  Key: CORS_ORIGINS                          │
│  Value: https://design-dispute.netlify.app  │
│                                              │
│  [ Save ]                                    │
│                                              │
└──────────────────────────────────────────────┘
```

**Purpose**: CORS allowlist (can be comma-separated for multiple)

---

## Step 6️⃣: Verify All Variables Added

```
┌──────────────────────────────────────────────────────────────┐
│  Environment Variables - Final State                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ MONGODB_URI = mongodb+srv://...                         │
│  ✅ JWT_SECRET = ●●●●●●●●                                  │
│  ✅ CLOUDINARY_CLOUD_NAME = dbk9b78qf                       │
│  ✅ NODE_ENV = production                                   │
│  ✅ PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = false ← NEW         │
│  ✅ PUPPETEER_EXECUTABLE_PATH = /usr/bin/...  ← NEW        │
│  ✅ CHROME_PATH = /usr/bin/chromium-browser   ← NEW        │
│  ✅ FRONTEND_URL = https://design-dispute... ← NEW         │
│  ✅ CORS_ORIGINS = https://design-dispute...  ← NEW        │
│                                                              │
│  All 9 variables ready!                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 7️⃣: Trigger Deployment

### Option A: Auto-Redeploy (Recommended)

```
When you save the last environment variable,
Render automatically triggers a new deployment.

WATCH the status:
┌──────────────────────────────────────────┐
│  Status: Building... (spinning icon)     │
│  Estimated time: 10-15 minutes           │
│                                          │
│  After build:                            │
│  ✅ Status: LIVE (green)                │
│                                          │
└──────────────────────────────────────────┘
```

### Option B: Manual Deploy

```
┌──────────────────────────────────────────────────┐
│  design-center-backend                           │
├──────────────────────────────────────────────────┤
│                                                  │
│  Tabs: ┌──────────┬──────────┬──────────┐      │
│        │Overview  │Settings  │ Deployments│    │
│        └──────────┴──────────┴──────────┘      │
│                                                  │
│  Click: Deployments tab                         │
│                                                  │
└──────────────────────────────────────────────────┘

Then:
┌──────────────────────────────────────────────────┐
│  Deployments                                     │
├──────────────────────────────────────────────────┤
│                                                  │
│  [ Manual Deploy ▼ ]  ← Click dropdown          │
│  [ Deploy latest commit ]  ← Select this        │
│                                                  │
│  Wait: 10-15 minutes                            │
│                                                  │
│  Status changes:                                 │
│  Building... → Live ✅                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Step 8️⃣: Monitor Build Progress

### Go to Deployments Tab

```
┌────────────────────────────────────────────────────┐
│  Deployments                                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Latest Deployment: (click to expand)             │
│                                                    │
│  Status: Building... ⌛                            │
│  Started: 2 minutes ago                           │
│  Estimated: 12 more minutes                       │
│                                                    │
│  [ View build logs → ]                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Click "View build logs"

```
┌───────────────────────────────────────────────────────┐
│  Build Logs                                           │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ✅ Fetching deployment...                           │
│  ✅ Running build command...                         │
│  ✅ apt-get update                                   │
│  ✅ Installing build-essential                       │
│  ✅ Installing chromium-browser (this takes ~3 min) │
│  ✅ Installing image libraries                       │
│  ✅ npm install                                      │
│  ✅ npm run build                                    │
│  ✅ Starting service                                 │
│  ✅ Service started on 0.0.0.0:4000                 │
│                                                       │
│  Deployment live!                                    │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Look for**:
- ✅ `chromium-browser` installation succeeds
- ✅ `Service started on 0.0.0.0:4000` at the end
- ❌ No ERROR or FAILED messages

---

## Step 9️⃣: Verify Deployment Success

### Check Service Status

```
┌───────────────────────────────────────────────────┐
│  design-center-backend - Overview                 │
├───────────────────────────────────────────────────┤
│                                                   │
│  Status: ✅ LIVE (green indicator)               │
│  Region: oregon                                   │
│  URL: https://design-backend-6vx4.onrender.com   │
│                                                   │
│  Last Deploy: 2 minutes ago                       │
│  Deploy Status: ✅ Succeeded                      │
│                                                   │
│  [ View latest logs ]                             │
│                                                   │
└───────────────────────────────────────────────────┘
```

**If status is ❌ FAILED**:
- Click "View latest logs"
- Search for ERROR messages
- Common issues: apt-get command failed, disk space

---

## Step 🔟: Test Diagnostics Endpoint

### Open Browser Console

1. Go to: https://design-dispute.netlify.app
2. Log in with test account
3. Press **F12** to open Developer Tools
4. Click **Console** tab
5. Paste this code:

```javascript
const token = localStorage.getItem('token');
fetch('https://design-backend-6vx4.onrender.com/api/proposals/diagnostics', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.table(data.dependencies);
  console.log('Full response:', data);
});
```

### Expected Output

```javascript
// Console output:

{
  dependencies: {
    puppeteer: "installed",
    canvas: "installed"
  },
  environment_variables: {
    PUPPETEER_EXECUTABLE_PATH: "set",
    CHROME_PATH: "set",
    FRONTEND_URL: "https://design-dispute.netlify.app",
    CORS_ORIGINS: "https://design-dispute.netlify.app"
  },
  system: {
    platform: "linux",
    nodeVersion: "v20.x.x",
    memoryUsage: {...}
  }
}
```

### If FAILED

```javascript
// Error example:

{
  dependencies: {
    puppeteer: "missing",  ← ❌ PROBLEM
    canvas: "missing"      ← ❌ PROBLEM
  }
}
```

**Solution**: Force rebuild
- Go to **Settings** → **Environment**
- Change any variable (or add `REBUILD=v2`)
- Save → Wait for rebuild

---

## Step 1️⃣1️⃣: Test PDF Generation

### In Frontend

1. Navigate to proposal generation page
2. Create a test proposal:
   - Client name: "Test"
   - Add one property
3. Click **Generate PDF**

### Success ✅

```
PDF starts downloading to your computer
OR
PDF displays in browser viewer
No error messages in console
Generation took 2-5 seconds
```

### Failure ❌

```
Browser console shows 500 error
Message: "Error generating PDF"
Check:
1. Render logs (search for ERROR)
2. Diagnostics endpoint response
3. Environment variables are set
```

---

## Summary: What You Did

```
✅ Step 1: Accessed Render Dashboard
✅ Step 2: Selected backend service
✅ Step 3: Opened Environment tab
✅ Step 4-5: Added 5 new environment variables
✅ Step 6: Verified all variables saved
✅ Step 7: Triggered deployment
✅ Step 8: Monitored build logs (10-15 min wait)
✅ Step 9: Verified deployment succeeded
✅ Step 10: Tested diagnostics endpoint
✅ Step 11: Tested PDF generation

Total time: 20-25 minutes (mostly waiting for build)
Success rate: 95%+ (if all steps followed correctly)
```

---

## 🆘 Troubleshooting

### "Build Failed" Status

**Action**:
1. Click deployment
2. View build logs
3. Look for `ERROR` message
4. Common issues:
   - `apt-get failed` → Network timeout, retry deploy
   - `Disk quota exceeded` → Plan too small, upgrade
   - `Build timeout` → Render took too long, try again

### "Status is LIVE but PDF Still Fails"

**Action**:
1. Check diagnostics endpoint
2. If dependencies say "missing":
   - Force rebuild: add REBUILD=v2 to env vars
   - Wait 10-15 minutes
   - Test again
3. If dependencies say "installed":
   - Check Render logs for runtime errors
   - Verify CORS_ORIGINS matches frontend URL
   - Test with simple proposal first

### "Can't Connect to Backend"

**Check**:
1. Frontend CORS_ORIGINS includes correct frontend URL
2. JWT token is valid (check localStorage)
3. Network tab shows CORS error or connection error
4. Backend URL is correct

---

**This guide covers the complete setup process. Follow all steps in order for best results!**