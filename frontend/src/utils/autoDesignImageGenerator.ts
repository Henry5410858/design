/**
 * Automatic Design Image Generator
 * Generates template design images from Fabric.js JSON data
 */

import * as fabric from 'fabric';

export interface DesignImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'png' | 'jpeg';
  backgroundColor?: string;
}

export interface TemplateDesignData {
  id: string;
  name: string;
  category: string;
  dimensions: string;
  designData: any; // Fabric.js JSON data
}

/**
 * Generate design image from Fabric.js JSON data
 */
export async function generateDesignImage(
  designData: any,
  options: DesignImageOptions = {}
): Promise<string | null> {
  try {
    console.log('🎨 Generating design image from JSON data...');
    
    const {
      width = 400,
      height = 400,
      quality = 0.8,
      format = 'png',
      backgroundColor = '#ffffff'
    } = options;

    // Create a temporary canvas element
    const canvasElement = document.createElement('canvas');
    canvasElement.width = width;
    canvasElement.height = height;
    
    // Create a new canvas
    const canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      backgroundColor
    });

    // Load the design data
    await new Promise<void>((resolve, reject) => {
      canvas.loadFromJSON(designData, () => {
        console.log('✅ Design data loaded successfully');
        resolve();
      });
    });

    // Render the canvas
    canvas.renderAll();

    // Generate image data URL
    const dataURL = canvas.toDataURL({
      format: format,
      quality: quality,
      multiplier: 1
    });

    // Clean up
    canvas.dispose();

    console.log(`✅ Design image generated: ${format.toUpperCase()}, ${width}x${height}`);
    return dataURL;

  } catch (error) {
    console.error('❌ Error generating design image:', error);
    return null;
  }
}

/**
 * Generate design image with proper aspect ratio
 */
export async function generateDesignImageWithAspectRatio(
  designData: any,
  maxWidth: number = 400,
  maxHeight: number = 400
): Promise<string | null> {
  try {
    // First, load the design to get its dimensions
    const tempCanvasElement = document.createElement('canvas');
    tempCanvasElement.width = 1;
    tempCanvasElement.height = 1;
    
    const tempCanvas = new fabric.Canvas(tempCanvasElement, {
      width: 1,
      height: 1
    });

    await new Promise<void>((resolve, reject) => {
      tempCanvas.loadFromJSON(designData, () => {
        resolve();
      });
    });

    // Get the actual dimensions from the loaded design
    const designWidth = tempCanvas.getWidth();
    const designHeight = tempCanvas.getHeight();
    
    console.log(`📐 Design dimensions: ${designWidth}x${designHeight}`);

    // Calculate aspect ratio
    const aspectRatio = designWidth / designHeight;
    
    let targetWidth = maxWidth;
    let targetHeight = maxHeight;

    // Adjust dimensions to maintain aspect ratio
    if (aspectRatio > 1) {
      // Landscape
      targetHeight = maxWidth / aspectRatio;
    } else {
      // Portrait or square
      targetWidth = maxHeight * aspectRatio;
    }

    // Ensure dimensions don't exceed max values
    targetWidth = Math.min(targetWidth, maxWidth);
    targetHeight = Math.min(targetHeight, maxHeight);

    console.log(`🎯 Target dimensions: ${targetWidth}x${targetHeight}`);

    // Clean up temp canvas
    tempCanvas.dispose();

    // Generate image with calculated dimensions
    return await generateDesignImage(designData, {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
      quality: 0.8,
      format: 'png'
    });

  } catch (error) {
    console.error('❌ Error generating design image with aspect ratio:', error);
    return null;
  }
}

/**
 * Generate multiple design images for different sizes
 */
export async function generateDesignImageSet(
  designData: any,
  sizes: { name: string; width: number; height: number }[] = [
    { name: 'thumbnail', width: 200, height: 200 },
    { name: 'preview', width: 400, height: 400 },
    { name: 'large', width: 800, height: 800 }
  ]
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};

  for (const size of sizes) {
    console.log(`🎨 Generating ${size.name} image (${size.width}x${size.height})...`);
    
    const imageData = await generateDesignImageWithAspectRatio(
      designData,
      size.width,
      size.height
    );
    
    results[size.name] = imageData;
  }

  return results;
}

/**
 * Create a template design data object
 */
export function createTemplateDesignData(
  id: string,
  name: string,
  category: string,
  dimensions: string,
  designData: any
): TemplateDesignData {
  return {
    id,
    name,
    category,
    dimensions,
    designData
  };
}

/**
 * Extract dimensions from design data
 */
export function extractDesignDimensions(designData: any): { width: number; height: number } {
  try {
    if (designData.width && designData.height) {
      return {
        width: designData.width,
        height: designData.height
      };
    }

    // If no direct dimensions, calculate from objects
    if (designData.objects && designData.objects.length > 0) {
      let maxWidth = 0;
      let maxHeight = 0;

      designData.objects.forEach((obj: any) => {
        const right = (obj.left || 0) + (obj.width || 0) * (obj.scaleX || 1);
        const bottom = (obj.top || 0) + (obj.height || 0) * (obj.scaleY || 1);
        
        maxWidth = Math.max(maxWidth, right);
        maxHeight = Math.max(maxHeight, bottom);
      });

      return {
        width: maxWidth || 1080,
        height: maxHeight || 1080
      };
    }

    // Default dimensions
    return { width: 1080, height: 1080 };
  } catch (error) {
    console.error('❌ Error extracting design dimensions:', error);
    return { width: 1080, height: 1080 };
  }
}

/**
 * Generate a design image with fallback
 */
export async function generateDesignImageWithFallback(
  designData: any,
  fallbackImageUrl?: string,
  options: DesignImageOptions = {}
): Promise<string> {
  try {
    const generatedImage = await generateDesignImage(designData, options);
    
    if (generatedImage) {
      return generatedImage;
    }

    // If generation fails, return fallback
    if (fallbackImageUrl) {
      console.log('⚠️ Using fallback image');
      return fallbackImageUrl;
    }

    // Create a placeholder image
    return createPlaceholderImage(options.width || 400, options.height || 400);
  } catch (error) {
    console.error('❌ Error in generateDesignImageWithFallback:', error);
    return fallbackImageUrl || createPlaceholderImage(options.width || 400, options.height || 400);
  }
}

/**
 * Create a placeholder image
 */
function createPlaceholderImage(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Diseño', width / 2, height / 2 - 10);
    ctx.fillText('Cargando...', width / 2, height / 2 + 10);
  }
  
  return canvas.toDataURL('image/png');
}
