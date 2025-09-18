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
 * Strongly influenced by the original object color to ensure diversity
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
  
  // Calculate color harmony based on original object color
  const originalHue = originalHsl.h;
  const originalSaturation = originalHsl.s;
  const originalLightness = originalHsl.l;
  
  // Generate uniqueness factor from object ID for additional variation
  let uniquenessFactor = 0;
  if (objectId) {
    for (let i = 0; i < objectId.length; i++) {
      uniquenessFactor += objectId.charCodeAt(i) * (i + 1);
    }
    uniquenessFactor = uniquenessFactor % 100;
  }
  
  // Strategy 1: Complementary to logo but strongly influenced by original
  const complementaryHue = (logoHsl.h + 180) % 360;
  const originalInfluencedHue1 = (complementaryHue + originalHue * 0.6) % 360;
  
  // Strategy 2: Triadic harmony with strong original color influence
  const triadicHue = (logoHsl.h + 120) % 360;
  const originalInfluencedHue2 = (triadicHue + originalHue * 0.7) % 360;
  
  // Strategy 3: Analogous to original but contrasting with logo
  const originalAnalogousHue = (originalHue + 60) % 360;
  const logoContrastHue = Math.abs(originalAnalogousHue - logoHsl.h) > 90 ? 
    originalAnalogousHue : (originalAnalogousHue + 180) % 360;
  
  // Strategy 4: Split complementary with original color base
  const splitComp1 = (logoHsl.h + 150) % 360;
  const splitComp2 = (logoHsl.h + 210) % 360;
  const originalSplitHue = Math.abs(splitComp1 - originalHue) < Math.abs(splitComp2 - originalHue) ? 
    splitComp1 : splitComp2;
  
  // Strategy 5: Tetradic harmony with original influence
  const tetradicHue = (logoHsl.h + 90) % 360;
  const originalTetradicHue = (tetradicHue + originalHue * 0.5) % 360;
  
  // Create color options with strong original color influence - avoid black
  const colorOptions = [
    {
      name: 'complementary_original',
      hsl: {
        h: originalInfluencedHue1,
        s: Math.min(originalSaturation * 1.3, 1),
        l: Math.max(0.3, Math.min(0.8, originalLightness > 0.5 ? 0.3 : 0.7)) // Avoid black
      }
    },
    {
      name: 'triadic_original',
      hsl: {
        h: originalInfluencedHue2,
        s: Math.min(originalSaturation * 1.2, 1),
        l: Math.max(0.3, Math.min(0.8, originalLightness > 0.5 ? 0.4 : 0.6)) // Avoid black
      }
    },
    {
      name: 'analogous_contrast',
      hsl: {
        h: logoContrastHue,
        s: Math.min(originalSaturation * 1.4, 1),
        l: Math.max(0.3, Math.min(0.8, originalLightness > 0.5 ? 0.2 : 0.8)) // Avoid black
      }
    },
    {
      name: 'split_complementary',
      hsl: {
        h: originalSplitHue,
        s: Math.min(originalSaturation * 1.1, 1),
        l: Math.max(0.3, Math.min(0.8, originalLightness > 0.5 ? 0.35 : 0.65)) // Avoid black
      }
    },
    {
      name: 'tetradic_original',
      hsl: {
        h: originalTetradicHue,
        s: Math.min(originalSaturation * 1.25, 1),
        l: Math.max(0.3, Math.min(0.8, originalLightness > 0.5 ? 0.25 : 0.75)) // Avoid black
      }
    },
    {
      name: 'original_based_vibrant',
      hsl: {
        h: originalHue,
        s: Math.min(originalSaturation * 1.5, 1), // Higher saturation
        l: Math.max(0.4, Math.min(0.8, originalLightness > 0.5 ? 0.4 : 0.6)) // Avoid black, stay close to original
      }
    }
  ];
  
  // Add uniqueness variation to hue
  const uniquenessVariation = (uniquenessFactor - 50) * 0.1; // -5 to +5 degrees
  
  // Calculate contrast for each option and pick the best one
  let bestOption = colorOptions[0];
  let bestScore = 0;
  
  for (const option of colorOptions) {
    // Apply uniqueness variation
    const variedHue = (option.hsl.h + uniquenessVariation + 360) % 360;
    const variedHsl = { ...option.hsl, h: variedHue };
    
    const optionRgb = hslToRgb(variedHsl);
    const optionColor = rgbToHex(optionRgb);
    const contrast = calculateDeltaE(logoColor, optionColor);
    
    // Calculate similarity to original color (we want some similarity)
    const originalContrast = calculateDeltaE(originalObjectColor, optionColor);
    const similarityScore = Math.max(0, 20 - originalContrast) / 20; // 0-1, higher is more similar
    
    // Score based on contrast with logo, similarity to original, and beauty
    const contrastScore = Math.min(contrast / 20, 1) * 10; // 0-10
    const similarityScoreWeighted = similarityScore * 3; // 0-3
    const beautyScore = 7; // Base beauty score
    const totalScore = contrastScore + similarityScoreWeighted + beautyScore;
    
    console.log(`🎨 Option ${option.name}: ${optionColor} (contrast: ${contrast.toFixed(2)}, similarity: ${similarityScore.toFixed(2)}, score: ${totalScore.toFixed(2)})`);
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestOption = { ...option, hsl: variedHsl };
    }
  }
  
  // Convert best option to final color
  const finalRgb = hslToRgb(bestOption.hsl);
  const finalColor = rgbToHex(finalRgb);
  const finalContrast = calculateDeltaE(logoColor, finalColor);
  const finalSimilarity = calculateDeltaE(originalObjectColor, finalColor);
  
  console.log(`🎨 Generated ${bestOption.name} color: ${finalColor} (logo contrast: ${finalContrast.toFixed(2)}, original similarity: ${finalSimilarity.toFixed(2)})`);
  return finalColor;
}

/**
 * Generate beautiful, aesthetically pleasing colors for overlapping objects
 * This function prioritizes visual beauty and harmony while maintaining good contrast
 */
export function generateBeautifulColor(logoColor: string, originalColor: string): string {
  const logoRgb = hexToRgb(logoColor);
  if (!logoRgb) return originalColor;

  const logoHsl = rgbToHsl(logoRgb);
  
  // Define beautiful color palettes that avoid dark/ugly colors and black
  const beautifulPalettes = [
    // Vibrant complementary colors - avoid black
    {
      name: 'vibrant_complementary',
      h: (logoHsl.h + 180) % 360,
      s: 0.8, // High saturation for vibrancy
      l: Math.max(0.4, Math.min(0.8, logoHsl.l > 0.5 ? 0.3 : 0.7)), // Avoid black, adjust based on logo lightness
      beauty: 9
    },
    // Triadic harmony - vibrant and balanced
    {
      name: 'triadic_vibrant',
      h: (logoHsl.h + 120) % 360,
      s: 0.75,
      l: Math.max(0.4, Math.min(0.8, logoHsl.l > 0.5 ? 0.35 : 0.65)), // Avoid black
      beauty: 9
    },
    // Analogous harmony - smooth and pleasing
    {
      name: 'analogous_smooth',
      h: (logoHsl.h + 30) % 360,
      s: 0.7,
      l: Math.max(0.4, Math.min(0.8, logoHsl.l > 0.5 ? 0.3 : 0.7)), // Avoid black
      beauty: 8
    },
    // Split complementary - more variety
    {
      name: 'split_complementary',
      h: (logoHsl.h + 150) % 360,
      s: 0.8,
      l: Math.max(0.4, Math.min(0.8, logoHsl.l > 0.5 ? 0.25 : 0.75)), // Avoid black
      beauty: 8
    },
    // Tetradic harmony - balanced and vibrant
    {
      name: 'tetradic_harmony',
      h: (logoHsl.h + 90) % 360,
      s: 0.75,
      l: Math.max(0.4, Math.min(0.8, logoHsl.l > 0.5 ? 0.3 : 0.7)), // Avoid black
      beauty: 7
    }
  ];
  
  // Find the best color based on contrast and beauty
  let bestColor = beautifulPalettes[0];
  let bestScore = 0;
  
  for (const palette of beautifulPalettes) {
    const colorRgb = hslToRgb(palette);
    const colorHex = rgbToHex(colorRgb);
    const contrast = calculateDeltaE(logoColor, colorHex);
    
    // Score based on contrast and beauty
    const contrastScore = Math.min(contrast / 20, 1) * 10;
    const beautyScore = palette.beauty;
    const totalScore = contrastScore + beautyScore;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestColor = palette;
    }
  }
  
  const finalRgb = hslToRgb(bestColor);
  return rgbToHex(finalRgb);
}

/**
 * Seven predefined colors for random selection
 * These are the brand colors defined in the BrandKit component
 */
export const PREDEFINED_COLORS = [
  '#000000', // Black (represents no color/transparent)
  '#00525b', // Dark teal/blue-green
  '#01aac7', // Bright turquoise/aqua blue
  '#32e0c5', // Light turquoise/mint green
  '#ffffff', // Pure white
  '#3f005f', // Rich deep purple
  '#230038'  // Very dark purple/indigo
];

/**
 * Generate a random gradient using two colors from the seven predefined colors
 * @param logoColor - The logo color to avoid similar colors to
 * @param similarityThreshold - Delta E threshold for considering colors too similar (default: 15)
 * @param objectId - Optional object ID for consistent randomization
 * @returns A gradient object with two randomly selected colors
 */
export function selectRandomGradient(
  logoColor: string, 
  similarityThreshold: number = 16,
  objectId?: string,
  objectWidth?: number,
  objectScaleX?: number
): any {
  console.log(`🌈 Selecting random gradient, excluding colors similar to logo: ${logoColor}`);
  
  // Filter out colors that are too similar to the logo color
  const availableColors = PREDEFINED_COLORS.filter(color => {
    const deltaE = calculateDeltaE(logoColor, color);
    const isTooSimilar = deltaE < similarityThreshold;
    
    console.log(`🎨 Color ${color}: ΔE = ${deltaE.toFixed(2)} (${isTooSimilar ? 'too similar' : 'acceptable'})`);
    
    return !isTooSimilar;
  });
  
  // If no colors are available (all are too similar), use the most contrasting ones
  if (availableColors.length === 0) {
    console.warn('⚠️ All predefined colors are too similar to logo, selecting most contrasting colors');
    
    let mostContrastingColors = PREDEFINED_COLORS.slice(0, 2);
    let maxContrast = 0;
    
    for (let i = 0; i < PREDEFINED_COLORS.length; i++) {
      for (let j = i + 1; j < PREDEFINED_COLORS.length; j++) {
        const contrast1 = calculateDeltaE(logoColor, PREDEFINED_COLORS[i]);
        const contrast2 = calculateDeltaE(logoColor, PREDEFINED_COLORS[j]);
        const totalContrast = contrast1 + contrast2;
        
        if (totalContrast > maxContrast) {
          maxContrast = totalContrast;
          mostContrastingColors = [PREDEFINED_COLORS[i], PREDEFINED_COLORS[j]];
        }
      }
    }
    
    console.log(`🎨 Selected most contrasting colors: ${mostContrastingColors.join(', ')}`);
    return createGradientObject(mostContrastingColors[0], mostContrastingColors[1]);
  }
  
  // Select two random colors from available colors
  let color1: string, color2: string;
  
  if (objectId) {
    // Generate pseudo-random selection based on object ID for consistency
    let hash1 = 0, hash2 = 0;
    for (let i = 0; i < objectId.length; i++) {
      const char = objectId.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash2 = ((hash2 << 7) - hash2) + char;
      hash1 = hash1 & hash1;
      hash2 = hash2 & hash2;
    }
    
    const index1 = Math.abs(hash1) % availableColors.length;
    let index2 = Math.abs(hash2) % availableColors.length;
    
    // Ensure we get two different colors
    if (index1 === index2 && availableColors.length > 1) {
      index2 = (index1 + 1) % availableColors.length;
    }
    
    color1 = availableColors[index1];
    color2 = availableColors[index2];
  } else {
    // Pure random selection
    const index1 = Math.floor(Math.random() * availableColors.length);
    let index2 = Math.floor(Math.random() * availableColors.length);
    
    // Ensure we get two different colors
    if (index1 === index2 && availableColors.length > 1) {
      index2 = (index1 + 1) % availableColors.length;
    }
    
    color1 = availableColors[index1];
    color2 = availableColors[index2];
  }
  
  const finalContrast1 = calculateDeltaE(logoColor, color1);
  const finalContrast2 = calculateDeltaE(logoColor, color2);
  
  console.log(`🌈 Randomly selected gradient colors: ${color1} and ${color2} (ΔE: ${finalContrast1.toFixed(2)}, ${finalContrast2.toFixed(2)})`);
  
  return createGradientObject(color1, color2, objectWidth, objectScaleX);
}

/**
 * Create a gradient object compatible with Fabric.js
 */
function createGradientObject(color1: string, color2: string, objectWidth?: number, objectScaleX?: number): any {
  // Calculate effective width: base width × scale factor
  const effectiveWidth = objectWidth && objectScaleX ? objectWidth * objectScaleX : (objectWidth || 400);
  
  console.log(`🌈 Creating gradient with effective width: ${effectiveWidth} (base: ${objectWidth}, scale: ${objectScaleX})`);
  
  return {
    type: 'linear',
    gradientUnits: 'pixels',
    coords: {
      x1: 0,
      y1: 0,
      x2: effectiveWidth, // Use effective width (base width × scale)
      y2: 0
    },
    colorStops: [
      {
        offset: 0,
        color: color1
      },
      {
        offset: 1,
        color: color2
      }
    ],
    offsetX: 0,
    offsetY: 0,
    id: 0
  };
}

/**
 * Randomly select a color from the seven predefined colors, excluding colors similar to the logo
 * @param logoColor - The logo color to avoid similar colors to
 * @param similarityThreshold - Delta E threshold for considering colors too similar (default: 15)
 * @param objectId - Optional object ID for consistent randomization
 * @returns A randomly selected color from the predefined palette
 */
export function selectRandomPredefinedColor(
  logoColor: string, 
  similarityThreshold: number = 16,
  objectId?: string
): string {
  console.log(`🎲 Selecting random predefined color, excluding colors similar to logo: ${logoColor}`);
  
  // Filter out colors that are too similar to the logo color
  const availableColors = PREDEFINED_COLORS.filter(color => {
    const deltaE = calculateDeltaE(logoColor, color);
    const isTooSimilar = deltaE < similarityThreshold;
    
    console.log(`🎨 Color ${color}: ΔE = ${deltaE.toFixed(2)} (${isTooSimilar ? 'too similar' : 'acceptable'})`);
    
    return !isTooSimilar;
  });
  
  // If no colors are available (all are too similar), return the most contrasting one
  if (availableColors.length === 0) {
    console.warn('⚠️ All predefined colors are too similar to logo, selecting most contrasting color');
    
    let mostContrastingColor = PREDEFINED_COLORS[0];
    let maxContrast = 0;
    
    for (const color of PREDEFINED_COLORS) {
      const contrast = calculateDeltaE(logoColor, color);
      if (contrast > maxContrast) {
        maxContrast = contrast;
        mostContrastingColor = color;
      }
    }
    
    console.log(`🎨 Selected most contrasting color: ${mostContrastingColor} (ΔE: ${maxContrast.toFixed(2)})`);
    return mostContrastingColor;
  }
  
  // Use object ID for consistent randomization if provided
  let randomIndex: number;
  if (objectId) {
    // Generate a pseudo-random index based on object ID
    let hash = 0;
    for (let i = 0; i < objectId.length; i++) {
      const char = objectId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    randomIndex = Math.abs(hash) % availableColors.length;
  } else {
    // Pure random selection
    randomIndex = Math.floor(Math.random() * availableColors.length);
  }
  
  const selectedColor = availableColors[randomIndex];
  const finalContrast = calculateDeltaE(logoColor, selectedColor);
  
  console.log(`🎲 Randomly selected color: ${selectedColor} from ${availableColors.length} available colors (ΔE: ${finalContrast.toFixed(2)})`);
  
  return selectedColor;
}

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
        
        ctx.drawImage(img, 0, 0, 1, 1);
        const imageData = ctx.getImageData(0, 0, 1, 1);
        const [r, g, b] = imageData.data;
        
        const hexColor = rgbToHex({ r, g, b });
        resolve(hexColor);
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
