import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { flyerType } = await request.json();
    const prompt = `Write 3 catchy flyer headlines for a ${flyerType || 'SALE'} flyer.`;

    // For now, return mock data since OpenAI is not configured
    // TODO: Implement actual OpenAI integration when API key is available
    const mockHeadlines = [
      `Amazing ${flyerType || 'SALE'} - Don't Miss Out!`,
      `Limited Time ${flyerType || 'SALE'} - Act Now!`,
      `Incredible ${flyerType || 'SALE'} - Save Big Today!`
    ];

    return NextResponse.json({ headlines: mockHeadlines });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate headlines' },
      { status: 500 }
    );
  }
}
