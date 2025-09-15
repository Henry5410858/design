'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  AdvancedCustomizationManager,
  ThemeCustomization,
  BrandCustomization,
  WorkflowCustomization,
  EnterpriseFeatures,
  CustomizationSettings,
  CustomizationResult
} from '@/utils/advancedCustomization';
import { 
  Palette, 
  Settings, 
  Eye, 
  Download, 
  Upload, 
  Save, 
  RotateCcw,
  Check,
  X,
  Plus,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Filter,
  Globe,
  Lock,
  Unlock,
  Shield,
  Users,
  Key,
  Database,
  Cloud,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Lightbulb,
  Target,
  Workflow,
  Building2,
  Crown,
  Star,
  Heart,
  Sparkles,
  Rocket,
  Award,
  Trophy,
  Medal,
  Camera,
  Image,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Grid,
  Layers,
  Layout,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  HardDrive,
  Network,
  Wifi,
  Bluetooth,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Shield as ShieldIcon,
  Key as KeyIcon,
  Database as DatabaseIcon,
  Cloud as CloudIcon,
  Zap as ZapIcon,
  Globe as GlobeIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Building2 as Building2Icon,
  Crown as CrownIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  Sparkles as SparklesIcon,
  Rocket as RocketIcon,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  Medal as MedalIcon,
  Camera as CameraIcon,
  Image as ImageIcon,
  Type as TypeIcon,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  List as ListIcon,
  Grid as GridIcon,
  Layers as LayersIcon,
  Layout as LayoutIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Server as ServerIcon,
  HardDrive as HardDriveIcon,
  Network as NetworkIcon,
  Wifi as WifiIcon,
  Bluetooth as BluetoothIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
  UserPlus as UserPlusIcon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon
} from 'lucide-react';

interface AdvancedCustomizationDashboardProps {
  onClose?: () => void;
  onSave?: (settings: CustomizationSettings) => void;
  onExport?: (config: string) => void;
  onImport?: (config: string) => void;
}

export default function AdvancedCustomizationDashboard({ 
  onClose, 
  onSave, 
  onExport, 
  onImport 
}: AdvancedCustomizationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'brand' | 'workflows' | 'enterprise' | 'preview'>('theme');
  const [customizationManager] = useState(() => new AdvancedCustomizationManager());
  const [settings, setSettings] = useState<CustomizationSettings>(customizationManager.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState('');
  const [results, setResults] = useState<CustomizationResult[]>([]);
  
  // Form states
  const [themeForm, setThemeForm] = useState<ThemeCustomization>(settings.theme);
  const [brandForm, setBrandForm] = useState<BrandCustomization>(settings.brand);
  const [workflowForm, setWorkflowForm] = useState<WorkflowCustomization>({
    id: '',
    name: '',
    description: '',
    steps: [],
    triggers: [],
    notifications: []
  });
  const [enterpriseForm, setEnterpriseForm] = useState<EnterpriseFeatures>(settings.enterprise);
  
  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorField, setSelectedColorField] = useState<string>('');
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [selectedFontField, setSelectedFontField] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(() => {
    const currentSettings = customizationManager.getSettings();
    setSettings(currentSettings);
    setThemeForm(currentSettings.theme);
    setBrandForm(currentSettings.brand);
    setEnterpriseForm(currentSettings.enterprise);
  }, [customizationManager]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await customizationManager.applyCustomizations();
      loadSettings();
      
      if (onSave) {
        onSave(customizationManager.getSettings());
      }
      
      addResult({
        success: true,
        message: 'Configuración guardada correctamente'
      });
    } catch (error) {
      addResult({
        success: false,
        message: 'Error al guardar la configuración',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setIsLoading(false);
    }
  }, [customizationManager, onSave, loadSettings]);

  const handleExport = useCallback(() => {
    const config = customizationManager.exportConfiguration();
    if (onExport) {
      onExport(config);
    } else {
      // Download file
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customization-config.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [customizationManager, onExport]);

  const handleImport = useCallback(async () => {
    if (!importConfig.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await customizationManager.importConfiguration(importConfig);
      addResult(result);
      
      if (result.success) {
        loadSettings();
        setShowImportModal(false);
        setImportConfig('');
      }
    } catch (error) {
      addResult({
        success: false,
        message: 'Error al importar la configuración',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setIsLoading(false);
    }
  }, [customizationManager, importConfig, loadSettings]);

  const handleReset = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await customizationManager.resetToDefaults();
      addResult(result);
      
      if (result.success) {
        loadSettings();
      }
    } catch (error) {
      addResult({
        success: false,
        message: 'Error al restaurar la configuración',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setIsLoading(false);
    }
  }, [customizationManager, loadSettings]);

  const handlePreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await customizationManager.generatePreview();
      addResult(result);
      
      if (result.success) {
        setShowPreview(true);
        customizationManager.openPreview();
      }
    } catch (error) {
      addResult({
        success: false,
        message: 'Error al generar la vista previa',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      });
    } finally {
      setIsLoading(false);
    }
  }, [customizationManager]);

  const addResult = useCallback((result: CustomizationResult) => {
    setResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
  }, []);

  const getTabIcon = (tab: string) => {
    const icons = {
      theme: <Palette className="w-4 h-4" />,
      brand: <Crown className="w-4 h-4" />,
      workflows: <Workflow className="w-4 h-4" />,
      enterprise: <Building2 className="w-4 h-4" />,
      preview: <Eye className="w-4 h-4" />
    };
    return icons[tab as keyof typeof icons];
  };

  const handleColorChange = useCallback((field: string, color: string) => {
    if (activeTab === 'theme') {
      setThemeForm(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          [field]: color
        }
      }));
    } else if (activeTab === 'brand') {
      setBrandForm(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          [field]: color
        }
      }));
    }
  }, [activeTab]);

  const handleFontChange = useCallback((field: string, font: string) => {
    setThemeForm(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [field]: font
      }
    }));
  }, []);

  const openColorPicker = useCallback((field: string) => {
    setSelectedColorField(field);
    setShowColorPicker(true);
  }, []);

  const openFontSelector = useCallback((field: string) => {
    setSelectedFontField(field);
    setShowFontSelector(true);
  }, []);

  const applyThemePreset = useCallback((preset: ThemeCustomization) => {
    setThemeForm(preset);
  }, []);

  const applyEnterpriseTemplate = useCallback((template: Partial<EnterpriseFeatures>) => {
    setEnterpriseForm(prev => ({ ...prev, ...template }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Personalización Avanzada
              </h2>
              <p className="text-sm text-gray-600">
                Configuración empresarial y personalización completa
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Preview button */}
            <button
              onClick={handlePreview}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              Vista Previa
            </button>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>

            {/* Import button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>

            {/* Reset button */}
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </button>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'theme', label: 'Tema', count: 0 },
            { id: 'brand', label: 'Marca', count: 0 },
            { id: 'workflows', label: 'Flujos', count: settings.workflows.length },
            { id: 'enterprise', label: 'Empresarial', count: 0 },
            { id: 'preview', label: 'Vista Previa', count: settings.preview.enabled ? 1 : 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {getTabIcon(tab.id)}
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'theme' && (
              <div className="space-y-6">
                {/* Theme Presets */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Plantillas de Tema</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {customizationManager.getThemePresets().map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyThemePreset(preset)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: preset.colors.primary }}
                          ></div>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: preset.colors.secondary }}
                          ></div>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: preset.colors.accent }}
                          ></div>
                        </div>
                        <div className="font-medium text-gray-800">{preset.name}</div>
                        <div className="text-sm text-gray-600">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Customization */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Colores</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(themeForm.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <button
                          onClick={() => openColorPicker(key)}
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: value }}
                        ></button>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Tipografía</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Familia de Fuentes
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Texto</label>
                          <button
                            onClick={() => openFontSelector('fontFamily')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:border-gray-400 transition-colors"
                          >
                            {themeForm.typography.fontFamily}
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Títulos</label>
                          <button
                            onClick={() => openFontSelector('headingFont')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:border-gray-400 transition-colors"
                          >
                            {themeForm.typography.headingFont}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'brand' && (
              <div className="space-y-6">
                {/* Company Information */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Información de la Empresa</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Nombre de la Empresa
                      </label>
                      <input
                        type="text"
                        value={brandForm.companyName}
                        onChange={(e) => setBrandForm(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Dominio
                      </label>
                      <input
                        type="text"
                        value={brandForm.domain}
                        onChange={(e) => setBrandForm(prev => ({ ...prev, domain: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Configuration */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Logo</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Logo Claro
                        </label>
                        <input
                          type="url"
                          value={brandForm.logo.light}
                          onChange={(e) => setBrandForm(prev => ({ 
                            ...prev, 
                            logo: { ...prev.logo, light: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Logo Oscuro
                        </label>
                        <input
                          type="url"
                          value={brandForm.logo.dark}
                          onChange={(e) => setBrandForm(prev => ({ 
                            ...prev, 
                            logo: { ...prev.logo, dark: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Colors */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Colores de Marca</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(brandForm.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <button
                          onClick={() => openColorPicker(key)}
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: value }}
                        ></button>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-600 capitalize">
                            {key}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom CSS/JS */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Código Personalizado</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        CSS Personalizado
                      </label>
                      <textarea
                        value={brandForm.customCSS}
                        onChange={(e) => setBrandForm(prev => ({ ...prev, customCSS: e.target.value }))}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="/* CSS personalizado */"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        JavaScript Personalizado
                      </label>
                      <textarea
                        value={brandForm.customJS}
                        onChange={(e) => setBrandForm(prev => ({ ...prev, customJS: e.target.value }))}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="// JavaScript personalizado"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'enterprise' && (
              <div className="space-y-6">
                {/* Enterprise Templates */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Plantillas Empresariales</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {customizationManager.getEnterpriseTemplates().map((template, index) => (
                      <button
                        key={index}
                        onClick={() => applyEnterpriseTemplate(template)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-6 h-6 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-800">Configuración Empresarial</div>
                            <div className="text-sm text-gray-600">
                              SSO, gestión de usuarios, API, integraciones
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SSO Configuration */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Autenticación SSO</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="sso-enabled"
                        checked={enterpriseForm.sso.enabled}
                        onChange={(e) => setEnterpriseForm(prev => ({
                          ...prev,
                          sso: { ...prev.sso, enabled: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      <label htmlFor="sso-enabled" className="text-sm font-medium text-gray-700">
                        Habilitar SSO
                      </label>
                    </div>
                    
                    {enterpriseForm.sso.enabled && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Proveedor
                          </label>
                          <select
                            value={enterpriseForm.sso.provider}
                            onChange={(e) => setEnterpriseForm(prev => ({
                              ...prev,
                              sso: { ...prev.sso, provider: e.target.value as any }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="saml">SAML</option>
                            <option value="oauth">OAuth 2.0</option>
                            <option value="ldap">LDAP</option>
                            <option value="azure">Azure AD</option>
                            <option value="google">Google Workspace</option>
                            <option value="okta">Okta</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Endpoint
                          </label>
                          <input
                            type="url"
                            value={enterpriseForm.sso.config.endpoint}
                            onChange={(e) => setEnterpriseForm(prev => ({
                              ...prev,
                              sso: {
                                ...prev.sso,
                                config: { ...prev.sso.config, endpoint: e.target.value }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* API Access */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Acceso API</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="api-enabled"
                        checked={enterpriseForm.apiAccess.enabled}
                        onChange={(e) => setEnterpriseForm(prev => ({
                          ...prev,
                          apiAccess: { ...prev.apiAccess, enabled: e.target.checked }
                        }))}
                        className="rounded"
                      />
                      <label htmlFor="api-enabled" className="text-sm font-medium text-gray-700">
                        Habilitar API
                      </label>
                    </div>
                    
                    {enterpriseForm.apiAccess.enabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Límite/Min
                            </label>
                            <input
                              type="number"
                              value={enterpriseForm.apiAccess.rateLimiting.requestsPerMinute}
                              onChange={(e) => setEnterpriseForm(prev => ({
                                ...prev,
                                apiAccess: {
                                  ...prev.apiAccess,
                                  rateLimiting: {
                                    ...prev.apiAccess.rateLimiting,
                                    requestsPerMinute: parseInt(e.target.value)
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Límite/Hora
                            </label>
                            <input
                              type="number"
                              value={enterpriseForm.apiAccess.rateLimiting.requestsPerHour}
                              onChange={(e) => setEnterpriseForm(prev => ({
                                ...prev,
                                apiAccess: {
                                  ...prev.apiAccess,
                                  rateLimiting: {
                                    ...prev.apiAccess.rateLimiting,
                                    requestsPerHour: parseInt(e.target.value)
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Límite/Día
                            </label>
                            <input
                              type="number"
                              value={enterpriseForm.apiAccess.rateLimiting.requestsPerDay}
                              onChange={(e) => setEnterpriseForm(prev => ({
                                ...prev,
                                apiAccess: {
                                  ...prev.apiAccess,
                                  rateLimiting: {
                                    ...prev.apiAccess.rateLimiting,
                                    requestsPerDay: parseInt(e.target.value)
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Vista Previa</h3>
                  <p className="text-gray-600 mb-6">
                    Genera una vista previa de tus personalizaciones en una nueva ventana
                  </p>
                  <button
                    onClick={handlePreview}
                    disabled={isLoading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 inline mr-2" />
                        Generar Vista Previa
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Results and Info */}
          <div className="space-y-6">
            {/* Results */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Resultados</h3>
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Info className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Los resultados aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{result.message}</p>
                          {result.errors && result.errors.length > 0 && (
                            <div className="mt-1">
                              {result.errors.map((error, i) => (
                                <p key={i} className="text-xs text-red-600">• {error}</p>
                              ))}
                            </div>
                          )}
                          {result.warnings && result.warnings.length > 0 && (
                            <div className="mt-1">
                              {result.warnings.map((warning, i) => (
                                <p key={i} className="text-xs text-yellow-600">• {warning}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
                
                <button
                  onClick={handlePreview}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  Vista Previa
                </button>
                
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar Config
                </button>
                
                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importar Config
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Importar Configuración</h3>
              <textarea
                value={importConfig}
                onChange={(e) => setImportConfig(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                placeholder="Pega aquí el JSON de configuración..."
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={isLoading || !importConfig.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Procesando...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
