const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFRenderer {
  constructor() {
    this.doc = null;
  }

  // Basic sanitization to avoid strange characters and incompatible glyphs
  sanitizeText(input) {
    if (!input) return '';
    const str = String(input);
    // Replace non-breaking spaces and control chars
    return str
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .normalize('NFC');
  }

  // Main method to generate PDF
  async generateProposal(data) {
    // Preload images (logo and property images) before starting PDF rendering
    const preloadResult = await this.preloadAssets(data);

    return new Promise(async (resolve, reject) => {
      try {
        console.log('Generating PDF with data:', {
          template: data.template,
          client: data.client,
          propertiesCount: data.items?.length,
          hasIntro: !!data.introText,
          hasContact: !!data.contact
        });

        // Create a new PDF document
        this.doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          bufferPages: true
        });

        const chunks = [];
        
        this.doc.on('data', (chunk) => chunks.push(chunk));
        this.doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        this.doc.on('error', reject);

        // Apply brand theme
        this.applyBrandTheme(data.theme);
        this.preloadedLogoBuffer = preloadResult.logoBuffer || null;
        this.preloadedItems = preloadResult.itemsWithBuffers || data.items || [];

        // Generate content based on template
        switch (data.template) {
          case 'comparative-short':
            this.generateComparativeShort({ ...data, items: this.preloadedItems });
            break;
          case 'simple-proposal':
            this.generateSimpleProposal({ ...data, items: this.preloadedItems });
            break;
          case 'dossier-express':
            this.generateDossierExpress({ ...data, items: this.preloadedItems });
            break;
          default:
            this.generateSimpleProposal({ ...data, items: this.preloadedItems });
        }

        // Add page numbers on all pages
        this.addPageNumbers();

        this.doc.end();

      } catch (error) {
        console.error('Error in PDF generation:', error);
        reject(error);
      }
    });
  }

  // Preload logo and property images as buffers so PDFKit can draw them synchronously
  async preloadAssets(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const { createCanvas, loadImage } = require('canvas');
    const toPngBuffer = async (buf) => {
      try {
        const img = await loadImage(buf);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toBuffer('image/png');
      } catch (_) { return buf; }
    };
    const loadOne = async (url) => {
      try {
        if (!url) return null;
        if (/^data:image\//i.test(url)) {
          const base64 = url.split(',')[1];
          return Buffer.from(base64, 'base64');
        }
        if (/^https?:\/\//i.test(url)) {
          const fetch = require('node-fetch');
          const timeoutMs = 5000;
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeoutMs);
          const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'image/*' } });
          clearTimeout(id);
          if (!res.ok) return null;
          const contentType = res.headers.get('content-type') || '';
          const buf = await res.buffer();
          if (/webp/i.test(contentType) || /\.webp(\?|$)/i.test(url)) {
            return await toPngBuffer(buf);
          }
          return buf;
        }
        // treat as local filesystem path
        if (fs.existsSync(url)) {
          return fs.readFileSync(url);
        }
        return null;
      } catch (_) {
        return null;
      }
    };

    // Load logo
    const logoBuffer = await loadOne(data?.theme?.logoUrl);

    // Load property images
    const itemsWithBuffers = await Promise.all(
      items.map(async (it) => ({
        ...it,
        _imageBuffer: await loadOne(it.imageUrl || it.enhancedUrl)
      }))
    );

    return { logoBuffer, itemsWithBuffers };
  }

  // Add page numbers bottom-right across all buffered pages
  addPageNumbers() {
    try {
      const range = this.doc.bufferedPageRange();
      const total = range.count;
      for (let i = 0; i < total; i++) {
        this.doc.switchToPage(i);
        const pageHeight = this.doc.page.height;
        const pageWidth = this.doc.page.width;
        const text = `Página ${i + 1} de ${total}`;
        this.doc
          .fillColor('#6B7280')
          .font('Helvetica')
          .fontSize(9)
          .text(text, 40, pageHeight - 40, { width: pageWidth - 80, align: 'right' });
      }
    } catch (_) {}
  }

  // Apply brand colors and styling
  applyBrandTheme(theme) {
    const safeTheme = theme || {};
    this.brandTheme = {
      primary: safeTheme.primary || '#1f2937',
      secondary: safeTheme.secondary || '#6366f1',
      logoUrl: safeTheme.logoUrl
    };
  }

  // Utility: draw a section header bar similar to the screenshot
  drawSectionHeader(title, x, y, width) {
    this.doc
      .save()
      .rect(x, y, width, 18)
      .fill('#CFE6FB')
      .restore();
    this.doc
      .fillColor(this.brandTheme.primary)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title, x + 10, y + 3, { width: width - 20 });
  }

  // Utility: label on the left, value below (light weight)
  drawLabelValue(label, value, x, y) {
    const lineHeight = 14; // consistent vertical rhythm
    const labelWidth = 120;
    this.doc
      .fillColor('#1F2937')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(label + ':', x, y, { width: labelWidth, continued: false });

    if (value) {
      this.doc
        .fillColor('#111827')
        .font('Helvetica')
        .fontSize(10)
        .text(value, x + labelWidth + 6, y, { width: 360 - labelWidth - 6 });
    }

    // Ensure we maintain expected y position for next line
    this.doc.y = Math.max(this.doc.y, y + lineHeight);
  }

  // Add header to PDF
  addHeader(title) {
    this.doc
      .fillColor(this.brandTheme.primary)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(title, 50, 50, { align: 'left' });

    // Add line separator
    this.doc
      .moveTo(50, 80)
      .lineTo(550, 80)
      .strokeColor(this.brandTheme.secondary)
      .lineWidth(2)
      .stroke();

    this.doc.y = 90;
  }

  // Add footer with page numbers
  addFooter() {
    const pageNumber = this.doc.bufferedPageRange().count;
    
    this.doc.page.margins = { bottom: 50 };
    this.doc
      .fontSize(10)
      .fillColor('#666666')
      .text(
        `Página ${pageNumber}`,
        50,
        this.doc.page.height - 50,
        { align: 'center' }
      );
  }

  // Template 1: Comparative Short (2-3 properties, 2 pages)
  generateComparativeShort(data) {
    const pageWidth = this.doc.page.width;
    const marginLeft = 40;
    const marginRight = 40;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Title box
    this.doc
      .save()
      .rect(marginLeft, 60, contentWidth, 46)
      .fill('#E6F0FA')
      .restore();
    this.doc
      .fillColor(this.brandTheme.primary)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(`Propuesta Comercial - ${this.sanitizeText(data.client.name)}`, marginLeft + 12, 70, { width: contentWidth - 24, align: 'left' });

    // Client info + image row
    const sectionTop = 120;
    this.drawSectionHeader('Información del Cliente', marginLeft, sectionTop, contentWidth);

    // Left column info
    let y = sectionTop + 26;
    this.drawLabelValue('Nombre del Cliente', this.sanitizeText(data.client.name || ''), marginLeft + 12, y);
    y += 20;
    this.drawLabelValue('Industria', this.sanitizeText(data.client.industry || ''), marginLeft + 12, y);

    // Right image card
    const imageCardW = 180;
    const imageCardH = 180;
    const imageX = marginLeft + contentWidth - imageCardW - 6;
    const imageY = sectionTop + 8;
    this.doc
      .save()
      .rect(imageX, imageY, imageCardW, imageCardH)
      .strokeColor('#BFD7EE')
      .lineWidth(1)
      .stroke()
      .restore();
    if (data.items?.[0]?._imageBuffer) {
      try {
        this.doc.image(data.items[0]._imageBuffer, imageX + 2, imageY + 2, { width: imageCardW - 4, height: imageCardH - 4, fit: [imageCardW - 4, imageCardH - 4] });
      } catch (_) {}
    }

    // Introduction section
    const introTop = imageY + imageCardH + 24;
    this.drawSectionHeader('Introducción', marginLeft, introTop, contentWidth);
    this.doc
      .fillColor('#333333')
      .fontSize(12)
      .font('Helvetica')
      .text(this.sanitizeText(data.introText || ''), marginLeft + 12, introTop + 26, { width: contentWidth - 24, align: 'justify' });

    // Properties section
    const propsTop = introTop + 110;
    this.drawSectionHeader('Propiedades/Producto', marginLeft, propsTop, contentWidth);
    let propsY = propsTop + 26;
    const first = data.items?.[0];
    if (first) {
      this.drawLabelValue('Título', this.sanitizeText(first.title || ''), marginLeft + 12, propsY);
      propsY += 14;
      this.drawLabelValue('Ubicación', this.sanitizeText(first.location || ''), marginLeft + 12, propsY);
      propsY += 14;
      if (first.price) {
        this.drawLabelValue('Precio (€, EUR)', first.price.toLocaleString(), marginLeft + 12, propsY);
        propsY += 14;
      }
      this.drawLabelValue('Características Clave', this.sanitizeText(first.keyFacts || ''), marginLeft + 12, propsY);
      propsY += 14;
      this.drawLabelValue('Descripción', this.sanitizeText(first.description || ''), marginLeft + 12, propsY);
    }

    // Bottom dual sections: Achievements and Contact
    const bottomTop = propsTop + 150;
    const colW = (contentWidth - 16) / 2;
    // Achievements (left)
    this.drawSectionHeader('Achievements', marginLeft, bottomTop, colW);
    let by = bottomTop + 26;
    this.drawLabelValue('Título', this.sanitizeText(first?.title || ''), marginLeft + 12, by); by += 14;
    this.drawLabelValue('Ubicación', this.sanitizeText(first?.location || ''), marginLeft + 12, by); by += 14;
    this.drawLabelValue('Precio (€)', first?.price ? first.price.toLocaleString() : '', marginLeft + 12, by); by += 14;
    this.drawLabelValue('Características Clave', this.sanitizeText(first?.keyFacts || ''), marginLeft + 12, by); by += 14;
    this.drawLabelValue('Descripción', this.sanitizeText(first?.description || ''), marginLeft + 12, by);

    // Contact (right)
    this.drawSectionHeader('Información de Contacto', marginLeft + colW + 16, bottomTop, colW);
    let cy = bottomTop + 26;
    const c = data.contact || {};
    this.drawLabelValue('Nombre', this.sanitizeText(c.name || ''), marginLeft + colW + 28, cy); cy += 14;
    this.drawLabelValue('E-mail', this.sanitizeText(c.email || ''), marginLeft + colW + 28, cy); cy += 14;
    this.drawLabelValue('Teléfono', this.sanitizeText(c.phone || ''), marginLeft + colW + 28, cy); cy += 14;
    this.drawLabelValue('Empresa', this.sanitizeText(c.company || ''), marginLeft + colW + 28, cy); cy += 14;
    this.drawLabelValue('Dirección', this.sanitizeText(c.address || ''), marginLeft + colW + 28, cy); cy += 14;
    this.drawLabelValue('Sitio Web', this.sanitizeText(c.website || ''), marginLeft + colW + 28, cy);
  }

  // Template 2: Simple Proposal (4-6 pages with photos and details)
  generateSimpleProposal(data) {
    this.addHeader(`Propuesta Detallada - ${data.client.name}`);

    // Cover page
    // Modern hero block
    const pageWidth = this.doc.page.width;
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Hero band
    this.doc
      .save()
      .rect(marginLeft, 130, contentWidth, 90)
      .fill(this.brandTheme.primary)
      .restore();

    // Title on hero
    this.doc
      .fillColor('#ffffff')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Propuesta Comercial', marginLeft + 20, 150, { width: contentWidth - 40, align: 'left' });

    // Optional logo on cover (top-right on hero band)
    if (this.preloadedLogoBuffer) {
      try {
        const logoWidth = 120;
        this.doc.image(this.preloadedLogoBuffer, marginLeft + contentWidth - logoWidth - 16, 138, { width: logoWidth, align: 'right' });
      } catch (_) {}
    }

    this.doc
      .fillColor('#ffffff')
      .fontSize(14)
      .font('Helvetica')
      .text(`Para: ${data.client.name}`, marginLeft + 20, 180, { width: contentWidth - 40, align: 'left' });

    if (data.client.industry) {
      this.doc
        .fillColor('#ffffff')
        .fontSize(12)
        .font('Helvetica')
        .text(`Industria: ${data.client.industry}`, marginLeft + 20, 200, { width: contentWidth - 40, align: 'left' });
    }

    this.doc
      .fillColor('#666666')
      .fontSize(10)
      .font('Helvetica')
      .text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, marginLeft, 240, { width: contentWidth, align: 'right' });

    // Add new page for content
    this.doc.addPage();

    // Table of contents
    this.addHeader('Tabla de Contenidos');
    
    const contents = [
      '1. Introducción',
      '2. Propiedades/Productos',
      '3. Detalles de Contacto'
    ];

    contents.forEach((item, index) => {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(12)
        .font('Helvetica')
        .text(item, 50, this.doc.y);
      this.doc.moveDown();
    });

    // Introduction page
    this.doc.addPage();
    this.addHeader('Introducción');

    if (data.introText) {
      this.doc
        .fillColor('#333333')
        .fontSize(12)
        .font('Helvetica')
        .text(data.introText, 50, this.doc.y, {
          align: 'justify',
          width: 500
        });
    } else {
      this.doc
        .fillColor('#666666')
        .fontSize(12)
        .font('Helvetica')
        .text(`Esta propuesta ha sido preparada específicamente para ${data.client.name}${data.client.industry ? ` en el sector ${data.client.industry}` : ''}.`, 50, this.doc.y, {
          align: 'justify',
          width: 500
        });
    }

    // Properties pages
    data.items.forEach((property, index) => {
      this.doc.addPage();
      this.addHeader(`Propiedad ${index + 1}: ${property.title}`);

      // Property details in a structured format
      const details = [];
      
      if (property.location) {
        details.push(`Ubicación: ${property.location}`);
      }
      
      if (property.price) {
        details.push(`Precio: €${property.price.toLocaleString()}`);
      }
      
      if (property.keyFacts) {
        details.push(`Características: ${property.keyFacts}`);
      }

      details.forEach(detail => {
        this.doc
          .fillColor('#333333')
          .fontSize(11)
          .font('Helvetica')
          .text(`• ${detail}`, 50, this.doc.y);
        this.doc.moveDown(0.5);
      });

      this.doc.moveDown();

      // Optional property image (full-width card style) using preloaded buffer
      if (property._imageBuffer) {
        try {
          const imgHeight = 320;
          // Ensure buffer is a PNG-compatible buffer for PDFKit
          const buf = property._imageBuffer;
          this.doc.image(buf, 50, this.doc.y, { width: contentWidth, fit: [contentWidth, imgHeight], align: 'center' });
          // Advance cursor beyond the image to avoid overlay
          this.doc.y = this.doc.y + imgHeight + 18;
        } catch (e) {
          // If direct draw fails, skip image gracefully
        }
      }

      // Property description
      this.doc
        .fillColor('#333333')
        .fontSize(12)
        .font('Helvetica')
        .text('Descripción:', 50, this.doc.y)
        .font('Helvetica-Bold');

      this.doc.moveDown(0.5);

      this.doc
        .fillColor('#666666')
        .fontSize(11)
        .font('Helvetica')
        .text(this.sanitizeText(property.description), 50, this.doc.y, {
          align: 'justify',
          width: 500
        });
    });

    // Contact page
    this.doc.addPage();
    this.addContactSection(data.contact, true);
  }

  // Template 3: Dossier Express (1-page executive summary)
  generateDossierExpress(data) {
    this.addHeader(`Resumen Ejecutivo - ${data.client.name}`);

    // Client summary
    this.doc
      .fillColor(this.brandTheme.primary)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Resumen para el Cliente:', 50, this.doc.y);

    this.doc
      .fillColor('#333333')
      .fontSize(11)
      .font('Helvetica')
      .text(`• Cliente: ${data.client.name}`, 70, this.doc.y);

    this.doc
      .text(`• Industria: ${data.client.industry || 'No especificada'}`, 70, this.doc.y);

    this.doc
      .text(`• Propuestas: ${data.items.length} propiedad(es)`, 70, this.doc.y);

    this.doc.moveDown();

    // Executive summary
    this.doc
      .fillColor(this.brandTheme.primary)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Resumen Ejecutivo:', 50, this.doc.y);

    const summaryText = data.introText || 
      `Presentamos ${data.items.length} propuesta(s) comercial(es) especialmente preparada(s) para ${data.client.name}.`;

    this.doc
      .fillColor('#333333')
      .fontSize(11)
      .font('Helvetica')
      .text(this.sanitizeText(summaryText), 50, this.doc.y, {
        align: 'justify',
        width: 500
      });

    this.doc.moveDown();

    // Quick property overview
    this.doc
      .fillColor(this.brandTheme.primary)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Propuestas Rápidas:', 50, this.doc.y);

    data.items.forEach((property, index) => {
      if (this.doc.y > 650) {
        // If running out of space, just list names
        this.doc
          .fillColor('#333333')
          .fontSize(10)
          .font('Helvetica')
          .text(`• ${this.sanitizeText(property.title)}${property.price ? ` - €${property.price.toLocaleString()}` : ''}`, 70, this.doc.y);
      } else {
        this.doc
          .fillColor(this.brandTheme.secondary)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(this.sanitizeText(property.title), 70, this.doc.y);

        // Inline thumbnail if available
        if (property._imageBuffer) {
          try {
            this.doc.image(property._imageBuffer, 360, this.doc.y - 14, { width: 120, fit: [120, 80] });
          } catch (_) {}
        }

        this.doc
          .fillColor('#666666')
          .fontSize(9)
          .font('Helvetica')
          .text(this.sanitizeText((property.description || '').substring(0, 150)) + '...', 70, this.doc.y, {
            width: 450
          });

        if (property.price) {
          this.doc
            .fillColor('#2E8B57')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`€${property.price.toLocaleString()}`, 70, this.doc.y);
        }
      }
      
      this.doc.moveDown();
    });

    // Compact contact section
    this.doc.moveDown();
    this.addContactSection(data.contact, false);
  }

  // Add contact information section
  addContactSection(contact, detailed = false) {
    if (!contact) return;

    if (detailed) {
      this.doc.addPage();
      this.addHeader('Información de Contacto');
    } else {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Contacto:', 50, this.doc.y);
      
      this.doc.moveDown(0.5);
    }

    const contactInfo = [];
    
    if (contact.name) contactInfo.push(`Nombre: ${this.sanitizeText(contact.name)}`);
    if (contact.email) contactInfo.push(`Email: ${this.sanitizeText(contact.email)}`);
    if (contact.phone) contactInfo.push(`Teléfono: ${this.sanitizeText(contact.phone)}`);
    if (contact.company) contactInfo.push(`Empresa: ${this.sanitizeText(contact.company)}`);
    if (contact.address) contactInfo.push(`Dirección: ${this.sanitizeText(contact.address)}`);
    if (contact.website) contactInfo.push(`Sitio Web: ${this.sanitizeText(contact.website)}`);

    contactInfo.forEach(info => {
      this.doc
        .fillColor('#333333')
        .fontSize(detailed ? 11 : 10)
        .font('Helvetica')
        .text(info, detailed ? 50 : 70, this.doc.y);
      
      this.doc.moveDown(0.5);
    });
  }
}

// Compatibility wrapper to match route usage: generatePDF({ template, data: { client, items, theme, intro }, ... })
async function generatePDF({ template, data }) {
  const renderer = new PDFRenderer();
  const mappedPayload = {
    template: template || 'simple-proposal',
    client: data?.client || {},
    items: data?.items || [],
    theme: data?.theme || {},
    introText: data?.intro || '',
    contact: (data?.client && data.client.contact) ? data.client.contact : (data?.contact || {})
  };
  return renderer.generateProposal(mappedPayload);
}

module.exports = { PDFRenderer, generatePDF };