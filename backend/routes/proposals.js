const express = require('express');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const auth = require('../middleware/auth');
const premium = require('../middleware/premium');
const { generateIntro } = require('../services/aiCopy');
const Proposal = require('../models/Proposal');

const router = express.Router();

async function renderPdf(res, { client, items, theme, aiIntro }) {
  const primary = theme?.primary || '#1f2937';
  const secondary = theme?.secondary || '#6366f1';
  const logoUrl = theme?.logoUrl;

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  // Stream PDF to response
  doc.pipe(res);

  // Cover
  doc.rect(0, 0, doc.page.width, 180).fill(primary);
  if (logoUrl) {
    try {
      const imgResp = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const imgBuf = Buffer.from(imgResp.data);
      doc.image(imgBuf, 36, 36, { fit: [120, 60] });
    } catch {}
  }
  doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('Propuesta Comercial', 36, 48, { continued: false });
  doc.fontSize(18).text(client?.name || '', 36, 84);

  // Intro
  doc.moveDown(4);
  doc.fillColor('#111827').font('Helvetica').fontSize(12);
  doc.text(aiIntro || '', { width: doc.page.width - 72 });

  // Items
  for (const it of items || []) {
    doc.moveDown(1.2);
    if (it.enhancedUrl || it.imageUrl) {
      try {
        const imgResp = await axios.get(it.enhancedUrl || it.imageUrl, { responseType: 'arraybuffer' });
        const buf = Buffer.from(imgResp.data);
        const x = 36;
        const y = doc.y;
        doc.image(buf, x, y, { fit: [180, 120] });
        doc.fillColor('#111827').font('Helvetica-Bold').text(it.title || '', x + 200, y);
        doc.font('Helvetica').fontSize(11).text(it.description || '', x + 200, y + 18, { width: doc.page.width - (x + 200) - 36 });
        if (typeof it.price === 'number') {
          doc.fillColor(secondary).font('Helvetica-Bold').fontSize(12).text(`${it.price.toFixed(2)} €`, x + 200, y + 72);
        }
        doc.moveDown(8);
      } catch {
        doc.fillColor('#111827').font('Helvetica-Bold').text(it.title || '');
        doc.font('Helvetica').fontSize(11).text(it.description || '');
      }
    } else {
      doc.fillColor('#111827').font('Helvetica-Bold').text(it.title || '');
      doc.font('Helvetica').fontSize(11).text(it.description || '');
    }
  }

  doc.end();
}

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

    const proposal = await Proposal.create({
      userId: req.user.id,
      client,
      items,
      theme,
      aiIntro,
      pdfUrl: '',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=proposal-${proposal._id}.pdf`);
    await renderPdf(res, { client, items, theme, aiIntro });
    return;
  } catch (e) {
    console.error('PDF generation failed:', e);
    return res.status(500).json({ message: 'PDF generation failed', error: e.message });
  }
});

module.exports = router;