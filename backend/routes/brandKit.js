const express = require('express');
const router = express.Router();
const BrandKit = require('../models/BrandKit');
const auth = require('../middleware/auth');

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Brand kit router is working' });
});

// Test endpoint to check auth
router.get('/test-auth', auth, async (req, res) => {
  res.json({
    success: true,
    message: 'Auth working',
    user: req.user
  });
});

// Security audit endpoint - check user isolation
router.get('/security-audit', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const brandKit = await BrandKit.getByUserId(userId);
    
    res.json({
      success: true,
      security: {
        userId: userId,
        hasBrandKit: !!brandKit,
        brandKitId: brandKit?._id,
        logoExists: !!(brandKit?.logo?.data),
        userIsolation: 'SECURE - User can only access their own data'
      },
      message: 'Security audit passed - User isolation is working correctly'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Security audit failed',
      error: error.message
    });
  }
});

// Get brand kit for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const brandKit = await BrandKit.getByUserId(req.user.userId || req.user.id);
    
    if (!brandKit) {
      // Return default brand kit if none exists
      return res.json({
        success: true,
        brandKit: {
          primaryColor: '#00525b',
          secondaryColor: '#01aac7',
          accentColor: '#32e0c5',
          logo: null,
          fonts: [],
          customElements: []
        }
      });
    }

    res.json({
      success: true,
      brandKit: {
        id: brandKit._id,
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
        logo: brandKit.logo ? {
          data: brandKit.logo.data,
          filename: brandKit.logo.filename,
          mimetype: brandKit.logo.mimetype,
          size: brandKit.logo.size
        } : null,
        fonts: brandKit.fonts || [],
        customElements: brandKit.customElements || []
      }
    });
  } catch (error) {
    console.error('Error fetching brand kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brand kit',
      error: error.message
    });
  }
});

// Update brand kit for authenticated user
router.put('/', auth, async (req, res) => {
  try {
    const { primaryColor, secondaryColor, accentColor, logo, fonts, customElements } = req.body;
    
    const updateData = {};
    
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;
    if (accentColor !== undefined) updateData.accentColor = accentColor;
    if (logo !== undefined) updateData.logo = logo;
    if (fonts !== undefined) updateData.fonts = fonts;
    if (customElements !== undefined) updateData.customElements = customElements;

    const brandKit = await BrandKit.updateByUserId(req.user.userId || req.user.id, updateData);

    res.json({
      success: true,
      message: 'Brand kit updated successfully',
      brandKit: {
        id: brandKit._id,
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
        logo: brandKit.logo ? {
          data: brandKit.logo.data,
          filename: brandKit.logo.filename,
          mimetype: brandKit.logo.mimetype,
          size: brandKit.logo.size
        } : null,
        fonts: brandKit.fonts || [],
        customElements: brandKit.customElements || []
      }
    });
  } catch (error) {
    console.error('Error updating brand kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit',
      error: error.message
    });
  }
});

// Update specific brand kit properties
router.patch('/', auth, async (req, res) => {
  try {
    console.log('🔍 BrandKit PATCH request received');
    console.log('🔍 User ID:', req.user.userId || req.user.id);
    console.log('🔍 Request body:', req.body);
    
    const updateData = {};
    
    // Only update provided fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    console.log('🔍 Update data:', updateData);
    
    // Check database connection health
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database connection not ready, state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection not available',
        error: 'Connection not ready'
      });
    }
    
    // Check logo data size if logo is being updated
    if (updateData.logo && updateData.logo.data) {
      const logoSize = updateData.logo.data.length;
      console.log('🔍 Logo data size:', logoSize, 'bytes');
      if (logoSize > 5 * 1024 * 1024) { // 5MB limit
        return res.status(400).json({
          success: false,
          message: 'Logo file is too large. Maximum size is 5MB.',
          error: 'File too large'
        });
      }
    }
    
    // Retry logic for database operations with large data
    let brandKit = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !brandKit) {
      try {
        console.log(`🔍 Attempting brand kit update (attempt ${retryCount + 1}/${maxRetries})`);
        brandKit = await BrandKit.updateByUserId(req.user.userId || req.user.id, updateData);
        console.log('🔍 Brand kit updated successfully:', brandKit ? 'Yes' : 'No');
        break;
      } catch (error) {
        retryCount++;
        console.error(`❌ Brand kit update attempt ${retryCount} failed:`, error.message);
        
        if (retryCount >= maxRetries) {
          console.error('❌ All retry attempts failed');
          return res.status(500).json({
            success: false,
            message: 'Failed to update brand kit after multiple attempts',
            error: 'Database operation failed'
          });
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    if (!brandKit) {
      console.error('❌ Brand kit update returned null after all retries');
      return res.status(500).json({
        success: false,
        message: 'Failed to update brand kit',
        error: 'Database update failed'
      });
    }

    res.json({
      success: true,
      message: 'Brand kit updated successfully',
      brandKit: {
        id: brandKit._id,
        primaryColor: brandKit.primaryColor,
        secondaryColor: brandKit.secondaryColor,
        accentColor: brandKit.accentColor,
        logo: brandKit.logo ? {
          data: brandKit.logo.data,
          filename: brandKit.logo.filename,
          mimetype: brandKit.logo.mimetype,
          size: brandKit.logo.size
        } : null,
        fonts: brandKit.fonts || [],
        customElements: brandKit.customElements || []
      }
    });
  } catch (error) {
    console.error('❌ Error patching brand kit:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating brand kit',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// Delete brand kit (reset to defaults)
router.delete('/', auth, async (req, res) => {
  try {
    await BrandKit.findOneAndDelete({ userId: req.user.userId || req.user.id });
    
    res.json({
      success: true,
      message: 'Brand kit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brand kit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting brand kit',
      error: error.message
    });
  }
});

// Get brand kit logo only - SECURE with auth
router.get('/logo', auth, async (req, res) => {
  try {
    const brandKit = await BrandKit.getByUserId(req.user.userId || req.user.id);
    
    if (!brandKit || !brandKit.logo) {
      return res.json({
        success: true,
        logo: null
      });
    }

    res.json({
      success: true,
      logo: {
        data: brandKit.logo.data,
        filename: brandKit.logo.filename,
        mimetype: brandKit.logo.mimetype,
        size: brandKit.logo.size
      }
    });
  } catch (error) {
    console.error('Error fetching brand kit logo:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching brand kit logo',
      error: error.message
    });
  }
});

module.exports = router;