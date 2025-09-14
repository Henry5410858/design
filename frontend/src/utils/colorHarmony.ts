/**
 * Color Harmony and Overlap Detection Utilities
 * Manages real-time color adjustment for objects overlapping with logo
 */

import { 
  calculateDeltaE, 
  areColorsTooSimilar, 
  generateHarmoniousColor,
  generateHighContrastColor,
  generateBeautifulColor,
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
  harmonyType: 'complementary' | 'triadic' | 'analogous' | 'contrast' | 'black_contrast' | 'beautiful' | null;
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
  if (!logoObject || !allObjects) {
    console.log("⚠️ detectOverlappingObjects: Missing logo or objects", {
      hasLogo: !!logoObject,
      objectCount: allObjects?.length || 0
    });
    return [];
  }

  const logoBounds = logoObject.getBoundingRect();
  console.log("🎯 Logo bounds:", logoBounds);
  
  const overlappingObjects: any[] = [];

  allObjects.forEach(obj => {
    // Skip the logo itself and background objects
    if (obj === logoObject || (obj as any).isBackground || (obj as any).isLogo) {
      console.log("⏭️ Skipping object (logo/background):", {
        type: obj.type,
        id: obj.id,
        isLogo: (obj as any).isLogo,
        isBackground: (obj as any).isBackground,
        isSameAsLogo: obj === logoObject
      });
      return;
    }

    const objBounds = obj.getBoundingRect();
    
    // Enhanced debugging for overlap calculation
    const overlapResult = isOverlapping(logoBounds, objBounds);
    const debugInfo = {
      type: obj.type,
      id: obj.id,
      logoBounds: {
        left: logoBounds.left,
        top: logoBounds.top,
        width: logoBounds.width,
        height: logoBounds.height,
        right: logoBounds.left + logoBounds.width,
        bottom: logoBounds.top + logoBounds.height
      },
      objBounds: {
        left: objBounds.left,
        top: objBounds.top,
        width: objBounds.width,
        height: objBounds.height,
        right: objBounds.left + objBounds.width,
        bottom: objBounds.top + objBounds.height
      },
      overlap: overlapResult
    };
    
    // Check for overlap using bounding rectangles
    if (overlapResult) {
      console.log("🎯 Found overlap:", debugInfo);
      overlappingObjects.push(obj);
    } else {
      console.log("📏 No overlap:", debugInfo);
    }
  });

  console.log(`🎯 Total overlapping objects found: ${overlappingObjects.length}`);
  return overlappingObjects;
}

/**
 * Check if two bounding rectangles overlap
 */
function isOverlapping(rect1: any, rect2: any): boolean {
  // Check if rectangles don't overlap (if any of these conditions are true, they don't overlap)
  const noOverlap = (
    rect1.left > rect2.left + rect2.width ||  // rect1 is completely to the right of rect2
    rect2.left > rect1.left + rect1.width ||  // rect2 is completely to the right of rect1
    rect1.top > rect2.top + rect2.height ||   // rect1 is completely below rect2
    rect2.top > rect1.top + rect1.height      // rect2 is completely below rect1
  );
  
  const hasOverlap = !noOverlap;
  
  // Debug logging for overlap calculation
  if (hasOverlap) {
    console.log("🔍 Overlap detected:", {
      rect1: { left: rect1.left, top: rect1.top, width: rect1.width, height: rect1.height },
      rect2: { left: rect2.left, top: rect2.top, width: rect2.width, height: rect2.height },
      checks: {
        rect1RightOfRect2: rect1.left > rect2.left + rect2.width,
        rect2RightOfRect1: rect2.left > rect1.left + rect1.width,
        rect1BelowRect2: rect1.top > rect2.top + rect2.height,
        rect2BelowRect1: rect2.top > rect1.top + rect1.height
      }
    });
  }
  
  return hasOverlap;
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
  console.log("analyzeColorHarmony")
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

    // Generate beautiful, aesthetically pleasing color for visual harmony
    console.log(`🎨 Object overlapping with logo - generating beautiful color`);
    console.log(`🎯 Logo color: ${logoColor}, Object color: ${objectColor} (ΔE: ${deltaE.toFixed(2)})`);
    
    // Generate beautiful color that complements the logo
    const beautifulColor = generateBeautifulColor(logoColor, objectColor);
    const newDeltaE = calculateDeltaE(logoColor, beautifulColor);
    
    console.log(`🎨 Generated beautiful color: ${beautifulColor} (ΔE: ${newDeltaE.toFixed(2)})`);
    
    colorState.currentColor = beautifulColor;
    colorState.harmonyType = 'beautiful';
    
    // Apply the beautiful color to the object
    applyColorToObject(obj, beautifulColor);
    
    console.log(`✨ Applied beautiful color: ${beautifulColor} (improved ΔE from ${deltaE.toFixed(2)} to ${newDeltaE.toFixed(2)})`);

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
export function applyColorToObject(fabricObject: any, color: string): void {
  console.log(`🚀 APPLYING COLOR TO OBJECT:`, {
    type: fabricObject.type,
    id: fabricObject.id,
    currentFill: fabricObject.fill,
    currentColor: fabricObject.color,
    currentStroke: fabricObject.stroke,
    newColor: color
  });
  
  // Apply color based on object type
  if (fabricObject.type === 'text' || fabricObject.type === 'i-text') {
    console.log(`📝 Setting text fill to: ${color}`);
    fabricObject.set('fill', color);
    console.log(`✅ Applied text color: ${color}`);
  } else if (fabricObject.type === 'rect' || fabricObject.type === 'circle' || fabricObject.type === 'ellipse') {
    console.log(`🔷 Setting shape fill to: ${color}`);
    fabricObject.set('fill', color);
    console.log(`✅ Applied shape fill: ${color}`);
  } else if (fabricObject.type === 'image') {
    // For images, we might want to apply a tint or overlay
    console.log(`🖼️ Setting image tint to: ${color}`);
    fabricObject.set('tint', color);
    console.log(`✅ Applied image tint: ${color}`);
  } else {
    // Fallback: try common properties
    console.log(`🔧 Using fallback color application for type: ${fabricObject.type}`);
    if (fabricObject.fill !== undefined) {
      fabricObject.set('fill', color);
      console.log(`✅ Applied fallback fill: ${color}`);
    } else if (fabricObject.color !== undefined) {
      fabricObject.set('color', color);
      console.log(`✅ Applied fallback color: ${color}`);
    } else if (fabricObject.stroke !== undefined) {
      fabricObject.set('stroke', color);
      console.log(`✅ Applied fallback stroke: ${color}`);
    } else {
      console.warn(`⚠️ Could not apply color - no suitable property found for type: ${fabricObject.type}`);
    }
  }
  
  // Force canvas re-render
  if (fabricObject.canvas) {
    console.log(`🔄 Rendering canvas after color change`);
    fabricObject.canvas.renderAll();
    console.log(`✅ Canvas rendered successfully`);
  } else {
    console.warn(`⚠️ No canvas found on object - cannot render`);
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
    console.log("🔄 monitorLogoMovement - checking for overlaps");
    if (!this.isActive) {
      console.log("⚠️ monitorLogoMovement: Not active", {
        isActive: this.isActive
      });
      return;
    }

    // Try to find a logo object if none is set
    if (!this.logoObject) {
      console.log("🔍 No logo object set - trying to find one");
      const allObjects = this.canvas.getObjects();
      
      // Look for potential logo objects
      const potentialLogo = allObjects.find((obj: any) => {
        const isLogo = (obj as any).isLogo || (obj as any).isBrandKitLogo;
        const hasLogoId = obj.get('id')?.includes('logo') || obj.get('id')?.includes('brand');
        const isLogoType = obj.type === 'image' && (obj as any).src?.includes('logo');
        const hasLogoName = (obj as any).name?.toLowerCase().includes('logo');
        const isTextLogo = (obj.type === 'text' || obj.type === 'i-text') && 
                          (obj.text?.toLowerCase().includes('logo') || 
                           obj.get('id')?.toLowerCase().includes('logo'));
        
        return isLogo || hasLogoId || isLogoType || hasLogoName || isTextLogo;
      });
      
      if (potentialLogo) {
        console.log("🎯 Found potential logo object:", {
          type: potentialLogo.type,
          id: potentialLogo.get('id')
        });
        this.logoObject = potentialLogo;
      } else {
        console.log("⚠️ No logo object found - skipping this monitoring cycle");
        // Continue monitoring in case a logo is added later
        setTimeout(() => {
          this.monitorLogoMovement();
        }, 100);
        return;
      }
    }

    try {
      const allObjects = this.canvas.getObjects();
      console.log(`📊 Total objects on canvas: ${allObjects.length}`);
      console.log(`📊 All objects details:`, allObjects.map((obj: any) => ({
        type: obj.type,
        id: obj.id,
        isLogo: (obj as any).isLogo,
        isBackground: (obj as any).isBackground,
        bounds: obj.getBoundingRect ? obj.getBoundingRect() : 'no bounds method'
      })));
      
      // Ensure all objects have color states initialized
      allObjects.forEach((obj: any) => {
        if (!obj.colorState) {
          console.log('🎨 Initializing missing color state for object:', obj.type, obj.id);
          initializeObjectColorState(obj);
        }
      });
      
      console.log(`🎯 About to detect overlaps with logo:`, {
        logoType: this.logoObject.type,
        logoId: this.logoObject.id,
        logoBounds: this.logoObject.getBoundingRect()
      });
      
      const overlappingObjects = detectOverlappingObjects(this.logoObject, allObjects);
      console.log(`🎯 Overlapping objects detected: ${overlappingObjects.length}`);
      
      if (overlappingObjects.length > 0) {
        console.log("📋 Overlapping object details:", overlappingObjects.map(obj => ({
          type: obj.type,
          id: obj.id,
          fill: obj.fill,
          color: obj.color
        })));
      }
      
      // Restore colors for objects that are no longer overlapping
      restoreOriginalColors(allObjects, overlappingObjects);
      
      // Analyze and adjust colors for currently overlapping objects
      if (overlappingObjects.length > 0) {
        console.log("🚀 Starting color harmony analysis...");
        analyzeColorHarmony(this.logoObject, overlappingObjects).then(() => {
          console.log("✅ Color harmony analysis completed");
          this.lastOverlappingObjects = overlappingObjects;
          this.canvas.renderAll();
        }).catch(error => {
          console.error('❌ Error in color harmony analysis:', error);
        });
      } else {
        console.log("ℹ️ No overlapping objects found");
        this.lastOverlappingObjects = [];
        this.canvas.renderAll();
      }
    } catch (error) {
      console.error('❌ Error in color harmony monitoring:', error);
    }

    // Continue monitoring with a small delay to prevent excessive CPU usage
    setTimeout(() => {
      console.log("⏰ setTimeout - continuing monitoring");
      this.monitorLogoMovement();
    }, 100);
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
