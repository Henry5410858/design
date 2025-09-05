import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  plan: 'Free' | 'Premium' | 'Ultra-Premium';
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  plan: {
    type: String,
    enum: ['Free', 'Premium', 'Ultra-Premium'],
    default: 'Free'
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
