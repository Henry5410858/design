/**
 * Utility functions for exporting canvas data without opening the editor
 */

export interface TemplateData {
  _id: string;
  name: string;
  canvasSize?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  backgroundColor?: string;
  designFilename?: string;
  objects?: any[];
}

export interface DesignData {
  designData: {
    objects: any[];
    backgroundColor?: string;
    backgroundImage?: string;
    canvasSize?: string;
  };
}

export interface CanvasExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  multiplier?: number;
}

/**
 * Get template data from the backend
 */
export async function getTemplateData(templateId: string): Promise<TemplateData | null> {
  try {
    const response = await fetch(`http://localhost:4000/api/templates/${templateId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch template ${templateId}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching template data:', error);
    return null;
  }
}

/**
 * Get design data from the backend
 */
export async function getDesignData(designFilename: string): Promise<DesignData | null> {
  try {
    const response = await fetch(`http://localhost:4000/api/templates/design/${designFilename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch design data ${designFilename}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching design data:', error);
    return null;
  }
}

/**
 * Generate canvas image from template and design data
 */
export async function generateCanvasImage(
  template: TemplateData, 
  designData: DesignData | null, 
  options: CanvasExportOptions = { format: 'png', quality: 1, multiplier: 1 }
): Promise<string | null> {
  try {
    // Create a hidden canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas dimensions - prioritize design data canvas size over template dimensions
    let width, height;
    
    if (designData?.designData?.canvasSize) {
      // Use canvas size from design data (most accurate)
      [width, height] = designData.designData.canvasSize.split('x').map(Number);
      console.log(`📏 Using design data canvas size: ${width}x${height}`);
    } else if (template.canvasSize) {
      // Fallback to template canvas size
      [width, height] = template.canvasSize.split('x').map(Number);
      console.log(`📏 Using template canvas size: ${width}x${height}`);
    } else {
      // Last fallback to template dimensions
      width = template.dimensions?.width || 1200;
      height = template.dimensions?.height || 1800;
      console.log(`📏 Using template dimensions: ${width}x${height}`);
    }
    
    // Use exact dimensions without multiplier for accurate size
    const multiplier = 1; // Always use 1:1 scale for accurate dimensions
    canvas.width = width;
    canvas.height = height;
    ctx.scale(multiplier, multiplier);
    
    console.log(`📐 Final canvas dimensions: ${canvas.width}x${canvas.height} (exact size)`);

    // Set background
    const backgroundColor = designData?.designData?.backgroundColor || template.backgroundColor || '#ffffff';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Handle background image if present
    if (designData?.designData?.backgroundImage) {
      try {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          bgImg.onload = () => {
            try {
              // Scale background image to cover canvas
              const scaleX = width / bgImg.width;
              const scaleY = height / bgImg.height;
              const scale = Math.max(scaleX, scaleY);
              
              const scaledWidth = bgImg.width * scale;
              const scaledHeight = bgImg.height * scale;
              const offsetX = (width - scaledWidth) / 2;
              const offsetY = (height - scaledHeight) / 2;
              
              ctx.drawImage(bgImg, offsetX, offsetY, scaledWidth, scaledHeight);
              resolve(true);
            } catch (error) {
              reject(error);
            }
          };
          
          bgImg.onerror = () => {
            console.warn('Failed to load background image');
            resolve(false);
          };
          
          bgImg.src = designData.designData?.backgroundImage || '';
        });
      } catch (error) {
        console.error('Error loading background image:', error);
      }
    }

    // Get objects to render
    let objects = [];
    if (designData && designData.designData && designData.designData.objects) {
      objects = designData.designData.objects;
      console.log(`📊 Using design data objects: ${objects.length} objects`);
      console.log(`📊 First few objects:`, objects.slice(0, 3));
      console.log(`📊 Full design data:`, designData);
    } else if (template.objects && template.objects.length > 0) {
      objects = template.objects;
      console.log(`📊 Using template objects: ${objects.length} objects`);
    } else {
      console.log(`⚠️ No objects found to render`);
      console.log(`📊 Template data:`, template);
      console.log(`📊 Design data:`, designData);
    }

    // Sort objects by z-index or render order
    objects.sort((a, b) => {
      const aZ = a.zIndex || 0;
      const bZ = b.zIndex || 0;
      return aZ - bZ;
    });

    // Render all objects
    console.log(`🎨 Rendering ${objects.length} objects to canvas`);
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      console.log(`  📝 Rendering object ${i + 1}/${objects.length}:`, obj.type, obj);
      
      // Debug specific object types
      if (obj.type === 'i-text' || obj.type === 'text') {
        console.log(`    📄 Text object details:`, {
          text: obj.text,
          fontSize: obj.fontSize,
          fontFamily: obj.fontFamily,
          fill: obj.fill,
          left: obj.left,
          top: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          opacity: obj.opacity
        });
      }
      
      if (obj.type === 'rect') {
        console.log(`    🔲 Rectangle object details:`, {
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          fill: obj.fill,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          opacity: obj.opacity
        });
      }
      
      await renderObjectToCanvas(ctx, obj, width, height);
    }

    // Convert canvas to base64 image
    const mimeType = `image/${options.format}`;
    const quality = options.quality || 1;
    return canvas.toDataURL(mimeType, quality).split(',')[1]; // Remove data:image/png;base64, prefix
  } catch (error) {
    console.error('Error generating canvas image:', error);
    return null;
  }
}

/**
 * Render individual objects to canvas with full Fabric.js support
 */
async function renderObjectToCanvas(
  ctx: CanvasRenderingContext2D, 
  obj: any, 
  canvasWidth: number, 
  canvasHeight: number
): Promise<void> {
  try {
    ctx.save();

    // Apply transformations in correct order
    const left = obj.left || 0;
    const top = obj.top || 0;
    const angle = obj.angle || 0;
    const scaleX = obj.scaleX || 1;
    const scaleY = obj.scaleY || 1;
    const originX = obj.originX || 'left';
    const originY = obj.originY || 'top';

    // Calculate origin offset
    let originOffsetX = 0;
    let originOffsetY = 0;
    
    if (originX === 'center') originOffsetX = (obj.width || 0) / 2;
    else if (originX === 'right') originOffsetX = obj.width || 0;
    
    if (originY === 'center') originOffsetY = (obj.height || 0) / 2;
    else if (originY === 'bottom') originOffsetY = obj.height || 0;

    // Apply transformations
    ctx.translate(left, top);
    ctx.translate(originOffsetX, originOffsetY);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-originOffsetX, -originOffsetY);

    // Set global styles
    if (obj.fill) ctx.fillStyle = obj.fill;
    if (obj.stroke) ctx.strokeStyle = obj.stroke;
    if (obj.strokeWidth) ctx.lineWidth = obj.strokeWidth;
    if (obj.strokeDashArray) ctx.setLineDash(obj.strokeDashArray);
    if (obj.strokeLineCap) ctx.lineCap = obj.strokeLineCap;
    if (obj.strokeLineJoin) ctx.lineJoin = obj.strokeLineJoin;
    if (obj.opacity !== undefined) ctx.globalAlpha = obj.opacity;

    // Render based on object type
    switch (obj.type) {
      case 'rect':
        await renderRect(ctx, obj);
        break;
        
      case 'circle':
        await renderCircle(ctx, obj);
        break;
        
      case 'ellipse':
        await renderEllipse(ctx, obj);
        break;
        
      case 'triangle':
        await renderTriangle(ctx, obj);
        break;
        
      case 'line':
        await renderLine(ctx, obj);
        break;
        
      case 'polygon':
        await renderPolygon(ctx, obj);
        break;
        
      case 'path':
        await renderPath(ctx, obj);
        break;
        
      case 'text':
      case 'i-text':
      case 'textbox':
        await renderText(ctx, obj);
        break;
        
      case 'image':
        await renderImage(ctx, obj);
        break;
        
      case 'group':
        await renderGroup(ctx, obj);
        break;
        
      default:
        console.warn('Unknown object type:', obj.type, obj);
    }

    ctx.restore();
  } catch (error) {
    console.error('Error rendering object:', error, obj);
  }
}

/**
 * Render rectangle with all Fabric.js properties
 */
async function renderRect(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const width = obj.width || 100;
  const height = obj.height || 100;
  const rx = obj.rx || 0;
  const ry = obj.ry || 0;

  ctx.beginPath();
  
  if (rx > 0 || ry > 0) {
    // Rounded rectangle
    ctx.roundRect(0, 0, width, height, [rx, ry, rx, ry]);
  } else {
    // Regular rectangle
    ctx.rect(0, 0, width, height);
  }
  
  if (obj.fill) ctx.fill();
  if (obj.stroke) ctx.stroke();
}

/**
 * Render circle
 */
async function renderCircle(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const radius = obj.radius || 50;
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  
  if (obj.fill) ctx.fill();
  if (obj.stroke) ctx.stroke();
}

/**
 * Render ellipse
 */
async function renderEllipse(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const rx = obj.rx || 50;
  const ry = obj.ry || 30;
  
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
  
  if (obj.fill) ctx.fill();
  if (obj.stroke) ctx.stroke();
}

/**
 * Render triangle
 */
async function renderTriangle(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const width = obj.width || 100;
  const height = obj.height || 100;
  
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width / 2, 0);
  ctx.lineTo(width, height);
  ctx.closePath();
  
  if (obj.fill) ctx.fill();
  if (obj.stroke) ctx.stroke();
}

/**
 * Render line
 */
async function renderLine(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const x1 = obj.x1 || 0;
  const y1 = obj.y1 || 0;
  const x2 = obj.x2 || 100;
  const y2 = obj.y2 || 0;
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  
  if (obj.stroke) ctx.stroke();
}

/**
 * Render polygon
 */
async function renderPolygon(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const points = obj.points || [];
  
  if (points.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  
  ctx.closePath();
  
  if (obj.fill) ctx.fill();
  if (obj.stroke) ctx.stroke();
}

/**
 * Render path (SVG path)
 */
async function renderPath(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const path = obj.path;
  
  if (!path || !Array.isArray(path)) return;
  
  ctx.beginPath();
  
  for (const command of path) {
    if (command[0] === 'M') {
      ctx.moveTo(command[1], command[2]);
    } else if (command[0] === 'L') {
      ctx.lineTo(command[1], command[2]);
    } else if (command[0] === 'C') {
      ctx.bezierCurveTo(command[1], command[2], command[3], command[4], command[5], command[6]);
    } else if (command[0] === 'Q') {
      ctx.quadraticCurveTo(command[1], command[2], command[3], command[4]);
    } else if (command[0] === 'Z') {
      ctx.closePath();
    }
  }
  
  if (obj.fill) ctx.fill();
  if (obj.stroke) ctx.stroke();
}

/**
 * Render text with all Fabric.js text properties
 */
async function renderText(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const text = obj.text || '';
  const fontSize = obj.fontSize || 16;
  const fontFamily = obj.fontFamily || 'Arial';
  const fontWeight = obj.fontWeight || 'normal';
  const fontStyle = obj.fontStyle || 'normal';
  const textAlign = obj.textAlign || 'left';
  const charSpacing = obj.charSpacing || 0;
  const lineHeight = obj.lineHeight || 1.16;
  
  console.log(`    🎨 Rendering text: "${text}" with font: ${fontSize}px ${fontFamily}`);
  
  // Set font
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = textAlign as CanvasTextAlign;
  ctx.textBaseline = 'top';
  
  // Handle text alignment
  let x = 0;
  if (textAlign === 'center') {
    x = (obj.width || 0) / 2;
  } else if (textAlign === 'right') {
    x = obj.width || 0;
  }
  
  // Split text into lines
  const lines = text.split('\n');
  const lineHeightPx = fontSize * lineHeight;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let currentX = x;
    
    // Handle character spacing
    if (charSpacing > 0) {
      for (let j = 0; j < line.length; j++) {
        ctx.fillText(line[j], currentX, i * lineHeightPx);
        currentX += ctx.measureText(line[j]).width + charSpacing;
      }
    } else {
      ctx.fillText(line, currentX, i * lineHeightPx);
    }
  }
  
  // Draw stroke if present
  if (obj.stroke) {
    ctx.strokeStyle = obj.stroke;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let currentX = x;
      
      if (charSpacing > 0) {
        for (let j = 0; j < line.length; j++) {
          ctx.strokeText(line[j], currentX, i * lineHeightPx);
          currentX += ctx.measureText(line[j]).width + charSpacing;
        }
      } else {
        ctx.strokeText(line, currentX, i * lineHeightPx);
      }
    }
  }
}

/**
 * Render image with all Fabric.js image properties
 */
async function renderImage(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const src = obj.src;
  
  if (!src) return;
  
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const width = obj.width || img.width;
          const height = obj.height || img.height;
          
          // Handle image filters (basic implementation)
          if (obj.filters && obj.filters.length > 0) {
            // For now, just draw the image
            // In a full implementation, you'd apply filters here
            ctx.drawImage(img, 0, 0, width, height);
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        console.warn('Failed to load image:', src);
        resolve(false);
      };
      
      img.src = src;
    });
  } catch (error) {
    console.error('Error rendering image:', error);
  }
}

/**
 * Render group (recursively render all objects in the group)
 */
async function renderGroup(ctx: CanvasRenderingContext2D, obj: any): Promise<void> {
  const objects = obj.objects || [];
  
  for (const childObj of objects) {
    await renderObjectToCanvas(ctx, childObj, 0, 0);
  }
}

/**
 * Export template as image without opening editor
 */
export async function exportTemplateAsImage(
  templateId: string, 
  options: CanvasExportOptions = { format: 'png', quality: 1, multiplier: 1 }
): Promise<string | null> {
  try {
    console.log(`🔍 Starting export for template: ${templateId}`);
    
    // Get template data
    const template = await getTemplateData(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    console.log(`📋 Template data loaded:`, template);

    // Get design data if available
    let designData = null;
    if (template.designFilename) {
      console.log(`📁 Loading design data from: ${template.designFilename}`);
      designData = await getDesignData(template.designFilename);
      console.log(`📁 Design data loaded:`, designData);
    } else {
      console.log(`⚠️ No designFilename found in template data`);
      // Try to load design data using template ID as filename
      const designFilename = `${templateId}.json`;
      console.log(`🔄 Trying to load design data from: ${designFilename}`);
      designData = await getDesignData(designFilename);
      console.log(`🔄 Design data loaded with template ID:`, designData);
    }

    // Generate canvas image
    return await generateCanvasImage(template, designData, options);
  } catch (error) {
    console.error('Error exporting template as image:', error);
    return null;
  }
}

/**
 * Export multiple templates as images
 */
export async function exportMultipleTemplatesAsImages(
  templateIds: string[], 
  options: CanvasExportOptions = { format: 'png', quality: 1, multiplier: 1 }
): Promise<{ [templateId: string]: string | null }> {
  const results: { [templateId: string]: string | null } = {};
  
  // Process templates in parallel for better performance
  const promises = templateIds.map(async (templateId) => {
    const imageData = await exportTemplateAsImage(templateId, options);
    results[templateId] = imageData;
  });

  await Promise.all(promises);
  return results;
}
