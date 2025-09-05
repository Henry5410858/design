import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For development/testing - always return a valid user
    // In production, you would validate the actual JWT token here
    
    const mockUser = {
      id: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId format
      name: 'Usuario Demo',
      email: 'usuario@demo.com',
      plan: 'Premium' as const
    };

    // Return success response immediately
    return NextResponse.json(mockUser);

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
