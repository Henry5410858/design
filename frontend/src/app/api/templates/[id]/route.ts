import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/lib/models/Template';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID parameter received:', id);
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }
    
    // Check if ID is a valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format:', id);
      return NextResponse.json(
        { error: 'Invalid template ID format' },
        { status: 400 }
      );
    }
    
    const template = await Template.findById(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    
    const template = await Template.findByIdAndUpdate(id, body, { new: true });
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const template = await Template.findByIdAndDelete(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
