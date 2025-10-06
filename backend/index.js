const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app FIRST
const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://design-center.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import routes AFTER app is initialized
const authRoutes = require('./routes/auth');
const proposalRoutes = require('./routes/proposals');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Design Center Backend',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Design Center Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      proposals: '/api/proposals',
      health: '/api/health'
    }
  });
});

// Handle 404 - Route not found
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/signin',
      'POST /api/proposals/generate',
      'GET /api/proposals/health'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/designcenter';

console.log('🔗 Connecting to MongoDB...');
console.log('📁 Database:', MONGODB_URI.includes('localhost') ? 'Local' : 'Cloud');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Backend is ready to accept requests`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /`);
    console.log(`   GET  /api/health`);
    console.log(`   POST /api/auth/signup`);
    console.log(`   POST /api/auth/signin`);
    console.log(`   POST /api/proposals/generate`);
    console.log(`   GET  /api/proposals/health`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.error('💡 Tip: Check your MONGODB_URI environment variable');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;