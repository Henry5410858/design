const mongoose = require('mongoose');
const Template = require('../models/Template');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Comprehensive initial data
const initialData = {
  // Real Estate Templates
  realEstateTemplates: [
    {
      name: 'Casa de Lujo',
      description: 'Anuncio elegante de casa de lujo con estilo premium',
      type: 'flyer',
      category: 'flyers',
      templateKey: 'luxuryHouse',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 300, height: 50, text: 'CASA DE LUJO', fontSize: 72, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 200, width: 300, height: 50, text: 'EN VENTA', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '3', type: 'text', x: 100, y: 300, width: 300, height: 50, text: 'PRECIO DESDE', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 100, y: 350, width: 300, height: 50, text: '$ 500.000', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' }
      ],
      backgroundColor: '#1e3a8a',
      backgroundImage: null,
      canvasSize: '1200x1800'
    },
    {
      name: 'Casa de Ensueño',
      description: 'Anuncio de casa de ensueño enfocado en la cocina',
      type: 'story',
      category: 'stories',
      templateKey: 'dreamHome',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 300, height: 50, text: 'CASA MODERNA', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '2', type: 'text', x: 100, y: 200, width: 300, height: 50, text: 'ENSUEÑO', fontSize: 96, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 100, y: 350, width: 300, height: 50, text: 'en venta', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 100, y: 400, width: 300, height: 50, text: 'Precio desde:', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '5', type: 'text', x: 100, y: 450, width: 300, height: 50, text: '$1,500,000', fontSize: 48, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '6', type: 'text', x: 100, y: 530, width: 300, height: 50, text: 'Llámamos:', fontSize: 24, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '7', type: 'text', x: 100, y: 570, width: 300, height: 50, text: '+123-456-7890', fontSize: 36, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#1e3a8a',
      backgroundImage: null,
      canvasSize: '1080x1920'
    },
    {
      name: 'Bienes Raíces Urbanos',
      description: 'Banner de bienes raíces urbanos con skyline de ciudad',
      type: 'banner',
      category: 'banners',
      templateKey: 'cityRealEstate',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 600, height: 80, text: 'BIENES RAÍCES URBANOS', fontSize: 72, color: '#FFFFFF', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 200, width: 600, height: 50, text: 'QUÉ SABER ANTES DE SALTAR', fontSize: 24, color: '#d1d5db', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#0f766e',
      backgroundImage: null,
      canvasSize: '1200x628'
    },
    {
      name: 'Folleto Tríptico',
      description: 'Folleto tríptico profesional para villas',
      type: 'brochure',
      category: 'documents',
      templateKey: 'trifoldBrochure',
      isRealEstate: true,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 100, width: 400, height: 50, text: 'Acerca de Nosotros', fontSize: 36, color: '#1f2937', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 160, width: 400, height: 100, text: 'Los folletos trípticos han sido durante mucho tiempo un tipo de material utilizado para anunciar marcas, productos y servicios. La mejor manera de maximizar su uso es introducir lo que la marca tiene para ofrecer con una sección breve o sobre nosotros como esta.', fontSize: 16, color: '#374151', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '3', type: 'text', x: 400, y: 200, width: 400, height: 50, text: 'Vive mejor en villas que te dan más de lo que esperas.', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 800, y: 100, width: 400, height: 50, text: 'Nuestras Casas', fontSize: 36, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '5', type: 'text', x: 800, y: 200, width: 400, height: 50, text: 'Villa Regal', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' },
        { id: '6', type: 'text', x: 800, y: 300, width: 400, height: 50, text: 'Villa Ruby', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' },
        { id: '7', type: 'text', x: 800, y: 400, width: 400, height: 50, text: 'Villa Ronda', fontSize: 24, color: '#FFFFFF', fontFamily: 'Georgia', fontWeight: 'normal' }
      ],
      backgroundColor: '#f3f4f6',
      backgroundImage: null,
      canvasSize: '1200x1800'
    }
  ],

  // Default Templates (Non-Real Estate)
  defaultTemplates: [
    // Summer Sale Flyer removed - eliminated one flyer from template gallery
    {
      name: 'Promo Historia Instagram',
      description: 'Plantilla de historia por defecto para promociones en redes sociales',
      type: 'story',
      category: 'stories',
      templateKey: 'instagramStoryPromo',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 50, y: 100, width: 300, height: 50, text: 'NUEVO PRODUCTO', fontSize: 48, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 50, y: 200, width: 300, height: 50, text: 'LANZAMIENTO', fontSize: 96, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 50, y: 350, width: 300, height: 50, text: '¡Próximamente!', fontSize: 24, color: '#9C27B0', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1080x1920'
    },
    {
      name: 'Banner de Evento',
      description: 'Plantilla de banner por defecto para eventos y anuncios',
      type: 'banner',
      category: 'banners',
      templateKey: 'eventBanner',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 120, width: 600, height: 80, text: 'GRAN APERTURA', fontSize: 72, color: '#1976D2', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 220, width: 600, height: 50, text: '¡Únete a nosotros para la celebración!', fontSize: 24, color: '#388E3C', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1200x628'
    },
    {
      name: 'Business Document',
      description: 'Default document template for business communications',
      type: 'document',
      category: 'documents',
      templateKey: 'businessDocument',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 80, width: 400, height: 50, text: 'Reporte Empresarial', fontSize: 48, color: '#424242', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 150, width: 400, height: 50, text: 'Q4 2024', fontSize: 24, color: '#616161', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '3', type: 'text', x: 100, y: 220, width: 400, height: 100, text: 'Este es un reporte empresarial integral que cubre todos los aspectos de nuestras operaciones para el cuarto trimestre de 2024.', fontSize: 16, color: '#424242', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1200x1800'
    },
    {
      name: 'IG/FB Square Post',
      description: 'Square post template optimized for Instagram and Facebook',
      type: 'social',
      category: 'social-posts',
      templateKey: 'igFbSquarePost',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 50, y: 200, width: 500, height: 60, text: 'NUEVO PRODUCTO', fontSize: 48, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 50, y: 300, width: 500, height: 80, text: 'LANZAMIENTO', fontSize: 72, color: '#E91E63', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 50, y: 450, width: 500, height: 40, text: '¡Próximamente!', fontSize: 24, color: '#9C27B0', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1080x1080'
    },
    {
      name: 'Post Promocional',
      description: 'Attractive design for social media promotions',
      type: 'social',
      category: 'social-posts',
      templateKey: 'postPromocional',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 50, y: 150, width: 500, height: 60, text: 'VENTA', fontSize: 64, color: '#FF6B35', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 50, y: 250, width: 500, height: 60, text: 'HASTA 70% DESCUENTO', fontSize: 48, color: '#FF6B35', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 50, y: 400, width: 500, height: 40, text: 'Solo por Tiempo Limitado', fontSize: 24, color: '#666666', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#FFFFFF',
      backgroundImage: null,
      canvasSize: '1080x1080'
    },
    {
      name: 'Professional Badge',
      description: 'Elegant professional badge for credentials and certifications',
      type: 'badge',
      category: 'badges',
      templateKey: 'professionalBadge',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 150, y: 200, width: 400, height: 60, text: 'PROFESIONAL', fontSize: 48, color: '#1e40af', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 150, y: 280, width: 400, height: 80, text: 'CERTIFICADO', fontSize: 72, color: '#1e40af', fontFamily: 'Georgia', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 150, y: 400, width: 400, height: 40, text: 'Experto en Diseño', fontSize: 24, color: '#64748b', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 150, y: 500, width: 400, height: 30, text: '2024', fontSize: 18, color: '#94a3b8', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#f8fafc',
      backgroundImage: null,
      canvasSize: '1080x1350'
    },
    {
      name: 'Insignia de Logro',
      description: 'Insignia moderna para premios y logros',
      type: 'badge',
      category: 'badges',
      templateKey: 'achievementBadge',
      isRealEstate: false,
      // isDefault removed - no more default templates
      objects: [
        { id: '1', type: 'text', x: 100, y: 150, width: 500, height: 60, text: 'EXCELENCIA', fontSize: 56, color: '#dc2626', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '2', type: 'text', x: 100, y: 250, width: 500, height: 80, text: 'PREMIO', fontSize: 80, color: '#dc2626', fontFamily: 'Arial', fontWeight: 'bold' },
        { id: '3', type: 'text', x: 100, y: 380, width: 500, height: 40, text: 'Rendimiento Excepcional', fontSize: 28, color: '#374151', fontFamily: 'Arial', fontWeight: 'normal' },
        { id: '4', type: 'text', x: 100, y: 450, width: 500, height: 30, text: 'Reconocido por trabajo excepcional', fontSize: 20, color: '#6b7280', fontFamily: 'Arial', fontWeight: 'normal' }
      ],
      backgroundColor: '#fef2f2',
      backgroundImage: null,
      canvasSize: '1080x1350'
    }
  ]
};

// Initialize all data
const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');

    // Initialize Templates
    console.log('📋 Initializing templates...');
    const allTemplates = [...initialData.realEstateTemplates, ...initialData.defaultTemplates];
    
    for (const templateData of allTemplates) {
      const existingTemplate = await Template.findOne({
        $or: [
          { name: templateData.name, type: templateData.type },
          { templateKey: templateData.templateKey }
        ]
      });

      if (!existingTemplate) {
        await Template.create(templateData);
        console.log(`✅ Created ${templateData.isRealEstate ? 'real estate' : 'default'} template: ${templateData.name}`);
      } else {
        console.log(`ℹ️ Template already exists: ${templateData.name}`);
      }
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log(`📊 Created/Updated: ${allTemplates.length} templates`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
const run = async () => {
  await connectDB();
  await initializeDatabase();
  await mongoose.disconnect();
  console.log('✅ Database initialization script completed');
  process.exit(0);
};

// Handle script execution
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase, initialData };
