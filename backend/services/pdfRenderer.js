const PDFDocument = require('pdfkit');
const axios = require('axios');

class PDFRenderer {
  constructor() {
    this.fonts = {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique'
    };
  }

  async renderTemplateToPdf({ template, data, locale = 'es', currencyCode = 'EUR' }) {
    try {
      console.log(`📄 Generating PDF with template: ${template}`);
      
      switch (template) {
        case 'dossier-express':
          return await this.generateDossierExpress(data, locale, currencyCode);
        case 'comparative-short':
          return await this.generateComparativeShort(data, locale, currencyCode);
        case 'simple-proposal':
          return await this.generateSimpleProposal(data, locale, currencyCode);
        default:
          return await this.generateDossierExpress(data, locale, currencyCode);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  async generateDossierExpress(data, locale, currencyCode) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Propuesta - ${data.client.name}`,
            Author: 'Sistema de Propuestas',
            Creator: 'PDFKit'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, data);
        
        // Client Information
        this.addClientSection(doc, data.client);
        
        // Introduction
        this.addIntroduction(doc, data.intro);
        
        // Properties
        this.addPropertiesSection(doc, data.items, currencyCode);
        
        // Footer
        this.addFooter(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateComparativeShort(data, locale, currencyCode) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 40,
          size: 'A4'
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Title
        doc.font(this.fonts.bold)
           .fontSize(20)
           .text('COMPARATIVA DE PROPIEDADES', { align: 'center' });
        doc.moveDown(0.5);

        // Client
        doc.font(this.fonts.bold)
           .fontSize(14)
           .text(`Cliente: ${data.client.name}`);
        doc.moveDown(0.5);

        // Properties comparison table
        this.addComparisonTable(doc, data.items, currencyCode);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateSimpleProposal(data, locale, currencyCode) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4'
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Cover page
        this.addCoverPage(doc, data);
        doc.addPage();

        // Table of contents would go here
        this.addDetailedContent(doc, data, currencyCode);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, data) {
    // Add logo if available
    if (data.theme?.logoUrl) {
      // For now, we'll just add text. Image handling can be added later
      doc.font(this.fonts.bold)
         .fontSize(16)
         .text('PROPUESTA COMERCIAL', { align: 'center' });
    } else {
      doc.font(this.fonts.bold)
         .fontSize(16)
         .text('PROPUESTA COMERCIAL', { align: 'center' });
    }
    
    doc.moveDown(1);
    
    // Add date
    const today = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    doc.font(this.fonts.normal)
       .fontSize(10)
       .text(`Generado el: ${today}`, { align: 'right' });
    
    doc.moveDown(2);
  }

  addClientSection(doc, client) {
    doc.font(this.fonts.bold)
       .fontSize(14)
       .text('INFORMACIÓN DEL CLIENTE');
    
    doc.moveDown(0.5);
    
    doc.font(this.fonts.normal)
       .fontSize(11)
       .text(`• Nombre: ${client.name}`);
    
    if (client.industry) {
      doc.text(`• Industria: ${client.industry}`);
    }
    
    if (client.contact?.company) {
      doc.text(`• Empresa: ${client.contact.company}`);
    }
    
    doc.moveDown(1);
  }

  addIntroduction(doc, intro) {
    if (intro && intro.trim()) {
      doc.font(this.fonts.bold)
         .fontSize(12)
         .text('INTRODUCCIÓN');
      
      doc.moveDown(0.5);
      
      doc.font(this.fonts.normal)
         .fontSize(10)
         .text(intro, { 
           align: 'justify',
           lineGap: 2
         });
      
      doc.moveDown(1);
    }
  }

  addPropertiesSection(doc, items, currencyCode) {
    doc.font(this.fonts.bold)
       .fontSize(14)
       .text('PROPIEDADES RECOMENDADAS');
    
    doc.moveDown(1);

    items.forEach((item, index) => {
      // Property header
      doc.font(this.fonts.bold)
         .fontSize(12)
         .text(`${index + 1}. ${item.title}`);
      
      doc.moveDown(0.3);

      // Property details
      doc.font(this.fonts.normal)
         .fontSize(10);

      if (item.location) {
        doc.text(`📍 Ubicación: ${item.location}`);
      }

      if (item.price) {
        const formattedPrice = new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: currencyCode
        }).format(item.price);
        doc.text(`💰 Precio: ${formattedPrice}`);
      }

      if (item.keyFacts) {
        doc.text(`⚡ Características: ${item.keyFacts}`);
      }

      doc.moveDown(0.2);

      // Description
      doc.text(`📝 Descripción: ${item.description}`, {
        lineGap: 1.5
      });

      // Separator between properties
      if (index < items.length - 1) {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .strokeColor('#cccccc')
            .stroke();
        doc.moveDown(0.5);
      }
    });
  }

  addComparisonTable(doc, items, currencyCode) {
    // Simple table implementation
    items.forEach((item, index) => {
      const y = doc.y;
      
      // Background for alternate rows
      if (index % 2 === 0) {
        doc.rect(50, y, 500, 60)
           .fillColor('#f8f9fa')
           .fill();
      }

      // Property title
      doc.font(this.fonts.bold)
         .fontSize(11)
         .fillColor('black')
         .text(item.title, 60, y + 10, { width: 300 });
      
      // Price
      if (item.price) {
        const formattedPrice = new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: currencyCode
        }).format(item.price);
        
        doc.text(formattedPrice, 370, y + 10, { width: 120, align: 'right' });
      }
      
      // Key facts
      if (item.keyFacts) {
        doc.font(this.fonts.normal)
           .fontSize(9)
           .fillColor('#666666')
           .text(item.keyFacts, 60, y + 30, { width: 430 });
      }
      
      doc.y = y + 70;
    });
  }

  addCoverPage(doc, data) {
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fillColor(data.theme?.primary || '#1f2937')
       .fill();
    
    doc.fillColor('#ffffff')
       .font(this.fonts.bold)
       .fontSize(28)
       .text('PROPUESTA COMERCIAL', 50, 200, { 
         align: 'center',
         width: doc.page.width - 100
       });
    
    doc.fontSize(18)
       .text(`Para: ${data.client.name}`, 50, 300, {
         align: 'center',
         width: doc.page.width - 100
       });
    
    const today = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    doc.fontSize(12)
       .text(today, 50, 400, {
         align: 'center',
         width: doc.page.width - 100
       });
  }

  addDetailedContent(doc, data, currencyCode) {
    this.addClientSection(doc, data.client);
    this.addIntroduction(doc, data.intro);
    this.addPropertiesSection(doc, data.items, currencyCode);
    
    // Add contact information
    if (data.client.contact) {
      doc.addPage();
      this.addContactSection(doc, data.client.contact);
    }
  }

  addContactSection(doc, contact) {
    doc.font(this.fonts.bold)
       .fontSize(14)
       .text('INFORMACIÓN DE CONTACTO');
    
    doc.moveDown(1);
    
    doc.font(this.fonts.normal)
       .fontSize(11);
    
    if (contact.name) {
      doc.text(`👤 ${contact.name}`);
    }
    
    if (contact.email) {
      doc.text(`📧 ${contact.email}`);
    }
    
    if (contact.phone) {
      doc.text(`📞 ${contact.phone}`);
    }
    
    if (contact.company) {
      doc.text(`🏢 ${contact.company}`);
    }
    
    if (contact.address) {
      doc.text(`📍 ${contact.address}`);
    }
  }

  addFooter(doc, data) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 50;
    
    doc.moveTo(50, footerY)
       .lineTo(550, footerY)
       .strokeColor('#cccccc')
       .stroke();
    
    doc.font(this.fonts.normal)
       .fontSize(8)
       .fillColor('#666666')
       .text('Documento generado automáticamente - Confidencial', 50, footerY + 10, {
         align: 'center',
         width: 500
       });
  }
}

module.exports = new PDFRenderer();