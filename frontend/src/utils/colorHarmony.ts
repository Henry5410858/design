/**
 * Color Harmony and Overlap Detection Utilities
 * Manages real-time color adjustment for objects overlapping with logo
 */

import { 
  calculateDeltaE, 
  areColorsTooSimilar, 
  generateHarmoniousColor,
  generateHighContrastColor,
  generateContrastingColor,
  COLOR_THRESHOLDS,
  type RGB,
  type HSL,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToHex
} from './colorScience';

export interface ColorState {
  originalColor: string;
  currentColor: string;
  isOverlapping: boolean;
  deltaE: number;
  harmonyType: 'complementary' | 'triadic' | 'analogous' | 'contrast' | null;
}

export interface OverlapObject {
  id: string;
  fabricObject: any;
  colorState: ColorState;
}

/**
 * Detect objects overlapping with logo using geometric collision detection
 */
export function detectOverlappingObjects(logoObject: any, allObjects: any[]): any[] {
  if (!logoObject || !allObjects) return [];

  const logoBounds = logoObject.getBoundingRect();
  const overlappingObjects: any[] = [];

  allObjects.forEach(obj => {
    // Skip the logo itself and background objects
    if (obj === logoObject || (obj as any).isBackground || (obj as any).isLogo) {
      return;
    }

    const objBounds = obj.getBoundingRect();
    
    // Check for overlap using bounding rectangles
    if (isOverlapping(logoBounds, objBounds)) {
      overlappingObjects.push(obj);
    }
  });

  return overlappingObjects;
}

/**
 * Check if two bounding rectangles overlap
 */
function isOverlapping(rect1: any, rect2: any): boolean {
  return !(
    rect1.left > rect2.left + rect2.width ||
    rect2.left > rect1.left + rect1.width ||
    rect1.top > rect2.top + rect2.height ||
    rect2.top > rect1.top + rect1.height
  );
}

/**
 * Initialize original color state for an object when it's first loaded
 * This preserves the original color from the saved JSON data
 */
export function initializeObjectColorState(fabricObject: any, originalData?: any): void {
  if (!fabricObject) return;
  
  // If object already has color state, don't overwrite it
  if (fabricObject.colorState) return;
  
  // Get original color from saved data if available, otherwise from current object
  let originalColor = '#000000';
  
  if (originalData) {
    // Use color from saved JSON data (most accurate)
    originalColor = originalData.fill || originalData.color || originalData.stroke || '#000000';
  } else {
    // Fallback to current object color
    const colorProperties = ['fill', 'color', 'stroke'];
    for (const prop of colorProperties) {
      const color = fabricObject[prop];
      if (color && color !== 'transparent' && color !== 'rgba(0,0,0,0)') {
        originalColor = normalizeColor(color);
        break;
      }
    }
  }
  
  // Initialize color state with original color from saved data
  fabricObject.colorState = {
    originalColor: normalizeColor(originalColor),
    currentColor: normalizeColor(originalColor),
    isOverlapping: false,
    deltaE: 0,
    harmonyType: null
  };
  
  console.log(`🎨 Initialized color state for object: original=${originalColor}, current=${fabricObject.colorState.currentColor}`);
}

/**
 * Extract color from Fabric.js object
 */
export function extractObjectColor(fabricObject: any): string {
  // Try different color properties in order of importance
  const colorProperties = ['fill', 'color', 'stroke', 'backgroundColor', 'textBackgroundColor'];
  
  for (const prop of colorProperties) {
    const color = fabricObject[prop];
    if (color && color !== 'transparent' && color !== 'rgba(0,0,0,0)') {
      const normalizedColor = normalizeColor(color);
      // Skip very dark or very light colors that might not be the main color
      const rgb = hexToRgb(normalizedColor);
      if (rgb) {
        const hsl = rgbToHsl(rgb);
        // Only use colors with reasonable saturation (not too gray)
        if (hsl.s > 0.1) {
          return normalizedColor;
        }
      }
    }
  }
  
  // Default fallback color
  return '#000000';
}

/**
 * Normalize color to hex format
 */
function normalizeColor(color: string): string {
  // If already hex, return as is
  if (color.startsWith('#')) {
    return color;
  }
  
  // Convert rgb/rgba to hex
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0]);
      const g = parseInt(matches[1]);
      const b = parseInt(matches[2]);
      return rgbToHex({ r, g, b });
    }
  }
  
  // Convert named colors (simplified)
  const namedColors: { [key: string]: string } = {
    'red': '#FF0000',
    'green': '#008000',
    'blue': '#0000FF',
    'white': '#FFFFFF',
    'black': '#000000',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'gray': '#808080',
    'grey': '#808080'
  };
  
  return namedColors[color.toLowerCase()] || '#000000';
}

/**
 * Extract dominant color from logo (for images and text)
 */
export async function extractLogoColor(logoObject: any): Promise<string> {
  // For text objects (like "LupaProp"), try to extract the text color
  if (logoObject.type === 'text' || logoObject.type === 'i-text') {
    const textColor = logoObject.fill || logoObject.color;
    if (textColor && textColor !== 'transparent') {
      console.log(`📝 Extracted text color from logo: ${normalizeColor(textColor)}`);
      return normalizeColor(textColor);
    }
  }
  
  // For group objects (like logo with background circle), try to find the most prominent color
  if (logoObject.type === 'group') {
    const objects = logoObject.getObjects ? logoObject.getObjects() : [];
    for (const obj of objects) {
      if (obj.type === 'text' || obj.type === 'i-text') {
        const textColor = obj.fill || obj.color;
        if (textColor && textColor !== 'transparent') {
          console.log(`📝 Extracted text color from grouped logo: ${normalizeColor(textColor)}`);
          return normalizeColor(textColor);
        }
      }
    }
  }
  
  // If logo has a solid color, use that
  const solidColor = extractObjectColor(logoObject);
  if (solidColor !== '#000000' || !logoObject.src) {
    return solidColor;
  }
  
  // For image logos, try to extract dominant color
  try {
    const { getDominantColorFromImage } = await import('./colorScience');
    return await getDominantColorFromImage(logoObject.src);
  } catch (error) {
    console.warn('Failed to extract logo color from image:', error);
    return solidColor;
  }
}

/**
 * Analyze color harmony between logo and overlapping objects
 */
export async function analyzeColorHarmony(logoObject: any, overlappingObjects: any[]): Promise<OverlapObject[]> {
  const logoColor = await extractLogoColor(logoObject);
  const results: OverlapObject[] = [];

  for (const obj of overlappingObjects) {
    const objectColor = extractObjectColor(obj);
    const deltaE = calculateDeltaE(logoColor, objectColor);
    
    // Initialize color state if not exists (should have been done when object was loaded)
    if (!obj.colorState) {
      console.warn('⚠️ Object missing color state - initializing with current color');
      obj.colorState = {
        originalColor: objectColor, // Fallback to current color
        currentColor: objectColor,
        isOverlapping: false,
        deltaE: 0,
        harmonyType: null
      };
    }

    const colorState: ColorState = {
      originalColor: obj.colorState.originalColor, // Use original color from saved JSON
      currentColor: obj.colorState.currentColor,
      isOverlapping: true,
      deltaE: deltaE,
      harmonyType: null
    };

    // Check if colors are too similar (need better distinction)
    if (areColorsTooSimilar(logoColor, objectColor, COLOR_THRESHOLDS.JUST_NOTICEABLE)) {
      console.log(`🎨 Colors need better distinction (ΔE: ${deltaE.toFixed(2)} < ${COLOR_THRESHOLDS.JUST_NOTICEABLE}): Logo(${logoColor}) vs Object(${objectColor})`);
      
      // Use high-contrast color for better logo visibility
      const harmoniousColor = generateHighContrastColor(logoColor, objectColor);
      colorState.currentColor = harmoniousColor;
      colorState.harmonyType = 'contrast';
      
      // Apply the new color to the object
      applyColorToObject(obj, harmoniousColor);
      
      console.log(`✨ Applied high-contrast color: ${harmoniousColor} (ΔE: ${calculateDeltaE(logoColor, harmoniousColor).toFixed(2)})`);
    }

    obj.colorState = colorState;
    results.push({
      id: obj.id || Math.random().toString(),
      fabricObject: obj,
      colorState: colorState
    });
  }

  return results;
}

/**
 * Apply color to Fabric.js object
 */
function applyColorToObject(fabricObject: any, color: string): void {
  // Try to apply color to the most appropriate property
  const colorProperties = ['fill', 'color', 'stroke'];
  
  for (const prop of colorProperties) {
    if (fabricObject[prop] !== undefined) {
      fabricObject.set(prop, color);
      break;
    }
  }
}

/**
 * Restore original colors for objects that are no longer overlapping
 */
export function restoreOriginalColors(allObjects: any[], currentlyOverlapping: any[]): void {
  const overlappingIds = new Set(currentlyOverlapping.map(obj => obj.id || obj));

  allObjects.forEach(obj => {
    if (obj.colorState && obj.colorState.isOverlapping && !overlappingIds.has(obj.id || obj)) {
      // Restore original color
      obj.colorState.isOverlapping = false;
      obj.colorState.currentColor = obj.colorState.originalColor;
      obj.colorState.harmonyType = null;
      
      // Apply original color
      applyColorToObject(obj, obj.colorState.originalColor);
      
      console.log(`🔄 Restored original color for object: ${obj.colorState.originalColor}`);
    }
  });
}

/**
 * Real-time color harmony manager
 */
export class ColorHarmonyManager {
  private canvas: any;
  private logoObject: any;
  private isActive: boolean = false;
  private lastOverlappingObjects: any[] = [];

  constructor(canvas: any) {
    this.canvas = canvas;
  }

  /**
   * Set the logo object to monitor
   */
  setLogoObject(logoObject: any): void {
    this.logoObject = logoObject;
  }

  /**
   * Start real-time color harmony monitoring
   */
  startMonitoring(): void {
    this.isActive = true;
    this.monitorLogoMovement();
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    this.isActive = false;
    this.restoreAllOriginalColors();
  }

  /**
   * Monitor logo movement and update colors in real-time
   */
  private monitorLogoMovement(): void {
    if (!this.isActive || !this.logoObject) return;

    try {
      const overlappingObjects = detectOverlappingObjects(this.logoObject, this.canvas.getObjects());
      console.log("🎨 Overlapping objects detected:", overlappingObjects.length);
      
      // Restore colors for objects that are no longer overlapping
      restoreOriginalColors(this.canvas.getObjects(), overlappingObjects);
      
      // Analyze and adjust colors for currently overlapping objects
      if (overlappingObjects.length > 0) {
        analyzeColorHarmony(this.logoObject, overlappingObjects).then(() => {
          this.lastOverlappingObjects = overlappingObjects;
          this.canvas.renderAll();
        }).catch(error => {
          console.error('❌ Error in color harmony analysis:', error);
        });
      } else {
        this.lastOverlappingObjects = [];
        this.canvas.renderAll();
      }
    } catch (error) {
      console.error('❌ Error in color harmony monitoring:', error);
    }

    // Continue monitoring with a small delay to prevent excessive CPU usage
    setTimeout(() => this.monitorLogoMovement(), 100);
  }

  /**
   * Restore all objects to their original colors
   */
  private restoreAllOriginalColors(): void {
    this.canvas.getObjects().forEach((obj: any) => {
      if (obj.colorState && obj.colorState.isOverlapping) {
        obj.colorState.isOverlapping = false;
        obj.colorState.currentColor = obj.colorState.originalColor;
        obj.colorState.harmonyType = null;
        applyColorToObject(obj, obj.colorState.originalColor);
      }
    });
    this.canvas.renderAll();
  }

  /**
   * Get current color harmony status
   */
  getStatus(): { 
    isActive: boolean; 
    logoColor: string; 
    overlappingCount: number;
    adjustedObjects: string[];
  } {
    const overlappingObjects = this.logoObject ? 
      detectOverlappingObjects(this.logoObject, this.canvas.getObjects()) : [];
    
    const adjustedObjects = this.canvas.getObjects()
      .filter((obj: any) => obj.colorState && obj.colorState.isOverlapping)
      .map((obj: any) => obj.id || 'unknown');

    return {
      isActive: this.isActive,
      logoColor: this.logoObject ? extractObjectColor(this.logoObject) : '#000000',
      overlappingCount: overlappingObjects.length,
      adjustedObjects: adjustedObjects
    };
  }
}
