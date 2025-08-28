# 🚀 Production Setup Guide for Canva Integration

## Overview
This guide will walk you through setting up the Canva integration for production use, including environment configuration, security hardening, and deployment steps.

## 🔐 Step 1: Canva Developer Account Setup

### 1.1 Apply for Canva Developer Access
1. Visit [Canva Developers](https://www.canva.com/developers/)
2. Click "Get Started" or "Apply for Access"
3. Fill out the application form:
   - **Company/Project Name**: RedDragon Design Center
   - **Use Case**: Real estate marketing design platform
   - **Expected User Volume**: Your estimated user count
   - **Integration Type**: OAuth 2.0 + API integration

### 1.2 Create OAuth Application
Once approved, create your OAuth app:
1. **App Name**: RedDragon Canva Integration
2. **Description**: Professional design tools for real estate marketing
3. **Redirect URIs**:
   - Production: `https://yourdomain.com/canva/callback`
   - Staging: `https://staging.yourdomain.com/canva/callback`
   - Development: `http://localhost:3000/canva/callback`
4. **Scopes Required**:
   - `designs:read` - Read user designs
   - `designs:write` - Create/edit designs
   - `brand_kit:read` - Access brand kits
   - `brand_kit:write` - Modify brand kits

### 1.3 Get Credentials
After setup, you'll receive:
- **Client ID**: Your unique application identifier
- **Client Secret**: Your secret key (keep secure!)
- **API Base URL**: Usually `https://api.canva.com`

## 🌍 Step 2: Environment Configuration

### 2.1 Backend Environment (.env)
```bash
# Database
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-super-secure-jwt-secret-key

# Canva Integration
CANVA_API_BASE_URL=https://api.canva.com
CANVA_CLIENT_ID=your_canva_client_id
CANVA_CLIENT_SECRET=your_canva_client_secret
CANVA_REDIRECT_URI=https://yourdomain.com/canva/callback

# Server Configuration
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.2 Frontend Environment (.env.local)
```bash
# Canva Integration
NEXT_PUBLIC_CANVA_API_URL=https://api.canva.com
NEXT_PUBLIC_CANVA_CLIENT_ID=your_canva_client_id
NEXT_PUBLIC_CANVA_REDIRECT_URI=https://yourdomain.com/canva/callback

# API Configuration
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Analytics (Optional)
NEXT_PUBLIC_GA_TRACKING_ID=your_ga_tracking_id
```

### 2.3 Production Domain Configuration
Update these files with your actual domain:

**Backend - CORS Configuration:**
```javascript
// backend/index.js
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://staging.yourdomain.com'
  ],
  credentials: true
}));
```

**Frontend - API Base URL:**
```typescript
// frontend/src/context/UserContext.tsx
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
```

## 🔒 Step 3: Security Hardening

### 3.1 JWT Security
```javascript
// backend/routes/auth.js
const JWT_OPTIONS = {
  expiresIn: '7d',
  issuer: 'reddragon-design-center',
  audience: 'reddragon-users',
  algorithm: 'HS256'
};

const token = jwt.sign(payload, process.env.JWT_SECRET, JWT_OPTIONS);
```

### 3.2 Rate Limiting
```bash
# Install rate limiting
npm install express-rate-limit

# backend/index.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

### 3.3 Input Validation
```bash
# Install validation
npm install joi

# backend/middleware/validation.js
const Joi = require('joi');

const canvaDesignSchema = Joi.object({
  templateId: Joi.string().required(),
  userId: Joi.string().required()
});

const validateCanvaDesign = (req, res, next) => {
  const { error } = canvaDesignSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details 
    });
  }
  next();
};
```

## 🚀 Step 4: Deployment

### 4.1 Backend Deployment
```bash
# Build and deploy backend
cd backend

# Install production dependencies
npm install --production

# Set environment variables
export NODE_ENV=production
export MONGODB_URI=your_production_mongodb_uri

# Start production server
npm start
```

### 4.2 Frontend Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, AWS, etc.)
```

### 4.3 Database Migration
```bash
# Run the role-to-plan migration
cd backend
node migrate-role-to-plan.js

# Verify migration
mongo your_database
db.users.find({}, {role: 1, plan: 1}).limit(5)
```

## 📊 Step 5: Monitoring & Analytics

### 5.1 Error Logging
```javascript
// backend/index.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log Canva API errors
app.use('/api/canva', (err, req, res, next) => {
  logger.error('Canva API Error:', {
    error: err.message,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  next(err);
});
```

### 5.2 Performance Monitoring
```bash
# Install monitoring tools
npm install express-status-monitor
npm install helmet

# backend/index.js
const statusMonitor = require('express-status-monitor');
const helmet = require('helmet');

app.use(helmet());
app.use(statusMonitor());
```

## 🧪 Step 6: Testing

### 6.1 API Testing
```bash
# Test Canva endpoints
curl -X GET "https://yourdomain.com/api/canva/templates" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X POST "https://yourdomain.com/api/canva/designs/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"templateId": "test-template", "userId": "test-user"}'
```

### 6.2 User Flow Testing
1. **Login** → Verify JWT token generation
2. **Navigate to /canva** → Check plan-based access
3. **Select template** → Verify editor opens
4. **Export design** → Test PNG/JPG/PDF export
5. **Apply brand kit** → Verify brand kit integration

### 6.3 Error Handling Testing
1. **Invalid tokens** → Should return 401
2. **Rate limiting** → Should return 429
3. **Plan restrictions** → Should return 403
4. **Invalid inputs** → Should return 400

## 🔧 Step 7: Troubleshooting

### 7.1 Common Issues

#### OAuth Callback Errors
```bash
# Check redirect URI configuration
# Verify client ID and secret
# Ensure HTTPS in production
# Check CORS settings
```

#### Template Loading Issues
```bash
# Verify Canva API access
# Check user plan permissions
# Validate API rate limits
# Check network connectivity
```

#### Export Failures
```bash
# Check user plan for PDF export
# Verify design completion status
# Check file size limits
# Validate export format support
```

### 7.2 Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('canva_debug', 'true');

// Check console for detailed logs
console.log('Canva Context:', useCanva());
console.log('User Plan:', user?.plan);
console.log('Canva Access:', canAccessCanva);
```

## 📈 Step 8: Performance Optimization

### 8.1 Caching
```javascript
// backend/routes/canva.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Cache templates
router.get('/templates', auth, async (req, res) => {
  const cacheKey = `templates_${req.user.plan}`;
  let templates = cache.get(cacheKey);
  
  if (!templates) {
    templates = await fetchTemplatesFromCanva(req.user);
    cache.set(cacheKey, templates);
  }
  
  res.json({ success: true, templates });
});
```

### 8.2 Database Indexing
```javascript
// backend/models/User.js
userSchema.index({ plan: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });
```

## 🎯 Step 9: Go-Live Checklist

- [ ] Canva developer account approved
- [ ] OAuth application configured
- [ ] Environment variables set
- [ ] Security measures implemented
- [ ] Database migration completed
- [ ] Backend deployed and tested
- [ ] Frontend built and deployed
- [ ] SSL certificates configured
- [ ] Monitoring tools active
- [ ] Error logging configured
- [ ] User testing completed
- [ ] Performance benchmarks met
- [ ] Backup procedures in place
- [ ] Support documentation ready

## 🚀 Step 10: Post-Launch

### 10.1 User Onboarding
- Create tutorial videos
- Write user guides
- Set up support channels
- Monitor user feedback

### 10.2 Analytics & Insights
- Track template usage
- Monitor export statistics
- Analyze user engagement
- Measure conversion rates

### 10.3 Continuous Improvement
- Gather user feedback
- Monitor performance metrics
- Plan feature updates
- Optimize based on usage data

---

## 🎉 **You're Ready for Production!**

Your Canva integration is now:
- ✅ **Secure** - OAuth 2.0 + JWT + Rate limiting
- ✅ **Scalable** - Plan-based access + Caching
- ✅ **Monitored** - Error logging + Performance tracking
- ✅ **Documented** - Complete setup + Troubleshooting guides

**Next step**: Apply for Canva developer access and get your production credentials!

---

*Need help with any specific step? Let me know and I'll guide you through it!* 🚀
