# Backend Deployment Guide

## Current Issue
Your frontend is deployed on Vercel, but your backend API is not deployed anywhere. This causes 404 errors when the frontend tries to call API endpoints.

## Solution: Deploy Backend to Railway (Recommended)

### Step 1: Prepare Backend for Deployment

1. **Update package.json scripts** in `backend/package.json`:
```json
{
  "scripts": {
    "start": "node index.js",
    "build": "echo 'Backend build completed'",
    "dev": "nodemon index.js"
  }
}
```

2. **Create Railway configuration** in `backend/railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

3. **Add health check endpoint** in `backend/index.js`:
```javascript
// Add this route before other routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

### Step 2: Deploy to Railway

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Create new project from GitHub repo**
4. **Select the `backend` folder as root directory**
5. **Add environment variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key
   - `PORT`: Railway will set this automatically

### Step 3: Update Frontend API URL

Once deployed, Railway will give you a URL like: `https://your-app-name.railway.app`

Update your frontend environment variables:
```bash
# In Vercel dashboard, add environment variable:
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app
```

## Alternative: Deploy to Render

### Step 1: Prepare Backend
1. Create `backend/render.yaml`:
```yaml
services:
  - type: web
    name: reddragon-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
```

### Step 2: Deploy
1. Connect GitHub to Render
2. Create new Web Service
3. Select your repository and `backend` folder
4. Add environment variables
5. Deploy

## Alternative: Deploy to DigitalOcean App Platform

### Step 1: Create App Spec
Create `backend/.do/app.yaml`:
```yaml
name: reddragon-backend
services:
- name: api
  source_dir: backend
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: MONGODB_URI
    scope: RUN_TIME
    type: SECRET
  - key: JWT_SECRET
    scope: RUN_TIME
    type: SECRET
```

## Quick Test

After deployment, test your backend:
```bash
curl https://your-backend-url.railway.app/api/health
```

Should return:
```json
{"status":"OK","timestamp":"2024-01-01T00:00:00.000Z"}
```

## Update Frontend

Once backend is deployed, update your frontend's API configuration:

1. **In Vercel Dashboard**:
   - Go to your project settings
   - Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app`
   - Redeploy

2. **Or update the config file**:
   ```typescript
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.railway.app';
   ```

## Current Status
- ✅ Frontend deployed on Vercel
- ❌ Backend not deployed (causing 404 errors)
- 🔄 Need to deploy backend to complete the setup
