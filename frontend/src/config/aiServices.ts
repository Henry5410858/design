/**
 * AI Services Configuration
 * Configure your API keys here for AI image enhancement and text generation
 */

export const AI_SERVICES_CONFIG = {
  // Cloudinary AI Configuration
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo',
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || 'demo',
    apiSecret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET || 'demo'
  },
  
  // Clipdrop API Configuration
  clipdrop: {
    apiKey: process.env.NEXT_PUBLIC_CLIPDROP_API_KEY || 'demo'
  },
  
  // Let's Enhance API Configuration
  letsenhance: {
    apiKey: process.env.NEXT_PUBLIC_LETSENHANCE_API_KEY || 'demo'
  },
  
  // OpenAI Configuration (for Phase 3)
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'demo'
  }
};

export const AI_FEATURES = {
  // Enable/disable AI features
  imageEnhancement: true,
  textGeneration: false, // Will be enabled in Phase 3
  
  // Default service preferences
  defaultImageEnhancementService: 'cloudinary' as 'cloudinary' | 'clipdrop' | 'letsenhance',
  
  // Feature flags
  enableQuickEnhancements: true,
  enableAdvancedOptions: true,
  enableUpscaling: true
};

export const ENHANCEMENT_PRESETS = {
  // Quick enhancement presets
  lighting: {
    name: 'Mejora de Iluminación',
    options: { lighting: 'enhance' as const },
    icon: '☀️'
  },
  sharpness: {
    name: 'Mejora de Nitidez',
    options: { sharpness: 'enhance' as const },
    icon: '⚡'
  },
  color: {
    name: 'Corrección de Color',
    options: { colorCorrection: 'enhance' as const },
    icon: '🎨'
  },
  full: {
    name: 'Mejora Completa',
    options: {
      lighting: 'enhance' as const,
      sharpness: 'enhance' as const,
      colorCorrection: 'enhance' as const,
      upscale: true
    },
    icon: '✨'
  },
  // New aggressive enhancement preset
  aggressive: {
    name: 'Mejora Agresiva',
    options: {
      lighting: 'brighten' as const,
      sharpness: 'enhance' as const,
      colorCorrection: 'vibrant' as const,
      upscale: false
    },
    icon: '🔥'
  }
};

export const SERVICE_INFO = {
  cloudinary: {
    name: 'Cloudinary AI',
    description: 'Mejoras rápidas y automáticas',
    pricing: 'Freemium',
    features: ['Mejora automática', 'Optimización', 'CDN global']
  },
  clipdrop: {
    name: 'Clipdrop',
    description: 'IA avanzada para imágenes',
    pricing: 'Por uso',
    features: ['Upscaling', 'Mejoras profesionales', 'API rápida']
  },
  letsenhance: {
    name: 'Let\'s Enhance',
    description: 'Especializado en upscaling',
    pricing: 'Por crédito',
    features: ['Upscaling 2x-8x', 'IA especializada', 'Alta calidad']
  }
};
