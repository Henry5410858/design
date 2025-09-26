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
const upload = multer({ storage: multer.memoryStorage() });

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

    const pdfBuffer = await renderTemplateToPdf({
      template,
      data: { client, items, theme, intro: aiIntro },
      locale,
      currencyCode,
    });

    if (persist) {
      const upload = await uploadPdf(pdfBuffer, { folder: `users/${req.user.id}/proposals`, publicId: `${template}-${Date.now()}` });
      return res.json({ url: upload.secure_url || upload.url, public_id: upload.public_id });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${template}.pdf`);
    return res.send(pdfBuffer);
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
      if (fileMap.has(idx)) {
        const f = fileMap.get(idx);
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: `users/${req.user.id}/proposal-items` },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(f.buffer);
        });
        return { ...it, imageUrl: uploadResult.secure_url || uploadResult.url };
      }
      return it;
    }));

    // Choose intro: prefer provided text; fallback to AI
    const aiIntro = introText?.trim()
      ? introText.trim()
      : await generateIntro({ clientName: client.name, industry: client.industry, valueProps: client.valueProps });

    // Merge contact into client
    client.contact = client.contact || contact || {};

    const persist = Boolean(req.body?.persist === 'true' || req.body?.persist === true);

    const pdfBuffer = await renderTemplateToPdf({
      template,
      data: { client, items: uploadedItems, theme, intro: aiIntro },
      locale: 'es',
      currencyCode: 'EUR',
    });

    if (persist) {
      const upload = await uploadPdf(pdfBuffer, { folder: `users/${req.user.id}/proposals`, publicId: `${template}-${Date.now()}` });
      return res.json({ url: upload.secure_url || upload.url, public_id: upload.public_id });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${template}.pdf`);
    return res.send(pdfBuffer);
  } catch (e) {
    console.error('PDF generation (multipart) failed:', e);
    return res.status(500).json({ message: 'PDF generation failed', error: e.message });
  }
});

// Backward-compatible endpoint (kept for existing clients)
router.post('/generate', auth, premium, async (req, res) => {
  try {
    const { client, items = [], theme } = req.body;
    if (!client?.name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const aiIntro = await generateIntro({
      clientName: client.name,
      industry: client.industry,
      valueProps: client.valueProps,
    });

    const pdfBuffer = await renderTemplateToPdf({
      template: 'dossier-express',
      data: { client, items, theme, intro: aiIntro },
      locale: 'es',
      currencyCode: 'EUR',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=proposal.pdf');
    return res.send(pdfBuffer);
  } catch (e) {
    console.error('PDF generation failed:', e);
    return res.status(500).json({ message: 'PDF generation failed', error: e.message });
  }
});

module.exports = router;