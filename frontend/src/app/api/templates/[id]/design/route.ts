import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    console.log(`📁 Loading design data for template: ${templateId}`);

    // Look for design JSON files in the backend uploads directory
    const designsDir = path.join(process.cwd(), '..', 'backend', 'uploads', 'designs');
    
    if (!fs.existsSync(designsDir)) {
      console.log(`⚠️ Designs directory not found: ${designsDir}`);
      return NextResponse.json({ error: 'Design data not found' }, { status: 404 });
    }

    // List all JSON files in the designs directory
    const files = fs.readdirSync(designsDir).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${files.length} design files`);

    // Try to find a design file that might match the template ID
    // For now, we'll use the first available design file as an example
    if (files.length === 0) {
      console.log(`⚠️ No design files found in ${designsDir}`);
      return NextResponse.json({ error: 'No design data available' }, { status: 404 });
    }

    // Use the first design file as an example
    // In a real implementation, you'd match the template ID to the correct design file
    const designFile = files[0];
    const designFilePath = path.join(designsDir, designFile);
    
    console.log(`📁 Loading design file: ${designFile}`);

    // Read the design file
    const designData = JSON.parse(fs.readFileSync(designFilePath, 'utf8'));
    
    console.log(`✅ Design data loaded successfully for template: ${templateId}`);
    
    return NextResponse.json(designData);

  } catch (error) {
    console.error(`❌ Error loading design data for template:`, error);
    return NextResponse.json(
      { error: 'Failed to load design data' },
      { status: 500 }
    );
  }
}
