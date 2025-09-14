/**
 * AI Image Enhancement Utilities
 * Supports multiple AI services: Cloudinary AI, Clipdrop, Let's Enhance
 */

export interface EnhancementOptions {
  lighting?: 'enhance' | 'brighten' | 'dim';
  sharpness?: 'enhance' | 'soften' | 'none';
  colorCorrection?: 'enhance' | 'vibrant' | 'natural';
  upscale?: boolean;
  service?: 'cloudinary' | 'clipdrop' | 'letsenhance';
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
      const startTime = Date.now();
      
      // Build Cloudinary transformation URL
      const transformations = this.buildCloudinaryTransformations(options);
      const enhancedUrl = `https://res.cloudinary.com/${this.cloudName}/image/fetch/${transformations}/${imageUrl}`;
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        enhancedImageUrl: enhancedUrl,
        service: 'cloudinary',
        processingTime
      };
    } catch (error) {
      return {
        success: false,
        error: `Cloudinary enhancement failed: ${error}`,
        service: 'cloudinary'
      };
    }
  }

  private buildCloudinaryTransformations(options: EnhancementOptions): string {
    const transforms: string[] = [];
    
    // Lighting adjustments
    if (options.lighting === 'enhance') {
      transforms.push('e_auto_brightness');
    } else if (options.lighting === 'brighten') {
      transforms.push('e_brightness:20');
    } else if (options.lighting === 'dim') {
      transforms.push('e_brightness:-20');
    }
    
    // Sharpness adjustments
    if (options.sharpness === 'enhance') {
      transforms.push('e_sharpen:100');
    } else if (options.sharpness === 'soften') {
      transforms.push('e_blur:300');
    }
    
    // Color correction
    if (options.colorCorrection === 'enhance') {
      transforms.push('e_auto_color');
    } else if (options.colorCorrection === 'vibrant') {
      transforms.push('e_saturation:50');
    }
    
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
