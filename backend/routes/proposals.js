const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const { generateIntro } = require('../services/aiCopy');
const { renderTemplateToPdf } = require('../services/pdfRenderer');
const { uploadPdf } = require('../services/cloudinaryHelpers');
const Proposal = require('../models/Proposal');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10MB for text fields (JSON)
    fileSize: 20 * 1024 * 1024,  // 20MB per file
    files: 20
  }
});

// List available templates (for UI selection)
router.get('/templates', auth, (req, res) => {
  res.json({
    templates: [
      { id: 'dossier-express', name: 'Dossier express', pages: 1 },
      { id: 'comparative-short', name: 'Comparativa corta', pages: 2 },
      { id: 'simple-proposal', name: 'Propuesta simple', pages: '4–6' },
    ],
  });
});

// Generate AI intro copy
router.post('/ai/intro', auth, async (req, res) => {
  try {
    const { clientName, industry, valueProps } = req.body || {};
    const text = await generateIntro({ clientName, industry, valueProps });
    res.json({ text });
  } catch (e) {
    res.status(500).json({ message: 'AI intro generation failed', error: e.message });
  }
});

// Alias to match frontend endpoint name
router.post('/enhance-intro', auth, async (req, res) => {
  try {
    const { text = '', clientName, industry, valueProps } = req.body || {};
    const generated = await generateIntro({ clientName, industry, valueProps });
    const enhancedText = text ? `${text.trim()}\n\n${generated}` : generated;
    res.json({ enhancedText });
  } catch (e) {
    res.status(500).json({ message: 'AI intro enhancement failed', error: e.message });
  }
});

// Render PDF from HTML templates (EJS + Puppeteer)
router.post('/render', auth, premium, async (req, res) => {
  try {
    const { template = 'dossier-express', client, items = [], theme, options = {}, useAI = true } = req.body || {};

    if (!client?.name) return res.status(400).json({ message: 'client.name is required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'At least one item is required' });

    const { locale = 'es', currencyCode = 'EUR', persist = false } = options;

    const aiIntro = useAI
      ? await generateIntro({ clientName: client.name, industry: client.industry, valueProps: client.valueProps })
      : (client?.intro || '');

    let pdfBuffer;
    try {
      pdfBuffer = await renderTemplateToPdf({
        template,
        data: { client, items, theme, intro: aiIntro },
        locale,
        currencyCode,
      });
      console.log(`[PDF] /render generated ${pdfBuffer?.length || 0} bytes for template: ${template}`);
    } catch (pdfError) {
      console.error('[PDF] Primary PDF generation failed:', pdfError);
      
      // Try with reduced retry count and simpler options
      try {
        console.log('[PDF] Attempting fallback PDF generation...');
        pdfBuffer = await renderTemplateToPdf({
          template,
          data: { client, items, theme, intro: aiIntro },
          locale,
          currencyCode,
          prefetch: false, // Skip image prefetching
          retries: 0 // No retries for fallback
        });
        console.log(`[PDF] Fallback PDF generation successful: ${pdfBuffer?.length || 0} bytes`);
      } catch (fallbackError) {
        console.error('[PDF] Fallback PDF generation also failed:', fallbackError);
        throw new Error(`PDF generation failed: ${pdfError.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }

    if (persist) {
      const upload = await uploadPdf(pdfBuffer, { folder: `users/${req.user.id}/proposals`, publicId: `${template}-${Date.now()}` });
      return res.json({ url: upload.secure_url || upload.url, public_id: upload.public_id });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${template}.pdf"`);
    res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer).toString());
    return res.end(pdfBuffer);
  } catch (e) {
    console.error('PDF render failed:', e);
    return res.status(500).json({ message: 'PDF render failed', error: e.message });
  }
});

// Accept multipart form data (UI form with images) and render via selected template
router.post('/generate', auth, premium, upload.any(), async (req, res) => {
  try {
    // Parse JSON fields
    const parseJSON = (key, fallback) => {
      try { return JSON.parse(req.body?.[key] || ''); } catch { return fallback; }
    };

    const client = parseJSON('client', {});
    const items = parseJSON('items', []);
    const theme = parseJSON('theme', {});
    const contact = parseJSON('contact', {});
    const template = req.body?.template || 'dossier-express';
    const introText = req.body?.introText || '';

    if (!client?.name) return res.status(400).json({ message: 'client.name is required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'At least one item is required' });

    // Map uploaded files to items by index naming convention propertyImage_{index}
    const fileMap = new Map();
    (req.files || []).forEach((f) => {
      const m = /^propertyImage_(\d+)$/.exec(f.fieldname);
      if (m) fileMap.set(Number(m[1]), f);
    });

    // Upload images to Cloudinary if file exists
    const uploadedItems = await Promise.all(items.map(async (it, idx) => {
      try {
        if (fileMap.has(idx)) {
          const f = fileMap.get(idx);
          const uploadResult = await new Promise((resolve, reject) => {
            console.log()
            const stream = cloudinary.uploader.upload_stream(
              { folder: `users/${req.user.id}/proposal-items` },
              (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(f.buffer);
          });
          return { ...it, imageUrl: uploadResult.secure_url || uploadResult.url };
        }
        console.log("it: ", it)
        return it;
      } catch (e) {
        // If Cloudinary upload fails (e.g., missing credentials), continue with original imageUrl
        console.warn('Image upload failed, using original imageUrl:', e?.message || e);
        return it;
      }
    }));

    // Choose intro: prefer provided text; fallback to AI
    const aiIntro = introText?.trim()
      ? introText.trim()
      : await generateIntro({ clientName: client.name, industry: client.industry, valueProps: client.valueProps });

    // Merge contact into client
    client.contact = client.contact || contact || {};

    const persist = Boolean(req.body?.persist === 'true' || req.body?.persist === true);

    let pdfBuffer;
    try {
      pdfBuffer = await renderTemplateToPdf({
        template,
        data: { client, items: uploadedItems, theme, intro: aiIntro },
        locale: 'es',
        currencyCode: 'EUR',
      });
      console.log(`[PDF] /generate generated ${pdfBuffer?.length || 0} bytes for template: ${template}`);
    } catch (pdfError) {
      console.error('[PDF] Primary PDF generation failed:', pdfError);
      
      // Try with reduced retry count and simpler options
      try {
        console.log('[PDF] Attempting fallback PDF generation...');
        pdfBuffer = await renderTemplateToPdf({
          template,
          data: { client, items: uploadedItems, theme, intro: aiIntro },
          locale: 'es',
          currencyCode: 'EUR',
          prefetch: false, // Skip image prefetching
          retries: 0 // No retries for fallback
        });
        console.log(`[PDF] Fallback PDF generation successful: ${pdfBuffer?.length || 0} bytes`);
      } catch (fallbackError) {
        console.error('[PDF] Fallback PDF generation also failed:', fallbackError);
        
        // Try ultra-simple fallback with minimal options
        try {
          console.log('[PDF] Attempting ultra-simple fallback PDF generation...');
          pdfBuffer = await renderTemplateToPdf({
            template: 'dossier-express', // Use simpler template
            data: { 
              client: { ...client, contact: client.contact || {} }, 
              items: uploadedItems.slice(0, 3), // Limit items to reduce complexity
              theme: { ...theme, logoUrl: null }, // Remove logo to avoid image issues
              intro: aiIntro 
            },
            locale: 'es',
            currencyCode: 'EUR',
            prefetch: false,
            retries: 0
          });
          console.log(`[PDF] Ultra-simple fallback successful: ${pdfBuffer?.length || 0} bytes`);
        } catch (ultraFallbackError) {
          console.error('[PDF] All PDF generation attempts failed:', ultraFallbackError);
          throw new Error(`PDF generation completely failed. Primary: ${pdfError.message}. Fallback: ${fallbackError.message}. Ultra-fallback: ${ultraFallbackError.message}`);
        }
      }
    }

    if (persist) {
      const upload = await uploadPdf(pdfBuffer, { folder: `users/${req.user.id}/proposals`, publicId: `${template}-${Date.now()}` });
      return res.json({ url: upload.secure_url || upload.url, public_id: upload.public_id });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${template}.pdf"`);
    res.setHeader('Content-Length', Buffer.byteLength(pdfBuffer).toString());
    return res.end(pdfBuffer);
  } catch (e) {
    console.error('PDF generation (multipart) failed:', e);
    return res.status(500).json({ message: 'PDF generation failed', error: e.message });
  }
});

// Backward-compatible endpoint (kept for existing clients) - DEPRECATED: Use the multipart version above
// router.post('/generate', auth, premium, async (req, res) => {
//   try {
//     const { client, items = [], theme } = req.body;
//     if (!client?.name || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'Invalid payload' });
//     }
//
//     const aiIntro = await generateIntro({
//       clientName: client.name,
//       industry: client.industry,
//       valueProps: client.valueProps,
//     });
//
//     const pdfBuffer = await renderTemplateToPdf({
//       template: 'dossier-express',
//       data: { client, items, theme, intro: aiIntro },
//       locale: 'es',
//       currencyCode: 'EUR',
//     });
//
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename=proposal.pdf');
//     return res.send(pdfBuffer);
//   } catch (e) {
//     console.error('PDF generation failed:', e);
//     return res.status(500).json({ message: 'PDF generation failed', error: e.message });
//   }
// });

module.exports = router;