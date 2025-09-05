import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Template from '@/lib/models/Template';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isRealEstate = searchParams.get('isRealEstate');
    
    let query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isRealEstate !== null && isRealEstate !== undefined) {
      query.isRealEstate = isRealEstate === 'true';
    }
    
    const templates = await Template.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const template = new Template(body);
    const savedTemplate = await template.save();
    
    return NextResponse.json(savedTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
