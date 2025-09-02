# Canva Integration Configuration

## Environment Variables

Create a `.env.local` file in your frontend directory with the following variables:

```bash
# Canva API Configuration
NEXT_PUBLIC_CANVA_API_URL=https://api.canva.com
NEXT_PUBLIC_CANVA_CLIENT_ID=your_canva_client_id_here
NEXT_PUBLIC_CANVA_REDIRECT_URI=http://localhost:3000/canva/callback

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Getting Canva Developer Access

### 1. Apply for Canva Developer Access
- Go to [Canva Developers](https://www.canva.com/developers/)
- Click "Get Started" or "Apply for Access"
- Fill out the application form
- Wait for approval (usually 1-2 weeks)

### 2. Create a New App
Once approved:
- Log into Canva Developer Console
- Create a new app
- Set app name and description
- Configure OAuth redirect URIs

### 3. Get Your Credentials
- Copy your Client ID
- Copy your Client Secret (for backend)
- Note your redirect URI

## Current Implementation Status

### ✅ What's Working (Demo Mode)
- Template gallery with 12 real estate templates
- Plan-based access controls
- Mock Canva editor interface
- Export functionality simulation
- Responsive design

### 🚧 What Needs Real Credentials
- Actual Canva editor embedding
- Real design creation via API
- Authentic export functionality
- Brand kit integration
- OAuth authentication flow

## Testing the Current Implementation

1. **Visit**: `http://localhost:3000/canva`
2. **What you'll see**:
   - Template gallery with colored placeholders
   - Category filters (Property Marketing, Social Media, etc.)
   - Search functionality
   - Plan-based upgrade prompts

3. **Test scenarios**:
   - Free user: Upgrade prompt
   - Premium user: 8 templates, PNG/JPG export
   - Ultra-Premium user: All 12 templates, PNG/JPG/PDF export

## Next Steps After Getting Canva Access

1. **Update environment variables** with real credentials
2. **Test OAuth flow** with real Canva authentication
3. **Verify API endpoints** for design creation and export
4. **Test real editor embedding** with actual Canva iframe
5. **Deploy to production** with proper environment variables

## Troubleshooting

### Common Issues
- **"Cannot find module" errors**: Run `npm install` and clear `.next` cache
- **MongoDB conflicts**: Ensure only one MongoDB instance is running
- **Port conflicts**: Check if ports 3000/3001 and 4000 are available

### Development Tips
- Use browser console (F12) to check for errors
- Check Network tab for API call failures
- Verify environment variables are loaded correctly
