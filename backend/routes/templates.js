const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Template = require('../models/Template');

// Helper function to safely delete files
const deleteFileSafely = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ File deleted successfully:', filePath);
      return true;
    } else {
      console.log('⚠️ File not found for deletion:', filePath);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting file:', filePath, error);
    return false;
  }
};

// Helper function to delete old design file when updating template
const deleteOldDesignFile = async (templateId) => {
  try {
    const template = await Template.findById(templateId);
    if (template && template.designFilename) {
      const oldFilePath = path.resolve(__dirname, '../uploads/designs', template.designFilename);
      if (deleteFileSafely(oldFilePath)) {
        console.log('🗑️ Old design file deleted for template:', templateId);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting old design file:', error);
    return false;
  }
};

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

// Configure multer for design data files
const designStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../uploads/designs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename for design data
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'design-' + uniqueSuffix + '.json');
  }
});

// Configure multer for general file uploads
const generalStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../uploads/files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    cb(null, `${nameWithoutExt}-${timestamp}${extension}`);
  }
});

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename for images
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + extension);
  }
});

const designUpload = multer({ 
  storage: designStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for design data
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed for design data'));
    }
  }
});

const generalUpload = multer({ 
  storage: generalStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|txt|zip|rar)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
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
          font: 'Arial',
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
          font: 'Arial',
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
          font: 'Arial',
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
          font: 'Arial',
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
          font: 'Arial',
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
          font: 'Arial',
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
          font: 'Arial',
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
          font: 'Arial',
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
    const defaultTemplates = [
      {
        name: 'Summer Sale Flyer',
        type: 'flyer',
        thumbnail: '/uploads/default-flyer-thumb.png',
        objects: getDefaultObjectsForType('flyer'),
        backgroundColor: '#FFFFFF',
        isDefault: true
      },
      {
        name: 'Instagram Story Promo',
        type: 'story',
        thumbnail: '/uploads/default-story-thumb.png',
        objects: getDefaultObjectsForType('story'),
        backgroundColor: '#FFFFFF',
        isDefault: true
      },
      {
        name: 'Event Banner',
        type: 'banner',
        thumbnail: '/uploads/default-banner-thumb.png',
        objects: getDefaultObjectsForType('banner'),
        backgroundColor: '#FFFFFF',
        isDefault: true
      },
      {
        name: 'Business Document',
        type: 'document',
        thumbnail: '/uploads/default-document-thumb.png',
        objects: getDefaultObjectsForType('document'),
        backgroundColor: '#FFFFFF',
        isDefault: true
      }
    ];

    for (const templateData of defaultTemplates) {
      const existingTemplate = await Template.findOne({ 
        name: templateData.name, 
        type: templateData.type,
        isDefault: true 
      });
      
      if (!existingTemplate) {
        await Template.create(templateData);
        console.log(`Created default ${templateData.type} template: ${templateData.name}`);
      }
    }
  } catch (error) {
    console.error('Error initializing default templates:', error);
  }
}

// Initialize default templates on startup
initializeDefaultTemplates();

// GET /api/templates?type=flyer|banner|story|document
router.get('/', async (req, res) => {
  try {
    const { type, category, isRealEstate, isDefault } = req.query;
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
    
    if (isDefault !== undefined) {
      query.isDefault = isDefault === 'true';
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
    const realEstateTemplates = await Template.find({ isRealEstate: true }).sort({ createdAt: -1 });
    res.json(realEstateTemplates);
  } catch (error) {
    console.error('Error fetching real estate templates:', error);
    res.status(500).json({ error: 'Failed to fetch real estate templates' });
  }
});

// GET /api/templates/by-key/:templateKey - Get template by templateKey
router.get('/by-key/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    
    if (!templateKey) {
      return res.status(400).json({ error: 'Template key is required' });
    }
    
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

// PUT /api/templates/by-key/:templateKey - Update template by templateKey
router.put('/by-key/:templateKey', async (req, res) => {
  try {
    const { templateKey } = req.params;
    
    if (!templateKey) {
      return res.status(400).json({ error: 'Template key is required' });
    }
    
    // Check if we're updating the designFilename (which means a new design file was uploaded)
    const isUpdatingDesign = req.body.designFilename && req.body.designFilename !== '';
    
    // If updating design, find the template first to get its ID for file cleanup
    let templateId = null;
    if (isUpdatingDesign) {
      const existingTemplate = await Template.findOne({ templateKey });
      if (existingTemplate) {
        templateId = existingTemplate._id;
        console.log('🔄 Updating design file for template key:', templateKey, 'ID:', templateId);
        const oldFileDeleted = await deleteOldDesignFile(templateId);
        if (oldFileDeleted) {
          console.log('✅ Old design file cleaned up successfully');
        }
      }
    }
    
    const template = await Template.findOneAndUpdate(
      { templateKey },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template by key:', error);
    res.status(500).json({ error: 'Failed to update template' });
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

// POST /api/templates/save-design - Save design data as file and return filename
router.post('/save-design', designUpload.single('designData'), async (req, res) => {
  try {
    let filename;
    
    if (req.file) {
      // File upload method
      filename = req.file.filename;
      console.log('Design data file saved via upload:', filename);
      console.log('File path:', req.file.path);
    } else if (req.body.designData) {
      // JSON data method (fallback)
      if (req.body.filename) {
        // Use custom filename if provided
        filename = req.body.filename;
        console.log('Using custom filename:', filename);
      } else {
        // Generate timestamp-based filename as fallback
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        filename = `design-${timestamp}-${randomSuffix}.json`;
        console.log('Generated timestamp filename:', filename);
      }
      
      const filePath = path.resolve(__dirname, '../uploads/designs', filename);
      
      // Write the design data to file
      fs.writeFileSync(filePath, JSON.stringify(req.body.designData, null, 2));
      console.log('Design data saved via JSON:', filename);
      console.log('File path:', filePath);
    } else {
      return res.status(400).json({ error: 'No design data provided (file or JSON)' });
    }

    // Return the filename that should be stored in the database
    res.json({ 
      success: true, 
      filename: filename,
      message: 'Design data saved successfully'
    });
  } catch (error) {
    console.error('Error saving design data:', error);
    res.status(500).json({ error: 'Failed to save design data' });
  }
});

// GET /api/templates/design/:filename - Get design data from file
router.get('/design/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.resolve(__dirname, '../uploads/designs', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Design file not found' });
    }

    const designData = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(designData);
    
    res.json({ 
      success: true, 
      designData: parsedData
    });
  } catch (error) {
    console.error('Error reading design data:', error);
    res.status(500).json({ error: 'Failed to read design data' });
  }
});

// POST /api/templates/save-design-large - Handle very large design data
router.post('/save-design-large', async (req, res) => {
  try {
    // This endpoint handles very large JSON payloads
    const designData = req.body.designData;
    
    if (!designData) {
      return res.status(400).json({ error: 'No design data provided' });
    }

    console.log('📊 Large design data received, size:', JSON.stringify(designData).length, 'bytes');

    // Generate filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const filename = `design-large-${timestamp}-${randomSuffix}.json`;
    const filePath = path.resolve(__dirname, '../uploads/designs', filename);

    // Write the design data to file
    fs.writeFileSync(filePath, JSON.stringify(designData, null, 2));
    console.log('✅ Large design data saved as file:', filename);
    console.log('📁 File path:', filePath);

    res.json({
      success: true,
      filename: filename,
      message: 'Large design data saved successfully',
      size: JSON.stringify(designData).length
    });
  } catch (error) {
    console.error('❌ Error saving large design data:', error);
    res.status(500).json({ error: 'Failed to save large design data' });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    // Validate template type
    const validTypes = ['flyer', 'banner', 'story', 'document'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid template type' });
    }
    
    // Create new template with default content based on type
    const newTemplate = await Template.create({
      name: name,
      type: type,
      thumbnail: '/uploads/default-thumbnail.png', // Will be updated when saved
      objects: getDefaultObjectsForType(type),
      backgroundColor: '#ffffff',
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
    
    // Prevent deletion of default templates
    if (template.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default templates' });
    }
    
    // Clean up associated files before deleting the template
    console.log('🗑️ Cleaning up files for template:', id);
    
    // Delete design file if it exists
    if (template.designFilename) {
      const designFilePath = path.resolve(__dirname, '../uploads/designs', template.designFilename);
      deleteFileSafely(designFilePath);
    }
    
    // Delete thumbnail file if it exists and it's not the default thumbnail
    if (template.thumbnail && template.thumbnail !== '/uploads/default-thumbnail.png') {
      const thumbnailPath = template.thumbnail.startsWith('/') ? template.thumbnail.substring(1) : template.thumbnail;
      const thumbnailFilePath = path.resolve(__dirname, '..', thumbnailPath);
      deleteFileSafely(thumbnailFilePath);
    }
    
    await Template.findByIdAndDelete(id);
    console.log('✅ Template and associated files deleted successfully');
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
    
    // Check if we're updating the designFilename (which means a new design file was uploaded)
    const isUpdatingDesign = req.body.designFilename && req.body.designFilename !== '';
    
    // If updating design, delete the old design file first
    if (isUpdatingDesign) {
      console.log('🔄 Updating design file for template:', id);
      const oldFileDeleted = await deleteOldDesignFile(id);
      if (oldFileDeleted) {
        console.log('✅ Old design file cleaned up successfully');
      }
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
    
    // Delete old thumbnail if it exists and it's not the default thumbnail
    if (template.thumbnail && template.thumbnail !== '/uploads/default-thumbnail.png') {
      const oldThumbnailPath = template.thumbnail.startsWith('/') ? template.thumbnail.substring(1) : template.thumbnail;
      const oldThumbnailFilePath = path.resolve(__dirname, '..', oldThumbnailPath);
      console.log('🗑️ Deleting old thumbnail:', oldThumbnailFilePath);
      deleteFileSafely(oldThumbnailFilePath);
    }
    
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

// POST /api/templates/upload-file - Upload general files
router.post('/upload-file', generalUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded successfully:', req.file.filename);
    console.log('File path:', req.file.path);
    console.log('File size:', req.file.size, 'bytes');
    console.log('File type:', req.file.mimetype);

    res.json({ 
      success: true, 
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: `/uploads/files/${req.file.filename}`,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// POST /api/templates/upload-image - Upload images
router.post('/upload-image', imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log('Image uploaded successfully:', req.file.filename);
    console.log('Image path:', req.file.path);
    console.log('Image size:', req.file.size, 'bytes');
    console.log('Image type:', req.file.mimetype);

    res.json({ 
      success: true, 
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: `/uploads/images/${req.file.filename}`,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /api/templates/upload-multiple - Upload multiple files
router.post('/upload-multiple', generalUpload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/files/${file.filename}`
    }));

    console.log('Multiple files uploaded successfully:', uploadedFiles.length);

    res.json({ 
      success: true, 
      files: uploadedFiles,
      count: uploadedFiles.length,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// GET /api/templates/files - List uploaded files
router.get('/files', async (req, res) => {
  try {
    const filesDir = path.resolve(__dirname, '../uploads/files');
    const imagesDir = path.resolve(__dirname, '../uploads/images');
    const designsDir = path.resolve(__dirname, '../uploads/designs');

    const getFilesInDir = (dirPath) => {
      if (!fs.existsSync(dirPath)) return [];
      
      return fs.readdirSync(dirPath)
        .filter(file => !file.startsWith('.'))
        .map(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            path: `/uploads/files/${file}`
          };
        });
    };

    const files = getFilesInDir(filesDir);
    const images = getFilesInDir(imagesDir);
    const designs = getFilesInDir(designsDir);

    res.json({ 
      success: true, 
      files: files,
      images: images,
      designs: designs,
      total: files.length + images.length + designs.length
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// POST /api/templates/cleanup-orphaned-files - Clean up orphaned files
router.post('/cleanup-orphaned-files', async (req, res) => {
  try {
    console.log('🧹 Starting orphaned files cleanup...');
    
    // Get all templates to check which design files are still referenced
    const templates = await Template.find({});
    const referencedDesignFiles = new Set();
    
    templates.forEach(template => {
      if (template.designFilename) {
        referencedDesignFiles.add(template.designFilename);
      }
    });
    
    // Check design files directory
    const designsDir = path.resolve(__dirname, '../uploads/designs');
    let orphanedFiles = [];
    let cleanedUpCount = 0;
    
    if (fs.existsSync(designsDir)) {
      const designFiles = fs.readdirSync(designsDir);
      
      designFiles.forEach(filename => {
        if (!referencedDesignFiles.has(filename)) {
          const filePath = path.join(designsDir, filename);
          if (deleteFileSafely(filePath)) {
            orphanedFiles.push(filename);
            cleanedUpCount++;
          }
        }
      });
    }
    
    console.log(`✅ Cleanup completed. Removed ${cleanedUpCount} orphaned files.`);
    
    res.json({
      success: true,
      message: `Cleanup completed successfully`,
      orphanedFilesRemoved: orphanedFiles,
      totalFilesCleaned: cleanedUpCount
    });
  } catch (error) {
    console.error('❌ Error during orphaned files cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup orphaned files' });
  }
});

// DELETE /api/templates/file/:filename - Delete uploaded file
router.delete('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { type } = req.query; // 'files', 'images', or 'designs'
    
    let filePath;
    switch (type) {
      case 'images':
        filePath = path.resolve(__dirname, '../uploads/images', filename);
        break;
      case 'designs':
        filePath = path.resolve(__dirname, '../uploads/designs', filename);
        break;
      default:
        filePath = path.resolve(__dirname, '../uploads/files', filename);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    console.log('File deleted successfully:', filename);

    res.json({ 
      success: true, 
      message: 'File deleted successfully',
      deletedFile: filename
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
