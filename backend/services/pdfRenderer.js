const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class SimplePDFRenderer {
  // Public entry
  static async generatePDF(proposalData = {}, template = 'custom-proposal') {
    try {
      console.log('📄 Generating PDF (custom proposal template)...');

      // Preprocess: normalize fields and preload images
      const normalized = await this._preprocessProposalData(proposalData);

      // Create PDF document
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true
      });

      const chunks = [];
      return await new Promise((resolve, reject) => {
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add content (synchronous drawing now that images are preloaded)
        try {
          this._addContentToPDF(doc, normalized, template);
          doc.end();
        } catch (err) {
          reject(err);
        }
      });

    } catch (error) {
      console.error('❌ Simple PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // ---------- PREPROCESS -----------

  static async _preprocessProposalData(proposalData) {
    // Clone shallow
    const data = Object.assign({}, proposalData);

    // Support both 'introduction' and 'introText'
    data.introduction = data.introduction || data.introText || '';

    // Normalize theme
    data.theme = data.theme || {};
    if (data.theme.primaryColor) data.theme.primary = data.theme.primaryColor;
    if (data.theme.secondaryColor) data.theme.secondary = data.theme.secondaryColor;

    // Preload logo
    data._logoBuffer = null;
    if (data.theme && data.theme.logoUrl) {
      try {
        data._logoBuffer = await this._fetchImageAsBuffer(data.theme.logoUrl);
      } catch (err) {
        console.warn('Could not load logo image:', err.message);
        data._logoBuffer = null;
      }
    }

    // Ensure items is array
    data.items = Array.isArray(data.items) ? data.items : [];

    // Preload images for each item (store as _imageBuffer)
    const preloadPromises = data.items.map(async (item, idx) => {
      item._imageBuffer = null;
      // If the item already has a Buffer
      if (item.imageBuffer && Buffer.isBuffer(item.imageBuffer)) {
        item._imageBuffer = item.imageBuffer;
        return;
      }
      // If item contains imageFileBuffer (for example from multer), use it
      if (item.imageFileBuffer && Buffer.isBuffer(item.imageFileBuffer)) {
        item._imageBuffer = item.imageFileBuffer;
        return;
      }
      // If there is an imagePath (server path), try read it
      if (item.imagePath && typeof item.imagePath === 'string') {
        try {
          item._imageBuffer = fs.readFileSync(item.imagePath);
          return;
        } catch (err) {
          console.warn(`Could not read imagePath for item ${idx}: ${err.message}`);
        }
      }
      // If there's an imageUrl (could be data URL or remote)
      if (item.imageUrl && typeof item.imageUrl === 'string') {
        try {
          item._imageBuffer = await this._fetchImageAsBuffer(item.imageUrl);
        } catch (err) {
          console.warn(`Failed to fetch image for item ${idx}: ${err.message}`);
          item._imageBuffer = null;
        }
      }
    });

    await Promise.all(preloadPromises);

    return data;
  }

  // Fetch a remote URL or decode a data URL and return Buffer
  static _fetchImageAsBuffer(urlOrData) {
    return new Promise((resolve, reject) => {
      try {
        // Data URL e.g., data:image/png;base64,....
        if (typeof urlOrData === 'string' && urlOrData.startsWith('data:')) {
          const commaIndex = urlOrData.indexOf(',');
          if (commaIndex === -1) return reject(new Error('Invalid data URL'));
          const meta = urlOrData.substring(5, commaIndex); // e.g., image/png;base64
          const isBase64 = meta.includes('base64');
          const dataPart = urlOrData.substring(commaIndex + 1);
          const buffer = isBase64 ? Buffer.from(dataPart, 'base64') : Buffer.from(decodeURIComponent(dataPart), 'utf8');
          return resolve(buffer);
        }

        // Local file path
        if (typeof urlOrData === 'string' && fs.existsSync(urlOrData)) {
          try {
            const b = fs.readFileSync(urlOrData);
            return resolve(b);
          } catch (err) {
            return reject(err);
          }
        }

        // Remote http(s) url
        const match = /^https?:\/\//i.test(urlOrData);
        if (!match) return reject(new Error('Unsupported image source (not data URL, local path or http/https URL).'));

        const client = urlOrData.startsWith('https') ? https : http;
        client.get(urlOrData, (res) => {
          const status = res.statusCode || 0;
          if (status >= 400) return reject(new Error(`HTTP ${status} when fetching image`));
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });
          res.on('error', reject);
        }).on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  // ---------- PDF CONTENT DRAWING -----------

  static _addContentToPDF(doc, proposalData, template) {
    const client = proposalData.client || {};
    const items = proposalData.items || [];
    const introduction = proposalData.introduction || '';
    const contact = proposalData.contact || {};
    const theme = proposalData.theme || {};

    // Theme colors with defaults
    const primaryColor = theme.primary || '#2c5aa0';
    const secondaryColor = theme.secondary || '#f8f9fa';
    const textColor = theme.textColor || '#333333';

    // Fonts & colors
    doc.fillColor(textColor);

    // Template-specific renderers
    switch (template) {
      case 'custom-proposal':
        this._renderCustomProposal(doc, { client, items, introduction, contact, theme, primaryColor, secondaryColor, textColor, logoBuffer: proposalData._logoBuffer });
        break;
      default:
        this._renderCustomProposal(doc, { client, items, introduction, contact, theme, primaryColor, secondaryColor, textColor, logoBuffer: proposalData._logoBuffer });
        break;
    }

    // Page numbers
    this._addPageNumbers(doc);
  }

  // Header used by templates
  static _drawHeader(doc, client, primaryColor, logoBuffer) {
    // Header bar
    const headerHeight = 100;
    doc.save();
    doc.rect(0, 0, doc.page.width, headerHeight).fill(primaryColor);
    doc.restore();

    // If logoBuffer, place at left
    const margin = doc.page.margins.left || 40;
    if (logoBuffer) {
      try {
        const logoMaxHeight = 56;
        const x = margin;
        const y = 18;
        doc.image(logoBuffer, x, y, { fit: [120, logoMaxHeight], align: 'left' });
      } catch (err) {
        // ignore image errors
      }
    }

    // Title centered
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
      .text('PROPUESTA COMERCIAL', 0, 35, { align: 'center' });

    // Client briefly under title (white)
    const clientName = client && client.name ? client.name : '';
    if (clientName) {
      doc.fontSize(11).font('Helvetica').fillColor('#ffffff').text(`Para: ${clientName}`, 0, 60, { align: 'center' });
    }

    // Move cursor below header
    doc.moveDown();
    doc.y = headerHeight + 10;
    doc.fillColor('#333333');
  }

  // ---------- Template renderers ----------

  static _renderCustomProposal(doc, ctx) {
    const { client, items, introduction, contact, primaryColor, logoBuffer } = ctx;

    this._drawHeader(doc, client, primaryColor, logoBuffer);

    // Información del Cliente
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('Información del Cliente');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    if (client && client.name) doc.text(`Nombre: ${client.name}`);
    if (client && client.industry) doc.text(`Sector: ${client.industry}`);

    doc.addPage();
    doc.y = 40;

    // Introducción
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('Introducción');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#333333').text(introduction || 'Introducción no proporcionada.', { align: 'justify', lineGap: 2 });

    // Propiedades/Producto
    doc.addPage();
    doc.y = 40;
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('Propiedades/Producto');
    doc.moveDown(0.5);

    const visibleItems = items.slice(0, 3); // Show up to 3 items

    visibleItems.forEach((item, idx) => {
      const x = doc.page.margins.left + idx * (doc.page.width - doc.page.margins.left * 2) / visibleItems.length;
      let y = doc.y;

      // Image area
      const imgHeight = 110;
      if (item._imageBuffer) {
        try {
          doc.image(item._imageBuffer, x, y, { fit: [doc.page.width / 3, imgHeight], align: 'center' });
        } catch (err) {
          // ignore
        }
      } else {
        doc.rect(x, y, doc.page.width / 3, imgHeight).stroke('#e0e0e0');
      }

      y += imgHeight + 8;

      // Title
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text(item.title || '—', x, y);
      y += 16;

      // Description
      if (item.description) doc.fontSize(8).text(item.description, x, y, { width: doc.page.width / 3, ellipsis: true });

      doc.y = y + 50; // Adjust the position for the next item
    });

    // Información de Contacto
    doc.addPage();
    doc.y = 40;
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('Información de Contacto');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    if (contact.name) doc.text(`Nombre: ${contact.name}`);
    if (contact.email) doc.text(`Email: ${contact.email}`);
    if (contact.phone) doc.text(`Teléfono: ${contact.phone}`);
    if (contact.company) doc.text(`Empresa: ${contact.company}`);
    if (contact.website) doc.text(`Web: ${contact.website}`);
    
    doc.moveDown(1);
    doc.fontSize(9).fillColor('#666666').text(`Propuesta generada el ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
  }

  static _addPageNumbers(doc) {
    const range = doc.bufferedPageRange(); // { start: 0, count: N }
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.height - 30;
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
        .text(`Página ${i + 1} de ${range.count}`, 0, bottom, { align: 'center' });
    }
  }

  static _formatCurrency(amount, currencyCode = 'EUR') {
    try {
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currencyCode }).format(Number(amount));
    } catch {
      return `${amount} ${currencyCode}`;
    }
  }
}

module.exports = SimplePDFRenderer;
