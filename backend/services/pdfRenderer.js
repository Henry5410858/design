// pdfrenderer.js
// Robust PDF renderer for proposals: handles images (data URLs, uploaded buffers, remote URLs),
// brand/logo, multiple templates, multi-page layout, and graceful fallbacks.
//
// Exports: SimplePDFRenderer.generatePDF(proposalData, template)
// - proposalData: { client, items, introduction|introText, theme, contact, ... }
// - items: array of { title, description, location, price, keyFacts, imageUrl (dataURL or remote URL) }
//   or items may already include imageBuffer (Buffer) or imagePath (server path).
//
// Returns: Promise<Buffer>

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class SimplePDFRenderer {
  // Available templates
  static templates = [
    { id: 'dossier-express', name: 'Dossier Express', pages: 1, description: 'Resumen ejecutivo de 1 página' },
    { id: 'comparative-short', name: 'Comparativa Corta', pages: 2, description: '2-3 propiedades, 2 páginas' },
    { id: 'simple-proposal', name: 'Propuesta Simple', pages: '4-6', description: '4-6 páginas con detalles completos' },
  ];

  // Get template by ID
  static getTemplate(templateId) {
    return this.templates.find(t => t.id === templateId) || this.templates[0];
  }

  // Get all templates
  static getTemplates() {
    return this.templates;
  }

  // Validate template ID
  static isValidTemplate(templateId) {
    return this.templates.some(t => t.id === templateId);
  }

  // Public entry
  static async generatePDF(proposalData = {}, template = 'dossier-express') {
    try {
      console.log('📄 Generating PDF (improved renderer)...');

      // Validate template
      if (!this.isValidTemplate(template)) {
        console.warn(`⚠️ Invalid template "${template}", falling back to default`);
        template = 'dossier-express';
      }

      const templateInfo = this.getTemplate(template);
      console.log(`📋 Using template: ${templateInfo.name} (${templateInfo.pages} pages)`);

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

  // fetch a remote URL or decode a data URL and return Buffer
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
      case 'comparative-short':
        this._renderComparativeShort(doc, { client, items, introduction, contact, theme, primaryColor, secondaryColor, textColor, logoBuffer: proposalData._logoBuffer });
        break;
      case 'simple-proposal':
        this._renderSimpleProposal(doc, { client, items, introduction, contact, theme, primaryColor, secondaryColor, textColor, logoBuffer: proposalData._logoBuffer });
        break;
      case 'dossier-express':
      default:
        this._renderDossierExpress(doc, { client, items, introduction, contact, theme, primaryColor, secondaryColor, textColor, logoBuffer: proposalData._logoBuffer });
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

  static _renderComparativeShort(doc, ctx) {
    // 2-3 properties, 2 pages target
    const { client, items, introduction, contact, primaryColor, logoBuffer } = ctx;

    this._drawHeader(doc, client, primaryColor, logoBuffer);

    // Intro + client block
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('INTRODUCCIÓN');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#333333').text(introduction || 'Introducción no proporcionada.', { align: 'justify', lineGap: 2 });

    doc.moveDown(0.6);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('INFORMACIÓN DEL CLIENTE');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    if (client && client.name) doc.text(`Nombre: ${client.name}`);
    if (client && client.industry) doc.text(`Sector: ${client.industry}`);

    doc.addPage(); // go to page 2 for properties
    doc.y = 40;

    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('COMPARATIVA DE PROPIEDADES');
    doc.moveDown(0.5);

    // Show up to 3 properties, side-by-side if possible
    const visibleItems = items.slice(0, 3);
    const containerPadding = 10;
    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colW = Math.floor(pageW / visibleItems.length);

    visibleItems.forEach((item, idx) => {
      const x = doc.page.margins.left + idx * colW;
      let y = doc.y;

      // Image area
      const imgHeight = 110;
      if (item._imageBuffer) {
        try {
          doc.image(item._imageBuffer, x + containerPadding, y, { fit: [colW - containerPadding * 2, imgHeight], align: 'center' });
        } catch (err) {
          // ignore
        }
      } else {
        // placeholder box
        doc.rect(x + containerPadding, y, colW - containerPadding * 2, imgHeight).stroke('#e0e0e0');
      }

      y += imgHeight + 8;

      // Title
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text(item.title || '—', x + containerPadding, y, { width: colW - containerPadding * 2 });
      y += 16;

      // Key facts, location, price
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      if (item.location) doc.text(`📍 ${item.location}`, x + containerPadding, y, { width: colW - containerPadding * 2 });
      if (item.price !== undefined) doc.text(`💰 ${this._formatCurrency(item.price)}`, x + containerPadding, doc.y, { width: colW - containerPadding * 2 });
      if (item.keyFacts) doc.text(item.keyFacts, x + containerPadding, doc.y + 4, { width: colW - containerPadding * 2 });

      // small description
      if (item.description) {
        doc.fontSize(8).text(item.description, x + containerPadding, doc.y + 6, { width: colW - containerPadding * 2, ellipsis: true });
      }
      // set top to original y for next column not to jump
      doc.y = 40 + imgHeight + 80; // make sure we keep consistent baseline
    });

    doc.addPage();
    doc.y = 40;
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text('Gracias por considerar nuestra propuesta. Para más información, contacte al equipo.', { align: 'center' });
  }

  static _renderSimpleProposal(doc, ctx) {
    // 4-6 pages layout: cover + items + details + contact
    const { client, items, introduction, contact, primaryColor, logoBuffer } = ctx;

    this._drawHeader(doc, client, primaryColor, logoBuffer);
    doc.moveDown(0.5);

    // Cover: client intro
    doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text(client.name || 'Cliente', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica').fillColor('#333333').text(introduction || 'Introducción no proporcionada.', { align: 'justify', lineGap: 2 });

    doc.addPage();
    doc.y = 40;
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('PROPIEDADES DESTACADAS');
    doc.moveDown(0.5);

    // For each property show image left, text right
    const visibleItems = items.slice(0, 6); // show up to 6
    visibleItems.forEach((item, idx) => {
      // Add page if necessary
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
        doc.y = 40;
      }

      const imageBoxH = 120;
      const startX = doc.page.margins.left;
      const imageBoxW = 160;
      const textBoxW = doc.page.width - doc.page.margins.left - doc.page.margins.right - imageBoxW - 20;

      // draw container
      // image
      if (item._imageBuffer) {
        try {
          doc.image(item._imageBuffer, startX, doc.y, { fit: [imageBoxW, imageBoxH], align: 'center', valign: 'top' });
        } catch (err) {
          // fallback to rectangle
          doc.rect(startX, doc.y, imageBoxW, imageBoxH).stroke('#e0e0e0');
        }
      } else {
        doc.rect(startX, doc.y, imageBoxW, imageBoxH).stroke('#e0e0e0');
      }

      // text block
      const textX = startX + imageBoxW + 12;
      let textY = doc.y;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text(item.title || 'Sin título', textX, textY, { width: textBoxW });
      textY += 16;
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      if (item.location) doc.text(`📍 ${item.location}`, textX, textY);
      if (item.price !== undefined) doc.text(`💰 ${this._formatCurrency(item.price)}`, textX, doc.y);
      if (item.keyFacts) {
        doc.moveDown(0.5);
        doc.fontSize(9).text(item.keyFacts, textX, doc.y, { width: textBoxW });
      }
      if (item.description) {
        doc.moveDown(0.3);
        doc.fontSize(9).text(item.description, textX, doc.y, { width: textBoxW, lineGap: 2 });
      }

      // move doc.y past the box
      doc.y = doc.y + imageBoxH + 16;
    });

    // Contact & closing
    doc.addPage();
    doc.y = 40;
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('CONTACTO');
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    if (contact.name) doc.text(`Nombre: ${contact.name}`);
    if (contact.email) doc.text(`Email: ${contact.email}`);
    if (contact.phone) doc.text(`Teléfono: ${contact.phone}`);
    if (contact.company) doc.text(`Empresa: ${contact.company}`);
    if (contact.website) doc.text(`Web: ${contact.website}`);

    doc.moveDown(1);
    doc.fontSize(9).fillColor('#666666').text(`Propuesta generada el ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
  }

  static _renderDossierExpress(doc, ctx) {
    // 1-page executive summary: cover + one or two properties at most
    const { client, items, introduction, contact, primaryColor, logoBuffer } = ctx;

    this._drawHeader(doc, client, primaryColor, logoBuffer);
    doc.moveDown(0.5);

    // Left column: intro + client
    const leftX = doc.page.margins.left;
    const leftW = (doc.page.width - doc.page.margins.left - doc.page.margins.right) * 0.55;
    const rightX = leftX + leftW + 12;
    const rightW = doc.page.width - doc.page.margins.right - rightX;

    // Intro
    doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('RESUMEN EJECUTIVO', leftX, doc.y, { width: leftW });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('#333333').text(introduction || 'Introducción no proporcionada.', leftX, doc.y, { width: leftW, lineGap: 2 });

    // Client info
    doc.moveDown(0.6);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('CLIENTE', leftX, doc.y);
    doc.moveDown(0.2);
    doc.fontSize(9).font('Helvetica').fillColor('#333333');
    if (client.name) doc.text(`Nombre: ${client.name}`, { width: leftW });
    if (client.industry) doc.text(`Sector: ${client.industry}`, { width: leftW });

    // Right column: top property (if any)
    const firstItem = items[0];
    if (firstItem) {
      // Image top right
      const imgTop = doc.page.margins.top + 20;
      const imgH = 160;
      try {
        if (firstItem._imageBuffer) {
          doc.image(firstItem._imageBuffer, rightX, imgTop, { fit: [rightW, imgH], align: 'center' });
        } else {
          doc.rect(rightX, imgTop, rightW, imgH).stroke('#e0e0e0');
        }
      } catch (err) {
        doc.rect(rightX, imgTop, rightW, imgH).stroke('#e0e0e0');
      }

      // Text under image
      const underY = imgTop + imgH + 8;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text(firstItem.title || 'Sin título', rightX, underY, { width: rightW });
      doc.moveDown(0.2);
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      if (firstItem.location) doc.text(`📍 ${firstItem.location}`, { width: rightW });
      if (firstItem.price !== undefined) doc.text(`💰 ${this._formatCurrency(firstItem.price)}`, { width: rightW });
      if (firstItem.keyFacts) doc.moveDown(0.2) && doc.text(firstItem.keyFacts, { width: rightW });
    }

    // Footer contact
    doc.moveTo(doc.page.margins.left, doc.page.height - 100).lineTo(doc.page.width - doc.page.margins.right, doc.page.height - 100).strokeColor('#e0e0e0').lineWidth(1).stroke();

    doc.fontSize(9).font('Helvetica').fillColor('#333333').text('Contacto:', doc.page.margins.left, doc.page.height - 88);
    if (contact.name) doc.text(contact.name, doc.page.margins.left + 60, doc.page.height - 88);
    if (contact.email) doc.text(`Email: ${contact.email}`, doc.page.margins.left, doc.page.height - 72);
    if (contact.phone) doc.text(`Tel: ${contact.phone}`, doc.page.margins.left, doc.page.height - 58);

    doc.fontSize(8).fillColor('#666666').text('Este documento es una versión ejecutiva de la propuesta.', doc.page.margins.left, doc.page.height - 40, { align: 'left' });
  }

  // ---------- Helpers ----------

  static _formatCurrency(amount, currencyCode = 'EUR') {
    try {
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currencyCode }).format(Number(amount));
    } catch {
      return `${amount} ${currencyCode}`;
    }
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

  // Backwards compatibility wrapper
  static renderTemplateToPdf(options) {
    return this.generatePDF(options.data, options.template);
  }
}

module.exports = SimplePDFRenderer;