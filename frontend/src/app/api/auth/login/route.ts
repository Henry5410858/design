import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // In a real implementation, validate the token with your main platform
    // For now, we'll simulate a successful validation
    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    // Mock user data - replace with actual API call to main platform
    const mockUser = {
      id: 'user_123',
      name: 'Usuario Demo',
      email: 'usuario@demo.com',
      plan: 'Premium' as const
    };

    // Generate a proper JWT token for this session
    const sessionToken = jwt.sign(
      { 
        id: mockUser.id, 
        email: mockUser.email, 
        plan: mockUser.plan 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

    return NextResponse.json({
      user: mockUser,
      token: sessionToken,
      expiresAt
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
