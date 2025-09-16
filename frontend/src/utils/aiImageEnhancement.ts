/**
 * AI Image Enhancement Utilities
 * Supports multiple AI services: Cloudinary AI, Clipdrop, Let's Enhance
 */

export interface EnhancementOptions {
  // Legacy options for backward compatibility
  lighting?: 'enhance' | 'brighten' | 'dim';
  sharpness?: 'enhance' | 'soften' | 'none';
  colorCorrection?: 'enhance' | 'vibrant' | 'natural';
  upscale?: boolean;
  service?: 'cloudinary' | 'clipdrop' | 'letsenhance';
  
  // Detailed Cloudinary AI controls
  brightness?: number;        // -100 to 100
  contrast?: number;          // -100 to 100
  exposure?: number;          // -100 to 100
  saturation?: number;        // -100 to 200
  vibrance?: number;          // -100 to 200
  hue?: number;              // -180 to 180
  gamma?: number;            // 0.1 to 3.0
  sharpen?: number;          // 0 to 2000
  unsharpMask?: string;      // "radius,amount,threshold"
  clarity?: number;          // -100 to 100
  noiseReduction?: number;   // 0 to 100
  whiteBalance?: 'auto' | 'as_shot' | 'daylight' | 'cloudy' | 'shade' | 'tungsten' | 'fluorescent' | 'flash';
  dynamicRange?: 'auto' | 'high' | 'normal';
  faceDetection?: boolean;
  autoColor?: boolean;
  autoContrast?: boolean;
  autoBrightness?: boolean;
  autoLevel?: boolean;
  improve?: boolean;
  enhance?: boolean;
}

export interface EnhancementResult {
  success: boolean;
  enhancedImageUrl?: string;
  error?: string;
  service?: string;
  processingTime?: number;
}

/**
 * Cloudinary AI Image Enhancement
 */
export class CloudinaryAIEnhancer {
  private cloudName: string;
  private apiKey: string;

  constructor(cloudName: string, apiKey: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
  }

  async enhanceImage(imageUrl: string, options: EnhancementOptions): Promise<EnhancementResult> {
    try {
      console.log('🔧 CloudinaryAIEnhancer.enhanceImage called with:');
      console.log('  - imageUrl:', imageUrl);
      console.log('  - options:', options);
      console.log('  - cloudName:', this.cloudName);
      console.log('  - apiKey:', this.apiKey ? '***' : 'MISSING');
      
      const startTime = Date.now();
      
      // Build Cloudinary transformation URL
      const transformations = this.buildCloudinaryTransformations(options);
      const enhancedUrl = `https://res.cloudinary.com/${this.cloudName}/image/fetch/${transformations}/${imageUrl}`;
      
      console.log('🔧 Cloudinary transformations:', transformations);
      console.log('🌐 Enhanced URL:', enhancedUrl);
      
      // Test if the URL is accessible
      try {
        const testResponse = await fetch(enhancedUrl, { method: 'HEAD' });
        console.log('🔍 URL accessibility test:', testResponse.status, testResponse.statusText);
      } catch (urlError) {
        console.warn('⚠️ URL accessibility test failed:', urlError);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        enhancedImageUrl: enhancedUrl,
        service: 'cloudinary',
        processingTime
      };
    } catch (error) {
      console.error('❌ Cloudinary enhancement error:', error);
      return {
        success: false,
        error: `Cloudinary enhancement failed: ${error}`,
        service: 'cloudinary'
      };
    }
  }

  private buildCloudinaryTransformations(options: EnhancementOptions): string {
    const transforms: string[] = [];
    
    // Legacy support - if detailed options are not provided, use legacy logic
    if (options.brightness === undefined && options.lighting) {
      // DRAMATIC lighting adjustments - very aggressive brightness
      if (options.lighting === 'enhance') {
        transforms.push('e_auto_brightness');
        transforms.push('e_brightness:60');
        transforms.push('e_contrast:40');
        transforms.push('e_gamma:1.2');
      } else if (options.lighting === 'brighten') {
        transforms.push('e_brightness:80');
        transforms.push('e_contrast:30');
        transforms.push('e_gamma:1.3');
      } else if (options.lighting === 'dim') {
        transforms.push('e_brightness:-20');
      }
    } else {
      // Detailed controls
      if (options.brightness !== undefined) {
        transforms.push(`e_brightness:${options.brightness}`);
      }
      if (options.contrast !== undefined) {
        transforms.push(`e_contrast:${options.contrast}`);
      }
      if (options.exposure !== undefined) {
        transforms.push(`e_exposure:${options.exposure}`);
      }
      if (options.gamma !== undefined) {
        transforms.push(`e_gamma:${options.gamma}`);
      }
    }
    
    // Legacy sharpness support
    if (options.sharpen === undefined && options.sharpness) {
      if (options.sharpness === 'enhance') {
        transforms.push('e_sharpen:400');
        transforms.push('e_unsharp_mask:1.0,2.0,1.0');
        transforms.push('e_improve');
        transforms.push('e_enhance');
      } else if (options.sharpness === 'soften') {
        transforms.push('e_blur:300');
      }
    } else {
      // Detailed sharpness controls
      if (options.sharpen !== undefined) {
        transforms.push(`e_sharpen:${options.sharpen}`);
      }
      if (options.unsharpMask !== undefined) {
        transforms.push(`e_unsharp_mask:${options.unsharpMask}`);
      }
      if (options.clarity !== undefined) {
        transforms.push(`e_clarity:${options.clarity}`);
      }
      if (options.noiseReduction !== undefined) {
        transforms.push(`e_noise_reduction:${options.noiseReduction}`);
      }
    }
    
    // Legacy color correction support
    if (options.saturation === undefined && options.colorCorrection) {
      if (options.colorCorrection === 'enhance') {
        transforms.push('e_auto_color');
        transforms.push('e_saturation:150');
        transforms.push('e_vibrance:80');
        transforms.push('e_auto_contrast');
        transforms.push('e_auto_color');
      } else if (options.colorCorrection === 'vibrant') {
        transforms.push('e_saturation:200');
        transforms.push('e_vibrance:120');
      }
    } else {
      // Detailed color controls
      if (options.saturation !== undefined) {
        transforms.push(`e_saturation:${options.saturation}`);
      }
      if (options.vibrance !== undefined) {
        transforms.push(`e_vibrance:${options.vibrance}`);
      }
      if (options.hue !== undefined) {
        transforms.push(`e_hue:${options.hue}`);
      }
    }
    
    // White balance
    if (options.whiteBalance) {
      transforms.push(`e_white_balance:${options.whiteBalance}`);
    }
    
    // Dynamic range
    if (options.dynamicRange) {
      transforms.push(`e_dynamic_range:${options.dynamicRange}`);
    }
    
    // Face detection
    if (options.faceDetection) {
      transforms.push('e_face_detection:true');
    }
    
    // Auto corrections
    if (options.autoColor) {
      transforms.push('e_auto_color');
    }
    if (options.autoContrast) {
      transforms.push('e_auto_contrast');
    }
    if (options.autoBrightness) {
      transforms.push('e_auto_brightness');
    }
    if (options.autoLevel) {
      transforms.push('e_auto_level');
    }
    if (options.improve) {
      transforms.push('e_improve');
    }
    if (options.enhance) {
      transforms.push('e_enhance');
    }
    
    // Quality improvements
    transforms.push('q_auto:best');
    transforms.push('f_auto');
    
    // Upscaling
    if (options.upscale) {
      transforms.push('e_scale:2');
    }
    
    return transforms.join(',');
  }
}

/**
 * Clipdrop AI Image Enhancement
 */
export class ClipdropEnhancer {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enhanceImage(imageUrl: string, options: EnhancementOptions): Promise<EnhancementResult> {
    try {
      const startTime = Date.now();
      
      // Convert image URL to blob
      const imageBlob = await this.urlToBlob(imageUrl);
      
      // Prepare form data
      const formData = new FormData();
      formData.append('image_file', imageBlob);
      
      // Add enhancement parameters
      if (options.lighting === 'enhance') {
        formData.append('lighting', 'enhance');
      }
      if (options.sharpness === 'enhance') {
        formData.append('sharpness', 'enhance');
      }
      if (options.colorCorrection === 'enhance') {
        formData.append('color_correction', 'enhance');
      }
      
      // Call Clipdrop API
      const response = await fetch('https://clipdrop-api.co/image-upscaling/v1', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Clipdrop API error: ${response.statusText}`);
      }
      
      const result = await response.blob();
      const enhancedImageUrl = URL.createObjectURL(result);
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        enhancedImageUrl,
        service: 'clipdrop',
        processingTime
      };
    } catch (error) {
      return {
        success: false,
        error: `Clipdrop enhancement failed: ${error}`,
        service: 'clipdrop'
      };
    }
  }

  private async urlToBlob(url: string): Promise<Blob> {
    const response = await fetch(url);
    return response.blob();
  }
}

/**
 * Let's Enhance AI Image Enhancement
 */
export class LetsEnhanceEnhancer {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enhanceImage(imageUrl: string, options: EnhancementOptions): Promise<EnhancementResult> {
    try {
      const startTime = Date.now();
      
      // Convert image URL to base64
      const imageBase64 = await this.urlToBase64(imageUrl);
      
      // Prepare request
      const requestBody = {
        image: imageBase64,
        upscale: options.upscale ? 2 : 1,
        enhance: true,
        // Add enhancement options
        ...options
      };
      
      // Call Let's Enhance API
      const response = await fetch('https://api.letsenhance.ai/v1/enhance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Let's Enhance API error: ${response.statusText}`);
      }
      
      const result = await response.json();
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        enhancedImageUrl: result.enhanced_image_url,
        service: 'letsenhance',
        processingTime
      };
    } catch (error) {
      return {
        success: false,
        error: `Let's Enhance failed: ${error}`,
        service: 'letsenhance'
      };
    }
  }

  private async urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * Main AI Image Enhancement Manager
 */
export class AIImageEnhancementManager {
  private cloudinaryEnhancer?: CloudinaryAIEnhancer;
  private clipdropEnhancer?: ClipdropEnhancer;
  private letsEnhanceEnhancer?: LetsEnhanceEnhancer;
  private defaultService: 'cloudinary' | 'clipdrop' | 'letsenhance' = 'cloudinary';

  constructor(config?: {
    cloudinary?: { cloudName: string; apiKey: string };
    clipdrop?: { apiKey: string };
    letsenhance?: { apiKey: string };
    defaultService?: 'cloudinary' | 'clipdrop' | 'letsenhance';
  }) {
    if (config?.cloudinary) {
      this.cloudinaryEnhancer = new CloudinaryAIEnhancer(
        config.cloudinary.cloudName,
        config.cloudinary.apiKey
      );
    }
    
    if (config?.clipdrop) {
      this.clipdropEnhancer = new ClipdropEnhancer(config.clipdrop.apiKey);
    }
    
    if (config?.letsenhance) {
      this.letsEnhanceEnhancer = new LetsEnhanceEnhancer(config.letsenhance.apiKey);
    }
    
    if (config?.defaultService) {
      this.defaultService = config.defaultService;
    }
  }

  async enhanceImage(imageUrl: string, options: EnhancementOptions = {}): Promise<EnhancementResult> {
    const service = options.service || this.defaultService;
    
    switch (service) {
      case 'cloudinary':
        if (!this.cloudinaryEnhancer) {
          return { success: false, error: 'Cloudinary enhancer not configured' };
        }
        return this.cloudinaryEnhancer.enhanceImage(imageUrl, options);
        
      case 'clipdrop':
        if (!this.clipdropEnhancer) {
          return { success: false, error: 'Clipdrop enhancer not configured' };
        }
        return this.clipdropEnhancer.enhanceImage(imageUrl, options);
        
      case 'letsenhance':
        if (!this.letsEnhanceEnhancer) {
          return { success: false, error: 'Let\'s Enhance not configured' };
        }
        return this.letsEnhanceEnhancer.enhanceImage(imageUrl, options);
        
      default:
        return { success: false, error: `Unknown service: ${service}` };
    }
  }

  // Quick enhancement presets
  async quickLightingFix(imageUrl: string): Promise<EnhancementResult> {
    return this.enhanceImage(imageUrl, { lighting: 'enhance' });
  }

  async quickSharpnessFix(imageUrl: string): Promise<EnhancementResult> {
    return this.enhanceImage(imageUrl, { sharpness: 'enhance' });
  }

  async quickColorFix(imageUrl: string): Promise<EnhancementResult> {
    return this.enhanceImage(imageUrl, { colorCorrection: 'enhance' });
  }

  async fullEnhancement(imageUrl: string): Promise<EnhancementResult> {
    return this.enhanceImage(imageUrl, {
      lighting: 'enhance',
      sharpness: 'enhance',
      colorCorrection: 'enhance',
      upscale: true
    });
  }
}

// Export default instance
export const aiImageEnhancer = new AIImageEnhancementManager();
