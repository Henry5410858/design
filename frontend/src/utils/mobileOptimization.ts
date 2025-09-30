/**
 * Mobile Optimization & PWA System
 * Advanced mobile features, touch optimization, and offline functionality
 */

export interface MobileConfig {
  touchOptimization: {
    enabled: boolean;
    gestureSupport: boolean;
    hapticFeedback: boolean;
    touchDelay: number;
  };
  responsiveBreakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
    large: number;
  };
  offlineSupport: {
    enabled: boolean;
    cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxCacheSize: number;
    offlinePages: string[];
  };
  performance: {
    lazyLoading: boolean;
    imageOptimization: boolean;
    codeSplitting: boolean;
    preloading: boolean;
  };
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'rotate' | 'pan' | 'tap' | 'long-press';
  direction?: 'left' | 'right' | 'up' | 'down';
  threshold: number;
  callback: (event: TouchEvent) => void;
}

export interface OfflineCache {
  url: string;
  data: any;
  timestamp: number;
  expires: number;
  size: number;
}

export interface MobileAnalytics {
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    screenSize: { width: number; height: number };
    orientation: 'portrait' | 'landscape';
  };
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    networkSpeed: 'slow' | 'medium' | 'fast';
  };
  usage: {
    touchEvents: number;
    gestures: number;
    offlineUsage: number;
    errors: number;
  };
}

export class MobileOptimizationManager {
  private config: MobileConfig;
  private gestures: TouchGesture[] = [];
  private cache: Map<string, OfflineCache> = new Map();
  private analytics: MobileAnalytics;
  private isOnline: boolean = navigator.onLine;
  private serviceWorker: ServiceWorker | null = null;

  constructor(config?: Partial<MobileConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.analytics = this.initializeAnalytics();
    this.setupEventListeners();
    this.initializeServiceWorker();
  }

  /**
   * Get default mobile configuration
   */
  private getDefaultConfig(): MobileConfig {
    return {
      touchOptimization: {
        enabled: true,
        gestureSupport: true,
        hapticFeedback: true,
        touchDelay: 300
      },
      responsiveBreakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1280,
        large: 1920
      },
      offlineSupport: {
        enabled: true,
        cacheStrategy: 'stale-while-revalidate',
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        offlinePages: ['/editor', '/templates', '/my-designs']
      },
      performance: {
        lazyLoading: true,
        imageOptimization: true,
        codeSplitting: true,
        preloading: true
      }
    };
  }

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): MobileAnalytics {
    return {
      deviceInfo: {
        type: this.getDeviceType(),
        os: this.getOS(),
        browser: this.getBrowser(),
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      },
      performance: {
        loadTime: 0,
        renderTime: 0,
        memoryUsage: 0,
        networkSpeed: this.getNetworkSpeed()
      },
      usage: {
        touchEvents: 0,
        gestures: 0,
        offlineUsage: 0,
        errors: 0
      }
    };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.analytics.usage.offlineUsage++;
    });

    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.analytics.deviceInfo.screenSize = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        this.analytics.deviceInfo.orientation = 
          window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      }, 100);
    });

    // Performance monitoring
    if ('performance' in window) {
      window.addEventListener('load', () => {
        this.measurePerformance();
      });
    }

    // Memory monitoring
    if ('memory' in performance) {
      setInterval(() => {
        this.analytics.performance.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }, 5000);
    }
  }

  /**
   * Initialize service worker for PWA
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && this.config.offlineSupport.enabled) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration.active || registration.waiting;
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < this.config.responsiveBreakpoints.mobile) {
      return 'mobile';
    } else if (width < this.config.responsiveBreakpoints.tablet) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get operating system
   */
  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac/i.test(userAgent)) return 'macOS';
    if (/Linux/i.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  /**
   * Get browser
   */
  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Get network speed
   */
  private getNetworkSpeed(): 'slow' | 'medium' | 'fast' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return 'slow';
      } else if (connection.effectiveType === '3g') {
        return 'medium';
      } else {
        return 'fast';
      }
    }
    return 'medium';
  }

  /**
   * Measure performance
   */
  private measurePerformance(): void {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.analytics.performance.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.analytics.performance.renderTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    }
  }

  /**
   * Add touch gesture
   */
  addGesture(gesture: TouchGesture): void {
    this.gestures.push(gesture);
    this.setupGestureListener(gesture);
  }

  /**
   * Setup gesture listener
   */
  private setupGestureListener(gesture: TouchGesture): void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const endTime = Date.now();
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const deltaTime = endTime - startTime;

        this.processGesture(gesture, deltaX, deltaY, deltaTime, e);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  /**
   * Process gesture
   */
  private processGesture(
    gesture: TouchGesture, 
    deltaX: number, 
    deltaY: number, 
    deltaTime: number, 
    event: TouchEvent
  ): void {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const direction = this.getDirection(deltaX, deltaY);

    switch (gesture.type) {
      case 'swipe':
        if (distance > gesture.threshold && deltaTime < 500) {
          if (gesture.direction === undefined || gesture.direction === direction) {
            gesture.callback(event);
            this.analytics.usage.gestures++;
          }
        }
        break;
      case 'tap':
        if (distance < 10 && deltaTime < 300) {
          gesture.callback(event);
          this.analytics.usage.gestures++;
        }
        break;
      case 'long-press':
        if (distance < 10 && deltaTime > 500) {
          gesture.callback(event);
          this.analytics.usage.gestures++;
        }
        break;
    }
  }

  /**
   * Get gesture direction
   */
  private getDirection(deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Haptic feedback
   */
  triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium'): void {
    if (this.config.touchOptimization.hapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  }

  /**
   * Cache data for offline use
   */
  async cacheData(url: string, data: any, expiresIn: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cacheEntry: OfflineCache = {
      url,
      data,
      timestamp: Date.now(),
      expires: Date.now() + expiresIn,
      size: JSON.stringify(data).length
    };

    this.cache.set(url, cacheEntry);
    
    // Check cache size limit
    await this.manageCacheSize();
  }

  /**
   * Get cached data
   */
  async getCachedData(url: string): Promise<any> {
    const cached = this.cache.get(url);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    return null;
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
    if (totalSize > this.config.offlineSupport.maxCacheSize) {
      entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(entries.length * 0.2))
        .forEach(([url]) => {
          this.cache.delete(url);
        });
    }
  }

  /**
   * Sync offline data when online
   */
  private async syncOfflineData(): Promise<void> {
    // Implementation for syncing offline data when connection is restored
    console.log('Syncing offline data...');
  }

  /**
   * Optimize images for mobile
   */
  optimizeImage(src: string, width?: number, height?: number): string {
    if (!this.config.performance.imageOptimization) {
      return src;
    }

    const deviceType = this.getDeviceType();
    const screenWidth = window.innerWidth;
    
    // Determine optimal image size
    let targetWidth = width || screenWidth;
    if (deviceType === 'mobile') {
      targetWidth = Math.min(targetWidth, screenWidth);
    } else if (deviceType === 'tablet') {
      targetWidth = Math.min(targetWidth, screenWidth * 0.8);
    }

    // Add image optimization parameters
    const url = new URL(src, window.location.origin);
    url.searchParams.set('w', targetWidth.toString());
    if (height) {
      url.searchParams.set('h', height.toString());
    }
    url.searchParams.set('q', '80'); // Quality
    url.searchParams.set('f', 'webp'); // Format

    return url.toString();
  }

  /**
   * Lazy load images
   */
  setupLazyLoading(): void {
    if (!this.config.performance.lazyLoading) return;

    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Preload critical resources
   */
  preloadResource(href: string, as: string): void {
    if (!this.config.performance.preloading) return;

    // Skip preloading in production environments to avoid excessive unused preloads
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isProduction = (
        hostname.includes('netlify.app') ||
        hostname.includes('vercel.app') ||
        hostname.includes('render.com') ||
        hostname.includes('herokuapp.com') ||
        hostname.includes('github.io') ||
        (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.') && !hostname.startsWith('10.'))
      );
      
      if (isProduction) {
        return;
      }
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }

  /**
   * Get mobile analytics
   */
  getAnalytics(): MobileAnalytics {
    return { ...this.analytics };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    return this.analytics.deviceInfo.type === 'mobile';
  }

  /**
   * Check if device is tablet
   */
  isTablet(): boolean {
    return this.analytics.deviceInfo.type === 'tablet';
  }

  /**
   * Check if device is desktop
   */
  isDesktop(): boolean {
    return this.analytics.deviceInfo.type === 'desktop';
  }

  /**
   * Check if online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get responsive class
   */
  getResponsiveClass(baseClass: string): string {
    const deviceType = this.analytics.deviceInfo.type;
    return `${baseClass} ${baseClass}--${deviceType}`;
  }

  /**
   * Install PWA
   */
  async installPWA(): Promise<boolean> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA installed successfully');
        return true;
      } catch (error) {
        console.error('PWA installation failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  /**
   * Send push notification
   */
  sendNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
}

// Export default instance
export const mobileOptimization = new MobileOptimizationManager();
