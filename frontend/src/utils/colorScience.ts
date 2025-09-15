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
 * Generate harmonious color based on original object color that contrasts with logo
 */
export function generateHarmoniousColorFromOriginal(logoColor: string, originalObjectColor: string): string {
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
    logoHsl,
    originalHsl
  });
  
  // Strategy: Use the specific color palette from the user's image
  const userColorPalette = [
    {
      name: 'bright_cyan',
      color: '#00D4FF', // Bright Cyan/Turquoise
      beauty: 9
    },
    {
      name: 'dark_teal',
      color: '#006B7D', // Dark Teal/Deep Cyan
      beauty: 8
    },
    {
      name: 'vibrant_aqua',
      color: '#00FFFF', // Vibrant Aqua/Light Turquoise
      beauty: 9
    },
    {
      name: 'deep_indigo',
      color: '#4B0082', // Deep Indigo/Dark Purple
      beauty: 8
    },
    {
      name: 'white',
      color: '#FFFFFF', // Pure White
      beauty: 7
    },
    {
      name: 'black',
      color: '#000000', // Solid Black
      beauty: 6
    }
  ];

  // Convert palette colors to HSL for analysis
  const harmoniousOptions = userColorPalette.map(paletteColor => {
    const colorRgb = hexToRgb(paletteColor.color);
    if (!colorRgb) return null;
    
    const colorHsl = rgbToHsl(colorRgb);
    
    return {
      name: paletteColor.name,
      h: colorHsl.h,
      s: colorHsl.s,
      l: colorHsl.l,
      beauty: paletteColor.beauty,
      originalColor: paletteColor.color
    };
  }).filter(option => option !== null);
  
  // Generate colors and evaluate them
  const colorOptions = harmoniousOptions.map(option => {
    // Use the original color from the palette
    const color = option.originalColor;
    const contrast = calculateDeltaE(logoColor, color);
    
    // Check if color is too dark or light
    const colorRgb = hexToRgb(color);
    const isTooDark = colorRgb && (colorRgb.r < 50 && colorRgb.g < 50 && colorRgb.b < 50);
    const isTooLight = colorRgb && (colorRgb.r > 200 && colorRgb.g > 200 && colorRgb.b > 200);
    
    // Don't penalize the specific palette colors
    const adjustedBeauty = option.beauty;
    
    return {
      color,
      name: option.name,
      contrast,
      beauty: adjustedBeauty,
      isTooDark,
      isTooLight
    };
  });
  
  // Filter colors - prioritize contrast with logo
  const goodColors = colorOptions.filter(option => 
    option.contrast > 5 // Minimum contrast with logo (lowered to allow more colors)
  );
  
  // If we have good colors, pick the best one
  if (goodColors.length > 0) {
    const bestColor = goodColors.reduce((best, current) => {
      const bestScore = (best.beauty * 0.6) + (Math.min(best.contrast / 15, 10) * 0.4);
      const currentScore = (current.beauty * 0.6) + (Math.min(current.contrast / 15, 10) * 0.4);
      return currentScore > bestScore ? current : best;
    });
    
    console.log(`✨ Harmonious ${bestColor.name} color: ${bestColor.color} (ΔE: ${bestColor.contrast.toFixed(2)}, Beauty: ${bestColor.beauty})`);
    return bestColor.color;
  }
  
  // Fallback to beautiful color generation
  console.log(`⚠️ No good harmonious colors found, using fallback from user palette`);
  return userColorPalette[0].color;
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
