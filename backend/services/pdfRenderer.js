const PDFDocument = require('pdfkit');

class SimplePDFRenderer {
  static async generatePDF(proposalData, template = 'dossier-express') {
    try {
      console.log('📄 Generating PDF with simple renderer...');
      
      // Create a PDF document
      const doc = new PDFDocument({ margin: 50 });
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
    const { client, items, introduction } = proposalData;

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('DESIGN PROPOSAL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated for: ${client?.name || 'Client'}`, { align: 'center' });
    doc.moveDown(2);

    // Introduction
    if (introduction) {
      doc.fontSize(10).text('Introduction:', { underline: true });
      doc.fontSize(9).text(introduction);
      doc.moveDown();
    }

    // Client Information
    doc.fontSize(10).text('CLIENT INFORMATION', { underline: true });
    doc.fontSize(9);
    doc.text(`Name: ${client?.name || 'N/A'}`);
    if (client?.email) doc.text(`Email: ${client.email}`);
    if (client?.phone) doc.text(`Phone: ${client.phone}`);
    doc.moveDown();

    // Properties/Items
    doc.fontSize(10).text('PROPERTIES', { underline: true });
    doc.moveDown(0.5);

    items?.forEach((item, index) => {
      doc.fontSize(9).font('Helvetica-Bold').text(`${index + 1}. ${item.title || 'Property'}`);
      doc.font('Helvetica');
      doc.text(`Description: ${item.description || 'No description provided'}`);
      if (item.location) doc.text(`Location: ${item.location}`);
      if (item.price) doc.text(`Price: $${item.price.toLocaleString()}`);
      doc.moveDown();
    });

    // Footer
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  }

  static renderTemplateToPdf(options) {
    // For compatibility with your existing code
    return this.generatePDF(options.data, options.template);
  }
}

module.exports = SimplePDFRenderer;