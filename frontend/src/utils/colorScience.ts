/**
 * Color Science Utilities
 * Implements ΔE (Delta E) color difference calculations and color harmony algorithms
 */

// Color conversion utilities
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface LAB {
  l: number; // Lightness (0-100)
  a: number; // Green-Red axis (-128 to 127)
  b: number; // Blue-Yellow axis (-128 to 127)
}

export interface HSL {
  h: number; // Hue (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

/**
 * Convert RGB to LAB color space
 * Uses the CIE 1976 (L*a*b*) color space
 */
export function rgbToLab(rgb: RGB): LAB {
  // First convert RGB to XYZ
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Convert to XYZ using sRGB matrix
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  let z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  // Normalize to D65 illuminant
  x /= 0.95047;
  y /= 1.00000;
  z /= 1.08883;

  // Convert to LAB
  const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const labB = 200 * (fy - fz);

  return { l, a, b: labB };
}

/**
 * Calculate ΔE (Delta E) color difference between two colors
 * Uses CIE76 formula for LAB color space
 * Returns a value where:
 * - ΔE < 1: Imperceptible difference
 * - ΔE 2-3: Just noticeable difference
 * - ΔE > 3: Clearly visible difference
 */
export function calculateDeltaE(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    console.warn('Invalid color format for ΔE calculation:', color1, color2);
    return 100; // Return high value for invalid colors
  }

  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  // CIE76 formula for ΔE
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;

  const deltaE = Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  
  return deltaE;
}

/**
 * Check if two colors are too similar (imperceptible difference)
 */
export function areColorsTooSimilar(color1: string, color2: string, threshold: number = 3): boolean {
  const deltaE = calculateDeltaE(color1, color2);
  return deltaE < threshold;
}

/**
 * Generate a contrasting color using complementary color theory
 */
export function generateContrastingColor(originalColor: string, intensity: number = 0.7): string {
  const rgb = hexToRgb(originalColor);
  if (!rgb) return originalColor;

  // Convert to HSL for easier manipulation
  const hsl = rgbToHsl(rgb);
  
  // Create complementary color by shifting hue by 180 degrees
  let complementaryHue = (hsl.h + 180) % 360;
  
  // Adjust saturation and lightness for better contrast
  const newSaturation = Math.min(hsl.s + 20, 100);
  const newLightness = hsl.l > 50 ? Math.max(hsl.l - 30, 10) : Math.min(hsl.l + 30, 90);
  
  // Convert back to RGB
  const newRgb = hslToRgb({
    h: complementaryHue,
    s: newSaturation,
    l: newLightness
  });
  
  return rgbToHex(newRgb);
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Generate harmonious color based on logo color and original object color
 * Uses multiple strategies for optimal contrast and visual appeal
 */
export function generateHarmoniousColor(logoColor: string, originalColor: string): string {
  const logoRgb = hexToRgb(logoColor);
  const originalRgb = hexToRgb(originalColor);
  
  if (!logoRgb || !originalRgb) return originalColor;

  const logoHsl = rgbToHsl(logoRgb);
  const originalHsl = rgbToHsl(originalRgb);

  // Strategy 1: High Contrast - Complementary color (180° apart)
  const complementaryHue = (logoHsl.h + 180) % 360;
  const complementaryRgb = hslToRgb({
    h: complementaryHue,
    s: Math.min(originalHsl.s * 1.2, 1), // Increase saturation slightly
    l: originalHsl.l
  });
  const complementaryColor = rgbToHex(complementaryRgb);
  
  // Strategy 2: Triadic color (120° apart) - Good harmony
  const triadicHue = (logoHsl.h + 120) % 360;
  const triadicRgb = hslToRgb({
    h: triadicHue,
    s: originalHsl.s,
    l: originalHsl.l
  });
  const triadicColor = rgbToHex(triadicRgb);
  
  // Strategy 3: High contrast with lightness inversion
  const contrastRgb = hslToRgb({
    h: logoHsl.h,
    s: logoHsl.s,
    l: logoHsl.l > 0.5 ? 0.2 : 0.8 // Invert lightness for high contrast
  });
  const contrastColor = rgbToHex(contrastRgb);
  
  // Choose the best option based on contrast with logo
  const options = [
    { color: complementaryColor, name: 'complementary' },
    { color: triadicColor, name: 'triadic' },
    { color: contrastColor, name: 'contrast' }
  ];
  
  // Calculate contrast for each option and pick the best one
  let bestOption = options[0];
  let bestContrast = 0;
  
  for (const option of options) {
    const contrast = calculateDeltaE(logoColor, option.color);
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestOption = option;
    }
  }
  
  console.log(`🎨 Generated ${bestOption.name} color: ${bestOption.color} (ΔE: ${bestContrast.toFixed(2)})`);
  return bestOption.color;
}

/**
 * Generate a high-contrast color specifically for logo visibility
 * This function prioritizes maximum contrast over harmony
 */
export function generateHighContrastColor(logoColor: string, originalColor: string): string {
  const logoRgb = hexToRgb(logoColor);
  if (!logoRgb) return originalColor;

  const logoHsl = rgbToHsl(logoRgb);
  
  // Strategy 1: Pure complementary (180° hue shift)
  const complementaryHsl = {
    h: (logoHsl.h + 180) % 360,
    s: 0.8, // High saturation for visibility
    l: logoHsl.l > 0.5 ? 0.3 : 0.7 // Ensure good contrast
  };
  
  // Strategy 2: Opposite lightness with same hue
  const oppositeLightnessHsl = {
    h: logoHsl.h,
    s: logoHsl.s,
    l: logoHsl.l > 0.5 ? 0.2 : 0.8 // Strong lightness contrast
  };
  
  // Strategy 3: Warm vs Cool contrast
  const isLogoWarm = logoHsl.h < 60 || logoHsl.h > 300; // Red, yellow, orange range
  const coolColorHsl = {
    h: isLogoWarm ? 200 : 20, // Blue/cyan vs Red/orange
    s: 0.7,
    l: 0.5
  };
  
  const options = [
    { color: rgbToHex(hslToRgb(complementaryHsl)), name: 'complementary', contrast: 0 },
    { color: rgbToHex(hslToRgb(oppositeLightnessHsl)), name: 'lightness', contrast: 0 },
    { color: rgbToHex(hslToRgb(coolColorHsl)), name: 'temperature', contrast: 0 }
  ];
  
  // Calculate actual contrast and pick the best
  let bestOption = options[0];
  let bestContrast = 0;
  
  for (const option of options) {
    const contrast = calculateDeltaE(logoColor, option.color);
    option.contrast = contrast;
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestOption = option;
    }
  }
  
  console.log(`🎯 High contrast ${bestOption.name} color: ${bestOption.color} (ΔE: ${bestContrast.toFixed(2)})`);
  return bestOption.color;
}

/**
 * Get dominant color from an image (simplified version)
 * This would typically use more sophisticated image analysis
 */
export function getDominantColorFromImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = 1;
        canvas.height = 1;
        
        // Draw scaled down image to 1x1 pixel
        ctx.drawImage(img, 0, 0, 1, 1);
        
        // Get the pixel data
        const imageData = ctx.getImageData(0, 0, 1, 1);
        const [r, g, b] = imageData.data;
        
        const color = rgbToHex({ r, g, b });
        resolve(color);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Color difference thresholds
 */
export const COLOR_THRESHOLDS = {
  IMPERCEPTIBLE: 1,    // ΔE < 1: Imperceptible to human eye
  JUST_NOTICEABLE: 8,  // ΔE 2-8: Just noticeable difference (increased for better distinction)
  CLEARLY_VISIBLE: 12, // ΔE > 12: Clearly visible difference
  VERY_DIFFERENT: 20   // ΔE > 20: Very different colors
} as const;
