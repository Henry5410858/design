/**
 * Advanced Monitoring & Analytics System
 * Real-time monitoring, logging, and system analytics
 */

export interface MonitoringConfig {
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    maxEntries: number;
    retention: number;
  };
  metrics: {
    enabled: boolean;
    collectionInterval: number;
    realTime: boolean;
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      errorRate: number;
      responseTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
  analytics: {
    enabled: boolean;
    userTracking: boolean;
    performanceTracking: boolean;
    businessMetrics: boolean;
  };
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  source: string;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface Alert {
  id: string;
  type: 'threshold' | 'anomaly' | 'error' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold?: number;
  timestamp: Date;
  resolved: boolean;
  acknowledged: boolean;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    uptime: number;
  }>;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
}

export interface BusinessMetrics {
  users: {
    active: number;
    new: number;
    returning: number;
    churn: number;
  };
  engagement: {
    sessionDuration: number;
    pageViews: number;
    bounceRate: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    mrr: number;
    arr: number;
    churn: number;
  };
}

export class AdvancedMonitoringManager {
  private config: MonitoringConfig;
  private logs: LogEntry[] = [];
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private systemHealth: SystemHealth;
  private businessMetrics: BusinessMetrics;
  private sessionId: string;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.sessionId = this.generateSessionId();
    this.systemHealth = this.initializeSystemHealth();
    this.businessMetrics = this.initializeBusinessMetrics();
    
    this.initializeMonitoring();
  }

  /**
   * Get default monitoring configuration
   */
  private getDefaultConfig(): MonitoringConfig {
    return {
      logging: {
        enabled: true,
        level: 'info',
        maxEntries: 10000,
        retention: 7 * 24 * 60 * 60 * 1000 // 7 days
      },
      metrics: {
        enabled: true,
        collectionInterval: 5000, // 5 seconds
        realTime: true
      },
      alerts: {
        enabled: true,
        thresholds: {
          errorRate: 5, // 5%
          responseTime: 2000, // 2 seconds
          memoryUsage: 80, // 80%
          cpuUsage: 90 // 90%
        }
      },
      analytics: {
        enabled: true,
        userTracking: true,
        performanceTracking: true,
        businessMetrics: true
      }
    };
  }

  /**
   * Initialize monitoring system
   */
  private initializeMonitoring(): void {
    this.setupLogging();
    this.setupMetricsCollection();
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
    this.setupUserTracking();
    
    console.log('📊 Advanced Monitoring System initialized');
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize system health
   */
  private initializeSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      services: [],
      resources: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      },
      performance: {
        avgResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        availability: 100
      }
    };
  }

  /**
   * Initialize business metrics
   */
  private initializeBusinessMetrics(): BusinessMetrics {
    return {
      users: {
        active: 0,
        new: 0,
        returning: 0,
        churn: 0
      },
      engagement: {
        sessionDuration: 0,
        pageViews: 0,
        bounceRate: 0,
        conversionRate: 0
      },
      revenue: {
        total: 0,
        mrr: 0,
        arr: 0,
        churn: 0
      }
    };
  }

  /**
   * Setup logging
   */
  private setupLogging(): void {
    if (!this.config.logging.enabled) return;

    // Override console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    console.log = (...args) => {
      this.log('debug', 'console', args.join(' '));
      originalConsole.log(...args);
    };

    console.info = (...args) => {
      this.log('info', 'console', args.join(' '));
      originalConsole.info(...args);
    };

    console.warn = (...args) => {
      this.log('warn', 'console', args.join(' '));
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.log('error', 'console', args.join(' '));
      originalConsole.error(...args);
    };

    // Global error handler
    window.addEventListener('error', (event) => {
      this.log('error', 'global', `Uncaught error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'promise', `Unhandled promise rejection: ${event.reason}`, {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  /**
   * Setup metrics collection
   */
  private setupMetricsCollection(): void {
    if (!this.config.metrics.enabled) return;

    // Collect metrics at regular intervals
    setInterval(() => {
      this.collectSystemMetrics();
      this.collectPerformanceMetrics();
      this.collectUserMetrics();
    }, this.config.metrics.collectionInterval);

    // Initial collection
    this.collectSystemMetrics();
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Network error monitoring
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(...args) {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch.apply(this, args);
        const duration = Date.now() - startTime;
        
        self.recordMetric('network_request_duration', duration, 'ms', {
          url: String(args[0]),
          method: args[1]?.method || 'GET',
          status: response.status.toString()
        });

        if (!response.ok) {
          self.log('error', 'network', `HTTP ${response.status}: ${response.statusText}`, {
            url: String(args[0]),
            method: args[1]?.method || 'GET',
            status: response.status
          });
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        self.recordMetric('network_request_error', 1, 'count', {
          url: String(args[0]),
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        self.log('error', 'network', `Network request failed: ${error}`, {
          url: String(args[0]),
          duration
        });

        throw error;
      }
    };
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.analytics.performanceTracking) return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms');
      this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
      this.recordMetric('first_byte', navigation.responseStart - navigation.fetchStart, 'ms');
      
      this.log('info', 'performance', 'Page load completed', {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domReady: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstByte: navigation.responseStart - navigation.fetchStart
      });
    });

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const resourceEntry = entry as any;
          this.recordMetric('resource_load_time', entry.duration, 'ms', {
            type: resourceEntry.initiatorType || 'unknown',
            name: entry.name
          });
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Setup user tracking
   */
  private setupUserTracking(): void {
    if (!this.config.analytics.userTracking) return;

    // Track page views
    let lastPage = window.location.pathname;
    const trackPageView = () => {
      const currentPage = window.location.pathname;
      if (currentPage !== lastPage) {
        this.trackEvent('page_view', {
          page: currentPage,
          previousPage: lastPage,
          referrer: document.referrer
        });
        lastPage = currentPage;
      }
    };

    // Track on navigation
    window.addEventListener('popstate', trackPageView);
    
    // Track user interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackEvent('click', {
        element: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 100)
      });
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.recordMetric('scroll_depth', maxScrollDepth, 'percent');
      }
    });

    // Track session duration
    const sessionStart = Date.now();
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - sessionStart;
      this.recordMetric('session_duration', sessionDuration, 'ms');
      this.trackEvent('session_end', { duration: sessionDuration });
    });
  }

  /**
   * Log entry
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', category: string, message: string, data?: any): void {
    if (!this.config.logging.enabled) return;
    if (this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
      source: 'frontend'
    };

    this.logs.push(logEntry);
    this.cleanupLogs();

    // Check for alerts
    if (level === 'error' && this.config.alerts.enabled) {
      this.checkErrorRateAlert();
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logging.level);
    const messageLevel = levels.indexOf(level);
    
    return messageLevel < configLevel;
  }

  /**
   * Record metric
   */
  recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
    if (!this.config.metrics.enabled) return;

    const metric: Metric = {
      id: this.generateId(),
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);
    this.cleanupMetrics();

    // Check for threshold alerts
    if (this.config.alerts.enabled) {
      this.checkThresholdAlerts(metric);
    }
  }

  /**
   * Track event
   */
  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.config.analytics.enabled) return;

    this.log('info', 'analytics', `Event: ${eventName}`, properties);
    this.recordMetric('event_count', 1, 'count', { event: eventName });

    // Update business metrics
    this.updateBusinessMetrics(eventName, properties);
  }

  /**
   * Update business metrics
   */
  private updateBusinessMetrics(eventName: string, properties: Record<string, any>): void {
    if (!this.config.analytics.businessMetrics) return;

    switch (eventName) {
      case 'page_view':
        this.businessMetrics.engagement.pageViews++;
        break;
      case 'session_end':
        this.businessMetrics.engagement.sessionDuration = properties.duration || 0;
        break;
      case 'user_signup':
        this.businessMetrics.users.new++;
        break;
      case 'user_login':
        this.businessMetrics.users.active++;
        break;
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes');
      this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes');
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes');
    }

    // Connection information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric('connection_type', connection.effectiveType === '4g' ? 4 : connection.effectiveType === '3g' ? 3 : 2, 'level');
      this.recordMetric('connection_downlink', connection.downlink, 'mbps');
      this.recordMetric('connection_rtt', connection.rtt, 'ms');
    }

    // Device information
    this.recordMetric('screen_width', window.screen.width, 'px');
    this.recordMetric('screen_height', window.screen.height, 'px');
    this.recordMetric('viewport_width', window.innerWidth, 'px');
    this.recordMetric('viewport_height', window.innerHeight, 'px');
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): void {
    // Frame rate
    if ('requestAnimationFrame' in window) {
      let frameCount = 0;
      let lastTime = performance.now();
      
      const measureFrameRate = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          this.recordMetric('fps', fps, 'fps');
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFrameRate);
      };
      
      requestAnimationFrame(measureFrameRate);
    }
  }

  /**
   * Collect user metrics
   */
  private collectUserMetrics(): void {
    // Active time
    let activeTime = 0;
    let lastActiveTime = Date.now();
    
    const updateActiveTime = () => {
      const now = Date.now();
      activeTime += now - lastActiveTime;
      lastActiveTime = now;
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, updateActiveTime, true);
    });

    // Record active time every minute
    setInterval(() => {
      this.recordMetric('active_time', activeTime, 'ms');
      activeTime = 0;
    }, 60000);
  }

  /**
   * Check threshold alerts
   */
  private checkThresholdAlerts(metric: Metric): void {
    const thresholds = this.config.alerts.thresholds;

    switch (metric.name) {
      case 'network_request_duration':
        if (metric.value > thresholds.responseTime) {
          this.createAlert('threshold', 'medium', 
            `Response time exceeded threshold: ${metric.value}ms`, 
            metric.name, metric.value, thresholds.responseTime);
        }
        break;
      
      case 'memory_used':
        const memoryPercent = (metric.value / (1024 * 1024 * 1024)) * 100; // Convert to GB and percentage
        if (memoryPercent > thresholds.memoryUsage) {
          this.createAlert('threshold', 'high',
            `Memory usage exceeded threshold: ${memoryPercent.toFixed(2)}%`,
            metric.name, memoryPercent, thresholds.memoryUsage);
        }
        break;
    }
  }

  /**
   * Check error rate alert
   */
  private checkErrorRateAlert(): void {
    const recentLogs = this.logs.filter(
      log => log.timestamp.getTime() > Date.now() - 60000 // Last minute
    );

    const errorLogs = recentLogs.filter(log => log.level === 'error');
    const errorRate = (errorLogs.length / recentLogs.length) * 100;

    if (errorRate > this.config.alerts.thresholds.errorRate) {
      this.createAlert('error', 'high',
        `Error rate exceeded threshold: ${errorRate.toFixed(2)}%`,
        'error_rate', errorRate, this.config.alerts.thresholds.errorRate);
    }
  }

  /**
   * Create alert
   */
  private createAlert(type: 'threshold' | 'anomaly' | 'error' | 'performance', 
                     severity: 'low' | 'medium' | 'high' | 'critical',
                     message: string,
                     metric: string,
                     value: number,
                     threshold?: number): void {
    const alert: Alert = {
      id: this.generateId(),
      type,
      severity,
      message,
      metric,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false,
      acknowledged: false
    };

    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Send real-time notification for critical alerts
    if (severity === 'critical') {
      this.sendNotification(alert);
    }
  }

  /**
   * Send notification
   */
  private sendNotification(alert: Alert): void {
    console.warn('🚨 ALERT:', alert);
    
    // In a real implementation, this would send to a notification service
    // or display in the UI
  }

  /**
   * Cleanup logs
   */
  private cleanupLogs(): void {
    const retentionTime = Date.now() - this.config.logging.retention;
    
    this.logs = this.logs.filter(log => log.timestamp.getTime() > retentionTime);
    
    if (this.logs.length > this.config.logging.maxEntries) {
      this.logs = this.logs.slice(-this.config.logging.maxEntries);
    }
  }

  /**
   * Cleanup metrics
   */
  private cleanupMetrics(): void {
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get logs
   */
  getLogs(level?: string, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  /**
   * Get metrics
   */
  getMetrics(name?: string, limit: number = 100): Metric[] {
    let filteredMetrics = this.metrics;
    
    if (name) {
      filteredMetrics = filteredMetrics.filter(metric => metric.name === name);
    }
    
    return filteredMetrics.slice(-limit);
  }

  /**
   * Get alerts
   */
  getAlerts(resolved: boolean = false, limit: number = 50): Alert[] {
    return this.alerts
      .filter(alert => alert.resolved === resolved)
      .slice(-limit);
  }

  /**
   * Get system health
   */
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  /**
   * Get business metrics
   */
  getBusinessMetrics(): BusinessMetrics {
    return { ...this.businessMetrics };
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Export data
   */
  exportData(): any {
    return {
      logs: this.logs,
      metrics: this.metrics,
      alerts: this.alerts,
      systemHealth: this.systemHealth,
      businessMetrics: this.businessMetrics,
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.logs = [];
    this.metrics = [];
    this.alerts = [];
  }
}

// Export default instance
export const advancedMonitoring = new AdvancedMonitoringManager();
