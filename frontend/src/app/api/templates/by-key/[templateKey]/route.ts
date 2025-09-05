import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/lib/models/Template';

export async function GET(
  request: NextRequest,
  { params }: { params: { templateKey: string } }
) {
  try {
    await connectDB();
    
    const { templateKey } = params;
    
    if (!templateKey) {
      return NextResponse.json(
        { error: 'Template key is required' },
        { status: 400 }
      );
    }
    
    const template = await Template.findOne({ templateKey });
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template by key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { templateKey: string } }
) {
  try {
    await connectDB();
    
    const { templateKey } = params;
    const body = await request.json();
    
    const template = await Template.findOneAndUpdate(
      { templateKey },
      body,
      { new: true }
    );
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template by key:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
