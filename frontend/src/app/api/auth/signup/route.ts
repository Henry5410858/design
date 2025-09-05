import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password, firstName, lastName, company, phone } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company,
      phone
    });
    
    await user.save();
    
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
      message: 'User created successfully',
      user: userData
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
