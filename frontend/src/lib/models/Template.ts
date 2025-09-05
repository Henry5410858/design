import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  type: string;
  category: string;
  description?: string;
  canvasSize: string;
  dimensions: {
    width: number;
    height: number;
  };
  backgroundColor?: string;
  backgroundImage?: string;
  thumbnail?: string;
  templateKey?: string;
  isRealEstate?: boolean;
  designFilename?: string;
  designfilepath?: string;
  objects?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['square-post', 'story', 'marketplace-flyer', 'fb-feed-banner', 'digital-badge', 'brochure']
  },
  category: {
    type: String,
    required: true,
    enum: ['social-posts', 'stories', 'flyers', 'banners', 'badges', 'documents']
  },
  description: {
    type: String,
    default: ''
  },
  canvasSize: {
    type: String,
    required: true
  },
  dimensions: {
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    }
  },
  backgroundColor: {
    type: String,
    default: '#FFFFFF'
  },
  backgroundImage: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: '/uploads/default-thumbnail.png'
  },
  templateKey: {
    type: String,
    unique: true,
    sparse: true
  },
  isRealEstate: {
    type: Boolean,
    default: false
  },
  designFilename: {
    type: String,
    default: null
  },
  designfilepath: {
    type: String,
    default: null
  },
  objects: {
    type: [Schema.Types.Mixed],
    default: []
  }
}, {
  timestamps: true
});

// Create indexes
TemplateSchema.index({ templateKey: 1 });
TemplateSchema.index({ type: 1 });
TemplateSchema.index({ category: 1 });
TemplateSchema.index({ isRealEstate: 1 });

export default mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
