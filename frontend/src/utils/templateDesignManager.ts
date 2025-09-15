/**
 * Template Design Manager
 * Manages automatic design image generation for templates
 */

import { generateDesignImageWithFallback, generateDesignImageSet, createTemplateDesignData, extractDesignDimensions } from './autoDesignImageGenerator';
import { Template } from '@/types';

export interface TemplateDesignImage {
  thumbnail: string;
  preview: string;
  large: string;
  generated: boolean;
  lastGenerated?: Date;
}

export interface TemplateWithDesign extends Template {
  designData?: any;
  designImages?: TemplateDesignImage;
}

/**
 * Template Design Manager Class
 */
export class TemplateDesignManager {
  private static instance: TemplateDesignManager;
  private designCache: Map<string, TemplateDesignImage> = new Map();
  private generationQueue: Set<string> = new Set();

  private constructor() {}

  static getInstance(): TemplateDesignManager {
    if (!TemplateDesignManager.instance) {
      TemplateDesignManager.instance = new TemplateDesignManager();
    }
    return TemplateDesignManager.instance;
  }

  /**
   * Load design data for a template
   */
  async loadDesignData(templateId: string): Promise<any | null> {
    try {
      console.log(`📁 Loading design data for template: ${templateId}`);
      
      // Try to load from the designs directory
      const response = await fetch(`/api/templates/${templateId}/design`);
      
      if (response.ok) {
        const designData = await response.json();
        console.log(`✅ Design data loaded for template: ${templateId}`);
        return designData;
      } else {
        console.log(`⚠️ No design data found for template: ${templateId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error loading design data for template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Generate design images for a template
   */
  async generateDesignImages(template: Template): Promise<TemplateDesignImage | null> {
    const templateId = template.id;
    
    // Check if already in cache
    if (this.designCache.has(templateId)) {
      console.log(`📋 Using cached design images for template: ${templateId}`);
      return this.designCache.get(templateId)!;
    }

    // Check if already generating
    if (this.generationQueue.has(templateId)) {
      console.log(`⏳ Design images already being generated for template: ${templateId}`);
      return null;
    }

    // Add to generation queue
    this.generationQueue.add(templateId);

    try {
      console.log(`🎨 Generating design images for template: ${templateId}`);
      
      // Load design data
      const designData = await this.loadDesignData(templateId);
      
      if (!designData) {
        console.log(`⚠️ No design data available for template: ${templateId}`);
        return null;
      }

      // Generate images
      const imageSet = await generateDesignImageSet(designData, [
        { name: 'thumbnail', width: 200, height: 200 },
        { name: 'preview', width: 400, height: 400 },
        { name: 'large', width: 800, height: 800 }
      ]);

      const designImages: TemplateDesignImage = {
        thumbnail: imageSet.thumbnail || template.thumbnail,
        preview: imageSet.preview || template.thumbnail,
        large: imageSet.large || template.thumbnail,
        generated: true,
        lastGenerated: new Date()
      };

      // Cache the result
      this.designCache.set(templateId, designImages);
      
      console.log(`✅ Design images generated for template: ${templateId}`);
      return designImages;

    } catch (error) {
      console.error(`❌ Error generating design images for template ${templateId}:`, error);
      return null;
    } finally {
      // Remove from generation queue
      this.generationQueue.delete(templateId);
    }
  }

  /**
   * Get design images for a template (with caching)
   */
  async getDesignImages(template: Template): Promise<TemplateDesignImage | null> {
    const templateId = template.id;
    
    // Check cache first
    if (this.designCache.has(templateId)) {
      return this.designCache.get(templateId)!;
    }

    // Generate if not in cache
    return await this.generateDesignImages(template);
  }

  /**
   * Preload design images for multiple templates
   */
  async preloadDesignImages(templates: Template[]): Promise<void> {
    console.log(`🚀 Preloading design images for ${templates.length} templates...`);
    
    const promises = templates.map(template => 
      this.generateDesignImages(template).catch(error => {
        console.error(`❌ Error preloading design images for template ${template.id}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
    console.log(`✅ Preloading completed for ${templates.length} templates`);
  }

  /**
   * Clear cache for a specific template
   */
  clearTemplateCache(templateId: string): void {
    this.designCache.delete(templateId);
    console.log(`🗑️ Cache cleared for template: ${templateId}`);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.designCache.clear();
    console.log(`🗑️ All design image cache cleared`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; templates: string[] } {
    return {
      size: this.designCache.size,
      templates: Array.from(this.designCache.keys())
    };
  }

  /**
   * Create a template with design data
   */
  async createTemplateWithDesign(template: Template): Promise<TemplateWithDesign> {
    const designData = await this.loadDesignData(template.id);
    const designImages = await this.getDesignImages(template);
    
    return {
      ...template,
      designData,
      designImages: designImages || undefined
    };
  }

  /**
   * Batch create templates with design data
   */
  async createTemplatesWithDesign(templates: Template[]): Promise<TemplateWithDesign[]> {
    console.log(`🚀 Creating ${templates.length} templates with design data...`);
    
    const results = await Promise.all(
      templates.map(template => this.createTemplateWithDesign(template))
    );
    
    console.log(`✅ Created ${results.length} templates with design data`);
    return results;
  }
}

// Export singleton instance
export const templateDesignManager = TemplateDesignManager.getInstance();

/**
 * Hook for using template design manager in React components
 */
export function useTemplateDesignManager() {
  return templateDesignManager;
}
