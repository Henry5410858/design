const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // ✅ ADDED - Replace your custom CORS middleware
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const brandKitRoutes = require('./routes/brandKit');
const canvaRoutes = require('./routes/canva');
const imageRoutes = require('./routes/images');
const proposalRoutes = require('./routes/proposals');

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ UPDATED: Enhanced CORS configuration for Netlify + Render
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://design-center.netlify.app', // ✅ Replace with your actual Netlify domain
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.some(allowed => origin === allowed)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ UPDATED: Increase body parser limits for large PDF requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb', 
  parameterLimit: 100000 
}));
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
// ✅ INCREASE payload limits for large PDFs
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 1000000 
}));
// ✅ Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.body) {
    console.log('Request body size:', JSON.stringify(req.body).length, 'bytes');
  }
  next();
});
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection with retry/backoff
let isConnecting = false;
let retryCount = 0;
const baseDelay = parseInt(process.env.MONGODB_RETRY_DELAY_MS || '2000', 10);
const maxDelay = parseInt(process.env.MONGODB_MAX_RETRY_DELAY_MS || '30000', 10);

const connectWithRetry = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return; // Avoid duplicate connects
  isConnecting = true;
  const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/design_center';
  const safeURI = mongoURI.replace(/\/\/.*@/, '//***:***@');
  try {
    console.log('🔌 Connecting to MongoDB:', safeURI);
    await mongoose.connect(mongoURI, {
      // Core connection options
      useNewUrlParser: true,
      useUnifiedTopology: true,

      // Timeouts (tuned for quicker feedback and reconnects)
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,

      // Driver server selection timeout (fail fast, we handle retries)
      serverSelectionTimeoutMS: 20000,
      heartbeatFrequencyMS: 10000,
    });
    retryCount = 0;
    console.log('✅ MongoDB connected successfully');
    console.log('🔍 Connected to database:', mongoose.connection.db?.databaseName);
    console.log('🔍 Connection host:', mongoose.connection.host);
  } catch (error) {
    retryCount += 1;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
    console.error('❌ MongoDB connection error:', error?.message || error);
    console.error(`⏳ Retrying in ${delay}ms (attempt ${retryCount}) — server stays up`);
    setTimeout(connectWithRetry, delay);
  } finally {
    isConnecting = false;
  }
};

// Initial connect attempt (non-blocking)
connectWithRetry();

// Connection state logs and auto-reconnect
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected');
});
mongoose.connection.on('reconnected', () => {
  console.log('🟡 Mongoose reconnected');
});
mongoose.connection.on('disconnected', () => {
  console.warn('🔴 Mongoose disconnected — scheduling reconnect');
  connectWithRetry();
});
mongoose.connection.on('error', (err) => {
  console.error('⚠️ Mongoose connection error:', err?.message || err);
});

// Add error handling for unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/brand-kit', brandKitRoutes);
app.use('/api/canva', canvaRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/proposals', proposalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: {
      state: readyState === 1 ? 'Connected' : readyState === 2 ? 'Connecting' : readyState === 3 ? 'Disconnecting' : 'Disconnected',
      readyState
    },
    reconnect: {
      retryCount,
      baseDelay,
      maxDelay
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    cors: 'Enabled for Netlify + Localhost'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!7777',
    timestamp: new Date().toISOString()
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working! Your frontend can connect to this backend.',
    timestamp: new Date().toISOString(),
    allowedOrigins: ['https://design-center.netlify.app', 'http://localhost:3000']
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'RedDragon Backend API', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      corsTest: '/api/cors-test',
      templates: '/api/templates',
      auth: '/api/auth',
      brandKit: '/api/brand-kit',
      canva: '/api/canva',
      proposals: '/api/proposals'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🌍 CORS enabled for: Netlify + Localhost`);
});