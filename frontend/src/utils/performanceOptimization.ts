/**
 * Advanced Performance Optimization System
 * Intelligent caching, lazy loading, image optimization, and performance monitoring
 */

export interface PerformanceConfig {
  caching: {
    enabled: boolean;
    maxCacheSize: number;
    cacheExpiry: number;
    strategies: {
      static: 'cache-first' | 'network-first' | 'stale-while-revalidate';
      api: 'network-first' | 'cache-first' | 'stale-while-revalidate';
      images: 'cache-first' | 'stale-while-revalidate';
    };
  };
  lazyLoading: {
    enabled: boolean;
    threshold: number;
    rootMargin: string;
    delay: number;
  };
  imageOptimization: {
    enabled: boolean;
    formats: string[];
    quality: number;
    sizes: number[];
    placeholder: boolean;
  };
  codeSplitting: {
    enabled: boolean;
    chunks: {
      vendor: boolean;
      common: boolean;
      routes: boolean;
    };
  };
  preloading: {
    enabled: boolean;
    critical: string[];
    prefetch: string[];
  };
  monitoring: {
    enabled: boolean;
    sampleRate: number;
    metrics: string[];
  };
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expires: number;
  size: number;
  hits: number;
  lastAccessed: number;
  tags: string[];
}

export interface PerformanceMetrics {
  coreWebVitals: {
    LCP: number; // Largest Contentful Paint
    FID: number; // First Input Delay
    CLS: number; // Cumulative Layout Shift
    FCP: number; // First Contentful Paint
    TTFB: number; // Time to First Byte
  };
  customMetrics: {
    pageLoadTime: number;
    domContentLoaded: number;
    resourceLoadTime: number;
    memoryUsage: number;
    networkLatency: number;
    renderTime: number;
  };
  userMetrics: {
    interactionTime: number;
    scrollDepth: number;
    timeOnPage: number;
    bounceRate: number;
  };
}

export interface OptimizationResult {
  success: boolean;
  improvements: {
    loadTime: number;
    bundleSize: number;
    cacheHitRate: number;
    imageOptimization: number;
  };
  recommendations: string[];
}

export class PerformanceOptimizationManager {
  private config: PerformanceConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private metrics: PerformanceMetrics;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized: boolean = false;

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.metrics = this.initializeMetrics();
    this.initialize();
  }

  /**
   * Get default performance configuration
   */
  private getDefaultConfig(): PerformanceConfig {
    return {
      caching: {
        enabled: true,
        maxCacheSize: 100 * 1024 * 1024, // 100MB
        cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
        strategies: {
          static: 'cache-first',
          api: 'network-first',
          images: 'stale-while-revalidate'
        }
      },
      lazyLoading: {
        enabled: true,
        threshold: 0.1,
        rootMargin: '50px',
        delay: 100
      },
      imageOptimization: {
        enabled: true,
        formats: ['webp', 'avif', 'png', 'jpg'],
        quality: 80,
        sizes: [320, 640, 768, 1024, 1280, 1920],
        placeholder: true
      },
      codeSplitting: {
        enabled: true,
        chunks: {
          vendor: true,
          common: true,
          routes: true
        }
      },
      preloading: {
        enabled: true,
        critical: ['/editor', '/templates'],
        prefetch: ['/my-designs', '/calendar']
      },
      monitoring: {
        enabled: true,
        sampleRate: 0.1,
        metrics: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB']
      }
    };
  }

  /**
   * Initialize performance optimization
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.setupCoreWebVitals();
    this.setupCustomMetrics();
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.setupPreloading();
    this.setupCaching();

    this.isInitialized = true;
    console.log('🚀 Performance Optimization initialized');
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupCoreWebVitals(): void {
    if (!this.config.monitoring.enabled) return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.coreWebVitals.LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fidEntry = entry as any;
          if (fidEntry.processingStart && fidEntry.startTime) {
            this.metrics.coreWebVitals.FID = fidEntry.processingStart - fidEntry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput && clsEntry.value) {
            clsValue += clsEntry.value;
          }
        });
        this.metrics.coreWebVitals.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.coreWebVitals.FCP = entry.startTime;
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', fcpObserver);
    }

    // Time to First Byte (TTFB)
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.metrics.coreWebVitals.TTFB = navigation.responseStart - navigation.requestStart;
      });
    }
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics(): void {
    if (!this.config.monitoring.enabled) return;

    // Page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.customMetrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.customMetrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      
      // Memory usage
      if ('memory' in performance) {
        this.metrics.customMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }
    });

    // Resource load time
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalLoadTime = 0;
        entries.forEach(entry => {
          totalLoadTime += entry.duration;
        });
        this.metrics.customMetrics.resourceLoadTime = totalLoadTime / entries.length;
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }

    // User interaction metrics
    this.setupUserMetrics();
  }

  /**
   * Setup user interaction metrics
   */
  private setupUserMetrics(): void {
    let interactionStart = Date.now();
    let scrollDepth = 0;
    let maxScrollDepth = 0;

    // Interaction time
    document.addEventListener('click', () => {
      this.metrics.userMetrics.interactionTime = Date.now() - interactionStart;
      interactionStart = Date.now();
    });

    // Scroll depth
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollDepth = (scrollTop / documentHeight) * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
      this.metrics.userMetrics.scrollDepth = maxScrollDepth;
    });

    // Time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      this.metrics.userMetrics.timeOnPage = Date.now() - startTime;
    });
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      coreWebVitals: {
        LCP: 0,
        FID: 0,
        CLS: 0,
        FCP: 0,
        TTFB: 0
      },
      customMetrics: {
        pageLoadTime: 0,
        domContentLoaded: 0,
        resourceLoadTime: 0,
        memoryUsage: 0,
        networkLatency: 0,
        renderTime: 0
      },
      userMetrics: {
        interactionTime: 0,
        scrollDepth: 0,
        timeOnPage: 0,
        bounceRate: 0
      }
    };
  }

  /**
   * Setup lazy loading
   */
  private setupLazyLoading(): void {
    if (!this.config.lazyLoading.enabled) return;

    const lazyElements = document.querySelectorAll('[data-lazy]');
    if (lazyElements.length === 0) return;

    const lazyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.loadLazyElement(element);
            lazyObserver.unobserve(element);
          }
        });
      },
      {
        threshold: this.config.lazyLoading.threshold,
        rootMargin: this.config.lazyLoading.rootMargin
      }
    );

    lazyElements.forEach(element => {
      lazyObserver.observe(element);
    });
  }

  /**
   * Load lazy element
   */
  private loadLazyElement(element: HTMLElement): void {
    const delay = this.config.lazyLoading.delay;
    
    setTimeout(() => {
      const src = element.dataset.src;
      const type = element.dataset.lazy;

      switch (type) {
        case 'image':
          if (src) {
            const img = element as HTMLImageElement;
            img.src = this.optimizeImage(src);
            img.removeAttribute('data-src');
            img.removeAttribute('data-lazy');
          }
          break;
        case 'component':
          if (src) {
            this.loadComponent(src).then(() => {
              element.removeAttribute('data-src');
              element.removeAttribute('data-lazy');
            });
          }
          break;
        case 'content':
          this.loadContent(src || '').then(content => {
            element.innerHTML = content;
            element.removeAttribute('data-src');
            element.removeAttribute('data-lazy');
          });
          break;
      }
    }, delay);
  }

  /**
   * Setup image optimization
   */
  private setupImageOptimization(): void {
    if (!this.config.imageOptimization.enabled) return;

    // Optimize existing images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.dataset.optimized) {
        img.src = this.optimizeImage(img.src);
        img.dataset.optimized = 'true';
      }
    });

    // Add responsive images
    this.addResponsiveImages();
  }

  /**
   * Optimize image URL
   */
  optimizeImage(src: string, width?: number, height?: number): string {
    if (!this.config.imageOptimization.enabled) return src;

    try {
      const url = new URL(src, window.location.origin);
      
      // Add optimization parameters
      if (width) url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      
      url.searchParams.set('q', this.config.imageOptimization.quality.toString());
      url.searchParams.set('f', this.getOptimalFormat());
      
      return url.toString();
    } catch (error) {
      console.error('Error optimizing image:', error);
      return src;
    }
  }

  /**
   * Get optimal image format
   */
  private getOptimalFormat(): string {
    const formats = this.config.imageOptimization.formats;
    
    if (formats.includes('avif') && this.supportsFormat('avif')) {
      return 'avif';
    } else if (formats.includes('webp') && this.supportsFormat('webp')) {
      return 'webp';
    } else if (formats.includes('png')) {
      return 'png';
    } else {
      return 'jpg';
    }
  }

  /**
   * Check if format is supported
   */
  private supportsFormat(format: string): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const context = canvas.getContext('2d');
    if (!context) return false;
    
    return canvas.toDataURL(`image/${format}`).indexOf(`image/${format}`) === 5;
  }

  /**
   * Add responsive images
   */
  private addResponsiveImages(): void {
    const images = document.querySelectorAll('img[data-responsive]');
    
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      if (imgElement.src) {
        const srcset = this.generateSrcSet(imgElement.src);
        imgElement.srcset = srcset;
        imgElement.sizes = this.generateSizes();
      }
    });
  }

  /**
   * Generate srcset for responsive images
   */
  private generateSrcSet(baseSrc: string): string {
    return this.config.imageOptimization.sizes
      .map(size => `${this.optimizeImage(baseSrc, size)} ${size}w`)
      .join(', ');
  }

  /**
   * Generate sizes attribute
   */
  private generateSizes(): string {
    return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }

  /**
   * Setup preloading
   */
  private setupPreloading(): void {
    if (!this.config.preloading.enabled) return;

    // Preload critical resources
    this.config.preloading.critical.forEach(url => {
      this.preloadResource(url, 'fetch');
    });

    // Prefetch non-critical resources
    setTimeout(() => {
      this.config.preloading.prefetch.forEach(url => {
        this.prefetchResource(url);
      });
    }, 2000);
  }

  /**
   * Preload resource
   */
  preloadResource(href: string, as: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }

  /**
   * Prefetch resource
   */
  prefetchResource(href: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  /**
   * Setup caching system
   */
  private setupCaching(): void {
    if (!this.config.caching.enabled) return;

    // Cache management
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000); // Every hour

    // Cache size monitoring
    setInterval(() => {
      this.monitorCacheSize();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Cache data
   */
  async cacheData(key: string, data: any, tags: string[] = [], expiry?: number): Promise<void> {
    if (!this.config.caching.enabled) return;

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + (expiry || this.config.caching.cacheExpiry),
      size: JSON.stringify(data).length,
      hits: 0,
      lastAccessed: Date.now(),
      tags
    };

    this.cache.set(key, entry);
    await this.manageCacheSize();
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any> {
    if (!this.config.caching.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    // Update access info
    entry.hits++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Invalidate cache by tags
   */
  invalidateCacheByTags(tags: string[]): void {
    const entriesToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.tags.some(tag => tags.includes(tag))) {
        entriesToDelete.push(key);
      }
    });

    entriesToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }

  /**
   * Manage cache size
   */
  private async manageCacheSize(): Promise<void> {
    let totalSize = 0;
    const entries = Array.from(this.cache.entries());

    // Calculate total size
    entries.forEach(([_, entry]) => {
      totalSize += entry.size;
    });

    // Remove oldest entries if over limit
    if (totalSize > this.config.caching.maxCacheSize) {
      entries
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
        .slice(0, Math.floor(entries.length * 0.2))
        .forEach(([key]) => {
          this.cache.delete(key);
        });
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expires < now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });
  }

  /**
   * Monitor cache size
   */
  private monitorCacheSize(): void {
    let totalSize = 0;
    let hitRate = 0;
    let totalHits = 0;
    let totalRequests = 0;

    this.cache.forEach(entry => {
      totalSize += entry.size;
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // +1 for the initial request
    });

    hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    console.log(`📊 Cache Stats: Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB, Hit Rate: ${hitRate.toFixed(2)}%`);
  }

  /**
   * Load component dynamically
   */
  private async loadComponent(componentPath: string): Promise<void> {
    try {
      const module = await import(componentPath);
      return module.default;
    } catch (error) {
      console.error('Error loading component:', error);
      throw error;
    }
  }

  /**
   * Load content
   */
  private async loadContent(url: string): Promise<string> {
    try {
      const cached = await this.getCachedData(url);
      if (cached) return cached;

      const response = await fetch(url);
      const content = await response.text();
      
      await this.cacheData(url, content, ['content']);
      return content;
    } catch (error) {
      console.error('Error loading content:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    // LCP recommendations
    if (metrics.coreWebVitals.LCP > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and critical CSS');
    }

    // FID recommendations
    if (metrics.coreWebVitals.FID > 100) {
      recommendations.push('Improve First Input Delay - reduce JavaScript execution time');
    }

    // CLS recommendations
    if (metrics.coreWebVitals.CLS > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift - add dimensions to images and avoid dynamic content insertion');
    }

    // Memory recommendations
    if (metrics.customMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Optimize memory usage - consider lazy loading and code splitting');
    }

    // Cache recommendations
    const cacheSize = Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
    if (cacheSize > this.config.caching.maxCacheSize * 0.8) {
      recommendations.push('Cache size is high - consider increasing cache limits or optimizing cached content');
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): OptimizationResult {
    const metrics = this.getMetrics();
    const recommendations = this.getOptimizationRecommendations();
    
    const cacheHitRate = this.calculateCacheHitRate();
    const improvements = {
      loadTime: this.calculateLoadTimeImprovement(),
      bundleSize: this.calculateBundleSizeImprovement(),
      cacheHitRate,
      imageOptimization: this.calculateImageOptimizationSavings()
    };

    return {
      success: true,
      improvements,
      recommendations
    };
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    let totalHits = 0;
    let totalRequests = 0;

    this.cache.forEach(entry => {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1;
    });

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  /**
   * Calculate load time improvement
   */
  private calculateLoadTimeImprovement(): number {
    const currentLoadTime = this.metrics.customMetrics.pageLoadTime;
    const baseline = 3000; // 3 seconds baseline
    return ((baseline - currentLoadTime) / baseline) * 100;
  }

  /**
   * Calculate bundle size improvement
   */
  private calculateBundleSizeImprovement(): number {
    // This would typically come from webpack-bundle-analyzer or similar
    return 15; // Placeholder for 15% improvement
  }

  /**
   * Calculate image optimization savings
   */
  private calculateImageOptimizationSavings(): number {
    // Calculate based on WebP/AVIF format savings
    return 25; // Placeholder for 25% savings
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Export default instance
export const performanceOptimization = new PerformanceOptimizationManager();
