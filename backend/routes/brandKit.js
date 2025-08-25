const express = require('express');
const router = express.Router();
const BrandKit = require('../models/BrandKit');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.resolve(__dirname, '../uploads') });

// GET brand kit (for a user)
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user'; // Fallback for testing
    let kit = await BrandKit.findOne({ userId });
    if (!kit) {
      kit = await BrandKit.create({
        userId,
        logo: null,
        brandName: 'My Brand',
        tagline: 'Your brand tagline here',
        colors: { primary: "#3B82F6", secondary: "#F59E0B", accent: "#10B981" },
        fonts: { heading: "Inter", body: "Inter" },
        font: "Inter" // Backward compatibility
      });
    }
    res.json(kit);
  } catch (error) {
    console.error('Error fetching brand kit:', error);
    res.status(500).json({ error: 'Failed to fetch brand kit' });
  }
});

// POST/PUT brand kit (update for a user)
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || 'default-user'; // Fallback for testing
    const update = req.body;
    
    // Ensure fonts structure is maintained
    if (update.fonts) {
      update.font = update.fonts.heading || update.fonts.body || 'Inter'; // Backward compatibility
    }
    
    let kit = await BrandKit.findOneAndUpdate(
      { userId }, 
      update, 
      { new: true, upsert: true }
    );
    res.json({ success: true, brandKit: kit });
  } catch (error) {
    console.error('Error updating brand kit:', error);
    res.status(500).json({ error: 'Failed to update brand kit' });
  }
});

// POST logo upload
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.user?.id || 'default-user'; // Fallback for testing
    const logoUrl = `/uploads/${req.file.filename}`;
    
    let kit = await BrandKit.findOneAndUpdate(
      { userId }, 
      { logo: logoUrl }, 
      { new: true, upsert: true }
    );
    
    res.json({ 
      success: true, 
      logoUrl: logoUrl, 
      brandKit: kit 
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Add generic image upload endpoint for editor
router.post('/uploads', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
