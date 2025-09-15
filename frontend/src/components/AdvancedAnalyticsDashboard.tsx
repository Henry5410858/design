'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  AdvancedAnalyticsManager,
  UserEvent,
  DesignAnalytics,
  A_BTest as ABTest,
  A_BTestVariant as ABTestVariant,
  BusinessIntelligence,
  AnalyticsDashboard
} from '@/utils/advancedAnalytics';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Download, 
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Filter,
  Download as DownloadIcon,
  Zap,
  Activity,
  PieChart,
  Globe,
  AlertCircle,
  Lightbulb,
  Trophy,
  Sparkles,
  TrendingDown,
  Minus,
  DollarSign,
  Image
} from 'lucide-react';

interface AdvancedAnalyticsDashboardProps {
  userId: string;
  onClose?: () => void;
  onExportData?: (data: any) => void;
}

export default function AdvancedAnalyticsDashboard({ 
  userId, 
  onClose, 
  onExportData 
}: AdvancedAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'designs' | 'users' | 'ab-tests' | 'insights' | 'realtime'>('overview');
  const [analyticsManager] = useState(() => new AdvancedAnalyticsManager(userId));
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Data states
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboard | null>(null);
  const [businessIntelligence, setBusinessIntelligence] = useState<BusinessIntelligence | null>(null);
  const [designAnalytics, setDesignAnalytics] = useState<DesignAnalytics[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'sessions' | 'exports' | 'revenue'>('users');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Load data on mount and when refresh key changes
  useEffect(() => {
    loadAllData();
  }, [refreshKey, selectedTimeRange, selectedMetric]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashboard, bi] = await Promise.all([
        analyticsManager.getAnalyticsDashboard(),
        analyticsManager.generateBusinessIntelligence()
      ]);
      
      setDashboardData(dashboard);
      setBusinessIntelligence(bi);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsManager]);

  const handleExportData = useCallback(() => {
    if (onExportData) {
      onExportData({
        dashboard: dashboardData,
        businessIntelligence,
        designAnalytics,
        abTests,
        timestamp: new Date().toISOString()
      });
    }
  }, [dashboardData, businessIntelligence, designAnalytics, abTests, onExportData]);

  const getTabIcon = (tab: string) => {
    const icons = {
      overview: <BarChart3 className="w-4 h-4" />,
      designs: <Image className="w-4 h-4" />,
      users: <Users className="w-4 h-4" />,
      'ab-tests': <Target className="w-4 h-4" />,
      insights: <Lightbulb className="w-4 h-4" />,
      realtime: <Activity className="w-4 h-4" />
    };
    return icons[tab as keyof typeof icons];
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatCurrency = (num: number): string => {
    return `$${num.toFixed(2)}`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Panel de Análisis Avanzado
              </h2>
              <p className="text-sm text-gray-600">
                Métricas en tiempo real y análisis de rendimiento
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Auto-actualizar:</label>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={isLoading}
              className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export button */}
            <button
              onClick={handleExportData}
              className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
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
            { id: 'overview', label: 'Resumen', count: dashboardData?.realTimeMetrics.activeUsers },
            { id: 'designs', label: 'Diseños', count: designAnalytics.length },
            { id: 'users', label: 'Usuarios', count: businessIntelligence?.overview.totalUsers },
            { id: 'ab-tests', label: 'Pruebas A/B', count: abTests.length },
            { id: 'insights', label: 'Perspectivas', count: businessIntelligence?.insights.recommendations.length },
            { id: 'realtime', label: 'Tiempo Real', count: dashboardData?.realTimeMetrics.currentSessions }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {getTabIcon(tab.id)}
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                  {formatNumber(tab.count)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Time Range and Metric Selectors */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Período de Tiempo
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Métrica Principal
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="users">Usuarios</option>
                <option value="sessions">Sesiones</option>
                <option value="exports">Exportaciones</option>
                <option value="revenue">Ingresos</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Dispositivo
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">Todos</option>
                  <option value="desktop">Escritorio</option>
                  <option value="tablet">Tablet</option>
                  <option value="mobile">Móvil</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Navegador
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">Todos</option>
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="safari">Safari</option>
                  <option value="edge">Edge</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  País
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">Todos</option>
                  <option value="us">Estados Unidos</option>
                  <option value="mx">México</option>
                  <option value="es">España</option>
                  <option value="ar">Argentina</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        <div className="space-y-6">
          {activeTab === 'overview' && dashboardData && (
            <>
              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Usuarios Activos</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {formatNumber(dashboardData.realTimeMetrics.activeUsers)}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Sesiones Actuales</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatNumber(dashboardData.realTimeMetrics.currentSessions)}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Diseños Creados Hoy</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {formatNumber(dashboardData.realTimeMetrics.designsCreatedToday)}
                      </p>
                    </div>
                    <Image className="w-8 h-8 text-purple-600" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Exportaciones Hoy</p>
                      <p className="text-2xl font-bold text-orange-800">
                        {formatNumber(dashboardData.realTimeMetrics.exportsToday)}
                      </p>
                    </div>
                    <Download className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Estado del Sistema</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(dashboardData.realTimeMetrics.systemHealth)}`}>
                    {dashboardData.realTimeMetrics.systemHealth.toUpperCase()}
                  </div>
                </div>
                
                {dashboardData.alerts.length > 0 && (
                  <div className="space-y-2">
                    {dashboardData.alerts.map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        alert.type === 'error' ? 'bg-red-50 border-red-400' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                        alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                        'bg-green-50 border-green-400'
                      }`}>
                        <div className="flex items-start gap-2">
                          {alert.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                          {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                          {alert.type === 'info' && <Info className="w-5 h-5 text-blue-600 mt-0.5" />}
                          {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                            {alert.action && (
                              <p className="text-xs text-gray-600 mt-1">Acción: {alert.action}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Activity Chart */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad de Usuarios</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Gráfico de Actividad</p>
                      <p className="text-sm">Datos: {dashboardData.charts.userActivity.length} puntos</p>
                    </div>
                  </div>
                </div>

                {/* Feature Usage Chart */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Uso de Funciones</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <PieChart className="w-12 h-12 mx-auto mb-2" />
                      <p>Gráfico de Uso</p>
                      <p className="text-sm">Funciones: {dashboardData.charts.featureUsage.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'insights' && businessIntelligence && (
            <div className="space-y-6">
              {/* Business Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Usuarios Totales</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {formatNumber(businessIntelligence.overview.totalUsers)}
                      </p>
                      <p className="text-xs text-blue-600">
                        Crecimiento: {formatPercentage(businessIntelligence.overview.growthRate)}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Diseños Totales</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatNumber(businessIntelligence.overview.totalDesigns)}
                      </p>
                    </div>
                    <Image className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Ingresos</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {formatCurrency(businessIntelligence.overview.revenue)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  Recomendaciones
                </h3>
                <div className="space-y-3">
                  {businessIntelligence.insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <p className="text-sm text-gray-800">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Templates */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Plantillas Mejor Valoradas
                </h3>
                <div className="space-y-2">
                  {businessIntelligence.insights.topPerformingTemplates.slice(0, 5).map((template, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{template.templateId}</p>
                          <p className="text-sm text-gray-600">
                            Satisfacción: {formatPercentage(template.satisfaction)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">{formatNumber(template.usage)}</p>
                        <p className="text-xs text-gray-600">usos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'realtime' && dashboardData && (
            <div className="space-y-6">
              {/* Real-time Activity */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Actividad en Tiempo Real
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800">
                      {formatNumber(dashboardData.realTimeMetrics.activeUsers)}
                    </p>
                    <p className="text-sm text-green-600">Usuarios Activos</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">
                      {formatNumber(dashboardData.realTimeMetrics.currentSessions)}
                    </p>
                    <p className="text-sm text-blue-600">Sesiones Activas</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-800">
                      {formatNumber(dashboardData.realTimeMetrics.designsCreatedToday)}
                    </p>
                    <p className="text-sm text-purple-600">Diseños Hoy</p>
                  </div>
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Distribución Geográfica
                </h3>
                <div className="space-y-2">
                  {dashboardData.charts.geographicDistribution.slice(0, 10).map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        <span className="font-medium text-gray-800">{country.country}</span>
                      </div>
                      <span className="text-sm text-gray-600">{formatNumber(country.users)} usuarios</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Cargando datos de análisis...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
