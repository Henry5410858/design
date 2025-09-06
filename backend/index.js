const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Increase payload size limits
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Increase raw body size limit for file uploads
app.use(express.raw({ limit: '500mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center', {
      bufferCommands: false, // Disable mongoose buffering
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Mongoose connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Backend API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/templates', require('./routes/templates'));
// Temporarily comment out brand-kit routes to test
// const brandKitRouter = require('./routes/brandKit');
// app.use('/api/brand-kit', brandKitRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/files', express.static(path.join(__dirname, 'uploads/files')));
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/uploads/designs', express.static(path.join(__dirname, 'uploads/designs')));

