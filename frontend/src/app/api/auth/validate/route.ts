import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data without password
    const userData = {
      id: user._id,
      email: user.email,
      plan: user.plan,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      phone: user.phone
    };
    
    return NextResponse.json({
      valid: true,
      user: userData
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}