/**
 * PDF Proposal Generator
 * Converts canvas designs to professional PDF proposals
 */

import { jsPDF } from 'jspdf';

export interface ProposalData {
  // Basic Info
  title: string;
  subtitle?: string;
  clientName: string;
  companyName: string;
  date: string;
  
  // Content Sections
  executiveSummary: string;
  objectives: string[];
  methodology: string;
  deliverables: string[];
  timeline: string;
  pricing: {
    total: number;
    breakdown: Array<{ item: string; amount: number }>;
  };
  
  // Contact Info
  contact: {
    name: string;
    email: string;
    phone: string;
    website?: string;
  };
  
  // Design Elements
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
}

export interface ProposalVariant {
  id: string;
  name: string;
  description: string;
  template: ProposalTemplate;
}

export interface ProposalTemplate {
  coverPage: CoverPageTemplate;
  contentPages: ContentPageTemplate[];
  styling: ProposalStyling;
}

export interface CoverPageTemplate {
  layout: 'centered' | 'left-aligned' | 'right-aligned' | 'grid';
  elements: Array<{
    type: 'title' | 'subtitle' | 'logo' | 'client-info' | 'date' | 'background';
    position: { x: number; y: number };
    styling: any;
  }>;
}

export interface ContentPageTemplate {
  title: string;
  sections: Array<{
    type: 'text' | 'list' | 'table' | 'image' | 'chart';
    content: string;
    styling: any;
  }>;
}

export interface ProposalStyling {
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontSize: {
    title: number;
    subtitle: number;
    heading: number;
    body: number;
    caption: number;
  };
}

export class PDFProposalGenerator {
  private pdf: jsPDF;
  private currentPage: number = 1;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  /**
   * Generate complete proposal PDF
   */
  async generateProposal(data: ProposalData, variant: ProposalVariant): Promise<Blob> {
    try {
      // Generate cover page
      await this.generateCoverPage(data, variant.template.coverPage, variant.template.styling);
      
      // Generate content pages
      for (const contentPage of variant.template.contentPages) {
        this.addNewPage();
        await this.generateContentPage(data, contentPage, variant.template.styling);
      }
      
      // Add contact page
      this.addNewPage();
      await this.generateContactPage(data);
      
      return this.pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF proposal:', error);
      throw new Error(`Failed to generate PDF: ${error}`);
    }
  }

  /**
   * Generate cover page
   */
  private async generateCoverPage(data: ProposalData, template: CoverPageTemplate, styling: ProposalStyling): Promise<void> {
    
    // Set background color
    const [r, g, b] = this.hexToRgb(styling.primaryColor);
    this.pdf.setFillColor(r, g, b);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Add background image if provided
    if (data.backgroundImageUrl) {
      try {
        const img = await this.loadImage(data.backgroundImageUrl);
        this.pdf.addImage(img, 'PNG', 0, 0, this.pageWidth, this.pageHeight);
      } catch (error) {
        console.warn('Could not load background image:', error);
      }
    }
    
    // Add logo if provided
    if (data.logoUrl) {
      try {
        const logo = await this.loadImage(data.logoUrl);
        const logoWidth = 60;
        const logoHeight = (logo.height * logoWidth) / logo.width;
        this.pdf.addImage(logo, 'PNG', this.margin, this.margin, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Could not load logo:', error);
      }
    }
    
    // Add title
    this.pdf.setTextColor(255, 255, 255); // White text
    this.pdf.setFontSize(styling.fontSize.title);
    this.pdf.setFont('helvetica', 'bold');
    
    const titleY = this.pageHeight / 2 - 40;
    this.pdf.text(data.title, this.pageWidth / 2, titleY, { align: 'center' });
    
    // Add subtitle
    if (data.subtitle) {
      this.pdf.setFontSize(styling.fontSize.subtitle);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(data.subtitle, this.pageWidth / 2, titleY + 15, { align: 'center' });
    }
    
    // Add client info box
    const clientBoxY = this.pageHeight - 100;
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.rect(this.margin, clientBoxY, this.pageWidth - (this.margin * 2), 60, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(styling.fontSize.heading);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Propuesta para:', this.margin + 10, clientBoxY + 15);
    
    this.pdf.setFontSize(styling.fontSize.body);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(data.clientName, this.margin + 10, clientBoxY + 25);
    this.pdf.text(data.companyName, this.margin + 10, clientBoxY + 35);
    this.pdf.text(`Fecha: ${data.date}`, this.margin + 10, clientBoxY + 45);
  }

  /**
   * Generate content page
   */
  private async generateContentPage(data: ProposalData, template: ContentPageTemplate, styling: ProposalStyling): Promise<void> {
    let currentY = this.margin + 20;
    
    // Page title
    const [r, g, b] = this.hexToRgb(styling.primaryColor);
    this.pdf.setTextColor(r, g, b);
    this.pdf.setFontSize(styling.fontSize.heading);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(template.title, this.margin, currentY);
    
    currentY += 15;
    
    // Add horizontal line
    const [lineR, lineG, lineB] = this.hexToRgb(styling.primaryColor);
    this.pdf.setDrawColor(lineR, lineG, lineB);
    this.pdf.line(this.margin, currentY, this.pageWidth - this.margin, currentY);
    currentY += 10;
    
    // Process sections
    for (const section of template.sections) {
      currentY = await this.processSection(data, section, currentY, styling);
      currentY += 10; // Spacing between sections
    }
  }

  /**
   * Process individual section
   */
  private async processSection(data: ProposalData, section: any, startY: number, styling: any): Promise<number> {
    let currentY = startY;
    
    switch (section.type) {
      case 'text':
        return this.addTextSection(section.content, currentY, styling);
      
      case 'list':
        return this.addListSection(section.content, currentY, styling);
      
      case 'table':
        return this.addTableSection(data, section.content, currentY, styling);
      
      case 'image':
        return this.addImageSection(data, section.content, currentY, styling);
      
      default:
        return currentY;
    }
  }

  /**
   * Add text section
   */
  private addTextSection(content: string, startY: number, styling: any): number {
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(styling.fontSize.body);
    this.pdf.setFont('helvetica', 'normal');
    
    const textWidth = this.pageWidth - (this.margin * 2);
    const lines = this.pdf.splitTextToSize(content, textWidth);
    
    let currentY = startY;
    for (const line of lines) {
      if (currentY > this.pageHeight - this.margin - 20) {
        this.addNewPage();
        currentY = this.margin + 20;
      }
      this.pdf.text(line, this.margin, currentY);
      currentY += 7;
    }
    
    return currentY;
  }

  /**
   * Add list section
   */
  private addListSection(content: string[], startY: number, styling: any): number {
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(styling.fontSize.body);
    this.pdf.setFont('helvetica', 'normal');
    
    let currentY = startY;
    for (const item of content) {
      if (currentY > this.pageHeight - this.margin - 20) {
        this.addNewPage();
        currentY = this.margin + 20;
      }
      
      // Bullet point
      this.pdf.text('•', this.margin, currentY);
      this.pdf.text(item, this.margin + 8, currentY);
      currentY += 7;
    }
    
    return currentY;
  }

  /**
   * Add table section (for pricing breakdown)
   */
  private addTableSection(data: ProposalData, content: string, startY: number, styling: any): number {
    if (content === 'pricing') {
      return this.addPricingTable(data, startY, styling);
    }
    return startY;
  }

  /**
   * Add pricing table
   */
  private addPricingTable(data: ProposalData, startY: number, styling: any): number {
    let currentY = startY;
    
    // Table header
    const [headerR, headerG, headerB] = this.hexToRgb(styling.primaryColor);
    this.pdf.setTextColor(headerR, headerG, headerB);
    this.pdf.setFontSize(styling.fontSize.heading);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Desglose de Precios', this.margin, currentY);
    currentY += 15;
    
    // Table
    const tableWidth = this.pageWidth - (this.margin * 2);
    const itemWidth = tableWidth * 0.7;
    const priceWidth = tableWidth * 0.3;
    
    // Header row
    const [fillR, fillG, fillB] = this.hexToRgb(styling.primaryColor);
    this.pdf.setFillColor(fillR, fillG, fillB);
    this.pdf.rect(this.margin, currentY - 5, tableWidth, 10, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(styling.fontSize.body);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Descripción', this.margin + 5, currentY);
    this.pdf.text('Precio', this.margin + itemWidth + 5, currentY);
    
    currentY += 10;
    
    // Data rows
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'normal');
    
    for (const item of data.pricing.breakdown) {
      this.pdf.text(item.item, this.margin + 5, currentY);
      this.pdf.text(`$${item.amount.toLocaleString()}`, this.margin + itemWidth + 5, currentY);
      currentY += 8;
    }
    
    // Total row
    currentY += 5;
    const [totalR, totalG, totalB] = this.hexToRgb(styling.primaryColor);
    this.pdf.setDrawColor(totalR, totalG, totalB);
    this.pdf.line(this.margin, currentY, this.pageWidth - this.margin, currentY);
    currentY += 8;
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(styling.fontSize.heading);
    this.pdf.text('Total:', this.margin + itemWidth - 30, currentY);
    this.pdf.text(`$${data.pricing.total.toLocaleString()}`, this.margin + itemWidth + 5, currentY);
    
    return currentY + 20;
  }

  /**
   * Add image section
   */
  private async addImageSection(data: ProposalData, content: string, startY: number, styling: any): Promise<number> {
    if (content === 'logo' && data.logoUrl) {
      try {
        const logo = await this.loadImage(data.logoUrl);
        const logoWidth = 40;
        const logoHeight = (logo.height * logoWidth) / logo.width;
        this.pdf.addImage(logo, 'PNG', this.margin, startY, logoWidth, logoHeight);
        return startY + logoHeight + 10;
      } catch (error) {
        console.warn('Could not load logo for image section:', error);
      }
    }
    return startY;
  }

  /**
   * Generate contact page
   */
  private async generateContactPage(data: ProposalData): Promise<void> {
    let currentY = this.margin + 20;
    
    // Contact title
    this.pdf.setTextColor(51, 51, 51); // #333333
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Información de Contacto', this.margin, currentY);
    
    currentY += 20;
    
    // Contact details
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'normal');
    
    const contactInfo = [
      `Nombre: ${data.contact.name}`,
      `Email: ${data.contact.email}`,
      `Teléfono: ${data.contact.phone}`,
    ];
    
    if (data.contact.website) {
      contactInfo.push(`Sitio Web: ${data.contact.website}`);
    }
    
    for (const info of contactInfo) {
      this.pdf.text(info, this.margin, currentY);
      currentY += 10;
    }
    
    // Thank you message
    currentY += 20;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text('Gracias por considerar nuestra propuesta. Esperamos trabajar con usted.', 
                  this.margin, currentY);
  }

  /**
   * Add new page
   */
  private addNewPage(): void {
    this.pdf.addPage();
    this.currentPage++;
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
}

// Predefined proposal variants
export const PROPOSAL_VARIANTS: ProposalVariant[] = [
  {
    id: 'real-estate',
    name: 'Bienes Raíces',
    description: 'Propuesta profesional para servicios inmobiliarios',
    template: {
      coverPage: {
        layout: 'centered',
        elements: [
          { type: 'title', position: { x: 105, y: 100 }, styling: {} },
          { type: 'subtitle', position: { x: 105, y: 120 }, styling: {} },
          { type: 'client-info', position: { x: 20, y: 200 }, styling: {} }
        ]
      },
      contentPages: [
        {
          title: 'Resumen Ejecutivo',
          sections: [
            { type: 'text', content: 'executiveSummary', styling: {} }
          ]
        },
        {
          title: 'Objetivos del Proyecto',
          sections: [
            { type: 'list', content: 'objectives', styling: {} }
          ]
        },
        {
          title: 'Metodología',
          sections: [
            { type: 'text', content: 'methodology', styling: {} }
          ]
        },
        {
          title: 'Entregables',
          sections: [
            { type: 'list', content: 'deliverables', styling: {} }
          ]
        },
        {
          title: 'Cronograma',
          sections: [
            { type: 'text', content: 'timeline', styling: {} }
          ]
        },
        {
          title: 'Inversión',
          sections: [
            { type: 'table', content: 'pricing', styling: {} }
          ]
        }
      ],
      styling: {
        fontFamily: 'helvetica',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b',
        fontSize: {
          title: 24,
          subtitle: 16,
          heading: 14,
          body: 10,
          caption: 8
        }
      }
    }
  },
  {
    id: 'business',
    name: 'Empresarial',
    description: 'Propuesta corporativa para servicios empresariales',
    template: {
      coverPage: {
        layout: 'left-aligned',
        elements: [
          { type: 'logo', position: { x: 20, y: 20 }, styling: {} },
          { type: 'title', position: { x: 20, y: 100 }, styling: {} },
          { type: 'client-info', position: { x: 20, y: 200 }, styling: {} }
        ]
      },
      contentPages: [
        {
          title: 'Propuesta de Valor',
          sections: [
            { type: 'text', content: 'executiveSummary', styling: {} }
          ]
        },
        {
          title: 'Objetivos Estratégicos',
          sections: [
            { type: 'list', content: 'objectives', styling: {} }
          ]
        },
        {
          title: 'Enfoque y Metodología',
          sections: [
            { type: 'text', content: 'methodology', styling: {} }
          ]
        },
        {
          title: 'Entregables y Resultados',
          sections: [
            { type: 'list', content: 'deliverables', styling: {} }
          ]
        },
        {
          title: 'Plan de Implementación',
          sections: [
            { type: 'text', content: 'timeline', styling: {} }
          ]
        },
        {
          title: 'Inversión Requerida',
          sections: [
            { type: 'table', content: 'pricing', styling: {} }
          ]
        }
      ],
      styling: {
        fontFamily: 'helvetica',
        primaryColor: '#059669',
        secondaryColor: '#374151',
        accentColor: '#dc2626',
        fontSize: {
          title: 22,
          subtitle: 14,
          heading: 12,
          body: 9,
          caption: 7
        }
      }
    }
  },
  {
    id: 'marketing',
    name: 'Marketing Digital',
    description: 'Propuesta creativa para servicios de marketing',
    template: {
      coverPage: {
        layout: 'grid',
        elements: [
          { type: 'title', position: { x: 105, y: 80 }, styling: {} },
          { type: 'subtitle', position: { x: 105, y: 100 }, styling: {} },
          { type: 'client-info', position: { x: 20, y: 180 }, styling: {} }
        ]
      },
      contentPages: [
        {
          title: 'Estrategia de Marketing',
          sections: [
            { type: 'text', content: 'executiveSummary', styling: {} }
          ]
        },
        {
          title: 'Objetivos de Campaña',
          sections: [
            { type: 'list', content: 'objectives', styling: {} }
          ]
        },
        {
          title: 'Tácticas y Canales',
          sections: [
            { type: 'text', content: 'methodology', styling: {} }
          ]
        },
        {
          title: 'Contenidos y Materiales',
          sections: [
            { type: 'list', content: 'deliverables', styling: {} }
          ]
        },
        {
          title: 'Cronograma de Campaña',
          sections: [
            { type: 'text', content: 'timeline', styling: {} }
          ]
        },
        {
          title: 'Inversión en Marketing',
          sections: [
            { type: 'table', content: 'pricing', styling: {} }
          ]
        }
      ],
      styling: {
        fontFamily: 'helvetica',
        primaryColor: '#7c3aed',
        secondaryColor: '#4b5563',
        accentColor: '#f97316',
        fontSize: {
          title: 20,
          subtitle: 13,
          heading: 11,
          body: 9,
          caption: 7
        }
      }
    }
  }
];

// Export default instance
export const pdfProposalGenerator = new PDFProposalGenerator();
