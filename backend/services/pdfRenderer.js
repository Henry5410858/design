const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

class PDFRenderer {
  static async generatePDF(proposalData, template = 'dossier-express') {
    let browser = null;
    
    try {
      // Environment detection
      const isRender = process.env.RENDER === 'true';
      const isProduction = process.env.NODE_ENV === 'production';

      // Browser configuration for Render
      const browserOptions = {
        headless: true,
        defaultViewport: { width: 1200, height: 1697 }, // A4 ratio
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--font-render-hinting=none'
        ]
      };

      if (isRender || isProduction) {
        // Render.com specific configuration
        browserOptions.executablePath = await chromium.executablePath;
        browserOptions.args = [
          ...browserOptions.args,
          '--single-process',
          '--no-zygote',
          '--max-old-space-size=256'
        ];
      } else {
        // Local development
        browserOptions.executablePath = puppeteer.executablePath();
      }

      browser = await puppeteer.launch(browserOptions);
      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = this.generateHTML(proposalData, template);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      await browser.close();
      return pdfBuffer;

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error('PDF Generation Error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  static generateHTML(proposalData, template) {
    // Your existing HTML generation logic
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
          }
          .client-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .property-item {
            margin-bottom: 15px;
            padding: 15px;
            border-left: 4px solid #007bff;
            background: #fff;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Design Proposal</h1>
          <p>Generated for ${proposalData.client?.name || 'Client'}</p>
        </div>
        
        <div class="client-info">
          <h3>Client Information</h3>
          <p><strong>Name:</strong> ${proposalData.client?.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${proposalData.client?.email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${proposalData.client?.phone || 'N/A'}</p>
        </div>

        <div class="properties">
          <h3>Properties</h3>
          ${proposalData.items?.map(item => `
            <div class="property-item">
              <h4>${item.title || 'Property'}</h4>
              <p>${item.description || 'No description provided'}</p>
              ${item.price ? `<p><strong>Price: $${item.price.toLocaleString()}</strong></p>` : ''}
            </div>
          `).join('') || '<p>No properties listed</p>'}
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = PDFRenderer;