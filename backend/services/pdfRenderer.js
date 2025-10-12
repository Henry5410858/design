// [file name]: image.png
// [file content begin]
// # Propuesta Comercial  
// Para: Andi Jackson  

// ## Información del Cliente  
// **Cliente:**  
// Andi Jackson  

// ---

// ## Apartmento Cento  
// G=DÍI Madrid Centro  
// $250.000  
// Características:  
// 3 bedrooms, 2 kichens  

// ---

// ## Introducción  
// Hola Andi Jackson,Gracias por considerar nuestra propuesta. Nos enfocamos en presentar soluciones inmobiliarias que refuercen su marca y conviertan mejor. Nuestra propuesta destaca Calidad Premium, Entrega Rapida.A continuación, encontrará una selección de propiedades pensadas para impactar positivamente a sus clientes.


// [file content end]

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

    // Remove specific problematic characters and clean text
    return str
      .replace(/[Ø=ÜÍ]/g, '') // Remove specific problematic characters
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ') // Replace non-breaking spaces
      .replace(/[\u0000-\u001F\u007F]/g, '') // Remove control characters
      .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u00C1\u00C9\u00CD\u00D3\u00DA\u00E1\u00E9\u00ED\u00F3\u00FA]/g, '') // Keep only safe characters including Spanish accents
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Helper to check if content will fit on current page
  checkPageSpace(requiredHeight) {
    const currentY = this.doc.y;
    const pageHeight = this.doc.page.height;
    const bottomMargin = 50; // Space for page numbers
    return (currentY + requiredHeight) < (pageHeight - bottomMargin);
  }

  // Helper to add new page if needed - DISABLED for single page requirement
  addPageIfNeeded(requiredHeight) {
    // Always return false to prevent new pages - keep everything on one page
    return false; // No page added - single page only
  }

  // Helper to ensure content fits on single page by reducing font sizes or content
  ensureSinglePage() {
    const pageHeight = this.doc.page.height;
    const currentY = this.doc.y;
    const availableHeight = pageHeight - currentY - 50; // 50px margin for footer

    // If we're too close to the bottom, reduce content or move up
    if (availableHeight < 100) {
      // Move current content up by reducing spacing
      this.doc.y = Math.max(50, currentY - 50);
    }
  }

  // Force single page by limiting content height
  forceSinglePage() {
    const pageHeight = this.doc.page.height;
    const maxContentHeight = pageHeight - 100; // Leave 100px for margins and footer

    if (this.doc.y > maxContentHeight) {
      this.doc.y = maxContentHeight;
    }
  }

  // Draw text-based LupaProp logo as fallback
  drawLupaPropTextLogo(x, y, width, height) {
    try {
      // Draw background rectangle
      this.doc
        .save()
        .rect(x, y, width, height)
        .fill('#1f2937')
        .restore();

      // Draw LupaProp text
      this.doc
        .fillColor('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('LupaProp', x + 10, y + 15, { width: width - 20, align: 'center' });

      // Draw tagline
      this.doc
        .fillColor('#ffffff')
        .fontSize(8)
        .font('Helvetica')
        .text('CASA PROPIA, UNA OPORTUNIDAD', x + 10, y + 35, { width: width - 20, align: 'center' });
    } catch (error) {
      // Silent fallback - if text logo fails, just continue
    }
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
          size: 'B5',
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
        this.lupapropLogoBuffer = preloadResult.lupapropLogoBuffer || null;
        this.preloadedItems = preloadResult.itemsWithBuffers || data.items || [];

        // Currency options
        this.currency = (data.options && data.options.outputCurrency) || 'USD';
        this.inputCurrency = (data.options && data.options.currencyCode) || 'USD';
        this.convertPrices = Boolean(data.options && data.options.convertPrices);
        this.durationDays = data.options && data.options.durationDays;

        // Generate content based on template
        switch (data.template) {
          case 'comparative-short':
            console.log('Raw client name:', data.client.name);
            console.log('Sanitized client name:', this.sanitizeText(data.client.name));
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

        // Page numbers removed as requested
        // this.addPageNumbers();

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

    // Load user's brand kit logo (for left side)
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

    console.log('🔍 Final user logoUrl:', logoUrl ? 'Present' : 'Missing');
    let logoBuffer = null;

    if (logoUrl) {
      // Check if it's a base64 data URL
      if (logoUrl.startsWith('data:image/')) {
        try {
          // Extract base64 data from data URL
          const base64Data = logoUrl.split(',')[1];
          logoBuffer = Buffer.from(base64Data, 'base64');
          console.log('🔍 User logo converted from base64, size:', logoBuffer.length);
        } catch (error) {
          console.log('❌ Error converting base64 logo:', error.message);
        }
      } else {
        // Try to load as URL or file path
        logoBuffer = await loadOne(logoUrl);
        console.log('🔍 User logo loaded from URL/file:', logoBuffer ? 'Success' : 'Failed');
      }
    }

    console.log('🔍 Final user logo buffer:', logoBuffer ? 'Success' : 'Failed');

    // Load LupaProp logo separately (for top right corner)
    const lupapropLogoPath = path.join(__dirname, '../assets/img/lupaprop-logo.png');
    const lupapropSvgPath = path.join(__dirname, '../assets/img/lupaprop-logo.svg');
    let lupapropLogoBuffer = null;

    // Try PNG first, then SVG, then create a fallback
    if (fs.existsSync(lupapropLogoPath)) {
      const fileSize = fs.statSync(lupapropLogoPath).size;
      console.log('🔍 LupaProp PNG found, size:', fileSize);
      if (fileSize > 1000) { // Only use if file is reasonably sized
        lupapropLogoBuffer = fs.readFileSync(lupapropLogoPath);
        console.log('🔍 LupaProp PNG logo loaded, size:', lupapropLogoBuffer.length);
      } else {
        console.log('⚠️ LupaProp PNG too small, trying SVG...');
        if (fs.existsSync(lupapropSvgPath)) {
          lupapropLogoBuffer = fs.readFileSync(lupapropSvgPath);
          console.log('🔍 LupaProp SVG logo loaded, size:', lupapropLogoBuffer.length);
        }
      }
    } else if (fs.existsSync(lupapropSvgPath)) {
      lupapropLogoBuffer = fs.readFileSync(lupapropSvgPath);
      console.log('🔍 LupaProp SVG logo loaded, size:', lupapropLogoBuffer.length);
    } else {
      console.log('❌ No LupaProp logo found at:', lupapropLogoPath, 'or', lupapropSvgPath);
    }

    // If still no logo, create a fallback text-based logo
    if (!lupapropLogoBuffer) {
      console.log('🔧 Creating fallback LupaProp text logo...');
      // We'll handle this in the drawing code by drawing text instead of image
    }

    // Load property images
    const itemsWithBuffers = await Promise.all(
      items.map(async (it) => ({
        ...it,
        _imageBuffer: await loadOne(it.imageUrl || it.enhancedUrl)
      }))
    );

    return { logoBuffer, lupapropLogoBuffer, itemsWithBuffers };
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
    } catch (_) { }
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

  // Template 1: Comparative Short (2-3 properties, 2 pages) - ULTRA COMPACT SINGLE PAGE
  // Template 1: Comparative Short - ULTRA COMPACT SINGLE PAGE
  // Template 1: Comparative Short - ULTRA COMPACT SINGLE PAGE
generateComparativeShort(data) {
  const pageWidth = this.doc.page.width;
  const marginLeft = 30;
  const marginRight = 30;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Even larger header to accommodate much larger logos
  this.doc
    .save()
    .rect(marginLeft, 40, contentWidth, 90)
    .fill(this.brandTheme.primary)
    .restore();

  // Add logo in top left if available - EVEN LARGER
  if (this.preloadedLogoBuffer) {
    try {
      const logoHeight = 60;
      this.doc.image(this.preloadedLogoBuffer, marginLeft + 8, 55, {
        height: logoHeight,
        fit: [0, logoHeight]
      });
    } catch (_) { }
  }

  // Add LupaProp logo at far right edge of header - CORRECTED POSITIONING
  // const logoHeight = 60;
  // const logoWidth = 200;
  // const rightMargin = 10; // Small margin from right edge

  // // CORRECT CALCULATION: Position from page right edge minus logo width and margin
  // const logoX = pageWidth - logoWidth - rightMargin + 110;
  // const logoY = 55; // Lowered position
  
  // if (this.lupapropLogoBuffer) {
  //   try {
  //     this.doc.image(this.lupapropLogoBuffer, logoX, logoY, {
  //       height: logoHeight,
  //       width: logoWidth,
  //       fit: [logoWidth, logoHeight]
  //     });
  //   } catch (error) {
  //     // Fallback to text logo
  //     this.drawLupaPropTextLogo(logoX, logoY, logoWidth, logoHeight);
  //   }
  // } else {
  //   // Draw text-based LupaProp logo
  //   this.drawLupaPropTextLogo(logoX, logoY, logoWidth, logoHeight);
  // }

  // Company name and title - adjusted for much larger logos
  this.doc
    .fillColor('#ffffff')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('Propuesta Comercial', marginLeft + 130, 55, { width: contentWidth - 170 });

  this.doc
    .fillColor('#ffffff')
    .fontSize(16)
    .font('Helvetica')
    .text(`Para: ${this.sanitizeText(data.client.name)}`, marginLeft + 160, 85, { width: contentWidth - 170 });

    let y = 140;
    this.drawSectionHeader('Información del Cliente', marginLeft, y, contentWidth);
    y += 20;

    this.drawLabelValue('Cliente', this.sanitizeText(data.client.name || ''), marginLeft + 8, y);
    y += 15;

    // Main property image (left side) - EVEN LARGER
    const imageWidth = 220;
    const imageHeight = 150;
    const imageX = marginLeft + 8;
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
      } catch (_) { }
    }

    // Property details (right side) - ultra compact
    const detailsX = imageX + imageWidth + 10;
    let detailsY = y;
    const firstProperty = data.items?.[0];

    if (firstProperty) {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(this.sanitizeText(firstProperty.title || ''), detailsX, detailsY);

      detailsY += 12;

      if (firstProperty.location) {
        this.doc
          .fillColor('#666666')
          .fontSize(8)
          .font('Helvetica')
          .text(`📍 ${this.sanitizeText(firstProperty.location)}`, detailsX, detailsY);
        detailsY += 10;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.doc
          .fillColor(this.brandTheme.secondary)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`${symbol}${amount}`, detailsX, detailsY);
        detailsY += 12;
      }

      if (firstProperty.keyFacts) {
        this.doc
          .fillColor('#333333')
          .fontSize(8)
          .font('Helvetica')
          .text('Características:', detailsX, detailsY);
        detailsY += 8;
        this.doc
          .fillColor('#666666')
          .fontSize(7)
          .font('Helvetica')
          .text(this.sanitizeText(firstProperty.keyFacts), detailsX, detailsY, { width: 150 });
      }
    }

    // Brief introduction text - ultra compact
    const introY = y + imageHeight + 40;
    this.drawSectionHeader('Introducción', marginLeft, introY, contentWidth);

    const introText = data.introText ||
      `Presentamos esta propuesta especialmente preparada para ${data.client.name}.`;
      this.doc.y = introY + 30; // Set position directly
    this.doc
      .fillColor('#333333')
      .fontSize(8)
      .font('Helvetica')
      .text(this.sanitizeText(introText), marginLeft + 8, this.doc.y + 10, {
        align: 'justify',
        width: contentWidth - 16
      });

    // Price and key details section - ultra compact
    const priceY = this.doc.y + 40;
    this.drawSectionHeader('Detalles Clave', marginLeft, priceY, contentWidth);

    let priceDetailsY = priceY + 20;
    if (firstProperty) {
      this.drawLabelValue('Propiedad', this.sanitizeText(firstProperty.title || ''), marginLeft + 8, priceDetailsY);
      priceDetailsY += 15;

      if (firstProperty.location) {
        this.drawLabelValue('Ubicación', this.sanitizeText(firstProperty.location), marginLeft + 8, priceDetailsY);
        priceDetailsY += 15;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.drawLabelValue('Precio', `${symbol}${amount}`, marginLeft + 8, priceDetailsY);
        priceDetailsY += 15;
      }
    }

    // Contact section (bottom) - force single page
    this.forceSinglePage();
    const contactY = this.doc.y + 10;
    this.drawSectionHeader('Contacto', marginLeft, contactY, contentWidth);

    const contact = data.contact || {};
    let contactYPos = contactY + 20;

    if (contact.name) {
      this.drawLabelValue('Nombre', this.sanitizeText(contact.name), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.email) {
      this.drawLabelValue('Email', this.sanitizeText(contact.email), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.phone) {
      this.drawLabelValue('Teléfono', this.sanitizeText(contact.phone), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.company) {
      this.drawLabelValue('Empresa', this.sanitizeText(contact.company), marginLeft + 8, contactYPos);
    }
  }

  // Template 2: Simple Proposal (1-2 pages with photos and details) - ULTRA COMPACT SINGLE PAGE
  // Template 2: Simple Proposal - ULTRA COMPACT SINGLE PAGE
  generateSimpleProposal(data) {
    const pageWidth = this.doc.page.width;
    const marginLeft = 30;
    const marginRight = 30;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Even larger header to accommodate much larger logos
    this.doc
      .save()
      .rect(marginLeft, 40, contentWidth, 90)
      .fill(this.brandTheme.primary)
      .restore();

    // Add logo in top left if available - EVEN LARGER
    if (this.preloadedLogoBuffer) {
      try {
        const logoHeight = 60;
        this.doc.image(this.preloadedLogoBuffer, marginLeft + 8, 55, {
          height: logoHeight,
          fit: [0, logoHeight]
        });
      } catch (_) { }
    }

    // // Add LupaProp logo at far right edge of header - FIXED POSITIONING
    // const logoHeight = 60;
    // const logoWidth = 200;
    // const rightMargin = 10; // Small margin from right edge
    // // Calculate logoX based on page right edge for consistent positioning
    // const logoX = pageWidth - logoWidth - rightMargin +110;
    // const logoY = 55; // Lowered position

    // if (this.lupapropLogoBuffer) {
    //   try {
    //     this.doc.image(this.lupapropLogoBuffer, logoX, logoY, {
    //       height: logoHeight,
    //       width: logoWidth,
    //       fit: [logoWidth, logoHeight]
    //     });
    //   } catch (error) {
    //     // Fallback to text logo
    //     this.drawLupaPropTextLogo(logoX, logoY, logoWidth, logoHeight);
    //   }
    // } else {
    //   // Draw text-based LupaProp logo
    //   this.drawLupaPropTextLogo(logoX, logoY, logoWidth, logoHeight);
    // }

    // Company name and title - adjusted for much larger logos
    this.doc
      .fillColor('#ffffff')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Propuesta Comercial', marginLeft + 130, 55, { width: contentWidth - 170 });

    this.doc
      .fillColor('#ffffff')
      .fontSize(16)
      .font('Helvetica')
      .text(`Para: ${this.sanitizeText(data.client.name)}`, marginLeft + 160, 85, { width: contentWidth - 170 });
    // Client details section - adjusted for much larger header
    let y = 140;
    this.drawSectionHeader('Información del Cliente', marginLeft, y, contentWidth);
    y += 20;

    this.drawLabelValue('Cliente', this.sanitizeText(data.client.name || ''), marginLeft + 8, y);
    y += 15;

    // Main property image (left side) - EVEN LARGER
    const imageWidth = 220;
    const imageHeight = 150;
    const imageX = marginLeft + 8;
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
      } catch (_) { }
    }

    // Property details (right side) - ultra compact
    const detailsX = imageX + imageWidth + 10;
    let detailsY = y;
    const firstProperty = data.items?.[0];

    if (firstProperty) {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(this.sanitizeText(firstProperty.title || ''), detailsX, detailsY);

      detailsY += 12;

      if (firstProperty.location) {
        this.doc
          .fillColor('#666666')
          .fontSize(8)
          .font('Helvetica')
          .text(`📍 ${this.sanitizeText(firstProperty.location)}`, detailsX, detailsY);
        detailsY += 10;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.doc
          .fillColor(this.brandTheme.secondary)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`${symbol}${amount}`, detailsX, detailsY);
        detailsY += 12;
      }

      if (firstProperty.keyFacts) {
        this.doc
          .fillColor('#333333')
          .fontSize(8)
          .font('Helvetica')
          .text('Características:', detailsX, detailsY);
        detailsY += 8;
        this.doc
          .fillColor('#666666')
          .fontSize(7)
          .font('Helvetica')
          .text(this.sanitizeText(firstProperty.keyFacts), detailsX, detailsY, { width: 150 });
      }
    }

    // Brief introduction text - ultra compact
    const introY = y + imageHeight + 40; // Fixed position instead of Math.max
    this.drawSectionHeader('Introducción', marginLeft, introY, contentWidth);

    const introText = data.introText ||
      `Presentamos esta propuesta especialmente preparada para ${data.client.name}.`;

    this.doc
      .fillColor('#333333')
      .fontSize(8)
      .font('Helvetica')
      .text(this.sanitizeText(introText), marginLeft + 8, this.doc.y + 6, {
        align: 'justify',
        width: contentWidth - 16
      });

    // Price and key details section - ultra compact
    const priceY = this.doc.y + 30;
    this.drawSectionHeader('Detalles Clave', marginLeft, priceY, contentWidth);

    let priceDetailsY = priceY + 20;
    if (firstProperty) {
      this.drawLabelValue('Propiedad', this.sanitizeText(firstProperty.title || ''), marginLeft + 8, priceDetailsY);
      priceDetailsY += 15;

      if (firstProperty.location) {
        this.drawLabelValue('Ubicación', this.sanitizeText(firstProperty.location), marginLeft + 8, priceDetailsY);
        priceDetailsY += 15;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.drawLabelValue('Precio', `${symbol}${amount}`, marginLeft + 8, priceDetailsY);
        priceDetailsY += 15;
      }
    }

    // Contact section (bottom) - force single page
    this.forceSinglePage();
    const contactY = this.doc.y + 25;
    this.drawSectionHeader('Contacto', marginLeft, contactY, contentWidth);

    const contact = data.contact || {};
    let contactYPos = contactY + 30;

    if (contact.name) {
      this.drawLabelValue('Nombre', this.sanitizeText(contact.name), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.email) {
      this.drawLabelValue('Email', this.sanitizeText(contact.email), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.phone) {
      this.drawLabelValue('Teléfono', this.sanitizeText(contact.phone), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.company) {
      this.drawLabelValue('Empresa', this.sanitizeText(contact.company), marginLeft + 8, contactYPos);
    }
  }

  // Template 3: Dossier Express (1-2 page executive summary) - ULTRA COMPACT SINGLE PAGE
  generateDossierExpress(data) {
    const pageWidth = this.doc.page.width;
    const marginLeft = 30;
    const marginRight = 30;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Even larger header to accommodate much larger logos
    this.doc
      .save()
      .rect(marginLeft, 40, contentWidth, 90)
      .fill(this.brandTheme.primary)
      .restore();

    // Add logo in top left if available - EVEN LARGER
    if (this.preloadedLogoBuffer) {
      try {
        const logoHeight = 60;
        this.doc.image(this.preloadedLogoBuffer, marginLeft + 8, 55, {
          height: logoHeight,
          fit: [0, logoHeight]
        });
      } catch (_) { }
    }

    // // Add LupaProp logo at far right edge of header - FIXED POSITIONING
    // const logoHeight = 60;
    // const logoWidth = 200;
    // const rightMargin = 10; // Small margin from right edge
    // // Calculate logoX based on page right edge for consistent positioning
    // const logoX = pageWidth - logoWidth - rightMargin + 110;
    // const logoY = 55; // Lowered position

    // if (this.lupapropLogoBuffer) {
    //   try {
    //     this.doc.image(this.lupapropLogoBuffer, logoX, logoY, {
    //       height: logoHeight,
    //       width: logoWidth,
    //       fit: [logoWidth, logoHeight]
    //     });
    //   } catch (error) {
    //     // Fallback to text logo
    //     this.drawLupaPropTextLogo(logoX, logoY, logoWidth, logoHeight);
    //   }
    // } else {
    //   // Draw text-based LupaProp logo
    //   this.drawLupaPropTextLogo(logoX, logoY, logoWidth, logoHeight);
    // }

    // Company name and title - adjusted for much larger logos
    this.doc
      .fillColor('#ffffff')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Propuesta Comercial', marginLeft + 130, 55, { width: contentWidth - 170 });

    this.doc
      .fillColor('#ffffff')
      .fontSize(16)
      .font('Helvetica')
      .text(`Para: ${this.sanitizeText(data.client.name)}`, marginLeft + 160, 85, { width: contentWidth - 170 });
    // Client details section - adjusted for much larger header
    let y = 140;
    this.drawSectionHeader('Información del Cliente', marginLeft, y, contentWidth);
    y += 20;

    this.drawLabelValue('Cliente', this.sanitizeText(data.client.name || ''), marginLeft + 8, y);
    y += 15;

    // Main property image (left side) - EVEN LARGER
    const imageWidth = 220;
    const imageHeight = 150;
    const imageX = marginLeft + 8;
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
      } catch (_) { }
    }

    // Property details (right side) - ultra compact
    const detailsX = imageX + imageWidth + 10;
    let detailsY = y;
    const firstProperty = data.items?.[0];

    if (firstProperty) {
      this.doc
        .fillColor(this.brandTheme.primary)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(this.sanitizeText(firstProperty.title || ''), detailsX, detailsY);

      detailsY += 12;

      if (firstProperty.location) {
        this.doc
          .fillColor('#666666')
          .fontSize(8)
          .font('Helvetica')
          .text(`📍 ${this.sanitizeText(firstProperty.location)}`, detailsX, detailsY);
        detailsY += 10;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.doc
          .fillColor(this.brandTheme.secondary)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`${symbol}${amount}`, detailsX, detailsY);
        detailsY += 12;
      }

      if (firstProperty.keyFacts) {
        this.doc
          .fillColor('#333333')
          .fontSize(8)
          .font('Helvetica')
          .text('Características:', detailsX, detailsY);
        detailsY += 8;
        this.doc
          .fillColor('#666666')
          .fontSize(7)
          .font('Helvetica')
          .text(this.sanitizeText(firstProperty.keyFacts), detailsX, detailsY, { width: 150 });
      }
    }

    // Brief introduction text - ultra compact
    const introY = y + imageHeight + 40; // Fixed position instead of Math.max
    this.drawSectionHeader('Introducción', marginLeft, introY, contentWidth);

    const introText = data.introText ||
      `Presentamos esta propuesta especialmente preparada para ${data.client.name}.`;

    this.doc
      .fillColor('#333333')
      .fontSize(8)
      .font('Helvetica')
      .text(this.sanitizeText(introText), marginLeft + 8, this.doc.y + 6, {
        align: 'justify',
        width: contentWidth - 16
      });

    // Price and key details section - ultra compact
    const priceY = this.doc.y + 8;
    this.drawSectionHeader('Detalles Clave', marginLeft, priceY, contentWidth);

    let priceDetailsY = priceY + 18;
    if (firstProperty) {
      this.drawLabelValue('Propiedad', this.sanitizeText(firstProperty.title || ''), marginLeft + 8, priceDetailsY);
      priceDetailsY += 15;

      if (firstProperty.location) {
        this.drawLabelValue('Ubicación', this.sanitizeText(firstProperty.location), marginLeft + 8, priceDetailsY);
        priceDetailsY += 15;
      }

      if (firstProperty.price) {
        const { amount, symbol } = this.getDisplayPrice(firstProperty.price);
        this.drawLabelValue('Precio', `${symbol}${amount}`, marginLeft + 8, priceDetailsY);
        priceDetailsY += 15;
      }
    }

    // Add description section if available - ultra compact
    if (firstProperty && firstProperty.description) {
      const descY = this.doc.y + 8;
      this.forceSinglePage(); // Ensure space for description

      this.drawSectionHeader('Descripción', marginLeft, descY, contentWidth);

      this.doc
        .fillColor('#333333')
        .fontSize(8)
        .font('Helvetica')
        .text(this.sanitizeText(firstProperty.description), marginLeft + 8, descY + 18, {
          align: 'justify',
          width: contentWidth - 16
        });
    }

    // Contact section - force single page
    this.forceSinglePage();
    const contactY = this.doc.y + 8;
    this.drawSectionHeader('Contacto', marginLeft, contactY, contentWidth);

    const contact = data.contact || {};
    let contactYPos = contactY + 18;

    if (contact.name) {
      this.drawLabelValue('Nombre', this.sanitizeText(contact.name), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.email) {
      this.drawLabelValue('Email', this.sanitizeText(contact.email), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.phone) {
      this.drawLabelValue('Teléfono', this.sanitizeText(contact.phone), marginLeft + 8, contactYPos);
      contactYPos += 15;
    }
    if (contact.company) {
      this.drawLabelValue('Empresa', this.sanitizeText(contact.company), marginLeft + 8, contactYPos);
    }
  }

  // Add contact information section
  addContactSection(contact, detailed = false) {
    if (!contact) return;

    if (detailed) {
      // Removed addPage() to keep single page layout
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