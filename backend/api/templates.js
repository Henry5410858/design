const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import the Template model
const Template = require('../models/Template');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://turbo-enigma-jw51.vercel.app',
    'https://turbo-enigma.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Database connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center';
    console.log('🔌 Connecting to MongoDB:', mongoURI.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    console.log('🔍 Connected to database:', mongoose.connection.db?.databaseName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// GET /api/templates
app.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /api/templates called');
    console.log('📊 Query params:', req.query);
    
    // Ensure database connection
    await connectDB();
    
    // Check database connection
    console.log('🔍 Database connection state:', mongoose.connection.readyState);
    console.log('🔍 Database name:', mongoose.connection.db?.databaseName);
    console.log('🔍 Database host:', mongoose.connection.host);
    
    // Test database access
    console.log('🔍 Testing database access...');
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      console.log('🔍 Available collections:', collections.map(c => c.name));
      
      // Check if templates collection exists
      const templatesCollection = collections.find(c => c.name === 'templates');
      console.log('🔍 Templates collection exists:', !!templatesCollection);
      
      if (templatesCollection) {
        const count = await db.collection('templates').countDocuments();
        console.log('🔍 Templates collection count:', count);
      }
    }
    
    const { type, category, isRealEstate } = req.query;
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isRealEstate !== undefined) {
      query.isRealEstate = isRealEstate === 'true';
    }
    
    console.log('🔍 Database query:', query);
    console.log('🔍 About to execute Template.find()...');
    
    const templates = await Template.find(query).sort({ createdAt: -1 });
    console.log(`✅ Found ${templates.length} templates`);
    console.log('🔍 First template:', templates[0] ? 'Exists' : 'No templates');
    
    res.json(templates);
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      message: error.message,
      name: error.name
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export for Vercel
module.exports = app;
