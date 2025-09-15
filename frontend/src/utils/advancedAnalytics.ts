/**
 * Advanced Analytics & Insights System
 * Comprehensive user behavior tracking, design performance metrics, and business intelligence
 */

export interface UserEvent {
  id: string;
  userId: string;
  eventType: 'click' | 'hover' | 'drag' | 'resize' | 'text_edit' | 'color_change' | 'export' | 'save' | 'load' | 'template_select';
  elementType: 'button' | 'canvas' | 'toolbar' | 'sidebar' | 'modal' | 'dropdown' | 'input' | 'text' | 'image' | 'shape';
  elementId?: string;
  elementName?: string;
  timestamp: Date;
  sessionId: string;
  metadata: {
    position?: { x: number; y: number };
    duration?: number;
    value?: any;
    previousValue?: any;
    canvasData?: any;
    deviceInfo?: DeviceInfo;
    performance?: PerformanceMetrics;
    elementId?: string;
    elementName?: string;
  };
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: { width: number; height: number };
  viewportSize: { width: number; height: number };
  deviceType: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  language: string;
  timezone: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cpuUsage?: number;
  networkLatency?: number;
  errorCount: number;
}

export interface DesignAnalytics {
  designId: string;
  templateId: string;
  userId: string;
  createdAt: Date;
  lastModified: Date;
  totalSessions: number;
  totalTimeSpent: number;
  totalInteractions: number;
  completionRate: number;
  exportCount: number;
  shareCount: number;
  downloadCount: number;
  performance: {
    averageLoadTime: number;
    averageRenderTime: number;
    errorRate: number;
    userSatisfactionScore: number;
  };
  engagement: {
    uniqueVisitors: number;
    returnVisitors: number;
    bounceRate: number;
    averageSessionDuration: number;
    mostUsedFeatures: Array<{ feature: string; count: number }>;
    popularElements: Array<{ element: string; usage: number }>;
  };
  designMetrics: {
    complexityScore: number;
    colorHarmonyScore: number;
    typographyScore: number;
    layoutScore: number;
    overallScore: number;
  };
}

export interface A_BTestVariant {
  id: string;
  name: string;
  description: string;
  configuration: any;
  trafficAllocation: number; // 0-1
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  metrics: {
    participants: number;
    conversions: number;
    conversionRate: number;
    statisticalSignificance: number;
    confidence: number;
  };
}

export interface A_BTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: A_BTestVariant[];
  targetMetric: 'completion_rate' | 'export_rate' | 'session_duration' | 'user_satisfaction' | 'engagement_score';
  status: 'draft' | 'running' | 'completed' | 'paused';
  createdAt: Date;
  startDate?: Date;
  endDate?: Date;
  results?: {
    winner?: string;
    improvement?: number;
    statisticalSignificance: number;
    confidence: number;
    recommendation: string;
  };
}

export interface BusinessIntelligence {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalDesigns: number;
    totalExports: number;
    revenue: number;
    growthRate: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    designCreation: Array<{ date: string; count: number }>;
    exportTrends: Array<{ date: string; count: number }>;
    featureUsage: Array<{ feature: string; usage: number; trend: 'up' | 'down' | 'stable' }>;
  };
  insights: {
    topPerformingTemplates: Array<{ templateId: string; usage: number; satisfaction: number }>;
    userSegments: Array<{ segment: string; size: number; characteristics: string[] }>;
    conversionFunnels: Array<{ stage: string; users: number; conversionRate: number }>;
    recommendations: string[];
  };
  predictions: {
    userGrowth: Array<{ date: string; predicted: number; confidence: number }>;
    revenue: Array<{ date: string; predicted: number; confidence: number }>;
    churnRisk: Array<{ userId: string; risk: number; factors: string[] }>;
  };
}

export interface AnalyticsDashboard {
  realTimeMetrics: {
    activeUsers: number;
    currentSessions: number;
    designsCreatedToday: number;
    exportsToday: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  charts: {
    userActivity: Array<{ time: string; users: number; sessions: number }>;
    featureUsage: Array<{ feature: string; usage: number }>;
    performanceMetrics: Array<{ metric: string; value: number; trend: number }>;
    geographicDistribution: Array<{ country: string; users: number }>;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    message: string;
    timestamp: Date;
    action?: string;
  }>;
}

export class AdvancedAnalyticsManager {
  private events: UserEvent[] = [];
  private sessionId: string;
  private userId: string;
  private isTracking: boolean = true;
  private eventQueue: UserEvent[] = [];
  private batchSize: number = 10;
  private flushInterval: number = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor(userId: string) {
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.startBatchFlush();
    this.initializeTracking();
  }

  /**
   * Track user event
   */
  trackEvent(
    eventType: UserEvent['eventType'],
    elementType: UserEvent['elementType'],
    metadata: Partial<UserEvent['metadata']> = {}
  ): void {
    if (!this.isTracking) return;

    const event: UserEvent = {
      id: this.generateEventId(),
      userId: this.userId,
      eventType,
      elementType,
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        deviceInfo: this.getDeviceInfo(),
        performance: this.getPerformanceMetrics(),
        ...metadata
      }
    };

    this.eventQueue.push(event);
    
    // Process high-priority events immediately
    if (this.isHighPriorityEvent(eventType)) {
      this.flushEvents();
    }
  }

  /**
   * Track design creation
   */
  trackDesignCreation(templateId: string, designId: string): void {
    this.trackEvent('template_select', 'canvas', {
      value: { templateId, designId },
      canvasData: { templateId, designId }
    });
  }

  /**
   * Track design modification
   */
  trackDesignModification(designId: string, changes: any): void {
    this.trackEvent('drag', 'canvas', {
      elementId: designId,
      value: changes
    });
  }

  /**
   * Track export action
   */
  trackExport(format: string, fileSize: number, processingTime: number): void {
    this.trackEvent('export', 'button', {
      elementName: `export_${format}`,
      value: { format, fileSize, processingTime }
    });
  }

  /**
   * Track user session
   */
  trackSession(sessionData: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    pageViews: number;
    interactions: number;
  }): void {
    this.trackEvent('load', 'canvas', {
      value: sessionData
    });
  }

  /**
   * Get design analytics
   */
  async getDesignAnalytics(designId: string): Promise<DesignAnalytics> {
    const events = this.events.filter(e => 
      e.metadata.canvasData?.designId === designId
    );

    const sessions = new Set(events.map(e => e.sessionId)).size;
    const totalTime = this.calculateTotalTime(events);
    const interactions = events.length;
    const exports = events.filter(e => e.eventType === 'export').length;

    return {
      designId,
      templateId: events[0]?.metadata.canvasData?.templateId || '',
      userId: this.userId,
      createdAt: events[0]?.timestamp || new Date(),
      lastModified: events[events.length - 1]?.timestamp || new Date(),
      totalSessions: sessions,
      totalTimeSpent: totalTime,
      totalInteractions: interactions,
      completionRate: this.calculateCompletionRate(events),
      exportCount: exports,
      shareCount: 0, // Would be tracked separately
      downloadCount: 0, // Would be tracked separately
      performance: {
        averageLoadTime: this.calculateAverageLoadTime(events),
        averageRenderTime: this.calculateAverageRenderTime(events),
        errorRate: this.calculateErrorRate(events),
        userSatisfactionScore: this.calculateSatisfactionScore(events)
      },
      engagement: {
        uniqueVisitors: sessions,
        returnVisitors: this.calculateReturnVisitors(events),
        bounceRate: this.calculateBounceRate(events),
        averageSessionDuration: totalTime / sessions,
        mostUsedFeatures: this.getMostUsedFeatures(events),
        popularElements: this.getPopularElements(events)
      },
      designMetrics: {
        complexityScore: this.calculateComplexityScore(events),
        colorHarmonyScore: this.calculateColorHarmonyScore(events),
        typographyScore: this.calculateTypographyScore(events),
        layoutScore: this.calculateLayoutScore(events),
        overallScore: 0 // Calculated from other scores
      }
    };
  }

  /**
   * Create A/B test
   */
  async createABTest(test: Omit<A_BTest, 'id' | 'createdAt'>): Promise<A_BTest> {
    const abTest: A_BTest = {
      ...test,
      id: this.generateTestId(),
      createdAt: new Date()
    };

    // Store A/B test configuration
    localStorage.setItem(`ab_test_${abTest.id}`, JSON.stringify(abTest));
    
    return abTest;
  }

  /**
   * Get user variant for A/B test
   */
  getUserVariant(testId: string): A_BTestVariant | null {
    const test = this.getABTest(testId);
    if (!test || test.status !== 'running') return null;

    // Use user ID to ensure consistent assignment
    const hash = this.hashString(this.userId + testId);
    const random = hash % 100;
    
    let cumulativeAllocation = 0;
    for (const variant of test.variants) {
      cumulativeAllocation += variant.trafficAllocation * 100;
      if (random < cumulativeAllocation) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback to first variant
  }

  /**
   * Track A/B test conversion
   */
  trackABTestConversion(testId: string, variantId: string): void {
    const test = this.getABTest(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (variant) {
      variant.metrics.participants++;
      variant.metrics.conversions++;
      variant.metrics.conversionRate = variant.metrics.conversions / variant.metrics.participants;
      
      // Update test in storage
      localStorage.setItem(`ab_test_${testId}`, JSON.stringify(test));
    }
  }

  /**
   * Generate business intelligence insights
   */
  async generateBusinessIntelligence(): Promise<BusinessIntelligence> {
    const allEvents = this.events;
    const uniqueUsers = new Set(allEvents.map(e => e.userId)).size;
    const activeUsers = this.getActiveUsers(allEvents);
    const totalDesigns = this.getTotalDesigns(allEvents);
    const totalExports = allEvents.filter(e => e.eventType === 'export').length;

    return {
      overview: {
        totalUsers: uniqueUsers,
        activeUsers,
        totalDesigns,
        totalExports,
        revenue: this.calculateRevenue(allEvents),
        growthRate: this.calculateGrowthRate(allEvents)
      },
      trends: {
        userGrowth: this.getUserGrowthTrend(allEvents),
        designCreation: this.getDesignCreationTrend(allEvents),
        exportTrends: this.getExportTrends(allEvents),
        featureUsage: this.getFeatureUsageTrends(allEvents)
      },
      insights: {
        topPerformingTemplates: this.getTopPerformingTemplates(allEvents),
        userSegments: this.getUserSegments(allEvents),
        conversionFunnels: this.getConversionFunnels(allEvents),
        recommendations: this.generateRecommendations(allEvents)
      },
      predictions: {
        userGrowth: this.predictUserGrowth(allEvents),
        revenue: this.predictRevenue(allEvents),
        churnRisk: this.predictChurnRisk(allEvents)
      }
    };
  }

  /**
   * Get real-time analytics dashboard
   */
  async getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayEvents = this.events.filter(e => e.timestamp >= today);
    const activeSessions = new Set(todayEvents.map(e => e.sessionId)).size;
    const designsToday = todayEvents.filter(e => e.eventType === 'template_select').length;
    const exportsToday = todayEvents.filter(e => e.eventType === 'export').length;

    return {
      realTimeMetrics: {
        activeUsers: this.getActiveUsers(this.events),
        currentSessions: activeSessions,
        designsCreatedToday: designsToday,
        exportsToday: exportsToday,
        systemHealth: this.getSystemHealth()
      },
      charts: {
        userActivity: this.getUserActivityChart(todayEvents),
        featureUsage: this.getFeatureUsageChart(todayEvents),
        performanceMetrics: this.getPerformanceMetricsChart(todayEvents),
        geographicDistribution: this.getGeographicDistribution(todayEvents)
      },
      alerts: this.getSystemAlerts()
    };
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    return {
      userAgent,
      screenResolution: { width: screen.width, height: screen.height },
      viewportSize: viewport,
      deviceType: this.getDeviceType(viewport),
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      renderTime: Date.now() - performance.timeOrigin,
      memoryUsage: memory ? memory.usedJSHeapSize : 0,
      errorCount: this.getErrorCount()
    };
  }

  private getDeviceType(viewport: { width: number; height: number }): 'desktop' | 'tablet' | 'mobile' {
    if (viewport.width < 768) return 'mobile';
    if (viewport.width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getErrorCount(): number {
    // This would typically track errors from a global error handler
    return 0;
  }

  private isHighPriorityEvent(eventType: string): boolean {
    const highPriorityEvents = ['export', 'save', 'load', 'template_select'];
    return highPriorityEvents.includes(eventType);
  }

  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private flushEvents(): void {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = this.eventQueue.splice(0, this.batchSize);
    this.events.push(...eventsToFlush);

    // Store events in localStorage for persistence
    this.storeEvents(eventsToFlush);

    // In a real implementation, this would send to analytics service
    console.log('📊 Analytics events flushed:', eventsToFlush.length);
  }

  private storeEvents(events: UserEvent[]): void {
    const stored = localStorage.getItem('analytics_events') || '[]';
    const existingEvents = JSON.parse(stored);
    const updatedEvents = [...existingEvents, ...events];
    
    // Keep only last 1000 events to prevent localStorage bloat
    if (updatedEvents.length > 1000) {
      updatedEvents.splice(0, updatedEvents.length - 1000);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(updatedEvents));
  }

  private initializeTracking(): void {
    // Track page load
    this.trackEvent('load', 'canvas', {
      value: { page: 'editor', timestamp: new Date() }
    });

    // Track window events
    window.addEventListener('beforeunload', () => {
      this.trackEvent('save', 'canvas', {
        value: { action: 'page_unload' }
      });
    });
  }

  private calculateTotalTime(events: UserEvent[]): number {
    if (events.length < 2) return 0;
    
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const startTime = sortedEvents[0].timestamp.getTime();
    const endTime = sortedEvents[sortedEvents.length - 1].timestamp.getTime();
    
    return endTime - startTime;
  }

  private calculateCompletionRate(events: UserEvent[]): number {
    const exportEvents = events.filter(e => e.eventType === 'export');
    const totalSessions = new Set(events.map(e => e.sessionId)).size;
    
    return totalSessions > 0 ? exportEvents.length / totalSessions : 0;
  }

  private calculateAverageLoadTime(events: UserEvent[]): number {
    const loadEvents = events.filter(e => e.eventType === 'load');
    if (loadEvents.length === 0) return 0;
    
    const totalTime = loadEvents.reduce((sum, event) => {
      return sum + (event.metadata.performance?.loadTime || 0);
    }, 0);
    
    return totalTime / loadEvents.length;
  }

  private calculateAverageRenderTime(events: UserEvent[]): number {
    const renderEvents = events.filter(e => e.eventType === 'drag' || e.eventType === 'resize');
    if (renderEvents.length === 0) return 0;
    
    const totalTime = renderEvents.reduce((sum, event) => {
      return sum + (event.metadata.performance?.renderTime || 0);
    }, 0);
    
    return totalTime / renderEvents.length;
  }

  private calculateErrorRate(events: UserEvent[]): number {
    const totalEvents = events.length;
    const errorEvents = events.filter(e => 
      e.metadata.performance?.errorCount && e.metadata.performance.errorCount > 0
    );
    
    return totalEvents > 0 ? errorEvents.length / totalEvents : 0;
  }

  private calculateSatisfactionScore(events: UserEvent[]): number {
    // Simplified satisfaction calculation based on completion rate and interaction patterns
    const completionRate = this.calculateCompletionRate(events);
    const averageSessionDuration = this.calculateTotalTime(events) / new Set(events.map(e => e.sessionId)).size;
    
    // Normalize to 0-100 scale
    const durationScore = Math.min(averageSessionDuration / (60 * 1000), 1) * 50; // Max 50 points for duration
    const completionScore = completionRate * 50; // Max 50 points for completion
    
    return Math.round(durationScore + completionScore);
  }

  private calculateReturnVisitors(events: UserEvent[]): number {
    // This would require tracking across sessions
    return 0;
  }

  private calculateBounceRate(events: UserEvent[]): number {
    const sessions = new Set(events.map(e => e.sessionId));
    const singleEventSessions = Array.from(sessions).filter(sessionId => {
      const sessionEvents = events.filter(e => e.sessionId === sessionId);
      return sessionEvents.length === 1;
    });
    
    return sessions.size > 0 ? singleEventSessions.length / sessions.size : 0;
  }

  private getMostUsedFeatures(events: UserEvent[]): Array<{ feature: string; count: number }> {
    const featureCounts = events.reduce((acc, event) => {
      const feature = event.elementName || event.elementType;
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getPopularElements(events: UserEvent[]): Array<{ element: string; usage: number }> {
    const elementCounts = events.reduce((acc, event) => {
      acc[event.elementType] = (acc[event.elementType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(elementCounts)
      .map(([element, usage]) => ({ element, usage }))
      .sort((a, b) => b.usage - a.usage);
  }

  private calculateComplexityScore(events: UserEvent[]): number {
    // Calculate based on number of interactions and types of elements used
    const uniqueElementTypes = new Set(events.map(e => e.elementType)).size;
    const totalInteractions = events.length;
    
    return Math.min((uniqueElementTypes * 10) + (totalInteractions / 10), 100);
  }

  private calculateColorHarmonyScore(events: UserEvent[]): number {
    const colorChangeEvents = events.filter(e => e.eventType === 'color_change');
    // Simplified scoring - would need actual color analysis
    return colorChangeEvents.length > 0 ? Math.min(colorChangeEvents.length * 20, 100) : 50;
  }

  private calculateTypographyScore(events: UserEvent[]): number {
    const textEvents = events.filter(e => e.eventType === 'text_edit' || e.elementType === 'text');
    return textEvents.length > 0 ? Math.min(textEvents.length * 15, 100) : 50;
  }

  private calculateLayoutScore(events: UserEvent[]): number {
    const layoutEvents = events.filter(e => 
      e.eventType === 'drag' || e.eventType === 'resize'
    );
    return layoutEvents.length > 0 ? Math.min(layoutEvents.length * 10, 100) : 50;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getABTest(testId: string): A_BTest | null {
    const stored = localStorage.getItem(`ab_test_${testId}`);
    return stored ? JSON.parse(stored) : null;
  }

  private getActiveUsers(events: UserEvent[]): number {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return new Set(
      events
        .filter(e => e.timestamp >= last24Hours)
        .map(e => e.userId)
    ).size;
  }

  private getTotalDesigns(events: UserEvent[]): number {
    return new Set(
      events
        .filter(e => e.eventType === 'template_select')
        .map(e => e.metadata.canvasData?.designId)
        .filter(Boolean)
    ).size;
  }

  private calculateRevenue(events: UserEvent[]): number {
    // Simplified revenue calculation
    const exportEvents = events.filter(e => e.eventType === 'export');
    return exportEvents.length * 0.5; // $0.50 per export
  }

  private calculateGrowthRate(events: UserEvent[]): number {
    // Simplified growth rate calculation
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastTwoMonths = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentUsers = new Set(
      events
        .filter(e => e.timestamp >= lastMonth)
        .map(e => e.userId)
    ).size;
    
    const previousUsers = new Set(
      events
        .filter(e => e.timestamp >= lastTwoMonths && e.timestamp < lastMonth)
        .map(e => e.userId)
    ).size;
    
    return previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0;
  }

  private getUserGrowthTrend(events: UserEvent[]): Array<{ date: string; count: number }> {
    // Simplified trend calculation
    const dailyUsers: Record<string, Set<string>> = {};
    
    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];
      if (!dailyUsers[date]) {
        dailyUsers[date] = new Set();
      }
      dailyUsers[date].add(event.userId);
    });
    
    return Object.entries(dailyUsers)
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getDesignCreationTrend(events: UserEvent[]): Array<{ date: string; count: number }> {
    const dailyDesigns: Record<string, number> = {};
    
    events
      .filter(e => e.eventType === 'template_select')
      .forEach(event => {
        const date = event.timestamp.toISOString().split('T')[0];
        dailyDesigns[date] = (dailyDesigns[date] || 0) + 1;
      });
    
    return Object.entries(dailyDesigns)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getExportTrends(events: UserEvent[]): Array<{ date: string; count: number }> {
    const dailyExports: Record<string, number> = {};
    
    events
      .filter(e => e.eventType === 'export')
      .forEach(event => {
        const date = event.timestamp.toISOString().split('T')[0];
        dailyExports[date] = (dailyExports[date] || 0) + 1;
      });
    
    return Object.entries(dailyExports)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getFeatureUsageTrends(events: UserEvent[]): Array<{ feature: string; usage: number; trend: 'up' | 'down' | 'stable' }> {
    const featureUsage = this.getMostUsedFeatures(events);
    // Simplified trend calculation
    return featureUsage.map(feature => ({
      feature: feature.feature,
      usage: feature.count,
      trend: 'stable' as const
    }));
  }

  private getTopPerformingTemplates(events: UserEvent[]): Array<{ templateId: string; usage: number; satisfaction: number }> {
    const templateUsage: Record<string, number> = {};
    
    events
      .filter(e => e.eventType === 'template_select')
      .forEach(event => {
        const templateId = event.metadata.canvasData?.templateId;
        if (templateId) {
          templateUsage[templateId] = (templateUsage[templateId] || 0) + 1;
        }
      });
    
    return Object.entries(templateUsage)
      .map(([templateId, usage]) => ({
        templateId,
        usage,
        satisfaction: Math.min(usage * 10, 100) // Simplified satisfaction
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }

  private getUserSegments(events: UserEvent[]): Array<{ segment: string; size: number; characteristics: string[] }> {
    // Simplified user segmentation
    const totalUsers = new Set(events.map(e => e.userId)).size;
    const activeUsers = this.getActiveUsers(events);
    
    return [
      {
        segment: 'Active Users',
        size: activeUsers,
        characteristics: ['Regular usage', 'High engagement']
      },
      {
        segment: 'New Users',
        size: totalUsers - activeUsers,
        characteristics: ['First-time users', 'Learning phase']
      }
    ];
  }

  private getConversionFunnels(events: UserEvent[]): Array<{ stage: string; users: number; conversionRate: number }> {
    const totalUsers = new Set(events.map(e => e.userId)).size;
    const usersWhoCreatedDesigns = new Set(
      events
        .filter(e => e.eventType === 'template_select')
        .map(e => e.userId)
    ).size;
    const usersWhoExported = new Set(
      events
        .filter(e => e.eventType === 'export')
        .map(e => e.userId)
    ).size;
    
    return [
      {
        stage: 'Visited',
        users: totalUsers,
        conversionRate: 100
      },
      {
        stage: 'Created Design',
        users: usersWhoCreatedDesigns,
        conversionRate: totalUsers > 0 ? (usersWhoCreatedDesigns / totalUsers) * 100 : 0
      },
      {
        stage: 'Exported',
        users: usersWhoExported,
        conversionRate: totalUsers > 0 ? (usersWhoExported / totalUsers) * 100 : 0
      }
    ];
  }

  private generateRecommendations(events: UserEvent[]): string[] {
    const recommendations: string[] = [];
    
    const bounceRate = this.calculateBounceRate(events);
    if (bounceRate > 0.5) {
      recommendations.push('High bounce rate detected. Consider improving onboarding flow.');
    }
    
    const completionRate = this.calculateCompletionRate(events);
    if (completionRate < 0.3) {
      recommendations.push('Low completion rate. Simplify the design process.');
    }
    
    const mostUsedFeatures = this.getMostUsedFeatures(events);
    if (mostUsedFeatures.length > 0) {
      recommendations.push(`Focus on improving ${mostUsedFeatures[0].feature} feature.`);
    }
    
    return recommendations;
  }

  private predictUserGrowth(events: UserEvent[]): Array<{ date: string; predicted: number; confidence: number }> {
    // Simplified prediction based on recent trends
    const growthTrend = this.getUserGrowthTrend(events);
    const lastWeek = growthTrend.slice(-7);
    const averageGrowth = lastWeek.reduce((sum, day) => sum + day.count, 0) / lastWeek.length;
    
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.round(averageGrowth * (1 + i * 0.1)),
        confidence: Math.max(0.6 - i * 0.05, 0.3)
      });
    }
    
    return predictions;
  }

  private predictRevenue(events: UserEvent[]): Array<{ date: string; predicted: number; confidence: number }> {
    // Simplified revenue prediction
    const exportTrend = this.getExportTrends(events);
    const lastWeek = exportTrend.slice(-7);
    const averageExports = lastWeek.reduce((sum, day) => sum + day.count, 0) / lastWeek.length;
    
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.round(averageExports * 0.5 * (1 + i * 0.05)), // $0.50 per export
        confidence: Math.max(0.7 - i * 0.05, 0.4)
      });
    }
    
    return predictions;
  }

  private predictChurnRisk(events: UserEvent[]): Array<{ userId: string; risk: number; factors: string[] }> {
    // Simplified churn prediction
    const users = Array.from(new Set(events.map(e => e.userId)));
    
    return users.map(userId => {
      const userEvents = events.filter(e => e.userId === userId);
      const lastActivity = Math.max(...userEvents.map(e => e.timestamp.getTime()));
      const daysSinceLastActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
      
      let risk = 0;
      const factors: string[] = [];
      
      if (daysSinceLastActivity > 7) {
        risk += 0.4;
        factors.push('Inactive for over a week');
      }
      
      if (userEvents.length < 5) {
        risk += 0.3;
        factors.push('Low engagement');
      }
      
      const exports = userEvents.filter(e => e.eventType === 'export').length;
      if (exports === 0) {
        risk += 0.3;
        factors.push('No exports completed');
      }
      
      return {
        userId,
        risk: Math.min(risk, 1),
        factors
      };
    }).filter(user => user.risk > 0.5);
  }

  private getUserActivityChart(events: UserEvent[]): Array<{ time: string; users: number; sessions: number }> {
    const hourlyActivity: Record<string, { users: Set<string>; sessions: Set<string> }> = {};
    
    events.forEach(event => {
      const hour = event.timestamp.getHours().toString().padStart(2, '0') + ':00';
      if (!hourlyActivity[hour]) {
        hourlyActivity[hour] = { users: new Set(), sessions: new Set() };
      }
      hourlyActivity[hour].users.add(event.userId);
      hourlyActivity[hour].sessions.add(event.sessionId);
    });
    
    return Object.entries(hourlyActivity)
      .map(([time, data]) => ({
        time,
        users: data.users.size,
        sessions: data.sessions.size
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  private getFeatureUsageChart(events: UserEvent[]): Array<{ feature: string; usage: number }> {   
    return this.getMostUsedFeatures(events).map(feature => ({
      feature: feature.feature,
      usage: feature.count
    }));
  }

  private getPerformanceMetricsChart(events: UserEvent[]): Array<{ metric: string; value: number; trend: number }> {
    return [
      {
        metric: 'Average Load Time',
        value: this.calculateAverageLoadTime(events),
        trend: 0 // Simplified - would calculate actual trend
      },
      {
        metric: 'Error Rate',
        value: this.calculateErrorRate(events),
        trend: 0
      },
      {
        metric: 'User Satisfaction',
        value: this.calculateSatisfactionScore(events),
        trend: 0
      }
    ];
  }

  private getGeographicDistribution(events: UserEvent[]): Array<{ country: string; users: number }> {
    // Simplified geographic distribution
    const countries: Record<string, Set<string>> = {};
    
    events.forEach(event => {
      const country = event.metadata.deviceInfo?.timezone?.split('/')[0] || 'Unknown';
      if (!countries[country]) {
        countries[country] = new Set();
      }
      countries[country].add(event.userId);
    });
    
    return Object.entries(countries)
      .map(([country, users]) => ({ country, users: users.size }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);
  }

  private getSystemHealth(): 'healthy' | 'warning' | 'critical' {
    // Simplified system health check
    const errorRate = this.calculateErrorRate(this.events);
    if (errorRate > 0.1) return 'critical';
    if (errorRate > 0.05) return 'warning';
    return 'healthy';
  }

  private getSystemAlerts(): Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    message: string;
    timestamp: Date;
    action?: string;
  }> {
    const alerts = [];
    
    const errorRate = this.calculateErrorRate(this.events);
    if (errorRate > 0.05) {
      alerts.push({
        id: 'high_error_rate',
        type: 'warning' as const,
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        action: 'Investigate system issues'
      });
    }
    
    const bounceRate = this.calculateBounceRate(this.events);
    if (bounceRate > 0.5) {
      alerts.push({
        id: 'high_bounce_rate',
        type: 'warning' as const,
        message: `High bounce rate: ${(bounceRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        action: 'Improve user onboarding'
      });
    }
    
    return alerts;
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushEvents(); // Flush remaining events
  }
}

// Export default instance
export const analyticsManager = new AdvancedAnalyticsManager('current-user');
