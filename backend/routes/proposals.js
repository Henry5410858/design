const express = require('express');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const { generateIntro } = require('../services/aiCopy');
const { uploadPdf } = require('../services/cloudinaryHelpers');
const pdfRenderer = require('../services/pdfRenderer');
const router = express.Router();

// Test endpoint to verify connection and auth
router.get('/test', auth, (req, res) => {
  console.log('🧪 Test endpoint called');
  console.log('🔑 User from auth middleware:', req.user);
  res.json({ 
    success: true, 
    message: 'Proposals API is working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for AI enhancement
router.get('/test-ai', auth, async (req, res) => {
  console.log('🤖 AI test endpoint called');
  console.log('🔑 User from auth middleware:', req.user);
  
  try {
    const testIntro = await generateIntro({ 
      clientName: 'Test Client', 
      valueProps: ['Test Value'] 
    });
    
    res.json({ 
      success: true, 
      message: 'AI enhancement is working',
      testIntro,
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ AI test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI enhancement test failed',
      error: error.message 
    });
  }
});

// CORS configuration
router.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://design-center.netlify.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,  // Max 10 MB per file
    fieldSize: 10 * 1024 * 1024, // Max 10 MB per text field (e.g. JSON like "items")
    files: 10,                   // Max 10 uploaded files
    fields: 20                   // Max 20 non-file fields
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Proposal Generator',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// List available templates
router.get('/templates', auth, (req, res) => {
  res.json({
    templates: [
      { id: 'dossier-express', name: 'Dossier Express', pages: 1, description: 'Resumen ejecutivo de 1 página' },
      { id: 'comparative-short', name: 'Comparativa Corta', pages: 2, description: '2-3 propiedades, 2 páginas' },
      { id: 'simple-proposal', name: 'Propuesta Simple', pages: '4-6', description: '4-6 páginas con detalles completos' },
    ],
  });
});

// Generate AI intro copy
router.post('/ai/intro', auth, async (req, res) => {
  try {
    const { clientName, industry, valueProps } = req.body || {};
    const text = await generateIntro({ clientName, valueProps });
    res.json({ text });
  } catch (error) {
    console.error('AI intro generation failed:', error);
    res.status(500).json({ 
      message: 'AI intro generation failed', 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
});

// Enhance intro text
router.post('/enhance-intro', auth, async (req, res) => {
  console.log('🤖 AI intro enhancement request received');
  console.log('🔑 User from auth middleware:', req.user);
  console.log('📝 Request body:', req.body);
  
  try {
    const { text = '', clientName, valueProps } = req.body || {};
    console.log('📝 Processing:', { text: text?.substring(0, 50), clientName, valueProps });
    
    const generated = await generateIntro({ clientName, valueProps });
    const enhancedText = text ? `${text.trim()}\n\n${generated}` : generated;
    
    console.log('✅ AI intro enhancement successful');
    res.json({ enhancedText });
  } catch (error) {
    console.error('❌ AI intro enhancement failed:', error);
    res.status(500).json({ 
      message: 'AI intro enhancement failed', 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
});

// Main PDF generation endpoint
router.post('/generate', auth, premium, upload.any(), async (req, res) => {
  console.log('📦 PDF generation request received - ENHANCED');
  console.log('🔑 User from auth middleware:', req.user);
  console.log('🔑 User ID:', req.user?.id || req.user?.userId);
  console.log('🔑 User plan:', req.user?.plan);
  console.log('🔑 Premium bypass allowed:', process.env.ALLOW_PDF_NON_PREMIUM === 'true' || process.env.NODE_ENV !== 'production');
  
  try {
    // Enhanced validation
    if (!req.body || Object.keys(req.body).length === 0) {
      console.log('❌ Empty request body received');
      return res.status(400).json({ 
        message: 'Empty request body',
        details: 'No data received from frontend'
      });
    }

    console.log('📋 Request body keys:', Object.keys(req.body));
    console.log('📁 Files received:', req.files?.length || 0);

    // Parse JSON fields with better error handling
    const parseJSON = (key, fallback) => {
      if (!req.body[key]) {
        console.log(`⚠️ Missing field: ${key}, using fallback`);
        return fallback;
      }
      try {
        return JSON.parse(req.body[key]);
      } catch (parseError) {
        console.error(`❌ JSON parse error for ${key}:`, parseError);
        console.log(`📝 Raw value for ${key}:`, req.body[key]);
        return fallback;
      }
    };

    const client = parseJSON('client', {});
    const items = parseJSON('items', []);
    const theme = parseJSON('theme', {});
    const contact = parseJSON('contact', {});
    const template = req.body?.template || 'dossier-express';
    const introText = req.body?.introText || '';
    const options = parseJSON('options', {});

    console.log('👤 Client:', client.name);
    console.log('📦 Items count:', items.length);
    console.log('🎨 Template:', template);

    // Validate required fields
    if (!client?.name?.trim()) {
      return res.status(400).json({ message: 'client.name is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Validate items
    const invalidItems = items.filter(item => !item.title?.trim() || !item.description?.trim());
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        message: 'All items must have title and description',
        invalidItems: invalidItems.map((_, index) => index)
      });
    }

    console.log(`📋 Processing: ${items.length} items for client: ${client.name}`);

    // Handle image uploads
    const fileMap = new Map();
    (req.files || []).forEach((file) => {
      const match = /^propertyImage_(\d+)$/.exec(file.fieldname);
      if (match) fileMap.set(Number(match[1]), file);
    });

    // Process items with image uploads
    const uploadedItems = await Promise.all(items.map(async (item, index) => {
      try {
        if (fileMap.has(index)) {
          const file = fileMap.get(index);
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: `users/${req.user.id}/proposal-items` },
              (error, result) => error ? reject(error) : resolve(result)
            );
            stream.end(file.buffer);
          });
          return { ...item, imageUrl: uploadResult.secure_url };
        }
        return item;
      } catch (uploadError) {
        console.warn(`Image upload failed for item ${index}:`, uploadError.message);
        return item; // Continue with original item if upload fails
      }
    }));
    

    // Generate or use provided intro
    let aiIntro;
    if (introText?.trim()) {
      aiIntro = introText.trim();
      console.log('📝 Using provided intro text');
    } else {
      console.log('🤖 Generating AI intro');
      aiIntro = await generateIntro({ 
        clientName: client.name, 
        valueProps: client.valueProps 
      });
    }

    // Merge contact into client
    client.contact = { ...client.contact, ...contact };

    const persist = Boolean(req.body?.persist === 'true' || req.body?.persist === true);

    console.log(`🔄 Generating PDF with template: ${template}`);
    
    // Generate PDF
    const pdfBuffer = await pdfRenderer.generatePDF({
      template,
      data: { 
        client, 
        items: uploadedItems, 
        theme, 
        intro: aiIntro, 
        options,
        userId: req.user.id, // Pass user ID for brand kit logo retrieval
        contact: { ...client.contact, ...contact } // Ensure contact info is passed
      },
      locale: 'es',
      currencyCode: options?.currencyCode || 'USD', // Default to USD instead of EUR
    });

    console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);

    if (persist) {
      console.log('💾 Persisting PDF to cloud storage');
      const upload = await uploadPdf(pdfBuffer, { 
        folder: `users/${req.user.id}/proposals`, 
        publicId: `${template}-${Date.now()}` 
      });
      return res.json({ 
        url: upload.secure_url, 
        public_id: upload.public_id,
        message: 'PDF generated and saved successfully'
      });
    }

    // Stream PDF to client
    const filename = `propuesta-${client.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-PDF-Size', pdfBuffer.length);
    res.setHeader('X-PDF-Template', template);
    
    console.log(`📤 Sending PDF to client: ${filename}`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('💥 PDF generation failed:', error);
    res.status(500).json({ 
      message: 'PDF generation failed', 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Simple PDF generation (backward compatibility)
router.post('/render', auth, premium, async (req, res) => {
  try {
    const { template = 'dossier-express', client, items = [], theme, options = {} } = req.body || {};

    if (!client?.name) {
      return res.status(400).json({ message: 'client.name is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const { locale = 'es', currencyCode = 'EUR', persist = false } = options;

    const aiIntro = await generateIntro({ 
      clientName: client.name, 
      valueProps: client.valueProps 
    });

    const pdfBuffer = await pdfRenderer.generatePDF({
      template,
      data: { client, items, theme, intro: aiIntro },
      locale,
      currencyCode,
    });

    if (persist) {
      const upload = await uploadPdf(pdfBuffer, { 
        folder: `users/${req.user.id}/proposals`, 
        publicId: `${template}-${Date.now()}` 
      });
      return res.json({ url: upload.secure_url, public_id: upload.public_id });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${template}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF render failed:', error);
    res.status(500).json({ 
      message: 'PDF render failed', 
      error: error.message 
    });
  }
});

module.exports = router;