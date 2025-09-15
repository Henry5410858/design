/**
 * Advanced Customization & Enterprise Features System
 * White-label solutions, theme customization, and enterprise-grade features
 */

export interface ThemeCustomization {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

export interface BrandCustomization {
  id: string;
  companyName: string;
  logo: {
    light: string; // URL for light theme
    dark: string; // URL for dark theme
    favicon: string;
    size: {
      width: number;
      height: number;
    };
    position: 'left' | 'center' | 'right';
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  domain: string;
  subdomain: string;
  customCSS: string;
  customJS: string;
  metaTags: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
  };
  footer: {
    text: string;
    links: Array<{
      label: string;
      url: string;
    }>;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    socialMedia: Array<{
      platform: string;
      url: string;
      icon: string;
    }>;
  };
}

export interface WorkflowCustomization {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    type: 'approval' | 'review' | 'modification' | 'notification';
    assignee: string;
    conditions: string[];
    actions: string[];
    timeout?: number;
  }>;
  triggers: Array<{
    event: string;
    condition: string;
    action: string;
  }>;
  notifications: Array<{
    type: 'email' | 'sms' | 'push' | 'slack' | 'teams';
    template: string;
    recipients: string[];
  }>;
}

export interface EnterpriseFeatures {
  sso: {
    enabled: boolean;
    provider: 'saml' | 'oauth' | 'ldap' | 'azure' | 'google' | 'okta';
    config: {
      endpoint: string;
      certificate: string;
      attributes: Record<string, string>;
    };
  };
  userManagement: {
    enabled: boolean;
    features: {
      bulkImport: boolean;
      roleBasedAccess: boolean;
      departmentManagement: boolean;
      userProvisioning: boolean;
    };
    roles: Array<{
      id: string;
      name: string;
      permissions: string[];
      description: string;
    }>;
  };
  apiAccess: {
    enabled: boolean;
    rateLimiting: {
      requestsPerMinute: number;
      requestsPerHour: number;
      requestsPerDay: number;
    };
    authentication: {
      type: 'api_key' | 'oauth2' | 'jwt';
      expiration: number;
    };
    endpoints: Array<{
      path: string;
      method: string;
      description: string;
      rateLimit: number;
    }>;
  };
  integrations: {
    crm: Array<{
      name: string;
      type: 'salesforce' | 'hubspot' | 'pipedrive' | 'custom';
      config: Record<string, any>;
    }>;
    analytics: Array<{
      name: string;
      type: 'google_analytics' | 'mixpanel' | 'amplitude' | 'custom';
      config: Record<string, any>;
    }>;
    storage: Array<{
      name: string;
      type: 'aws_s3' | 'google_cloud' | 'azure_blob' | 'custom';
      config: Record<string, any>;
    }>;
    communication: Array<{
      name: string;
      type: 'slack' | 'teams' | 'discord' | 'custom';
      config: Record<string, any>;
    }>;
  };
  security: {
    encryption: {
      atRest: boolean;
      inTransit: boolean;
      algorithm: string;
    };
    compliance: string[];
    auditLogging: boolean;
    dataRetention: {
      period: number;
      autoDelete: boolean;
    };
  };
  backup: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    retention: number;
    locations: string[];
  };
}

export interface CustomizationSettings {
  theme: ThemeCustomization;
  brand: BrandCustomization;
  workflows: WorkflowCustomization[];
  enterprise: EnterpriseFeatures;
  preview: {
    enabled: boolean;
    url: string;
    expires: Date;
  };
}

export interface CustomizationResult {
  success: boolean;
  message: string;
  previewUrl?: string;
  errors?: string[];
  warnings?: string[];
}

export class AdvancedCustomizationManager {
  private settings: CustomizationSettings;
  private previewWindow: Window | null = null;

  constructor(initialSettings?: Partial<CustomizationSettings>) {
    this.settings = this.getDefaultSettings();
    if (initialSettings) {
      this.settings = this.mergeSettings(this.settings, initialSettings);
    }
  }

  /**
   * Get default customization settings
   */
  private getDefaultSettings(): CustomizationSettings {
    return {
      theme: {
        id: 'default',
        name: 'Default Theme',
        description: 'Default DiseñoPro theme',
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#F59E0B',
          background: '#FFFFFF',
          surface: '#F8FAFC',
          text: '#1F2937',
          textSecondary: '#6B7280',
          border: '#E5E7EB',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          headingFont: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem'
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          }
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
          '3xl': '4rem'
        },
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          full: '9999px'
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        },
        animations: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms'
          },
          easing: {
            linear: 'linear',
            ease: 'ease',
            easeIn: 'ease-in',
            easeOut: 'ease-out',
            easeInOut: 'ease-in-out'
          }
        }
      },
      brand: {
        id: 'default-brand',
        companyName: 'DiseñoPro',
        logo: {
          light: '/assets/img/logo.png',
          dark: '/assets/img/logo-dark.png',
          favicon: '/favicon.ico',
          size: { width: 120, height: 40 },
          position: 'left'
        },
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#F59E0B'
        },
        domain: 'diseñopro.com',
        subdomain: 'app',
        customCSS: '',
        customJS: '',
        metaTags: {
          title: 'DiseñoPro - Diseño Profesional',
          description: 'Crea diseños profesionales con nuestra herramienta de diseño',
          keywords: ['diseño', 'profesional', 'creativo', 'herramientas'],
          ogImage: '/assets/img/og-image.png'
        },
        footer: {
          text: '© 2024 DiseñoPro. Todos los derechos reservados.',
          links: [
            { label: 'Política de Privacidad', url: '/privacy' },
            { label: 'Términos de Servicio', url: '/terms' }
          ]
        },
        contact: {
          email: 'contacto@diseñopro.com',
          phone: '+1 (555) 123-4567',
          address: '123 Diseño St, Ciudad, País',
          socialMedia: [
            { platform: 'Twitter', url: 'https://twitter.com/diseñopro', icon: 'twitter' },
            { platform: 'LinkedIn', url: 'https://linkedin.com/company/diseñopro', icon: 'linkedin' }
          ]
        }
      },
      workflows: [],
      enterprise: {
        sso: {
          enabled: false,
          provider: 'saml',
          config: {
            endpoint: '',
            certificate: '',
            attributes: {}
          }
        },
        userManagement: {
          enabled: false,
          features: {
            bulkImport: false,
            roleBasedAccess: false,
            departmentManagement: false,
            userProvisioning: false
          },
          roles: [
            {
              id: 'admin',
              name: 'Administrador',
              permissions: ['*'],
              description: 'Acceso completo al sistema'
            },
            {
              id: 'editor',
              name: 'Editor',
              permissions: ['create', 'edit', 'delete'],
              description: 'Puede crear y editar diseños'
            },
            {
              id: 'viewer',
              name: 'Visualizador',
              permissions: ['view'],
              description: 'Solo puede ver diseños'
            }
          ]
        },
        apiAccess: {
          enabled: false,
          rateLimiting: {
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            requestsPerDay: 10000
          },
          authentication: {
            type: 'api_key',
            expiration: 365 * 24 * 60 * 60 * 1000 // 1 year
          },
          endpoints: []
        },
        integrations: {
          crm: [],
          analytics: [],
          storage: [],
          communication: []
        },
        security: {
          encryption: {
            atRest: true,
            inTransit: true,
            algorithm: 'AES-256'
          },
          compliance: ['GDPR', 'SOC2'],
          auditLogging: true,
          dataRetention: {
            period: 365 * 24 * 60 * 60 * 1000, // 1 year
            autoDelete: false
          }
        },
        backup: {
          enabled: true,
          frequency: 'daily',
          retention: 30,
          locations: ['aws-s3', 'local']
        }
      },
      preview: {
        enabled: false,
        url: '',
        expires: new Date()
      }
    };
  }

  /**
   * Merge settings with defaults
   */
  private mergeSettings(defaults: CustomizationSettings, overrides: Partial<CustomizationSettings>): CustomizationSettings {
    return {
      theme: { ...defaults.theme, ...overrides.theme },
      brand: { ...defaults.brand, ...overrides.brand },
      workflows: overrides.workflows || defaults.workflows,
      enterprise: { ...defaults.enterprise, ...overrides.enterprise },
      preview: { ...defaults.preview, ...overrides.preview }
    };
  }

  /**
   * Update theme customization
   */
  async updateTheme(theme: Partial<ThemeCustomization>): Promise<CustomizationResult> {
    try {
      this.settings.theme = { ...this.settings.theme, ...theme };
      await this.saveSettings();
      await this.generateCSS();
      
      return {
        success: true,
        message: 'Tema actualizado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al actualizar el tema',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Update brand customization
   */
  async updateBrand(brand: Partial<BrandCustomization>): Promise<CustomizationResult> {
    try {
      this.settings.brand = { ...this.settings.brand, ...brand };
      await this.saveSettings();
      await this.updateMetaTags();
      
      return {
        success: true,
        message: 'Marca actualizada correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al actualizar la marca',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Add or update workflow
   */
  async updateWorkflow(workflow: WorkflowCustomization): Promise<CustomizationResult> {
    try {
      const existingIndex = this.settings.workflows.findIndex(w => w.id === workflow.id);
      if (existingIndex >= 0) {
        this.settings.workflows[existingIndex] = workflow;
      } else {
        this.settings.workflows.push(workflow);
      }
      
      await this.saveSettings();
      
      return {
        success: true,
        message: 'Flujo de trabajo actualizado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al actualizar el flujo de trabajo',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Update enterprise features
   */
  async updateEnterpriseFeatures(features: Partial<EnterpriseFeatures>): Promise<CustomizationResult> {
    try {
      this.settings.enterprise = { ...this.settings.enterprise, ...features };
      await this.saveSettings();
      
      return {
        success: true,
        message: 'Características empresariales actualizadas correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al actualizar las características empresariales',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Generate preview
   */
  async generatePreview(): Promise<CustomizationResult> {
    try {
      const previewId = this.generatePreviewId();
      const previewUrl = `${window.location.origin}/preview/${previewId}`;
      
      this.settings.preview = {
        enabled: true,
        url: previewUrl,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      
      await this.saveSettings();
      await this.createPreviewInstance(previewId);
      
      return {
        success: true,
        message: 'Vista previa generada correctamente',
        previewUrl
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al generar la vista previa',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Open preview in new window
   */
  openPreview(): void {
    if (this.settings.preview.enabled && this.settings.preview.url) {
      if (this.previewWindow && !this.previewWindow.closed) {
        this.previewWindow.focus();
      } else {
        this.previewWindow = window.open(
          this.settings.preview.url,
          'preview',
          'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
      }
    }
  }

  /**
   * Apply customizations
   */
  async applyCustomizations(): Promise<CustomizationResult> {
    try {
      await this.generateCSS();
      await this.updateMetaTags();
      await this.injectCustomCode();
      await this.saveSettings();
      
      return {
        success: true,
        message: 'Personalizaciones aplicadas correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al aplicar las personalizaciones',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Reset to defaults
   */
  async resetToDefaults(): Promise<CustomizationResult> {
    try {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
      await this.generateCSS();
      await this.updateMetaTags();
      
      return {
        success: true,
        message: 'Configuración restaurada a valores predeterminados'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al restaurar la configuración',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Export configuration
   */
  exportConfiguration(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import configuration
   */
  async importConfiguration(configJson: string): Promise<CustomizationResult> {
    try {
      const importedSettings = JSON.parse(configJson) as CustomizationSettings;
      
      // Validate the imported settings
      if (!this.validateSettings(importedSettings)) {
        throw new Error('Configuración inválida');
      }
      
      this.settings = importedSettings;
      await this.saveSettings();
      await this.generateCSS();
      await this.updateMetaTags();
      
      return {
        success: true,
        message: 'Configuración importada correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al importar la configuración',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Get current settings
   */
  getSettings(): CustomizationSettings {
    return { ...this.settings };
  }

  /**
   * Private helper methods
   */
  private async saveSettings(): Promise<void> {
    // In a real implementation, this would save to a backend service
    localStorage.setItem('customization_settings', JSON.stringify(this.settings));
  }

  private async generateCSS(): Promise<void> {
    const css = this.generateCustomCSS();
    
    // Remove existing custom CSS
    const existingStyle = document.getElementById('custom-theme');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new custom CSS
    const style = document.createElement('style');
    style.id = 'custom-theme';
    style.textContent = css;
    document.head.appendChild(style);
  }

  private generateCustomCSS(): string {
    const { theme } = this.settings;
    
    return `
      :root {
        --color-primary: ${theme.colors.primary};
        --color-secondary: ${theme.colors.secondary};
        --color-accent: ${theme.colors.accent};
        --color-background: ${theme.colors.background};
        --color-surface: ${theme.colors.surface};
        --color-text: ${theme.colors.text};
        --color-text-secondary: ${theme.colors.textSecondary};
        --color-border: ${theme.colors.border};
        --color-success: ${theme.colors.success};
        --color-warning: ${theme.colors.warning};
        --color-error: ${theme.colors.error};
        --color-info: ${theme.colors.info};
        
        --font-family: ${theme.typography.fontFamily};
        --font-family-heading: ${theme.typography.headingFont};
        
        --spacing-xs: ${theme.spacing.xs};
        --spacing-sm: ${theme.spacing.sm};
        --spacing-md: ${theme.spacing.md};
        --spacing-lg: ${theme.spacing.lg};
        --spacing-xl: ${theme.spacing.xl};
        
        --border-radius-sm: ${theme.borderRadius.sm};
        --border-radius-md: ${theme.borderRadius.md};
        --border-radius-lg: ${theme.borderRadius.lg};
        
        --shadow-sm: ${theme.shadows.sm};
        --shadow-md: ${theme.shadows.md};
        --shadow-lg: ${theme.shadows.lg};
        
        --animation-duration-fast: ${theme.animations.duration.fast};
        --animation-duration-normal: ${theme.animations.duration.normal};
        --animation-duration-slow: ${theme.animations.duration.slow};
      }
      
      body {
        font-family: var(--font-family);
        background-color: var(--color-background);
        color: var(--color-text);
      }
      
      .btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
      }
      
      .btn-secondary {
        background-color: var(--color-secondary);
        border-color: var(--color-secondary);
      }
      
      .card {
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-md);
      }
    `;
  }

  private async updateMetaTags(): Promise<void> {
    const { brand } = this.settings;
    
    // Update title
    document.title = brand.metaTags.title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', brand.metaTags.description);
    
    // Update favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', brand.logo.favicon);
  }

  private async injectCustomCode(): Promise<void> {
    const { brand } = this.settings;
    
    // Remove existing custom CSS
    const existingCustomCSS = document.getElementById('custom-brand-css');
    if (existingCustomCSS) {
      existingCustomCSS.remove();
    }
    
    // Add custom CSS
    if (brand.customCSS) {
      const style = document.createElement('style');
      style.id = 'custom-brand-css';
      style.textContent = brand.customCSS;
      document.head.appendChild(style);
    }
    
    // Remove existing custom JS
    const existingCustomJS = document.getElementById('custom-brand-js');
    if (existingCustomJS) {
      existingCustomJS.remove();
    }
    
    // Add custom JS
    if (brand.customJS) {
      const script = document.createElement('script');
      script.id = 'custom-brand-js';
      script.textContent = brand.customJS;
      document.head.appendChild(script);
    }
  }

  private generatePreviewId(): string {
    return `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createPreviewInstance(previewId: string): Promise<void> {
    // In a real implementation, this would create a preview instance on the backend
    console.log('Creating preview instance:', previewId);
  }

  private validateSettings(settings: any): boolean {
    // Basic validation - in a real implementation, this would be more comprehensive
    return settings && 
           settings.theme && 
           settings.brand && 
           settings.enterprise;
  }

  /**
   * Get theme presets
   */
  getThemePresets(): ThemeCustomization[] {
    const defaultTheme = this.getDefaultSettings().theme;
    
    return [
      {
        ...defaultTheme,
        id: 'default',
        name: 'Default',
        description: 'Tema predeterminado de DiseñoPro'
      },
      {
        ...defaultTheme,
        id: 'dark',
        name: 'Dark Mode',
        description: 'Tema oscuro moderno',
        colors: {
          primary: '#60A5FA',
          secondary: '#A78BFA',
          accent: '#FBBF24',
          background: '#111827',
          surface: '#1F2937',
          text: '#F9FAFB',
          textSecondary: '#D1D5DB',
          border: '#374151',
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#60A5FA'
        }
      },
      {
        ...defaultTheme,
        id: 'minimal',
        name: 'Minimal',
        description: 'Diseño minimalista y limpio',
        colors: {
          primary: '#000000',
          secondary: '#666666',
          accent: '#FF6B6B',
          background: '#FFFFFF',
          surface: '#FAFAFA',
          text: '#000000',
          textSecondary: '#666666',
          border: '#E0E0E0',
          success: '#4CAF50',
          warning: '#FF9800',
          error: '#F44336',
          info: '#2196F3'
        }
      }
    ];
  }

  /**
   * Get enterprise templates
   */
  getEnterpriseTemplates(): Partial<EnterpriseFeatures>[] {
    return [
      {
        sso: {
          enabled: true,
          provider: 'azure',
          config: {
            endpoint: '',
            certificate: '',
            attributes: {}
          }
        },
        userManagement: {
          enabled: true,
          features: {
            bulkImport: true,
            roleBasedAccess: true,
            departmentManagement: true,
            userProvisioning: true
          },
          roles: this.getDefaultSettings().enterprise.userManagement.roles
        },
        apiAccess: {
          enabled: true,
          rateLimiting: {
            requestsPerMinute: 1000,
            requestsPerHour: 10000,
            requestsPerDay: 100000
          },
          authentication: {
            type: 'oauth2',
            expiration: 3600 * 1000 // 1 hour
          },
          endpoints: []
        }
      }
    ];
  }
}

// Export default instance
export const customizationManager = new AdvancedCustomizationManager();
