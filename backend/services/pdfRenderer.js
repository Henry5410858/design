const PDFDocument = require('pdfkit');

class SimplePDFRenderer {
  static async generatePDF(proposalData, template = 'dossier-express') {
    try {
      console.log('📄 Generating PDF with improved simple renderer...');
      
      // Create a PDF document with better margins
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        bufferPages: true 
      });
      
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add content to PDF
        this.addContentToPDF(doc, proposalData, template);
        
        doc.end();
      });
      
    } catch (error) {
      console.error('❌ Simple PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  static addContentToPDF(doc, proposalData, template) {
    const { client, items, introduction, theme = {} } = proposalData;

    // Helper function for currency formatting
    const formatCurrency = (amount, currencyCode = 'EUR') => {
      try {
        return new Intl.NumberFormat('es-ES', { 
          style: 'currency', 
          currency: currencyCode 
        }).format(amount);
      } catch {
        return `${amount} ${currencyCode}`;
      }
    };

    // Colors - use theme colors or defaults
    const primaryColor = theme.primaryColor || '#2c5aa0';
    const secondaryColor = theme.secondaryColor || '#f8f9fa';
    const textColor = theme.textColor || '#333333';
    const borderColor = theme.borderColor || '#e0e0e0';

    // Set default font and color
    doc.fillColor(textColor);

    // ===== HEADER SECTION =====
    this.addHeaderSection(doc, client, primaryColor, secondaryColor);

    // ===== INTRODUCTION SECTION =====
    if (introduction) {
      this.addIntroductionSection(doc, introduction, primaryColor);
    }

    // ===== CLIENT INFORMATION SECTION =====
    this.addClientSection(doc, client, primaryColor);

    // ===== PROPERTIES/ITEMS SECTION =====
    this.addItemsSection(doc, items, primaryColor, formatCurrency);

    // ===== FOOTER SECTION =====
    this.addFooterSection(doc, primaryColor);

    // Add page numbers if multiple pages
    this.addPageNumbers(doc);
  }

  static addHeaderSection(doc, client, primaryColor, secondaryColor) {
    // Header background
    doc.rect(0, 0, doc.page.width, 120)
       .fill(primaryColor);
    
    // Title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('PROPUESTA COMERCIAL', 40, 40, { align: 'center' });
    
    // Client name
    doc.fontSize(16)
       .font('Helvetica')
       .text(`Para: ${client?.name || 'Cliente'}`, 40, 80, { align: 'center' });
    
    // Reset position after header
    doc.y = 140;
    doc.fillColor('#333333');
  }

  static addIntroductionSection(doc, introduction, primaryColor) {
    doc.moveDown(0.5);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('INTRODUCCIÓN', { underline: false });
    
    doc.moveDown(0.3);
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(introduction, {
         align: 'justify',
         lineGap: 2
       });
    
    doc.moveDown();
    
    // Add separator line
    doc.moveTo(40, doc.y)
       .lineTo(doc.page.width - 40, doc.y)
       .strokeColor('#e0e0e0')
       .lineWidth(1)
       .stroke();
    
    doc.moveDown();
  }

  static addClientSection(doc, client, primaryColor) {
    doc.moveDown(0.5);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('INFORMACIÓN DEL CLIENTE', { underline: false });
    
    doc.moveDown(0.3);
    
    // Client info box
    const clientBoxY = doc.y;
    const clientBoxHeight = 60;
    
    // Background for client info
    doc.rect(40, clientBoxY, doc.page.width - 80, clientBoxHeight)
       .fill('#f8f9fa');
    
    // Client details
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333');
    
    const startX = 60;
    let currentY = clientBoxY + 15;
    
    doc.text(`Nombre: ${client?.name || 'N/A'}`, startX, currentY);
    currentY += 15;
    
    if (client?.email) {
      doc.text(`Email: ${client.email}`, startX, currentY);
      currentY += 15;
    }
    
    if (client?.phone) {
      doc.text(`Teléfono: ${client.phone}`, startX, currentY);
      currentY += 15;
    }
    
    if (client?.industry) {
      doc.text(`Sector: ${client.industry}`, startX, currentY);
    }
    
    doc.y = clientBoxY + clientBoxHeight + 20;
    
    // Add separator line
    doc.moveTo(40, doc.y)
       .lineTo(doc.page.width - 40, doc.y)
       .strokeColor('#e0e0e0')
       .lineWidth(1)
       .stroke();
    
    doc.moveDown();
  }

  static addItemsSection(doc, items, primaryColor, formatCurrency) {
    doc.moveDown(0.5);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text('SERVICIOS PROPUESTOS', { underline: false });
    
    doc.moveDown(0.5);

    items?.forEach((item, index) => {
      // Check if we need a new page
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
        doc.y = 40;
      }

      // Item container
      const itemBoxY = doc.y;
      const itemBoxHeight = 80;
      
      // Item background with subtle border
      doc.rect(40, itemBoxY, doc.page.width - 80, itemBoxHeight)
         .fill('#ffffff')
         .strokeColor('#e0e0e0')
         .lineWidth(1)
         .stroke();
      
      // Item number and title
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text(`${index + 1}. ${item.title || 'Servicio'}`, 60, itemBoxY + 15);
      
      // Item description
      if (item.description) {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#333333')
           .text(item.description, 60, itemBoxY + 35, {
             width: doc.page.width - 120,
             lineGap: 1
           });
      }
      
      // Item details (location, price, etc.)
      let detailY = itemBoxY + 55;
      const detailX = 60;
      
      doc.fontSize(8)
         .font('Helvetica');
      
      if (item.location) {
        doc.text(`📍 ${item.location}`, detailX, detailY);
        detailY += 12;
      }
      
      if (item.price) {
        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(`💰 ${formatCurrency(item.price)}`, detailX, detailY);
        doc.fillColor('#333333');
      }
      
      doc.y = itemBoxY + itemBoxHeight + 20;
      
      // Add small gap between items
      doc.moveDown(0.3);
    });
    
    if (!items || items.length === 0) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text('No se han especificado servicios.', { align: 'center' });
      doc.moveDown();
    }
  }

  static addFooterSection(doc, primaryColor) {
    // Add final separator
    doc.moveTo(40, doc.y)
       .lineTo(doc.page.width - 40, doc.y)
       .strokeColor('#e0e0e0')
       .lineWidth(1)
       .stroke();
    
    doc.moveDown(1.5);
    
    // Footer text
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Propuesta generada el ${new Date().toLocaleDateString('es-ES')}`, { 
         align: 'center' 
       });
    
    // Confidential notice
    doc.moveDown(0.5);
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .text('Este documento es confidencial y está destinado exclusivamente al cliente mencionado.', {
         align: 'center'
       });
  }

  static addPageNumbers(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Add page number at bottom
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#666666')
         .text(
           `Página ${i + 1} de ${pages.count}`,
           40,
           doc.page.height - 30,
           { align: 'center' }
         );
    }
  }

  static renderTemplateToPdf(options) {
    // For compatibility with your existing code
    return this.generatePDF(options.data, options.template);
  }
}

module.exports = SimplePDFRenderer;