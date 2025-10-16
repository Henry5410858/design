# 🔧 CORS & Login Troubleshooting Guide

## 🎯 Quick Diagnosis

When you see these errors in browser console:

### ❌ Error 1: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Root Cause**: Backend doesn't recognize your frontend's origin

**Solution Steps**:
1. Find your Netlify domain (exact URL from browser address bar)
2. On Render backend settings, add to environment:
   ```
   FRONTEND_URL=https://your-exact-netlify-domain.netlify.app
   ```
3. Redeploy backend
4. Hard refresh (Ctrl+Shift+R)

---

### ❌ Error 2: "POST 500 (Internal Server Error)"

**Root Cause**: Usually `NEXT_PUBLIC_API_URL` not set on Netlify

**Solution Steps**:
1. Check that `NEXT_PUBLIC_API_URL` is set in Netlify environment variables
2. Value should be your Render backend URL (e.g., `https://design-backend-6vx4.onrender.com`)
3. Redeploy Netlify frontend
4. Check browser console for exact error

---

### ❌ Error 3: "Invalid credentials" (after CORS fixed)

**Root Cause**: Either wrong credentials OR MongoDB connection issue

**Check**:
1. Open Render logs → look for MongoDB connection errors
2. Try correct credentials (test account)
3. If no test account, create one via backend script or MongoDB directly

---

## 🧪 Testing Checklist

### Step 1: Verify Backend is Running
```bash
curl -X GET https://design-backend-6vx4.onrender.com/health
# Should return: {"status": "ok"} or similar
```

### Step 2: Check CORS Configuration
Open DevTools Console and run:
```javascript
// This will show you what CORS sees
fetch('https://design-backend-6vx4.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log('✅ CORS working:', d))
  .catch(e => console.error('❌ CORS blocked:', e));
```

### Step 3: Verify Frontend API URL
In browser console:
```javascript
// Show what API endpoint frontend is using
console.log('API URL:', window.location.href);
// Check if NEXT_PUBLIC_API_URL was set
fetch('/api/config').then(r => r.json()).then(d => console.log('Frontend config:', d)).catch(e => console.log('No config endpoint'));
```

---

## 📋 Environment Variable Checklist

### Backend (Render) - MUST HAVE:

- ✅ `MONGODB_URI` - MongoDB connection string
- ✅ `JWT_SECRET` - Secret for token signing
- ✅ `FRONTEND_URL` - Your Netlify domain
- ✅ `PORT` - Usually 4000
- ✅ `CLOUDINARY_*` - If using image features

### Frontend (Netlify) - MUST HAVE:

- ✅ `NEXT_PUBLIC_API_URL` - Your Render backend URL

---

## 🔍 Debugging: Getting Exact URLs

### Find Netlify Frontend URL:
1. Open your site in browser
2. Look at address bar: `https://example.netlify.app`
3. This is your `FRONTEND_URL` for backend

### Find Render Backend URL:
1. Go to Render dashboard → Services → Your backend
2. Look for "Service URL" at the top
3. This is your `NEXT_PUBLIC_API_URL` for frontend

---

## 📊 Environment Variables Summary

This shows exact variable names and where to set them:

| Variable | Set In | Value | Example |
|----------|--------|-------|---------|
| `FRONTEND_URL` | Render Env Vars | Frontend's Netlify domain | `https://design-dispute.netlify.app` |
| `NEXT_PUBLIC_API_URL` | Netlify Env Vars | Backend's Render URL | `https://design-backend-6vx4.onrender.com` |
| `MONGODB_URI` | Render Env Vars | MongoDB connection | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Render Env Vars | Secret string | Use strong random string |

---

## 🛠️ Common CORS Issues & Solutions

### Issue: CORS works locally but fails in production

**Cause**: Hardcoded `localhost` in CORS config

**Solution**: Ensure using `FRONTEND_URL` environment variable (already fixed in new code)

---

### Issue: Multiple Netlify deployments with different URLs

**Cause**: Each deploy gets unique URL, previous URL is blocked

**Solution**: Use environment variable `CORS_ORIGINS` (comma-separated):
```
CORS_ORIGINS=https://design-dispute.netlify.app,https://staging-version.netlify.app
```

---

### Issue: Staging and production share same domain issue

**Cause**: CORS checking exact origin match

**Solution**: Create separate backend instances or use regex patterns (requires code change)

---

## 🧬 Code Files That Were Changed

1. **`backend/index.js`** - Now reads `FRONTEND_URL` and `CORS_ORIGINS` from environment
2. **`frontend/src/config/api.ts`** - Now validates `NEXT_PUBLIC_API_URL` in production
3. **`frontend/src/context/AuthContext.tsx`** - Removed fallback to internal API, clearer error messages
4. **`backend/.env.example`** - Updated with production requirements
5. **`frontend/.env.example`** - New file showing frontend config

---

## 🚨 Red Flags

If you see these, deployment is misconfigured:

1. **"Backend unreachable"** → Check `NEXT_PUBLIC_API_URL` on Netlify
2. **"CORS blocked"** → Check `FRONTEND_URL` on Render
3. **"Invalid credentials" right away** → Check backend is running on Render
4. **No console logs about authentication** → Frontend JavaScript isn't running (check build errors)

---

## 📞 Getting Help

If still not working, collect this info:

1. **Your Netlify domain**: `https://_____.netlify.app`
2. **Your Render backend URL**: `https://_____.onrender.com`
3. **Exact error message** from browser DevTools Console
4. **Check Render logs** for MongoDB/connection errors
5. **Check Netlify build logs** for NEXT_PUBLIC_API_URL validation

---

**Last Updated**: January 2025
**Status**: Production Ready