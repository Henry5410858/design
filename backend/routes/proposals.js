const express = require('express');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const { generateIntro } = require('../services/aiCopy');
const Proposal = require('../models/Proposal');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

async function renderPdf(res, { client, items, theme, aiIntro, contact, template = 'comparative-short' }) {
  const primary = theme?.primary || '#1f2937';
  const secondary = theme?.secondary || '#6366f1';
  const logoUrl = theme?.logoUrl;

  // Helper to transform Cloudinary URLs with optimized params
  const transformCloudinary = (url, { w, h, c = 'fill', q = 'auto', f = 'auto' } = {}) => {
    try {
      if (!url || typeof url !== 'string') return url;
      // Only transform Cloudinary-hosted assets
      if (!/res\.cloudinary\.com\//.test(url)) return url;
      const replacement = `/upload/f_${f},q_${q},c_${c}${w ? `,w_${w}` : ''}${h ? `,h_${h}` : ''}/`;
      // Insert after /upload/
      return url.replace(/\/upload\/(?:v\d+\/)?/, (m) => m.replace(/\/upload\//, replacement));
    } catch {
      return url;
    }
  };

  // Static Spanish labels (i18n removed per request)
  const t = {
    cover_title_comparative: 'Propuesta Comparativa',
    cover_title_simple: 'Propuesta Profesional',
    cover_title_dossier: 'Dossier Express',
    presentation: 'Presentación',
    comparison: 'Comparación de Opciones',
    contact: 'Información de Contacto',
    summary: 'Resumen Ejecutivo',
    benefits: 'Beneficios Clave',
    investment_summary: 'Resumen de Inversión',
    min_price: 'Precio Mínimo',
    max_price: 'Precio Máximo',
    avg_price: 'Precio Promedio',
  };

  // Read template
  const templatePath = path.join(__dirname, '..', 'templates', `${template}.ejs`);
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  // Render HTML
  const html = ejs.render(templateContent, {
    client,
    items,
    theme,
    aiIntro,
    contact,
    primary,
    secondary,
    logoUrl,
    t,
    // Expose image helper to templates
    getImg: (url, w, h, c) => transformCloudinary(url, { w, h, c }),
  });

  // Launch puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });

  await browser.close();

  // Send PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=proposal-${Date.now()}.pdf`);
  res.send(pdfBuffer);
}

router.post('/generate', auth, premium, upload.any(), async (req, res) => {
  try {
    const { client, items: itemsStr, theme, contact, template = 'comparative-short', introText } = req.body;

    let clientData, items, themeData, contactData;
    try {
      clientData = JSON.parse(client);
      items = JSON.parse(itemsStr);
      themeData = JSON.parse(theme);
      contactData = contact ? JSON.parse(contact) : {};
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON data' });
    }

    if (!clientData?.name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Client name and at least one item required' });
    }

    let aiIntro = introText;
    if (!aiIntro) {
      aiIntro = await generateIntro({
        clientName: clientData.name,
        industry: clientData.industry,
        valueProps: clientData.valueProps,
      });
    }

    // Process uploaded images
    const processedItems = await Promise.all(items.map(async (item, index) => {
      const imageField = `propertyImage_${index}`;
      const uploadedFile = req.files?.find(f => f.fieldname === imageField);

      if (uploadedFile) {
        try {
          // Upload to Cloudinary with optimizations
          const result = await cloudinary.uploader.upload(
            `data:${uploadedFile.mimetype};base64,${uploadedFile.buffer.toString('base64')}`,
            {
              folder: 'proposals',
              transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
              ]
            }
          );

          return {
            ...item,
            enhancedUrl: result.secure_url,
            imageUrl: result.secure_url
          };
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without image
          return item;
        }
      }

      return item;
    }));

    const proposal = await Proposal.create({
      userId: req.user.id,
      client: clientData,
      contact: contactData,
      items: processedItems,
      theme: themeData,
      template,
      aiIntro,
      pdfUrl: '',
    });

    await renderPdf(res, {
      client: clientData,
      items: processedItems,
      theme: themeData,
      aiIntro,
      contact: contactData,
      template,
    });
    return;
  } catch (e) {
    console.error('PDF generation failed:', e);
    return res.status(500).json({ message: 'PDF generation failed', error: e.message });
  }
});

router.post('/enhance-intro', auth, premium, async (req, res) => {
  try {
    const { text, clientName, industry, valueProps } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const enhancedText = await generateIntro({
      clientName: clientName || 'cliente',
      industry: industry || 'general',
      valueProps: valueProps || [],
      baseText: text,
    });

    res.json({ enhancedText });
  } catch (e) {
    console.error('Intro enhancement failed:', e);
    return res.status(500).json({ message: 'Intro enhancement failed', error: e.message });
  }
});

module.exports = router;