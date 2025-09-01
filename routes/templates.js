const express = require('express');
const router = express.Router();   
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Template = require('../models/Template');

// Configure multer for thumbnail uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename for thumbnail
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'thumb-' + uniqueSuffix + '.png');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Import comprehensive initial data
const { initialData } = require('../scripts/initializeDatabase');

// Helper function to get default objects based on template type
function getDefaultObjectsForType(type) {
  switch (type) {
    case 'flyer':
      return [
        {
          id: '1',
          type: 'text',
          x: 100,
          y: 100,
          width: 300,
          height: 50,
          text: 'Your Flyer Headline',
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#1D4ED8',
        },
        {
          id: '2',
          type: 'text',
          x: 100,
          y: 170,
          width: 300,
          height: 30,
          text: 'Add your content here',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#6B7280',
        }
      ];
    case 'banner':
      return [
        {
          id: '1',
          type: 'text',
          x: 100,
          y: 120,
          width: 600,
          height: 80,
          text: 'BANNER HEADLINE',
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#1976D2',
        },
        {
          id: '2',
          type: 'text',
          x: 100,
          y: 220,
          width: 600,
          height: 50,
          text: 'Subtitle text here',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#388E3C',
        }
      ];
    case 'story':
      return [
        {
          id: '1',
          type: 'text',
          x: 50,
          y: 100,
          width: 300,
          height: 50,
          text: 'STORY TITLE',
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#E91E63',
        },
        {
          id: '2',
          type: 'text',
          x: 50,
          y: 170,
          width: 300,
          height: 40,
          text: 'Your story content',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#9C27B0',
        }
      ];
    case 'document':
      return [
        {
          id: '1',
          type: 'text',
          x: 100,
          y: 80,
          width: 400,
          height: 50,
          text: 'Document Title',
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#424242',
        },
        {
          id: '2',
          type: 'text',
          x: 100,
          y: 150,
          width: 400,
          height: 30,
          text: 'Document content here',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#616161',
        }
      ];
    default:
      return [];
  }
}

// Initialize default templates if they don't exist
async function initializeDefaultTemplates() {
  try {
    console.log('🚀 Initializing comprehensive template data...');
    
    // Get all templates from comprehensive data
    const allTemplates = [...initialData.realEstateTemplates, ...initialData.defaultTemplates];

    for (const templateData of allTemplates) {
      const existingTemplate = await Template.findOne({
        $or: [
          { name: templateData.name, type: templateData.type },
          { templateKey: templateData.templateKey }
        ]
      });

      if (!existingTemplate) {
        await Template.create(templateData);
        console.log(`✅ Created ${templateData.isRealEstate ? 'real estate' : 'default'} ${templateData.type} template: ${templateData.name}`);
      } else {
        console.log(`ℹ️ Template already exists: ${templateData.name}`);
      }
    }
    
    console.log(`🎉 Template initialization completed: ${allTemplates.length} templates processed`);
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
  }
}

// Initialize default templates on startup
initializeDefaultTemplates();

// GET /api/templates?type=flyer|banner|story|document&category=flyers|stories|banners|documents&isRealEstate=true
router.get('/', async (req, res) => {
  try {
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

    const templates = await Template.find(query).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/real-estate - Get all real estate templates
router.get('/real-estate', async (req, res) => {
  try {
    const templates = await Template.find({ isRealEstate: true }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching real estate templates:', error);
    res.status(500).json({ error: 'Failed to fetch real estate templates' });
  }
});

// GET /api/templates/by-key/:templateKey - Get template by templateKey
router.get('/by-key/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    const template = await Template.findOne({ templateKey });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template by key:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
  try {
    const { name, type, category, description } = req.body;

    if (!name || !type || !category) {
      return res.status(400).json({ error: 'Name, type, and category are required' });
    }

    // Validate template type
    const validTypes = ['flyer', 'banner', 'story', 'document', 'badge', 'social', 'brochure'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid template type' });
    }

    // Validate category
    const validCategories = ['social-posts', 'stories', 'flyers', 'banners', 'badges', 'documents'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Create new template with default content based on type
    const newTemplate = await Template.create({
      name: name,
      description: description || '',
      type: type,
      category: category,
      thumbnail: '/uploads/default-thumbnail.png',
      objects: getDefaultObjectsForType(type),
      backgroundColor: '#ffffff',
      isRealEstate: false
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// POST /api/templates/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for duplication:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for duplication:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const newTemplate = await Template.create({
      ...template.toObject(),
      _id: undefined, // Remove the original ID
      name: template.name + ' (Copy)',
      isDefault: false, // Ensure copied templates are not marked as default
      isRealEstate: false, // Ensure copied templates are not marked as real estate
      templateKey: undefined, // Remove template key for copies
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for deletion:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for deletion:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }

    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Prevent deletion of default templates and real estate templates
    if (template.isDefault || template.isRealEstate) {
      return res.status(400).json({ error: 'Cannot delete default or real estate templates' });
    }

    await Template.findByIdAndDelete(id);
    res.json({ success: true, deletedTemplate: template });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// PUT /api/templates/:id - Save template changes
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for update:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for update:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }

    const template = await Template.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// PUT /api/templates/by-key/:templateKey - Update template by templateKey
router.put('/by-key/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    console.log('Updating template by key:', templateKey);
    console.log('Update data:', req.body);

    const template = await Template.findOneAndUpdate(
      { templateKey },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log('Template updated successfully:', template.name);
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template by key:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// POST /api/templates/:id/thumbnail - Upload thumbnail for template
router.post('/:id/thumbnail', upload.single('thumbnail'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received for thumbnail upload:', id);
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format for thumbnail upload:', id);
      return res.status(400).json({ error: 'Invalid template ID format' });
    }

    console.log('Thumbnail upload request received for template:', id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const template = await Template.findById(id);
    if (!template) {
      console.log('Template not found:', id);
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No thumbnail file uploaded' });
    }

    console.log('File uploaded successfully:', req.file.filename);

    // Update the template's thumbnail path
    const thumbnailPath = '/uploads/' + req.file.filename;
    template.thumbnail = thumbnailPath;
    template.updatedAt = new Date();

    await template.save();

    console.log('Template thumbnail updated:', thumbnailPath);

    res.json({
      success: true,
      thumbnail: thumbnailPath,
      template: template
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

module.exports = router;
