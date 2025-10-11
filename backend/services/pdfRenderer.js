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
      .replace(/[Ø=ÜÍ]/g, '') // Remove specific problematic characters
      .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u00C1\u00C9\u00CD\u00D3\u00DA\u00E1\u00E9\u00ED\u00F3\u00FA]/g, '') // Keep only safe characters including Spanish accents
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
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

        // Currency options
        this.currency = (data.options && data.options.outputCurrency) || 'USD';
        this.inputCurrency = (data.options && data.options.currencyCode) || 'USD';
        this.convertPrices = Boolean(data.options && data.options.convertPrices);
        this.durationDays = data.options && data.options.durationDays;

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
            this.generateDossierExpress({ ...data, items: this.preloadedItems }); // Use optimized single-page template as default
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

    // Load logo - check both theme.logoUrl and brand kit logo data
    let logoUrl = data?.theme?.logoUrl;
    console.log('🔍 Logo loading - theme.logoUrl:', logoUrl ? 'Present' : 'Missing');
    
    // If no logoUrl in theme, try to get brand kit logo from user
    if (!logoUrl && data?.userId) {
      try {
        console.log('🔍 Fetching brand kit for user:', data.userId);
        const BrandKit = require('../models/BrandKit');
        const brandKit = await BrandKit.getByUserId(data.userId);
        console.log('🔍 Brand kit found:', brandKit ? 'Yes' : 'No');
        if (brandKit?.logo?.data) {
          logoUrl = brandKit.logo.data;
          console.log('🔍 Brand kit logo data length:', brandKit.logo.data.length);
        } else {
          console.log('🔍 No logo data in brand kit');
        }
      } catch (error) {
        console.log('❌ Could not fetch brand kit logo:', error.message);
      }
    }
    
    console.log('🔍 Final logoUrl:', logoUrl ? 'Present' : 'Missing');
    let logoBuffer = null;
    
    if (logoUrl) {
      // Check if it's a base64 data URL
      if (logoUrl.startsWith('data:image/')) {
        try {
          // Extract base64 data from data URL
          const base64Data = logoUrl.split(',')[1];
          logoBuffer = Buffer.from(base64Data, 'base64');
          console.log('🔍 Logo converted from base64, size:', logoBuffer.length);
        } catch (error) {
          console.log('❌ Error converting base64 logo:', error.message);
        }
      } else {
        // Try to load as URL
        logoBuffer = await loadOne(logoUrl);
        console.log('🔍 Logo loaded from URL:', logoBuffer ? 'Success' : 'Failed');
      }
    }
    
    console.log('🔍 Final logo buffer:', logoBuffer ? 'Success' : 'Failed');

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

  // Convert and format price for display
  getDisplayPrice(value) {
    const rates = {
      USD: 1,    // Base currency
      EUR: 0.92, // 1 USD = 0.92 EUR (approximate)
      ARS: 1000  // 1 USD = 1000 ARS (approximate, adjust as needed)
    };
    const symbolMap = { USD: '$', EUR: '€', ARS: '$' };
    
    // Convert input to USD first
    const inUsd = this.inputCurrency && rates[this.inputCurrency] ? value / rates[this.inputCurrency] : value;
    
    // Convert to output currency
    const out = this.convertPrices && this.currency && rates[this.currency]
      ? inUsd * rates[this.currency]
      : (this.currency === this.inputCurrency ? value : inUsd);
    
    const amount = Math.round(out).toLocaleString('es-ES');
    const symbol = symbolMap[this.currency || 'USD'] || '$';
    return { amount, symbol };
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

  // Template 1: Comparative Short (2-3 properties, 2 pages) - OPTIMIZED
  generateComparativeShort(data) {
    const pageWidth = this.doc.page.width;
    const marginLeft = 40;
    const marginRight = 40;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Header with logo and company name
    this.doc
      .save()
      .rect(marginLeft, 50, contentWidth, 60)
      .fill(this.brandTheme.primary)
      .restore();

    // Add logo in top left if available
    if (this.preloadedLogoBuffer) {
      try {
        const logoHeight = 40;
        this.doc.image(this.preloadedLogoBuffer, marginLeft + 10, 60, { 
          height: logoHeight, 
          fit: [0, logoHeight] 
        });
      } catch (_) {}
    }

    // Company name and title
    this.doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Propuesta Comercial', marginLeft + 120, 65, { width: contentWidth - 130 });

    this.doc
      .fillColor('#ffffff')
      .fontSize(12)
      .font('Helvetica')
      .text(`Para: ${this.sanitizeText(data.client.name)}`, marginLeft + 120, 85, { width: contentWidth - 130 });

    // Client details section
    let y = 130;
    this.drawSectionHeader('Información del Cliente', marginLeft, y, contentWidth);
    y += 26;

    this.drawLabelValue('Cliente', this.sanitizeText(data.client.name || ''), marginLeft + 12, y);
    y += 20;

    // Main property image (left side)
    const imageWidth = 200;
    const imageHeight = 150;
    const imageX = marginLeft + 12;
    const imageY = y;

    if (data.items?.[0]?._imageBuffer) {
      try {
        this.doc
          .save()
          .rect(imageX, imageY, imageWidth, imageHeight)
          .strokeColor('#E5E7EB')
          .lineWidth(1)
          .stroke()
          .restore();
        
        this.doc.image(data.items[0]._imageBuffer, imageX + 2, imageY + 2, { 
          width: imageWidth - 4, 
          height: imageHeight - 4, 
          fit: [imageWidth - 4, imageHeight - 4] 
        });
      } catch (_) {}
    }

    // Property details (right side)
    const detailsX = imageX + imageWidth + 20;
    let detailsY = y;
    const firstProperty = data.items?.[0];

    if (firstProperty) {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(this.sanitizeText(firstProperty.title || ''), detailsX, detailsY);

      detailsY += 20;
      
      if (firstProperty.location) {
        this.doc
          .fillColor('#666666')
          .fontSize(10)
          .font('Helvetica')
          .text(`📍 ${this.sanitizeText(firstProperty.location)}`, detailsX, detailsY);
        detailsY += 15;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.doc
          .fillColor(this.brandTheme.secondary)
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(`${symbol}${amount}`, detailsX, detailsY);
        detailsY += 20;
      }

      if (firstProperty.keyFacts) {
        this.doc
          .fillColor('#333333')
          .fontSize(10)
          .font('Helvetica')
          .text('Características:', detailsX, detailsY);
        detailsY += 12;
        this.doc
          .fillColor('#666666')
          .fontSize(9)
          .font('Helvetica')
          .text(this.sanitizeText(firstProperty.keyFacts), detailsX, detailsY, { width: 200 });
      }
    }

    // Brief introduction text
    const introY = Math.max(y + imageHeight + 20, detailsY + 40);
    this.drawSectionHeader('Introducción', marginLeft, introY, contentWidth);
    
    const introText = data.introText || 
      `Presentamos esta propuesta especialmente preparada para ${data.client.name}.`;
    
    this.doc
      .fillColor('#333333')
      .fontSize(11)
      .font('Helvetica')
      .text(this.sanitizeText(introText), marginLeft + 12, introY + 26, {
        align: 'justify',
        width: contentWidth - 24
      });

    // Price and key details section
    const priceY = introY + 80;
    this.drawSectionHeader('Detalles Clave', marginLeft, priceY, contentWidth);
    
    let priceDetailsY = priceY + 26;
    if (firstProperty) {
      this.drawLabelValue('Propiedad', this.sanitizeText(firstProperty.title || ''), marginLeft + 12, priceDetailsY);
      priceDetailsY += 16;
      
      if (firstProperty.location) {
        this.drawLabelValue('Ubicación', this.sanitizeText(firstProperty.location), marginLeft + 12, priceDetailsY);
        priceDetailsY += 16;
      }
      
      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.drawLabelValue('Precio', `${symbol}${amount}`, marginLeft + 12, priceDetailsY);
        priceDetailsY += 16;
      }
    }

    // Contact section (bottom)
    const contactY = Math.max(priceDetailsY + 20, 650);
    this.drawSectionHeader('Contacto', marginLeft, contactY, contentWidth);
    
    const contact = data.contact || {};
    let contactYPos = contactY + 26;
    
    if (contact.name) {
      this.drawLabelValue('Nombre', this.sanitizeText(contact.name), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.email) {
      this.drawLabelValue('Email', this.sanitizeText(contact.email), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.phone) {
      this.drawLabelValue('Teléfono', this.sanitizeText(contact.phone), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.company) {
      this.drawLabelValue('Empresa', this.sanitizeText(contact.company), marginLeft + 12, contactYPos);
    }
  }

  // Template 2: Simple Proposal (1-2 pages with photos and details) - OPTIMIZED
  generateSimpleProposal(data) {
    const pageWidth = this.doc.page.width;
    const marginLeft = 40;
    const marginRight = 40;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Header with logo and company name
    this.doc
      .save()
      .rect(marginLeft, 50, contentWidth, 60)
      .fill(this.brandTheme.primary)
      .restore();

    // Add logo in top left if available
    if (this.preloadedLogoBuffer) {
      try {
        const logoHeight = 40;
        this.doc.image(this.preloadedLogoBuffer, marginLeft + 10, 60, { 
          height: logoHeight, 
          fit: [0, logoHeight] 
        });
      } catch (_) {}
    }

    // Company name and title
    this.doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Propuesta Comercial', marginLeft + 120, 65, { width: contentWidth - 130 });

      this.doc
        .fillColor('#ffffff')
        .fontSize(12)
        .font('Helvetica')
      .text(`Para: ${this.sanitizeText(data.client.name)}`, marginLeft + 120, 85, { width: contentWidth - 130 });

    // Client details section
    let y = 130;
    this.drawSectionHeader('Información del Cliente', marginLeft, y, contentWidth);
    y += 26;

    this.drawLabelValue('Cliente', this.sanitizeText(data.client.name || ''), marginLeft + 12, y);
    y += 20;

    // Main property image (left side)
    const imageWidth = 200;
    const imageHeight = 150;
    const imageX = marginLeft + 12;
    const imageY = y;

    if (data.items?.[0]?._imageBuffer) {
      try {
        this.doc
          .save()
          .rect(imageX, imageY, imageWidth, imageHeight)
          .strokeColor('#E5E7EB')
          .lineWidth(1)
          .stroke()
          .restore();
        
        this.doc.image(data.items[0]._imageBuffer, imageX + 2, imageY + 2, { 
          width: imageWidth - 4, 
          height: imageHeight - 4, 
          fit: [imageWidth - 4, imageHeight - 4] 
        });
      } catch (_) {}
    }

    // Property details (right side)
    const detailsX = imageX + imageWidth + 20;
    let detailsY = y;
    const firstProperty = data.items?.[0];

    if (firstProperty) {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(this.sanitizeText(firstProperty.title || ''), detailsX, detailsY);

      detailsY += 20;
      
      if (firstProperty.location) {
      this.doc
        .fillColor('#666666')
          .fontSize(10)
        .font('Helvetica')
          .text(`📍 ${this.sanitizeText(firstProperty.location)}`, detailsX, detailsY);
        detailsY += 15;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.doc
          .fillColor(this.brandTheme.secondary)
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(`${symbol}${amount}`, detailsX, detailsY);
        detailsY += 20;
      }

      if (firstProperty.keyFacts) {
        this.doc
          .fillColor('#333333')
          .fontSize(10)
          .font('Helvetica')
          .text('Características:', detailsX, detailsY);
        detailsY += 12;
      this.doc
        .fillColor('#666666')
          .fontSize(9)
        .font('Helvetica')
          .text(this.sanitizeText(firstProperty.keyFacts), detailsX, detailsY, { width: 200 });
      }
    }

    // Brief introduction text
    const introY = Math.max(y + imageHeight + 20, detailsY + 40);
    this.drawSectionHeader('Introducción', marginLeft, introY, contentWidth);
    
    const introText = data.introText || 
      `Presentamos esta propuesta especialmente preparada para ${data.client.name}.`;

    this.doc
      .fillColor('#333333')
      .fontSize(11)
      .font('Helvetica')
      .text(this.sanitizeText(introText), marginLeft + 12, introY + 26, {
        align: 'justify',
        width: contentWidth - 24
      });

    // Price and key details section
    const priceY = introY + 80;
    this.drawSectionHeader('Detalles Clave', marginLeft, priceY, contentWidth);
    
    let priceDetailsY = priceY + 26;
    if (firstProperty) {
      this.drawLabelValue('Propiedad', this.sanitizeText(firstProperty.title || ''), marginLeft + 12, priceDetailsY);
      priceDetailsY += 16;
      
      if (firstProperty.location) {
        this.drawLabelValue('Ubicación', this.sanitizeText(firstProperty.location), marginLeft + 12, priceDetailsY);
        priceDetailsY += 16;
      }
      
      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.drawLabelValue('Precio', `${symbol}${amount}`, marginLeft + 12, priceDetailsY);
        priceDetailsY += 16;
      }
    }

    // Contact section (bottom)
    const contactY = Math.max(priceDetailsY + 20, 650);
    this.drawSectionHeader('Contacto', marginLeft, contactY, contentWidth);
    
    const contact = data.contact || {};
    let contactYPos = contactY + 26;
    
    if (contact.name) {
      this.drawLabelValue('Nombre', this.sanitizeText(contact.name), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.email) {
      this.drawLabelValue('Email', this.sanitizeText(contact.email), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.phone) {
      this.drawLabelValue('Teléfono', this.sanitizeText(contact.phone), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.company) {
      this.drawLabelValue('Empresa', this.sanitizeText(contact.company), marginLeft + 12, contactYPos);
    }
  }

  // Template 3: Dossier Express (1-page executive summary) - OPTIMIZED
  generateDossierExpress(data) {
    const pageWidth = this.doc.page.width;
    const marginLeft = 40;
    const marginRight = 40;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Header with logo and company name
    this.doc
      .save()
      .rect(marginLeft, 50, contentWidth, 60)
      .fill(this.brandTheme.primary)
      .restore();

    // Add logo in top left if available
    if (this.preloadedLogoBuffer) {
      try {
        const logoHeight = 40;
        this.doc.image(this.preloadedLogoBuffer, marginLeft + 10, 60, { 
          height: logoHeight, 
          fit: [0, logoHeight] 
        });
      } catch (_) {}
    }

    // Company name and title
    this.doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Propuesta Comercial', marginLeft + 120, 65, { width: contentWidth - 130 });

    this.doc
      .fillColor('#ffffff')
      .fontSize(12)
      .font('Helvetica')
      .text(`Para: ${this.sanitizeText(data.client.name)}`, marginLeft + 120, 85, { width: contentWidth - 130 });

    // Client details section
    let y = 130;
    this.drawSectionHeader('Información del Cliente', marginLeft, y, contentWidth);
    y += 26;

    this.drawLabelValue('Cliente', this.sanitizeText(data.client.name || ''), marginLeft + 12, y);
    y += 20;

    // Main property image (left side)
    const imageWidth = 200;
    const imageHeight = 150;
    const imageX = marginLeft + 12;
    const imageY = y;

    if (data.items?.[0]?._imageBuffer) {
      try {
        this.doc
          .save()
          .rect(imageX, imageY, imageWidth, imageHeight)
          .strokeColor('#E5E7EB')
          .lineWidth(1)
          .stroke()
          .restore();
        
        this.doc.image(data.items[0]._imageBuffer, imageX + 2, imageY + 2, { 
          width: imageWidth - 4, 
          height: imageHeight - 4, 
          fit: [imageWidth - 4, imageHeight - 4] 
        });
      } catch (_) {}
    }

    // Property details (right side)
    const detailsX = imageX + imageWidth + 20;
    let detailsY = y;
    const firstProperty = data.items?.[0];

    if (firstProperty) {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(this.sanitizeText(firstProperty.title || ''), detailsX, detailsY);

      detailsY += 20;
      
      if (firstProperty.location) {
        this.doc
          .fillColor('#666666')
          .fontSize(10)
          .font('Helvetica')
          .text(`📍 ${this.sanitizeText(firstProperty.location)}`, detailsX, detailsY);
        detailsY += 15;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.doc
          .fillColor(this.brandTheme.secondary)
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(`${symbol}${amount}`, detailsX, detailsY);
        detailsY += 20;
      }

      if (firstProperty.keyFacts) {
        this.doc
          .fillColor('#333333')
          .fontSize(10)
          .font('Helvetica')
          .text('Características:', detailsX, detailsY);
        detailsY += 12;
        this.doc
          .fillColor('#666666')
          .fontSize(9)
          .font('Helvetica')
          .text(this.sanitizeText(firstProperty.keyFacts), detailsX, detailsY, { width: 200 });
      }
    }

    // Brief introduction text
    const introY = Math.max(y + imageHeight + 20, detailsY + 40);
    this.drawSectionHeader('Introducción', marginLeft, introY, contentWidth);
    
    const introText = data.introText || 
      `Presentamos esta propuesta especialmente preparada para ${data.client.name}.`;
    
    this.doc
      .fillColor('#333333')
      .fontSize(11)
      .font('Helvetica')
      .text(this.sanitizeText(introText), marginLeft + 12, introY + 26, {
        align: 'justify',
        width: contentWidth - 24
      });

    // Price and key details section
    const priceY = introY + 80;
    this.drawSectionHeader('Detalles Clave', marginLeft, priceY, contentWidth);
    
    let priceDetailsY = priceY + 26;
    if (firstProperty) {
      this.drawLabelValue('Propiedad', this.sanitizeText(firstProperty.title || ''), marginLeft + 12, priceDetailsY);
      priceDetailsY += 16;
      
      if (firstProperty.location) {
        this.drawLabelValue('Ubicación', this.sanitizeText(firstProperty.location), marginLeft + 12, priceDetailsY);
        priceDetailsY += 16;
      }
      
      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.drawLabelValue('Precio', `${symbol}${amount}`, marginLeft + 12, priceDetailsY);
        priceDetailsY += 16;
      }
    }

    // Contact section (bottom)
    const contactY = Math.max(priceDetailsY + 20, 650);
    this.drawSectionHeader('Contacto', marginLeft, contactY, contentWidth);
    
    const contact = data.contact || {};
    let contactYPos = contactY + 26;
    
    if (contact.name) {
      this.drawLabelValue('Nombre', this.sanitizeText(contact.name), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.email) {
      this.drawLabelValue('Email', this.sanitizeText(contact.email), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.phone) {
      this.drawLabelValue('Teléfono', this.sanitizeText(contact.phone), marginLeft + 12, contactYPos);
      contactYPos += 16;
    }
    if (contact.company) {
      this.drawLabelValue('Empresa', this.sanitizeText(contact.company), marginLeft + 12, contactYPos);
    }
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
    contact: (data?.client && data.client.contact) ? data.client.contact : (data?.contact || {}),
    options: data?.options || {},
    userId: data?.userId // Pass userId for brand kit logo retrieval
  };
  return renderer.generateProposal(mappedPayload);
}

module.exports = { PDFRenderer, generatePDF };