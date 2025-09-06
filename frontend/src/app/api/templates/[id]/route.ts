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
  type: { type: String, enum: ['square-post', 'story', 'marketplace-flyer', 'fb-feed-banner', 'digital-badge', 'brochure'], required: true },
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 Template by ID API called');
    await connectDB();
    
    const { id } = await params;
    console.log('🔍 Template ID received:', id);
    
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID format' },
        { status: 400 }
      );
    }
    
    // Try multiple methods to find the template
    let template = null;
    
    // Method 1: findById
    template = await Template.findById(id);
    if (template) {
      return NextResponse.json(template);
    }
    
    // Method 2: findOne with _id
    template = await Template.findOne({ _id: id });
    if (template) {
      return NextResponse.json(template);
    }
    
    // Method 3: findOne with ObjectId
    template = await Template.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (template) {
      return NextResponse.json(template);
    }
    
    // Method 4: Get all templates and find by string comparison
    const allTemplates = await Template.find({});
    const foundTemplate = allTemplates.find(t => t._id.toString() === id);
    
    if (foundTemplate) {
      return NextResponse.json(foundTemplate);
    }
    
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}
