/**
 * Advanced Security System
 * Encryption, authentication, compliance, and security monitoring
 */

export interface SecurityConfig {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  authentication: {
    mfa: boolean;
    biometric: boolean;
    sessionTimeout: number;
    maxAttempts: number;
  };
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    soc2: boolean;
    hipaa: boolean;
    auditLogging: boolean;
  };
  monitoring: {
    enabled: boolean;
    threatDetection: boolean;
    anomalyDetection: boolean;
    realTimeAlerts: boolean;
  };
  dataProtection: {
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    dataMasking: boolean;
    secureDeletion: boolean;
  };
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'threat' | 'compliance' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  resolved: boolean;
}

export interface ComplianceReport {
  standard: string;
  status: 'compliant' | 'non-compliant' | 'partial';
  score: number;
  issues: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }>;
  lastAudit: Date;
  nextAudit: Date;
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'suspicious_activity' | 'data_exfiltration' | 'malware' | 'ddos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  timestamp: Date;
  details: Record<string, any>;
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
}

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  key: string;
  algorithm: string;
}

export class AdvancedSecurityManager {
  private config: SecurityConfig;
  private securityEvents: SecurityEvent[] = [];
  private threats: ThreatDetection[] = [];
  private complianceReports: ComplianceReport[] = [];
  private encryptionKey: string | null = null;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.initializeSecurity();
  }

  /**
   * Get default security configuration
   */
  private getDefaultConfig(): SecurityConfig {
    return {
      encryption: {
        enabled: true,
        algorithm: 'AES-GCM',
        keyLength: 256,
        ivLength: 12
      },
      authentication: {
        mfa: true,
        biometric: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxAttempts: 5
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        soc2: true,
        hipaa: false,
        auditLogging: true
      },
      monitoring: {
        enabled: true,
        threatDetection: true,
        anomalyDetection: true,
        realTimeAlerts: true
      },
      dataProtection: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        dataMasking: true,
        secureDeletion: true
      }
    };
  }

  /**
   * Initialize security system
   */
  private initializeSecurity(): void {
    this.generateEncryptionKey();
    this.setupEventListeners();
    this.startSecurityMonitoring();
    
    console.log('🔒 Advanced Security System initialized');
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): void {
    if (this.config.encryption.enabled) {
      // Generate a random key for demo purposes
      // In production, use proper key management
      this.encryptionKey = this.generateRandomKey(this.config.encryption.keyLength / 8);
    }
  }

  /**
   * Generate random key
   */
  private generateRandomKey(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Setup security event listeners
   */
  private setupEventListeners(): void {
    // Monitor authentication attempts
    window.addEventListener('beforeunload', () => {
      this.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        details: { action: 'session_end' }
      });
    });

    // Monitor for suspicious activity
    document.addEventListener('click', (event) => {
      this.monitorUserBehavior(event);
    });

    // Monitor network requests
    this.monitorNetworkRequests();
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    if (!this.config.monitoring.enabled) return;

    // Monitor for threats every 30 seconds
    setInterval(() => {
      this.detectThreats();
    }, 30000);

    // Monitor for anomalies every 5 minutes
    setInterval(() => {
      this.detectAnomalies();
    }, 300000);

    // Generate compliance reports daily
    setInterval(() => {
      this.generateComplianceReports();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Encrypt data
   */
  async encryptData(data: any): Promise<EncryptionResult> {
    if (!this.config.encryption.enabled || !this.encryptionKey) {
      throw new Error('Encryption not enabled or key not available');
    }

    try {
      const dataString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(this.config.encryption.ivLength));

      // Import key
      const keyBuffer = new Uint8Array(this.encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      // Convert to base64
      const encrypted = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      const ivString = btoa(String.fromCharCode(...iv));

      return {
        encrypted,
        iv: ivString,
        key: this.encryptionKey,
        algorithm: this.config.encryption.algorithm
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  async decryptData(encryptionResult: EncryptionResult): Promise<any> {
    if (!this.config.encryption.enabled) {
      throw new Error('Encryption not enabled');
    }

    try {
      // Convert from base64
      const encryptedBuffer = new Uint8Array(atob(encryptionResult.encrypted).split('').map(c => c.charCodeAt(0)));
      const iv = new Uint8Array(atob(encryptionResult.iv).split('').map(c => c.charCodeAt(0)));

      // Import key
      const keyBuffer = new Uint8Array(encryptionResult.key.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedBuffer
      );

      // Convert to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Mask sensitive data
   */
  maskSensitiveData(data: any, fields: string[]): any {
    if (!this.config.dataProtection.dataMasking) return data;

    const masked = { ...data };
    
    fields.forEach(field => {
      if (masked[field]) {
        const value = String(masked[field]);
        if (value.length > 4) {
          masked[field] = '*'.repeat(value.length - 4) + value.slice(-4);
        } else {
          masked[field] = '*'.repeat(value.length);
        }
      }
    });

    return masked;
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: Partial<SecurityEvent>): void {
    if (!this.config.compliance.auditLogging) return;

    const securityEvent: SecurityEvent = {
      id: this.generateSecureToken(16),
      type: event.type || 'system',
      severity: event.severity || 'low',
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details: event.details || {},
      resolved: false,
      ...event
    };

    this.securityEvents.push(securityEvent);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Send real-time alert if critical
    if (securityEvent.severity === 'critical' && this.config.monitoring.realTimeAlerts) {
      this.sendSecurityAlert(securityEvent);
    }
  }

  /**
   * Get client IP (mock implementation)
   */
  private getClientIP(): string {
    // In a real implementation, this would get the actual client IP
    return '192.168.1.1';
  }

  /**
   * Send security alert
   */
  private sendSecurityAlert(event: SecurityEvent): void {
    console.warn('🚨 CRITICAL SECURITY ALERT:', event);
    
    // In a real implementation, this would send to a security monitoring system
    // or notify security team
  }

  /**
   * Monitor user behavior
   */
  private monitorUserBehavior(event: Event): void {
    if (!this.config.monitoring.anomalyDetection) return;

    const behaviorData = {
      timestamp: Date.now(),
      type: event.type,
      target: (event.target as Element)?.tagName || 'unknown',
      x: (event as MouseEvent).clientX || 0,
      y: (event as MouseEvent).clientY || 0
    };

    // Store behavior data for analysis
    // In a real implementation, this would be more sophisticated
    this.analyzeBehaviorPattern(behaviorData);
  }

  /**
   * Analyze behavior pattern
   */
  private analyzeBehaviorPattern(data: any): void {
    // Simple anomaly detection
    // In a real implementation, this would use machine learning
    const now = Date.now();
    const recentEvents = this.securityEvents.filter(
      e => e.timestamp.getTime() > now - 60000 // Last minute
    );

    if (recentEvents.length > 100) {
      this.logSecurityEvent({
        type: 'threat',
        severity: 'medium',
        details: {
          reason: 'High frequency of events detected',
          eventCount: recentEvents.length
        }
      });
    }
  }

  /**
   * Monitor network requests
   */
  private monitorNetworkRequests(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(...args) {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = Date.now();
        
        // Log network request
        self.logSecurityEvent({
          type: 'system',
          severity: 'low',
          details: {
            action: 'network_request',
            url: args[0],
            method: args[1]?.method || 'GET',
            status: response.status,
            duration: endTime - startTime
          }
        });

        return response;
      } catch (error) {
        self.logSecurityEvent({
          type: 'system',
          severity: 'medium',
          details: {
            action: 'network_error',
            url: args[0],
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        
        throw error;
      }
    };
  }

  /**
   * Detect threats
   */
  private detectThreats(): void {
    if (!this.config.monitoring.threatDetection) return;

    // Check for brute force attacks
    this.detectBruteForce();
    
    // Check for suspicious patterns
    this.detectSuspiciousPatterns();
    
    // Check for data exfiltration
    this.detectDataExfiltration();
  }

  /**
   * Detect brute force attacks
   */
  private detectBruteForce(): void {
    const recentAuthEvents = this.securityEvents.filter(
      e => e.type === 'authentication' && 
           e.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );

    if (recentAuthEvents.length > this.config.authentication.maxAttempts) {
      const threat: ThreatDetection = {
        id: this.generateSecureToken(16),
        type: 'brute_force',
        severity: 'high',
        source: 'authentication_system',
        target: 'user_accounts',
        timestamp: new Date(),
        details: {
          attempts: recentAuthEvents.length,
          timeWindow: '5 minutes'
        },
        status: 'detected'
      };

      this.threats.push(threat);
      this.logSecurityEvent({
        type: 'threat',
        severity: 'high',
        details: threat.details
      });
    }
  }

  /**
   * Detect suspicious patterns
   */
  private detectSuspiciousPatterns(): void {
    // Check for unusual access patterns
    const recentEvents = this.securityEvents.filter(
      e => e.timestamp.getTime() > Date.now() - 3600000 // Last hour
    );

    // Group by IP address
    const ipGroups = recentEvents.reduce((groups, event) => {
      const ip = event.ipAddress;
      groups[ip] = groups[ip] || [];
      groups[ip].push(event);
      return groups;
    }, {} as Record<string, SecurityEvent[]>);

    // Check for suspicious IPs
    Object.entries(ipGroups).forEach(([ip, events]) => {
      if (events.length > 50) { // More than 50 events per hour
        const threat: ThreatDetection = {
          id: this.generateSecureToken(16),
          type: 'suspicious_activity',
          severity: 'medium',
          source: ip,
          target: 'application',
          timestamp: new Date(),
          details: {
            events: events.length,
            timeWindow: '1 hour'
          },
          status: 'detected'
        };

        this.threats.push(threat);
      }
    });
  }

  /**
   * Detect data exfiltration
   */
  private detectDataExfiltration(): void {
    // Check for large data transfers
    const recentNetworkEvents = this.securityEvents.filter(
      e => e.type === 'system' && 
           e.details.action === 'network_request' &&
           e.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );

    const largeTransfers = recentNetworkEvents.filter(
      e => e.details.duration > 10000 // More than 10 seconds
    );

    if (largeTransfers.length > 5) {
      const threat: ThreatDetection = {
        id: this.generateSecureToken(16),
        type: 'data_exfiltration',
        severity: 'high',
        source: 'network_activity',
        target: 'sensitive_data',
        timestamp: new Date(),
        details: {
          transfers: largeTransfers.length,
          timeWindow: '5 minutes'
        },
        status: 'detected'
      };

      this.threats.push(threat);
    }
  }

  /**
   * Detect anomalies
   */
  private detectAnomalies(): void {
    if (!this.config.monitoring.anomalyDetection) return;

    // Analyze user behavior patterns
    const userEvents = this.securityEvents.filter(
      e => e.userId && e.timestamp.getTime() > Date.now() - 3600000 // Last hour
    );

    // Check for unusual user behavior
    const userGroups = userEvents.reduce((groups, event) => {
      const userId = event.userId!;
      groups[userId] = groups[userId] || [];
      groups[userId].push(event);
      return groups;
    }, {} as Record<string, SecurityEvent[]>);

    Object.entries(userGroups).forEach(([userId, events]) => {
      // Check for unusual activity patterns
      if (events.length > 100) { // More than 100 events per hour
        this.logSecurityEvent({
          type: 'threat',
          severity: 'medium',
          userId,
          details: {
            reason: 'Unusual user activity detected',
            events: events.length,
            timeWindow: '1 hour'
          }
        });
      }
    });
  }

  /**
   * Generate compliance reports
   */
  private generateComplianceReports(): void {
    const standards = ['GDPR', 'CCPA', 'SOC2', 'HIPAA'];
    
    standards.forEach(standard => {
      const report = this.generateComplianceReport(standard);
      this.complianceReports.push(report);
    });

    // Keep only last 30 reports per standard
    this.complianceReports = this.complianceReports.slice(-120);
  }

  /**
   * Generate compliance report for specific standard
   */
  private generateComplianceReport(standard: string): ComplianceReport {
    const issues = this.identifyComplianceIssues(standard);
    const score = Math.max(0, 100 - (issues.length * 10));
    const status = score >= 80 ? 'compliant' : score >= 60 ? 'partial' : 'non-compliant';

    return {
      standard,
      status,
      score,
      issues,
      lastAudit: new Date(),
      nextAudit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  /**
   * Identify compliance issues
   */
  private identifyComplianceIssues(standard: string): Array<{ id: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; recommendation: string }> {
    const issues: Array<{ id: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; recommendation: string }> = [];

    switch (standard) {
      case 'GDPR':
        if (!this.config.dataProtection.encryptionAtRest) {
          issues.push({
            id: 'gdpr-001',
            description: 'Personal data not encrypted at rest',
            severity: 'high',
            recommendation: 'Enable encryption at rest for all personal data'
          });
        }
        if (!this.config.compliance.auditLogging) {
          issues.push({
            id: 'gdpr-002',
            description: 'Audit logging not enabled',
            severity: 'medium',
            recommendation: 'Enable comprehensive audit logging'
          });
        }
        break;
      
      case 'SOC2':
        if (!this.config.authentication.mfa) {
          issues.push({
            id: 'soc2-001',
            description: 'Multi-factor authentication not enabled',
            severity: 'high',
            recommendation: 'Enable MFA for all user accounts'
          });
        }
        break;
      
      case 'HIPAA':
        if (!this.config.encryption.enabled) {
          issues.push({
            id: 'hipaa-001',
            description: 'Data encryption not enabled',
            severity: 'critical',
            recommendation: 'Enable encryption for all PHI data'
          });
        }
        break;
    }

    return issues;
  }

  /**
   * Get security events
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Get threats
   */
  getThreats(limit: number = 50): ThreatDetection[] {
    return this.threats.slice(-limit);
  }

  /**
   * Get compliance reports
   */
  getComplianceReports(): ComplianceReport[] {
    return this.complianceReports;
  }

  /**
   * Resolve threat
   */
  resolveThreat(threatId: string): boolean {
    const threat = this.threats.find(t => t.id === threatId);
    if (threat) {
      threat.status = 'resolved';
      return true;
    }
    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    // Clear sensitive data
    this.encryptionKey = null;
    this.securityEvents = [];
    this.threats = [];
    this.complianceReports = [];
  }
}

// Export default instance
export const advancedSecurity = new AdvancedSecurityManager();
