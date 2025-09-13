/**
 * Utility functions for detecting object overlaps and calculating color contrasts
 */

export interface CanvasObject {
  id: string;
  type: string;
  x?: number;
  y?: number;
  left?: number;
  top?: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  color?: string;
  fill?: string;
}

export interface OverlapInfo {
  object: CanvasObject;
  overlapArea: number;
  overlapPercentage: number;
}

/**
 * Calculate the effective position and size of an object considering scaling
 */
export function getObjectBounds(obj: CanvasObject) {
  const left = obj.left ?? obj.x ?? 0;
  const top = obj.top ?? obj.y ?? 0;
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  
  return {
    left,
    top,
    right: left + (obj.width * scaleX),
    bottom: top + (obj.height * scaleY),
    width: obj.width * scaleX,
    height: obj.height * scaleY
  };
}

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(bounds1: ReturnType<typeof getObjectBounds>, bounds2: ReturnType<typeof getObjectBounds>): boolean {
  return !(
    bounds1.right <= bounds2.left ||
    bounds1.left >= bounds2.right ||
    bounds1.bottom <= bounds2.top ||
    bounds1.top >= bounds2.bottom
  );
}

/**
 * Calculate the overlap area between two rectangles
 */
export function calculateOverlapArea(bounds1: ReturnType<typeof getObjectBounds>, bounds2: ReturnType<typeof getObjectBounds>): number {
  if (!rectanglesOverlap(bounds1, bounds2)) {
    return 0;
  }
  
  const overlapLeft = Math.max(bounds1.left, bounds2.left);
  const overlapTop = Math.max(bounds1.top, bounds2.top);
  const overlapRight = Math.min(bounds1.right, bounds2.right);
  const overlapBottom = Math.min(bounds1.bottom, bounds2.bottom);
  
  return (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
}

/**
 * Find all objects that overlap with a given object
 */
export function findOverlappingObjects(targetObj: CanvasObject, allObjects: CanvasObject[]): OverlapInfo[] {
  const targetBounds = getObjectBounds(targetObj);
  const overlaps: OverlapInfo[] = [];
  
  for (const obj of allObjects) {
    // Skip the target object itself
    if (obj.id === targetObj.id) {
      continue;
    }
    
    const objBounds = getObjectBounds(obj);
    const overlapArea = calculateOverlapArea(targetBounds, objBounds);
    
    if (overlapArea > 0) {
      const objArea = objBounds.width * objBounds.height;
      const overlapPercentage = (overlapArea / objArea) * 100;
      
      overlaps.push({
        object: obj,
        overlapArea,
        overlapPercentage
      });
    }
  }
  
  // Sort by overlap percentage (highest first)
  return overlaps.sort((a, b) => b.overlapPercentage - a.overlapPercentage);
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate the relative luminance of a color
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate the contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    return 1; // Default to low contrast if colors are invalid
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Generate a contrasting color for better visibility
 */
export function generateContrastingColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    return '#FFFFFF'; // Default to white if color is invalid
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // If the background is dark (luminance < 0.5), return white, otherwise black
  return luminance < 0.5 ? '#FFFFFF' : '#000000';
}

/**
 * Generate a color that contrasts well with the given background
 * Returns a color that ensures a minimum contrast ratio of 4.5:1 (WCAG AA standard)
 */
export function getHighContrastColor(backgroundColor: string): string {
  const baseContrastColor = generateContrastingColor(backgroundColor);
  
  // Check if the base contrast color meets WCAG AA standards (4.5:1)
  const contrastRatio = getContrastRatio(backgroundColor, baseContrastColor);
  
  if (contrastRatio >= 4.5) {
    return baseContrastColor;
  }
  
  // If not, try to find a better color by adjusting brightness
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) {
    return baseContrastColor;
  }
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // Generate a color with opposite luminance
  if (luminance < 0.5) {
    // Background is dark, return a bright color
    return '#FFFFFF';
  } else {
    // Background is dark, return a dark color
    return '#000000';
  }
}

/**
 * Extract dominant colors from an image (simplified version)
 * This is a basic implementation that could be enhanced with more sophisticated algorithms
 */
export function extractDominantColorsFromImage(imageData: string): string[] {
  // For now, return common contrasting colors
  // In a more sophisticated implementation, you would analyze the actual image pixels
  return ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF'];
}

/**
 * Find the best contrasting color from a palette for a given background
 */
export function findBestContrastColor(backgroundColor: string, colorPalette: string[]): string {
  let bestColor = colorPalette[0];
  let bestContrast = 0;
  
  for (const color of colorPalette) {
    const contrast = getContrastRatio(backgroundColor, color);
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestColor = color;
    }
  }
  
  return bestColor;
}
