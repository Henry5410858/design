import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // For now, return a placeholder image
    // In production, this would fetch the actual template thumbnail from your storage
    const placeholderImage = `https://via.placeholder.com/400x300/1f2937/ffffff?text=Template+${id}`;
    
    // Redirect to placeholder image
    return NextResponse.redirect(placeholderImage);
  } catch (error) {
    console.error('Error fetching template thumbnail:', error);
    
    // Return a default placeholder on error
    const defaultImage = `https://via.placeholder.com/400x300/374151/ffffff?text=Template+Not+Found`;
    return NextResponse.redirect(defaultImage);
  }
}
