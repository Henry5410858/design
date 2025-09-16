/**
 * Comprehensive Color System Test
 * Tests all components of the color harmony system
 */

import { 
  generateHarmoniousColorFromOriginal, 
  calculateDeltaE,
  testColorSystem 
} from './colorHarmony';
import { 
  hexToRgb, 
  rgbToHex, 
  rgbToHsl, 
  hslToRgb 
} from './colorScience';

export interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

export class ColorSystemTester {
  private results: TestResult[] = [];

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Comprehensive Color System Tests...');
    this.results = [];

    // Test each step
    await this.testColorConversions();
    await this.testDeltaECalculation();
    await this.testColorGeneration();
    await this.testUniqueness();
    await this.testContrastQuality();
    await this.testEdgeCases();
    await this.testVariousLogoColors();

    // Print summary
    this.printSummary();
    return this.results;
  }

  /**
   * Test color conversion functions
   */
  private async testColorConversions(): Promise<void> {
    console.log('\n🔍 Testing Color Conversions...');
    
    try {
      // Test hex to RGB
      const rgb = hexToRgb('#FF0000');
      if (rgb && rgb.r === 255 && rgb.g === 0 && rgb.b === 0) {
        this.addResult('Color Conversions', 'PASS', 'Hex to RGB conversion works correctly');
      } else {
        this.addResult('Color Conversions', 'FAIL', 'Hex to RGB conversion failed', { expected: {r: 255, g: 0, b: 0}, actual: rgb });
      }

      // Test RGB to hex
      const hex = rgbToHex({ r: 255, g: 0, b: 0 });
      if (hex === '#FF0000') {
        this.addResult('Color Conversions', 'PASS', 'RGB to hex conversion works correctly');
      } else {
        this.addResult('Color Conversions', 'FAIL', 'RGB to hex conversion failed', { expected: '#FF0000', actual: hex });
      }

      // Test RGB to HSL
      const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
      if (hsl && Math.abs(hsl.h - 0) < 0.1 && Math.abs(hsl.s - 1) < 0.1 && Math.abs(hsl.l - 0.5) < 0.1) {
        this.addResult('Color Conversions', 'PASS', 'RGB to HSL conversion works correctly');
      } else {
        this.addResult('Color Conversions', 'FAIL', 'RGB to HSL conversion failed', { expected: {h: 0, s: 1, l: 0.5}, actual: hsl });
      }

      // Test HSL to RGB
      const rgbFromHsl = hslToRgb({ h: 0, s: 1, l: 0.5 });
      if (rgbFromHsl && rgbFromHsl.r === 255 && rgbFromHsl.g === 0 && rgbFromHsl.b === 0) {
        this.addResult('Color Conversions', 'PASS', 'HSL to RGB conversion works correctly');
      } else {
        this.addResult('Color Conversions', 'FAIL', 'HSL to RGB conversion failed', { expected: {r: 255, g: 0, b: 0}, actual: rgbFromHsl });
      }

    } catch (error) {
      this.addResult('Color Conversions', 'FAIL', 'Color conversion test failed with error', { error: error.message });
    }
  }

  /**
   * Test Delta E calculation
   */
  private async testDeltaECalculation(): Promise<void> {
    console.log('\n🔍 Testing Delta E Calculation...');
    
    try {
      // Test identical colors
      const identicalDeltaE = calculateDeltaE('#FF0000', '#FF0000');
      if (identicalDeltaE === 0) {
        this.addResult('Delta E Calculation', 'PASS', 'Identical colors have ΔE = 0');
      } else {
        this.addResult('Delta E Calculation', 'FAIL', 'Identical colors should have ΔE = 0', { actual: identicalDeltaE });
      }

      // Test very different colors
      const differentDeltaE = calculateDeltaE('#FF0000', '#00FF00');
      if (differentDeltaE > 100) {
        this.addResult('Delta E Calculation', 'PASS', 'Very different colors have high ΔE', { deltaE: differentDeltaE });
      } else {
        this.addResult('Delta E Calculation', 'WARNING', 'Very different colors should have high ΔE', { actual: differentDeltaE });
      }

      // Test similar colors
      const similarDeltaE = calculateDeltaE('#FF0000', '#FF0100');
      if (similarDeltaE < 5) {
        this.addResult('Delta E Calculation', 'PASS', 'Similar colors have low ΔE', { deltaE: similarDeltaE });
      } else {
        this.addResult('Delta E Calculation', 'WARNING', 'Similar colors should have low ΔE', { actual: similarDeltaE });
      }

    } catch (error) {
      this.addResult('Delta E Calculation', 'FAIL', 'Delta E calculation test failed with error', { error: error.message });
    }
  }

  /**
   * Test color generation
   */
  private async testColorGeneration(): Promise<void> {
    console.log('\n🔍 Testing Color Generation...');
    
    try {
      const testCases = [
        { logoColor: '#8B5CF6', originalColor: '#F59E0B', objectId: 'test1' },
        { logoColor: '#1D4ED8', originalColor: '#EF4444', objectId: 'test2' },
        { logoColor: '#10B981', originalColor: '#F97316', objectId: 'test3' },
        { logoColor: '#000000', originalColor: '#000000', objectId: 'test4' }, // Same color test
        { logoColor: '#FFFFFF', originalColor: '#FFFFFF', objectId: 'test5' }, // Same color test
      ];

      let allPassed = true;
      for (const testCase of testCases) {
        const generatedColor = generateHarmoniousColorFromOriginal(
          testCase.logoColor, 
          testCase.originalColor, 
          testCase.objectId
        );

        // Check if color is valid hex
        if (!/^#[0-9A-F]{6}$/i.test(generatedColor)) {
          this.addResult('Color Generation', 'FAIL', `Invalid hex color generated: ${generatedColor}`, testCase);
          allPassed = false;
        }

        // Check if color is different from original (unless they're the same)
        if (testCase.logoColor !== testCase.originalColor && generatedColor === testCase.originalColor) {
          this.addResult('Color Generation', 'WARNING', `Generated color same as original: ${generatedColor}`, testCase);
        }
      }

      if (allPassed) {
        this.addResult('Color Generation', 'PASS', 'All color generation tests passed');
      }

    } catch (error) {
      this.addResult('Color Generation', 'FAIL', 'Color generation test failed with error', { error: error.message });
    }
  }

  /**
   * Test uniqueness of generated colors
   */
  private async testUniqueness(): Promise<void> {
    console.log('\n🔍 Testing Color Uniqueness...');
    
    try {
      const logoColor = '#8B5CF6';
      const originalColor = '#F59E0B';
      const objectIds = ['obj1', 'obj2', 'obj3', 'obj4', 'obj5'];

      const generatedColors = objectIds.map(id => 
        generateHarmoniousColorFromOriginal(logoColor, originalColor, id)
      );

      // Check uniqueness
      const uniqueColors = new Set(generatedColors);
      const uniquenessRatio = uniqueColors.size / generatedColors.length;

      if (uniquenessRatio >= 0.8) { // At least 80% unique
        this.addResult('Color Uniqueness', 'PASS', `Good uniqueness: ${uniqueColors.size}/${generatedColors.length} unique colors`);
      } else if (uniquenessRatio >= 0.5) {
        this.addResult('Color Uniqueness', 'WARNING', `Moderate uniqueness: ${uniqueColors.size}/${generatedColors.length} unique colors`);
      } else {
        this.addResult('Color Uniqueness', 'FAIL', `Poor uniqueness: ${uniqueColors.size}/${generatedColors.length} unique colors`);
      }

    } catch (error) {
      this.addResult('Color Uniqueness', 'FAIL', 'Color uniqueness test failed with error', { error: error.message });
    }
  }

  /**
   * Test contrast quality
   */
  private async testContrastQuality(): Promise<void> {
    console.log('\n🔍 Testing Contrast Quality...');
    
    try {
      const testCases = [
        { logoColor: '#8B5CF6', originalColor: '#F59E0B' },
        { logoColor: '#1D4ED8', originalColor: '#EF4444' },
        { logoColor: '#10B981', originalColor: '#F97316' },
        { logoColor: '#000000', originalColor: '#FFFFFF' },
        { logoColor: '#FFFFFF', originalColor: '#000000' },
      ];

      let goodContrastCount = 0;
      for (const testCase of testCases) {
        const generatedColor = generateHarmoniousColorFromOriginal(
          testCase.logoColor, 
          testCase.originalColor, 
          'test'
        );

        const contrast = calculateDeltaE(testCase.logoColor, generatedColor);
        if (contrast > 8) { // Good contrast threshold
          goodContrastCount++;
        }
      }

      const contrastRatio = goodContrastCount / testCases.length;
      if (contrastRatio >= 0.8) {
        this.addResult('Contrast Quality', 'PASS', `Good contrast: ${goodContrastCount}/${testCases.length} cases`);
      } else if (contrastRatio >= 0.5) {
        this.addResult('Contrast Quality', 'WARNING', `Moderate contrast: ${goodContrastCount}/${testCases.length} cases`);
      } else {
        this.addResult('Contrast Quality', 'FAIL', `Poor contrast: ${goodContrastCount}/${testCases.length} cases`);
      }

    } catch (error) {
      this.addResult('Contrast Quality', 'FAIL', 'Contrast quality test failed with error', { error: error.message });
    }
  }

  /**
   * Test edge cases
   */
  private async testEdgeCases(): Promise<void> {
    console.log('\n🔍 Testing Edge Cases...');
    
    try {
      // Test with invalid colors
      const invalidColor = generateHarmoniousColorFromOriginal('invalid', '#FF0000', 'test');
      if (invalidColor && /^#[0-9A-F]{6}$/i.test(invalidColor)) {
        this.addResult('Edge Cases', 'PASS', 'Handles invalid logo color gracefully');
      } else {
        this.addResult('Edge Cases', 'FAIL', 'Does not handle invalid logo color properly');
      }

      // Test with empty object ID
      const emptyIdColor = generateHarmoniousColorFromOriginal('#FF0000', '#00FF00', '');
      if (emptyIdColor && /^#[0-9A-F]{6}$/i.test(emptyIdColor)) {
        this.addResult('Edge Cases', 'PASS', 'Handles empty object ID gracefully');
      } else {
        this.addResult('Edge Cases', 'FAIL', 'Does not handle empty object ID properly');
      }

      // Test with undefined object ID
      const undefinedIdColor = generateHarmoniousColorFromOriginal('#FF0000', '#00FF00', undefined);
      if (undefinedIdColor && /^#[0-9A-F]{6}$/i.test(undefinedIdColor)) {
        this.addResult('Edge Cases', 'PASS', 'Handles undefined object ID gracefully');
      } else {
        this.addResult('Edge Cases', 'FAIL', 'Does not handle undefined object ID properly');
      }

    } catch (error) {
      this.addResult('Edge Cases', 'FAIL', 'Edge cases test failed with error', { error: error.message });
    }
  }

  /**
   * Test various logo colors
   */
  private async testVariousLogoColors(): Promise<void> {
    console.log('\n🔍 Testing Various Logo Colors...');
    
    try {
      const logoColors = [
        '#FF0000', // Red
        '#00FF00', // Green
        '#0000FF', // Blue
        '#FFFF00', // Yellow
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#800080', // Purple
        '#FFA500', // Orange
        '#000000', // Black
        '#FFFFFF', // White
        '#808080', // Gray
        '#8B4513', // Brown
      ];

      const originalColor = '#F59E0B';
      let goodContrastCount = 0;

      for (const logoColor of logoColors) {
        const generatedColor = generateHarmoniousColorFromOriginal(logoColor, originalColor, 'test');
        const contrast = calculateDeltaE(logoColor, generatedColor);
        
        console.log(`🎨 Logo: ${logoColor} → Generated: ${generatedColor} (ΔE: ${contrast.toFixed(2)})`);
        
        if (contrast > 8) {
          goodContrastCount++;
        }
      }

      const contrastRatio = goodContrastCount / logoColors.length;
      if (contrastRatio >= 0.8) {
        this.addResult('Various Logo Colors', 'PASS', `Good contrast with ${goodContrastCount}/${logoColors.length} logo colors`);
      } else if (contrastRatio >= 0.5) {
        this.addResult('Various Logo Colors', 'WARNING', `Moderate contrast with ${goodContrastCount}/${logoColors.length} logo colors`);
      } else {
        this.addResult('Various Logo Colors', 'FAIL', `Poor contrast with ${goodContrastCount}/${logoColors.length} logo colors`);
      }

    } catch (error) {
      this.addResult('Various Logo Colors', 'FAIL', 'Various logo colors test failed with error', { error: error.message });
    }
  }

  /**
   * Add a test result
   */
  private addResult(step: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any): void {
    this.results.push({ step, status, message, details });
    console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${step}: ${message}`);
    if (details) {
      console.log('   Details:', details);
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('\n📊 Test Summary:');
    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    const warningCount = this.results.filter(r => r.status === 'WARNING').length;
    const totalCount = this.results.length;

    console.log(`✅ Passed: ${passCount}/${totalCount}`);
    console.log(`❌ Failed: ${failCount}/${totalCount}`);
    console.log(`⚠️ Warnings: ${warningCount}/${totalCount}`);

    if (failCount === 0) {
      console.log('🎉 All critical tests passed! Color system is working properly.');
    } else {
      console.log('🚨 Some tests failed. Please check the issues above.');
    }
  }
}

/**
 * Run the comprehensive test
 */
export async function runColorSystemTest(): Promise<TestResult[]> {
  const tester = new ColorSystemTester();
  return await tester.runAllTests();
}

// Auto-run test when imported
if (typeof window !== 'undefined') {
  console.log('🧪 Color System Test loaded. Run runColorSystemTest() to test the system.');
}
