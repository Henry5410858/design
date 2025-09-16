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
  
  // If all options have low contrast, generate a high-contrast color
  if (bestContrast < 15) {
    console.log(`🎨 Low contrast detected (${bestContrast.toFixed(2)}), generating high-contrast color`);
    
    // Generate a high-contrast color based on logo lightness
    const logoLightness = logoHsl.l;
    const highContrastHsl = {
      h: (logoHsl.h + 180) % 360, // Opposite hue
      s: Math.min(logoHsl.s * 1.5, 1), // Higher saturation
      l: logoLightness > 0.5 ? 0.2 : 0.8 // Invert lightness for maximum contrast
    };
    
    const highContrastRgb = hslToRgb(highContrastHsl);
    const highContrastColor = rgbToHex(highContrastRgb);
    const highContrastDeltaE = calculateDeltaE(logoColor, highContrastColor);
    
    if (highContrastDeltaE > bestContrast) {
      bestOption = { color: highContrastColor, name: 'high-contrast' };
      bestContrast = highContrastDeltaE;
    }
  }
  
  console.log(`🎨 Generated ${bestOption.name} color: ${bestOption.color} (ΔE: ${bestContrast.toFixed(2)})`);
  return bestOption.color;
}

/**
 * Generate harmonious color based on original object color that contrasts with logo
 * Enhanced to create unique, beautiful colors for each overlapping object
 */
export function generateHarmoniousColorFromOriginal(logoColor: string, originalObjectColor: string, objectId?: string): string {
  const logoRgb = hexToRgb(logoColor);
  const originalRgb = hexToRgb(originalObjectColor);
  
  if (!logoRgb || !originalRgb) {
    return generateBeautifulColor(logoColor, originalObjectColor);
  }
  
  const logoHsl = rgbToHsl(logoRgb);
  const originalHsl = rgbToHsl(originalRgb);
  
  console.log(`🎨 Generating harmonious color from original:`, {
    logoColor,
    originalObjectColor,
    objectId,
    logoHsl,
    originalHsl
  });
  
  // Enhanced beautiful color palette with more variety and uniqueness
  const beautifulColorPalette = [
    // Vibrant and energetic colors
    {
      name: 'electric_blue',
      color: '#00BFFF', // Electric Blue
      beauty: 9,
      category: 'vibrant'
    },
    {
      name: 'coral_pink',
      color: '#FF6B6B', // Coral Pink
      beauty: 9,
      category: 'vibrant'
    },
    {
      name: 'lime_green',
      color: '#32CD32', // Lime Green
      beauty: 8,
      category: 'vibrant'
    },
    {
      name: 'golden_yellow',
      color: '#FFD700', // Golden Yellow
      beauty: 8,
      category: 'vibrant'
    },
    {
      name: 'hot_pink',
      color: '#FF1493', // Hot Pink
      beauty: 9,
      category: 'vibrant'
    },
    {
      name: 'turquoise',
      color: '#40E0D0', // Turquoise
      beauty: 9,
      category: 'vibrant'
    },
    {
      name: 'orange_red',
      color: '#FF4500', // Orange Red
      beauty: 8,
      category: 'vibrant'
    },
    {
      name: 'purple',
      color: '#8A2BE2', // Blue Violet
      beauty: 8,
      category: 'vibrant'
    },
    
    // Sophisticated and elegant colors
    {
      name: 'deep_teal',
      color: '#008B8B', // Dark Cyan
      beauty: 8,
      category: 'sophisticated'
    },
    {
      name: 'burgundy',
      color: '#800020', // Burgundy
      beauty: 7,
      category: 'sophisticated'
    },
    {
      name: 'navy_blue',
      color: '#000080', // Navy Blue
      beauty: 7,
      category: 'sophisticated'
    },
    {
      name: 'forest_green',
      color: '#228B22', // Forest Green
      beauty: 8,
      category: 'sophisticated'
    },
    {
      name: 'maroon',
      color: '#800000', // Maroon
      beauty: 7,
      category: 'sophisticated'
    },
    {
      name: 'olive_green',
      color: '#808000', // Olive
      beauty: 7,
      category: 'sophisticated'
    },
    
    // Soft and pleasant colors
    {
      name: 'lavender',
      color: '#E6E6FA', // Lavender
      beauty: 8,
      category: 'soft'
    },
    {
      name: 'mint_cream',
      color: '#F5FFFA', // Mint Cream
      beauty: 7,
      category: 'soft'
    },
    {
      name: 'peach',
      color: '#FFDAB9', // Peach Puff
      beauty: 8,
      category: 'soft'
    },
    {
      name: 'sky_blue',
      color: '#87CEEB', // Sky Blue
      beauty: 8,
      category: 'soft'
    },
    {
      name: 'light_coral',
      color: '#F08080', // Light Coral
      beauty: 8,
      category: 'soft'
    },
    {
      name: 'light_green',
      color: '#90EE90', // Light Green
      beauty: 7,
      category: 'soft'
    },
    
    // High contrast colors for maximum visibility
    {
      name: 'bright_white',
      color: '#FFFFFF', // Pure White
      beauty: 6,
      category: 'contrast'
    },
    {
      name: 'pure_black',
      color: '#000000', // Pure Black
      beauty: 6,
      category: 'contrast'
    },
    {
      name: 'bright_red',
      color: '#FF0000', // Pure Red
      beauty: 7,
      category: 'contrast'
    },
    {
      name: 'bright_green',
      color: '#00FF00', // Pure Green
      beauty: 7,
      category: 'contrast'
    },
    {
      name: 'bright_blue',
      color: '#0000FF', // Pure Blue
      beauty: 7,
      category: 'contrast'
    }
  ];

  // Generate unique colors based on object ID for variety
  let colorOptions = beautifulColorPalette.map(paletteColor => {
    const color = paletteColor.color;
    const contrast = calculateDeltaE(logoColor, color);
    
    // Check if color is too dark or light
    const colorRgb = hexToRgb(color);
    const isTooDark = colorRgb && (colorRgb.r < 30 && colorRgb.g < 30 && colorRgb.b < 30);
    const isTooLight = colorRgb && (colorRgb.r > 240 && colorRgb.g > 240 && colorRgb.b > 240);
    
    // Calculate uniqueness score based on object ID
    let uniquenessScore = 1;
    if (objectId) {
      // Use object ID to create consistent but unique color selection
      const hash = objectId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      uniquenessScore = Math.abs(hash) % 10 + 1;
    }
    
    // Adjust beauty score based on uniqueness and contrast
    const adjustedBeauty = paletteColor.beauty + (uniquenessScore * 0.5);
    
    return {
      color,
      name: paletteColor.name,
      category: paletteColor.category,
      contrast,
      beauty: adjustedBeauty,
      uniqueness: uniquenessScore,
      isTooDark,
      isTooLight
    };
  });
  
  // Filter out problematic colors
  const goodColors = colorOptions.filter(option => 
    !option.isTooDark && 
    !option.isTooLight && 
    option.contrast > 8 // Good contrast with logo
  );
  
  // If we have good colors, pick the best one
  if (goodColors.length > 0) {
    // Sort by a combination of beauty, contrast, and uniqueness
    const bestColor = goodColors.reduce((best, current) => {
      const bestScore = (best.beauty * 0.4) + (Math.min(best.contrast / 20, 10) * 0.4) + (best.uniqueness * 0.2);
      const currentScore = (current.beauty * 0.4) + (Math.min(current.contrast / 20, 10) * 0.4) + (current.uniqueness * 0.2);
      return currentScore > bestScore ? current : best;
    });
    
    console.log(`✨ Beautiful ${bestColor.name} color: ${bestColor.color} (ΔE: ${bestColor.contrast.toFixed(2)}, Beauty: ${bestColor.beauty.toFixed(1)}, Uniqueness: ${bestColor.uniqueness})`);
    return bestColor.color;
  }
  
  // Fallback: generate a color based on the original object color
  console.log(`⚠️ No good colors found, generating based on original color`);
  return generateColorFromOriginal(logoColor, originalObjectColor);
}

/**
 * Generate a color based on the original object color with better contrast
 */
function generateColorFromOriginal(logoColor: string, originalColor: string): string {
  const logoRgb = hexToRgb(logoColor);
  const originalRgb = hexToRgb(originalColor);
  
  if (!logoRgb || !originalRgb) {
    return '#FF6B6B'; // Fallback to coral
  }
  
  const logoHsl = rgbToHsl(logoRgb);
  const originalHsl = rgbToHsl(originalRgb);
  
  // Create a complementary color with good contrast
  const complementaryHue = (logoHsl.h + 180) % 360;
  const newColor = hslToRgb({
    h: complementaryHue,
    s: Math.min(originalHsl.s * 1.3, 100), // Increase saturation
    l: originalHsl.l > 50 ? 30 : 70 // Invert lightness for contrast
  });
  
  return rgbToHex(newColor);
}

/**
 * Generate beautiful, aesthetically pleasing colors for overlapping objects
 * This function prioritizes visual beauty and harmony while maintaining good contrast
 */
export function generateBeautifulColor(logoColor: string, originalColor: string): string {
  const logoRgb = hexToRgb(logoColor);
  if (!logoRgb) return originalColor;

  const logoHsl = rgbToHsl(logoRgb);
  
  // Define beautiful color palettes that avoid dark/ugly colors
  const beautifulPalettes = [
    // Vibrant complementary colors
    {
      name: 'vibrant_complementary',
      h: (logoHsl.h + 180) % 360,
      s: 0.8, // High saturation for vibrancy
      l: 0.6, // Good lightness - not too dark, not too light
      beauty: 9
    },
    // Triadic harmony - vibrant and balanced
    {
      name: 'triadic_vibrant',
      h: (logoHsl.h + 120) % 360,
      s: 0.75,
      l: 0.65,
      beauty: 9
    },
    // Analogous harmony - smooth and pleasing
    {
      name: 'analogous_smooth',
      h: (logoHsl.h + 45) % 360,
      s: 0.7,
      l: 0.7,
      beauty: 8
    },
    // Split complementary - rich and dynamic
    {
      name: 'split_complementary_rich',
      h: (logoHsl.h + 150) % 360,
      s: 0.85,
      l: 0.55,
      beauty: 8
    },
    // Beautiful pastels - soft and elegant
    {
      name: 'beautiful_pastel',
      h: (logoHsl.h + 60) % 360,
      s: 0.6, // Moderate saturation for pastel beauty
      l: 0.75, // Light but not washed out
      beauty: 7
    },
    // Jewel tones - rich and luxurious
    {
      name: 'jewel_luxury',
      h: (logoHsl.h + 90) % 360,
      s: 0.9, // Very high saturation
      l: 0.5, // Perfect jewel tone lightness
      beauty: 10
    },
    // Warm/cool harmony - temperature contrast
    {
      name: 'temperature_harmony',
      h: logoHsl.h < 60 || logoHsl.h > 300 ? 200 : 20, // Cool blue or warm orange
      s: 0.8,
      l: 0.6,
      beauty: 8
    },
    // Sunset colors - warm and inviting
    {
      name: 'sunset_warm',
      h: logoHsl.h < 60 || logoHsl.h > 300 ? 30 : 210, // Warm orange or cool blue
      s: 0.75,
      l: 0.65,
      beauty: 9
    },
    // Ocean colors - cool and refreshing
    {
      name: 'ocean_cool',
      h: 180, // Pure teal
      s: 0.7,
      l: 0.6,
      beauty: 8
    },
    // Forest colors - natural and calming
    {
      name: 'forest_natural',
      h: 120, // Pure green
      s: 0.6,
      l: 0.55,
      beauty: 7
    }
  ];
  
  // Generate colors and evaluate them
  const colorOptions = beautifulPalettes.map(palette => {
    const color = rgbToHex(hslToRgb(palette));
    const contrast = calculateDeltaE(logoColor, color);
    
    // Check if color is too dark (avoid colors like #010101)
    const colorRgb = hexToRgb(color);
    const isTooDark = colorRgb && (colorRgb.r < 50 && colorRgb.g < 50 && colorRgb.b < 50);
    const isTooLight = colorRgb && (colorRgb.r > 200 && colorRgb.g > 200 && colorRgb.b > 200);
    
    // Penalize dark/light colors
    const darknessPenalty = isTooDark ? -5 : 0;
    const lightnessPenalty = isTooLight ? -2 : 0;
    
    // Calculate beauty score with penalties
    const adjustedBeauty = palette.beauty + darknessPenalty + lightnessPenalty;
    
    return {
      color,
      name: palette.name,
      contrast,
      beauty: Math.max(0, adjustedBeauty), // Ensure non-negative beauty score
      isTooDark,
      isTooLight
    };
  });
  
  // Filter out ugly colors and find the best option
  const goodColors = colorOptions.filter(option => 
    !option.isTooDark && 
    !option.isTooLight && 
    option.contrast > 10 && // Good contrast requirement
    option.beauty > 5 // Minimum beauty requirement
  );
  
  // If we have good colors, pick the best one
  if (goodColors.length > 0) {
    const bestColor = goodColors.reduce((best, current) => {
      const bestScore = (best.beauty * 0.7) + (Math.min(best.contrast / 20, 10) * 0.3);
      const currentScore = (current.beauty * 0.7) + (Math.min(current.contrast / 20, 10) * 0.3);
      return currentScore > bestScore ? current : best;
    });
    
    console.log(`✨ Beautiful ${bestColor.name} color: ${bestColor.color} (ΔE: ${bestColor.contrast.toFixed(2)}, Beauty: ${bestColor.beauty})`);
    return bestColor.color;
  }
  
  // Fallback: use a guaranteed beautiful color
  const fallbackColors = [
    '#FF6B6B', // Coral red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Sky blue
    '#96CEB4', // Mint green
    '#FECA57', // Golden yellow
    '#FF9FF3', // Pink
    '#54A0FF', // Blue
    '#5F27CD'  // Purple
  ];
  
  // Pick the fallback color with best contrast
  let bestFallback = fallbackColors[0];
  let bestFallbackContrast = 0;
  
  for (const fallbackColor of fallbackColors) {
    const contrast = calculateDeltaE(logoColor, fallbackColor);
    if (contrast > bestFallbackContrast) {
      bestFallbackContrast = contrast;
      bestFallback = fallbackColor;
    }
  }
  
  console.log(`✨ Using beautiful fallback color: ${bestFallback} (ΔE: ${bestFallbackContrast.toFixed(2)})`);
  return bestFallback;
}

/**
 * Generate a high-contrast color specifically for logo visibility (legacy function)
 * This function prioritizes maximum contrast over harmony
 */
export function generateHighContrastColor(logoColor: string, originalColor: string): string {
  // For backward compatibility, use the beautiful color function
  return generateBeautifulColor(logoColor, originalColor);
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
  JUST_NOTICEABLE: 8,  // ΔE < 8: Just noticeable difference (lowered for better detection)
  CLEARLY_VISIBLE: 20, // ΔE > 20: Clearly visible difference
  VERY_DIFFERENT: 30   // ΔE > 30: Very different colors
} as const;

/**
 * Test function to verify the color system is working properly
 */
export function testColorSystem(): void {
  console.log('🧪 Testing Color System...');
  
  // Test with different logo colors
  const testCases = [
    { logoColor: '#1D4ED8', originalColor: '#F59E0B', objectId: 'test1' },
    { logoColor: '#10B981', originalColor: '#EF4444', objectId: 'test2' },
    { logoColor: '#8B5CF6', originalColor: '#F97316', objectId: 'test3' },
    { logoColor: '#000000', originalColor: '#000000', objectId: 'test4' }, // Same color test
    { logoColor: '#FFFFFF', originalColor: '#FFFFFF', objectId: 'test5' }, // Same color test
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n🧪 Test Case ${index + 1}:`);
    console.log(`  Logo Color: ${testCase.logoColor}`);
    console.log(`  Original Color: ${testCase.originalColor}`);
    console.log(`  Object ID: ${testCase.objectId}`);
    
    const harmoniousColor = generateHarmoniousColorFromOriginal(
      testCase.logoColor, 
      testCase.originalColor, 
      testCase.objectId
    );
    
    const contrast = calculateDeltaE(testCase.logoColor, harmoniousColor);
    const isGoodContrast = contrast > 8;
    
    console.log(`  Generated Color: ${harmoniousColor}`);
    console.log(`  Contrast (ΔE): ${contrast.toFixed(2)}`);
    console.log(`  Good Contrast: ${isGoodContrast ? '✅' : '❌'}`);
    
    // Test uniqueness - same object ID should generate same color
    const harmoniousColor2 = generateHarmoniousColorFromOriginal(
      testCase.logoColor, 
      testCase.originalColor, 
      testCase.objectId
    );
    
    const isConsistent = harmoniousColor === harmoniousColor2;
    console.log(`  Consistent: ${isConsistent ? '✅' : '❌'}`);
  });
  
  console.log('\n✅ Color System Test Complete!');
}
