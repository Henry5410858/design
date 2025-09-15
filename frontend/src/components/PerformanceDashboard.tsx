'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  performanceOptimization,
  PerformanceMetrics,
  OptimizationResult 
} from '@/utils/performanceOptimization';
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Clock,
  HardDrive,
  Wifi,
  Image,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface PerformanceDashboardProps {
  onClose?: () => void;
  onExport?: (report: OptimizationResult) => void;
}

export default function PerformanceDashboard({ onClose, onExport }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [report, setReport] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'core-vitals' | 'custom' | 'recommendations'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentMetrics = performanceOptimization.getMetrics();
      const performanceReport = performanceOptimization.generatePerformanceReport();
      
      setMetrics(currentMetrics);
      setReport(performanceReport);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    if (report && onExport) {
      onExport(report);
    } else {
      // Download as JSON
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'performance-report.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [report, onExport]);

  const getScoreColor = (score: number, thresholds: { good: number; needsImprovement: number }) => {
    if (score <= thresholds.good) return 'text-green-600';
    if (score <= thresholds.needsImprovement) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number, thresholds: { good: number; needsImprovement: number }) => {
    if (score <= thresholds.good) return 'bg-green-100';
    if (score <= thresholds.needsImprovement) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTabIcon = (tab: string) => {
    const icons = {
      overview: <Activity className="w-4 h-4" />,
      'core-vitals': <Gauge className="w-4 h-4" />,
      custom: <BarChart3 className="w-4 h-4" />,
      recommendations: <AlertTriangle className="w-4 h-4" />
    };
    return icons[tab as keyof typeof icons];
  };

  if (!metrics || !report) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando métricas de rendimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Dashboard de Rendimiento
              </h2>
              <p className="text-sm text-gray-600">
                Monitoreo en tiempo real del rendimiento de la aplicación
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </button>

            {/* Refresh button */}
            <button
              onClick={loadMetrics}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
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
            { id: 'overview', label: 'Resumen' },
            { id: 'core-vitals', label: 'Core Web Vitals' },
            { id: 'custom', label: 'Métricas Personalizadas' },
            { id: 'recommendations', label: 'Recomendaciones' }
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
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Performance Score */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Puntuación General</h3>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round((100 - (metrics.coreWebVitals.LCP / 50) - (metrics.coreWebVitals.FID / 2) - (metrics.coreWebVitals.CLS * 100))).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">de 100</div>
            </div>

            {/* Load Time */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Tiempo de Carga</h3>
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatTime(metrics.customMetrics.pageLoadTime)}
              </div>
              <div className="text-sm text-gray-600">Tiempo total</div>
            </div>

            {/* Memory Usage */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Uso de Memoria</h3>
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatBytes(metrics.customMetrics.memoryUsage)}
              </div>
              <div className="text-sm text-gray-600">RAM utilizada</div>
            </div>

            {/* Cache Hit Rate */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Cache Hit Rate</h3>
                <Database className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {report.improvements.cacheHitRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Efectividad</div>
            </div>
          </div>
        )}

        {activeTab === 'core-vitals' && (
          <div className="space-y-6">
            {/* LCP */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getScoreBgColor(metrics.coreWebVitals.LCP, { good: 2500, needsImprovement: 4000 }).replace('bg-', 'bg-').replace('-100', '')}`}></div>
                  <h3 className="font-semibold text-gray-800">Largest Contentful Paint (LCP)</h3>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(metrics.coreWebVitals.LCP, { good: 2500, needsImprovement: 4000 })}`}>
                  {formatTime(metrics.coreWebVitals.LCP)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metrics.coreWebVitals.LCP <= 2500 ? 'bg-green-500' : 
                    metrics.coreWebVitals.LCP <= 4000 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((metrics.coreWebVitals.LCP / 5000) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Mide el tiempo de renderizado del elemento de contenido más grande.
              </p>
            </div>

            {/* FID */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getScoreBgColor(metrics.coreWebVitals.FID, { good: 100, needsImprovement: 300 }).replace('bg-', 'bg-').replace('-100', '')}`}></div>
                  <h3 className="font-semibold text-gray-800">First Input Delay (FID)</h3>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(metrics.coreWebVitals.FID, { good: 100, needsImprovement: 300 })}`}>
                  {metrics.coreWebVitals.FID.toFixed(0)}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metrics.coreWebVitals.FID <= 100 ? 'bg-green-500' : 
                    metrics.coreWebVitals.FID <= 300 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((metrics.coreWebVitals.FID / 500) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Mide la capacidad de respuesta de la página a la interacción del usuario.
              </p>
            </div>

            {/* CLS */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getScoreBgColor(metrics.coreWebVitals.CLS, { good: 0.1, needsImprovement: 0.25 }).replace('bg-', 'bg-').replace('-100', '')}`}></div>
                  <h3 className="font-semibold text-gray-800">Cumulative Layout Shift (CLS)</h3>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(metrics.coreWebVitals.CLS, { good: 0.1, needsImprovement: 0.25 })}`}>
                  {metrics.coreWebVitals.CLS.toFixed(3)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metrics.coreWebVitals.CLS <= 0.1 ? 'bg-green-500' : 
                    metrics.coreWebVitals.CLS <= 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((metrics.coreWebVitals.CLS / 0.5) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Mide la estabilidad visual de la página durante la carga.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4">Métricas Personalizadas</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">DOM Content Loaded</span>
                  <span className="text-sm font-bold text-gray-800">{formatTime(metrics.customMetrics.domContentLoaded)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Resource Load Time</span>
                  <span className="text-sm font-bold text-gray-800">{formatTime(metrics.customMetrics.resourceLoadTime)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Network Latency</span>
                  <span className="text-sm font-bold text-gray-800">{formatTime(metrics.customMetrics.networkLatency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Render Time</span>
                  <span className="text-sm font-bold text-gray-800">{formatTime(metrics.customMetrics.renderTime)}</span>
                </div>
              </div>
            </div>

            {/* User Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4">Métricas de Usuario</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Interaction Time</span>
                  <span className="text-sm font-bold text-gray-800">{formatTime(metrics.userMetrics.interactionTime)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Scroll Depth</span>
                  <span className="text-sm font-bold text-gray-800">{metrics.userMetrics.scrollDepth.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Time on Page</span>
                  <span className="text-sm font-bold text-gray-800">{formatTime(metrics.userMetrics.timeOnPage)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Bounce Rate</span>
                  <span className="text-sm font-bold text-gray-800">{metrics.userMetrics.bounceRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-800">Recomendaciones de Optimización</h3>
            </div>

            {report.recommendations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-800 mb-2">¡Excelente rendimiento!</h4>
                <p className="text-gray-600">No se encontraron problemas críticos de rendimiento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">Recomendación #{index + 1}</h4>
                        <p className="text-gray-700">{recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Performance Improvements */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Mejoras Implementadas</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{report.improvements.loadTime.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Tiempo de Carga</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">-{report.improvements.bundleSize.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Tamaño Bundle</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{report.improvements.cacheHitRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Cache Hit Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">-{report.improvements.imageOptimization.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Tamaño Imágenes</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
