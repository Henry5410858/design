import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Template schema (inline for Vercel)
const CanvasObjectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'text', 'i-text', 'image', 'rect', 'rectangle', 'circle', 'triangle', 
      'polygon', 'path', 'rounded-rectangle', 'line', 'placeholder', 'shape'
    ], 
    required: true 
  },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  left: { type: Number },
  top: { type: Number },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  radius: { type: Number },
  text: { type: String },
  content: { type: String },
  fontSize: { type: Number, default: 48 },
  font: { type: String, default: 'Arial' },
  fontFamily: { type: String, default: 'Arial' },
  fontWeight: { type: String, default: 'normal' },
  textAlign: { type: String, default: 'left' },
  color: { type: String, default: '#000000' },
  fill: { type: String, default: '#000000' },
  stroke: { type: String, default: 'transparent' },
  borderColor: { type: String, default: 'transparent' },
  strokeWidth: { type: Number, default: 0 },
  borderWidth: { type: Number, default: 0 },
  strokeLineCap: { type: String, default: 'butt' },
  strokeLineJoin: { type: String, default: 'miter' },
  src: { type: String },
  url: { type: String },
  placeholder: { type: String },
  originalAspectRatio: { type: Number },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  rotation: { type: Number, default: 0 },
  rx: { type: Number, default: 0 },
  ry: { type: Number, default: 0 },
  points: { type: [Number], default: [] },
  path: { type: String },
  shape: { type: String },
  isBackground: { type: Boolean, default: false }
}, { _id: false });

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['square-post', 'story', 'marketplace-flyer', 'real-estate-flyer', 'fb-feed-banner', 'digital-badge', 'brochure'], required: true },
  category: { type: String, enum: ['social-posts', 'stories', 'flyers', 'banners', 'badges', 'documents', 'marketplace-flyers', 'fb-banners'], required: true },
  templateKey: { type: String, unique: true, sparse: true },
  thumbnail: { type: String, default: '/uploads/default-thumbnail.png' },
  fileUrl: { type: String },
  designFilename: { type: String },
  objects: [CanvasObjectSchema],
  backgroundColor: { type: String, default: '#ffffff' },
  backgroundImage: { type: String },
  canvasSize: { type: String, default: '1200x1800' },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRealEstate: { type: Boolean, default: false }
}, { timestamps: true });

const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/design_center', {
      bufferCommands: false,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Frontend templates API called');
    console.log('📊 Request URL:', request.url);
    
    await connectDB();
    console.log('✅ Database connected');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isRealEstate = searchParams.get('isRealEstate');
    
    console.log('📊 Query params:', { type, category, isRealEstate });
    
    let query: any = {};
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (isRealEstate !== null) query.isRealEstate = isRealEstate === 'true';
    
    console.log('🔍 Database query:', query);
    console.log('🔍 Template model:', Template ? 'Loaded' : 'Not loaded');
    
    const templates = await Template.find(query).sort({ createdAt: -1 });
    console.log(`✅ Found ${templates.length} templates`);
    
    return NextResponse.json(templates);
    
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Frontend templates POST API called');
    
    await connectDB();
    console.log('✅ Database connected');
    
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { name, type, dimensions, brandKitLogo } = body;
    
    if (!type) {
      console.log('❌ No template type provided');
      return NextResponse.json({ error: 'Template type is required' }, { status: 400 });
    }
    
    // Validate template type
    const validTypes = ['square-post', 'story', 'marketplace-flyer', 'real-estate-flyer', 'fb-feed-banner', 'digital-badge', 'brochure'];
    if (!validTypes.includes(type)) {
      console.log('❌ Invalid template type:', type);
      return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }
    
    // Generate default name if none provided
    const templateName = name || generateDefaultTemplateName(type);
    console.log('📝 Template name:', templateName);
    
    // Generate a unique template key
    const templateKey = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔑 Template key:', templateKey);
    
    // Get default objects and add logo if available
    let templateObjects = getDefaultObjectsForType(type);
    console.log('📦 Default objects:', templateObjects.length);
    
    // Add brand kit logo to template if available
    if (brandKitLogo) {
      console.log('🏷️ Adding brand kit logo');
      const logoObject = {
        id: 'brand-logo',
        type: 'image',
        x: 50,
        y: 50,
        width: 100,
        height: 60,
        src: brandKitLogo,
        selectable: true,
        evented: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        cornerStyle: 'circle',
        cornerColor: '#00525b',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#00525b',
        borderScaleFactor: 1
      };
      
      // Add logo as the first object
      templateObjects.unshift(logoObject);
    }
    
    // Prepare dimensions
    const templateDimensions = dimensions || getDefaultDimensions(type);
    console.log('📐 Template dimensions:', templateDimensions);
    
    // Prepare template data
    const templateData = {
      name: templateName,
      type: type,
      category: getCategoryForType(type),
      thumbnail: '/uploads/default-thumbnail.png',
      objects: templateObjects,
      backgroundColor: '#ffffff',
      dimensions: templateDimensions,
      templateKey: templateKey,
    };
    
    console.log('📋 Template data to create:', {
      name: templateData.name,
      type: templateData.type,
      category: templateData.category,
      templateKey: templateData.templateKey,
      dimensions: templateData.dimensions,
      objectsCount: templateData.objects.length
    });
    
    // Create new template with default content based on type
    const newTemplate = await Template.create(templateData);
    
    console.log('✅ Template created successfully:', newTemplate._id);
    
    return NextResponse.json(newTemplate, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error creating template:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      keyPattern: (error as any)?.keyPattern,
      keyValue: (error as any)?.keyValue,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to create template', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper functions
function generateDefaultTemplateName(type: string): string {
  const typeNames: { [key: string]: string } = {
    'square-post': 'Nueva Publicación Cuadrada',
    'story': 'Nueva Historia',
    'marketplace-flyer': 'Nuevo Flyer de Mercado',
    'real-estate-flyer': 'Nuevo Flyer Inmobiliario',
    'fb-feed-banner': 'Nuevo Banner de Facebook',
    'digital-badge': 'Nueva Insignia Digital',
    'brochure': 'Nuevo Folleto'
  };
  
  return typeNames[type] || 'Nueva Plantilla';
}

function getDefaultObjectsForType(type: string): any[] {
  const defaultObjects: { [key: string]: any[] } = {
    'square-post': [
      {
        id: 'text-1',
        type: 'text',
        x: 50,
        y: 50,
        width: 400,
        height: 60,
        text: 'Tu Texto Aquí',
        fontSize: 32,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center'
      }
    ],
    'story': [
      {
        id: 'text-1',
        type: 'text',
        x: 50,
        y: 100,
        width: 300,
        height: 80,
        text: 'Tu Historia',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center'
      }
    ],
    'real-estate-flyer': [
      {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 500,
        height: 60,
        text: 'PROPIEDAD EN VENTA',
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#1e40af',
        textAlign: 'center'
      },
      {
        id: 'text-2',
        type: 'text',
        x: 100,
        y: 200,
        width: 500,
        height: 40,
        text: 'Descripción de la propiedad',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#374151',
        textAlign: 'center'
      }
    ],
    'marketplace-flyer': [
      {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 500,
        height: 60,
        text: 'OFERTA ESPECIAL',
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#dc2626',
        textAlign: 'center'
      },
      {
        id: 'text-2',
        type: 'text',
        x: 100,
        y: 200,
        width: 500,
        height: 40,
        text: 'Descripción del producto',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#374151',
        textAlign: 'center'
      }
    ],
    'fb-feed-banner': [
      {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 600,
        height: 60,
        text: 'Banner de Facebook',
        fontSize: 32,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#1877f2',
        textAlign: 'center'
      }
    ],
    'digital-badge': [
      {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 200,
        width: 400,
        height: 60,
        text: 'INSIGNIA',
        fontSize: 48,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#1e40af',
        textAlign: 'center'
      }
    ],
    'brochure': [
      {
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 500,
        height: 60,
        text: 'Título del Folleto',
        fontSize: 36,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'left'
      }
    ]
  };
  
  return defaultObjects[type] || [];
}

function getCategoryForType(type: string): string {
  const categoryMap: { [key: string]: string } = {
    'square-post': 'social-posts',
    'story': 'stories',
    'marketplace-flyer': 'marketplace-flyers',
    'real-estate-flyer': 'flyers',
    'fb-feed-banner': 'fb-banners',
    'digital-badge': 'badges',
    'brochure': 'documents'
  };
  
  return categoryMap[type] || 'documents';
}

function getDefaultDimensions(type: string): { width: number; height: number } {
  const dimensionsMap: { [key: string]: { width: number; height: number } } = {
    'square-post': { width: 1080, height: 1080 },
    'story': { width: 1080, height: 1920 },
    'marketplace-flyer': { width: 1200, height: 1500 },
    'real-estate-flyer': { width: 1200, height: 1500 },
    'fb-feed-banner': { width: 1200, height: 628 },
    'digital-badge': { width: 1080, height: 1350 },
    'brochure': { width: 1200, height: 1500 }
  };
  
  return dimensionsMap[type] || { width: 1200, height: 1500 };
}