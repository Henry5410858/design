# Vercel Environment Setup Guide

## Problem
Your frontend is trying to connect to `http://localhost:4000` which doesn't exist in production. You need to configure the correct backend URL for your Vercel deployment.

## Solution

### 1. Set Environment Variables in Vercel

Go to your Vercel dashboard and add these environment variables:

```bash
# Backend API URL (replace with your actual backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-app.vercel.app

# Or if your backend is on a different domain:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Other environment variables (if needed)
NEXT_PUBLIC_MAIN_PLATFORM_URL=https://your-main-platform.com
NEXT_PUBLIC_BILLING_URL=https://your-main-platform.com/billing
JWT_SECRET=your_jwt_secret_here
```

### 2. How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend URL (e.g., `https://your-backend-app.vercel.app`)
   - **Environment**: Production (and Preview if you want)

### 3. Redeploy Your Application

After adding the environment variables:
1. Go to the Deployments tab
2. Click "Redeploy" on your latest deployment
3. Or push a new commit to trigger a new deployment

### 4. Verify the Fix

After redeployment, check your browser's Network tab to see if API calls are now going to the correct URL instead of `localhost:4000`.

## Backend Deployment Options

### Option 1: Deploy Backend to Vercel
If you haven't deployed your backend yet:
1. Create a new Vercel project for your backend
2. Deploy the `backend` folder
3. Use the Vercel-provided URL as your `NEXT_PUBLIC_API_URL`

### Option 2: Use Existing Backend
If you already have a backend deployed elsewhere:
1. Use that URL as your `NEXT_PUBLIC_API_URL`
2. Make sure CORS is configured to allow your Vercel domain

### Option 3: Use Vercel API Routes
You could also move your backend logic to Vercel API routes in the `frontend/src/app/api/` folder.

## Testing Locally

To test with the new configuration locally:
1. Create a `.env.local` file in your frontend directory
2. Add: `NEXT_PUBLIC_API_URL=http://localhost:4000`
3. Run `npm run dev`

## Troubleshooting

- **Still getting connection refused**: Check that your backend is actually deployed and accessible
- **CORS errors**: Make sure your backend allows requests from your Vercel domain
- **Environment variables not working**: Make sure you're using `NEXT_PUBLIC_` prefix for client-side variables
