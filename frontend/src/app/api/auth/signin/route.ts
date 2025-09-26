import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Align with backend user shape to avoid mismatches during fallback
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, default: 'Gratis' }, // Match backend default/enum
  firstName: { type: String },
  lastName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Connect to the SAME DB as the backend
async function connectDB() {
  if (mongoose.connections[0]?.readyState) return;

  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.NEXT_MONGODB_URI ||
    process.env.NEXT_PUBLIC_MONGODB_URI ||
    'mongodb://localhost:27017/design_center';

  try {
    await mongoose.connect(mongoUri, { bufferCommands: false });
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token compatible with backend middleware
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(
      { id: user._id, email: user.email, plan: user.plan },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
