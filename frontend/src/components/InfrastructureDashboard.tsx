'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  scalabilitySystem,
  InfrastructureMetrics,
  ScalingEvent,
  LoadBalancerConfig,
  ScalabilityConfig
} from '@/utils/scalabilitySystem';
import { 
  Server, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Database,
  Globe,
  Shield,
  Loader
} from 'lucide-react';

interface InfrastructureDashboardProps {
  onClose?: () => void;
  onExport?: (data: any) => void;
}

export default function InfrastructureDashboard({ onClose, onExport }: InfrastructureDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'scaling' | 'load-balancer' | 'metrics' | 'settings'>('overview');
  const [metrics, setMetrics] = useState<InfrastructureMetrics | null>(null);
  const [scalingEvents, setScalingEvents] = useState<ScalingEvent[]>([]);
  const [loadBalancer, setLoadBalancer] = useState<LoadBalancerConfig | null>(null);
  const [config, setConfig] = useState<ScalabilityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadInfrastructureData();
    if (autoRefresh) {
      const interval = setInterval(loadInfrastructureData, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadInfrastructureData = useCallback(async () => {
    setIsLoading(true);
    try {
      const metricsData = scalabilitySystem.getMetrics();
      const eventsData = scalabilitySystem.getScalingEvents(50);
      const loadBalancerData = scalabilitySystem.getLoadBalancerConfig();
      const configData = scalabilitySystem.getConfig();

      setMetrics(metricsData);
      setScalingEvents(eventsData);
      setLoadBalancer(loadBalancerData);
      setConfig(configData);
    } catch (error) {
      console.error('Error loading infrastructure data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    const exportData = scalabilitySystem.exportData();

    if (onExport) {
      onExport(exportData);
    } else {
      // Download as JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'infrastructure-report.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [onExport]);

  const handleManualScaleUp = useCallback(() => {
    const success = scalabilitySystem.manualScaleUp();
    if (success) {
      loadInfrastructureData();
    }
  }, [loadInfrastructureData]);

  const handleManualScaleDown = useCallback(() => {
    const success = scalabilitySystem.manualScaleDown();
    if (success) {
      loadInfrastructureData();
    }
  }, [loadInfrastructureData]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getScalingIcon = (type: string) => {
    switch (type) {
      case 'scale-up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'scale-down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTabIcon = (tab: string) => {
    const icons = {
      overview: <Activity className="w-4 h-4" />,
      scaling: <TrendingUp className="w-4 h-4" />,
      'load-balancer': <Globe className="w-4 h-4" />,
      metrics: <BarChart3 className="w-4 h-4" />,
      settings: <Settings className="w-4 h-4" />
    };
    return icons[tab as keyof typeof icons];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (!metrics || !loadBalancer || !config) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando datos de infraestructura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Dashboard de Infraestructura
              </h2>
              <p className="text-sm text-gray-600">
                Monitoreo de escalabilidad, balanceador de carga y métricas del sistema
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
              onClick={loadInfrastructureData}
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
            { id: 'scaling', label: 'Escalabilidad' },
            { id: 'load-balancer', label: 'Balanceador' },
            { id: 'metrics', label: 'Métricas' },
            { id: 'settings', label: 'Configuración' }
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
            {/* System Status */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Estado del Sistema</h3>
                {getHealthIcon(metrics.health.overall)}
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {metrics.health.overall.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">
                {scalabilitySystem.getSystemStatus()}
              </div>
            </div>

            {/* Active Instances */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Instancias Activas</h3>
                <Server className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {metrics.instances.active}
              </div>
              <div className="text-sm text-gray-600">
                de {config.autoScaling.maxInstances} máximo
              </div>
            </div>

            {/* CPU Usage */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Uso de CPU</h3>
                <Cpu className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {metrics.load.cpu.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                {metrics.load.cpu > 80 ? 'Alto uso' : 'Normal'}
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Uso de Memoria</h3>
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {metrics.load.memory.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                {metrics.load.memory > 80 ? 'Alto uso' : 'Normal'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scaling' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Eventos de Escalabilidad
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleManualScaleUp}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Escalar Arriba
                </button>
                <button
                  onClick={handleManualScaleDown}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                >
                  <TrendingDown className="w-4 h-4" />
                  Escalar Abajo
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Configuración de Auto-scaling</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Instancias mínimas:</span>
                      <span className="text-sm font-medium">{config.autoScaling.minInstances}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Instancias máximas:</span>
                      <span className="text-sm font-medium">{config.autoScaling.maxInstances}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Umbral de escalado:</span>
                      <span className="text-sm font-medium">{config.autoScaling.scaleUpThreshold}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Umbral de reducción:</span>
                      <span className="text-sm font-medium">{config.autoScaling.scaleDownThreshold}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Estado Actual</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Instancias activas:</span>
                      <span className="text-sm font-medium">{metrics.instances.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Instancias pendientes:</span>
                      <span className="text-sm font-medium">{metrics.instances.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Instancias terminando:</span>
                      <span className="text-sm font-medium">{metrics.instances.terminating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total de instancias:</span>
                      <span className="text-sm font-medium">{metrics.instances.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">Eventos Recientes</h4>
              {scalingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No hay eventos de escalabilidad</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scalingEvents.slice(0, 10).map(event => (
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getScalingIcon(event.type)}
                          <div>
                            <div className="font-medium text-gray-800">
                              {event.type.replace('-', ' ').toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-600">{event.reason}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800">
                            {event.fromInstances} → {event.toInstances}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(event.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'load-balancer' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Balanceador de Carga
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Configuración</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nombre:</span>
                    <span className="text-sm font-medium">{loadBalancer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Algoritmo:</span>
                    <span className="text-sm font-medium">{loadBalancer.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Health Check:</span>
                    <span className="text-sm font-medium">{loadBalancer.healthCheck.path}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Intervalo:</span>
                    <span className="text-sm font-medium">{loadBalancer.healthCheck.interval / 1000}s</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Estadísticas</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Targets totales:</span>
                    <span className="text-sm font-medium">{loadBalancer.targets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Targets saludables:</span>
                    <span className="text-sm font-medium">
                      {loadBalancer.targets.filter(t => t.health === 'healthy').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tiempo promedio:</span>
                    <span className="text-sm font-medium">
                      {Math.round(loadBalancer.targets.reduce((sum, t) => sum + t.responseTime, 0) / loadBalancer.targets.length)}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Targets del Balanceador</h4>
              <div className="space-y-3">
                {loadBalancer.targets.map(target => (
                  <div key={target.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        target.health === 'healthy' ? 'bg-green-500' : 
                        target.health === 'unhealthy' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-gray-800">{target.id}</div>
                        <div className="text-sm text-gray-600">{target.url}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        {target.responseTime}ms
                      </div>
                      <div className="text-xs text-gray-500">
                        Peso: {target.weight}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Métricas del Sistema
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resource Usage */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Uso de Recursos</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">CPU</span>
                      <span className="text-sm font-medium">{metrics.load.cpu.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          metrics.load.cpu > 80 ? 'bg-red-500' : 
                          metrics.load.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(metrics.load.cpu, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Memoria</span>
                      <span className="text-sm font-medium">{metrics.load.memory.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          metrics.load.memory > 80 ? 'bg-red-500' : 
                          metrics.load.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(metrics.load.memory, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Red</span>
                      <span className="text-sm font-medium">{metrics.load.network.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          metrics.load.network > 80 ? 'bg-red-500' : 
                          metrics.load.network > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(metrics.load.network, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Disco</span>
                      <span className="text-sm font-medium">{metrics.load.disk.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          metrics.load.disk > 80 ? 'bg-red-500' : 
                          metrics.load.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(metrics.load.disk, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Metrics */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Métricas de Requests</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total de requests:</span>
                    <span className="text-sm font-medium">{formatNumber(metrics.requests.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Requests exitosos:</span>
                    <span className="text-sm font-medium">{formatNumber(metrics.requests.successful)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Requests fallidos:</span>
                    <span className="text-sm font-medium">{formatNumber(metrics.requests.failed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tiempo promedio:</span>
                    <span className="text-sm font-medium">{metrics.requests.averageResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Throughput:</span>
                    <span className="text-sm font-medium">{metrics.requests.throughput.toFixed(1)} req/min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && config && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Configuración de Infraestructura
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Auto-scaling Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Auto-scaling
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.autoScaling.enabled}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Auto-scaling habilitado</span>
                  </label>
                  <div className="text-sm text-gray-600">
                    Instancias: {config.autoScaling.minInstances} - {config.autoScaling.maxInstances}
                  </div>
                  <div className="text-sm text-gray-600">
                    Umbrales: {config.autoScaling.scaleUpThreshold}% / {config.autoScaling.scaleDownThreshold}%
                  </div>
                </div>
              </div>

              {/* Load Balancing Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Balanceador de Carga
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.loadBalancing.enabled}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Balanceador habilitado</span>
                  </label>
                  <div className="text-sm text-gray-600">
                    Estrategia: {config.loadBalancing.strategy}
                  </div>
                  <div className="text-sm text-gray-600">
                    Health Check: {config.loadBalancing.healthCheck ? 'Habilitado' : 'Deshabilitado'}
                  </div>
                </div>
              </div>

              {/* Caching Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Caché
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.caching.enabled}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Caché habilitado</span>
                  </label>
                  <div className="text-sm text-gray-600">
                    Estrategia: {config.caching.strategy}
                  </div>
                  <div className="text-sm text-gray-600">
                    TTL: {config.caching.ttl / 1000}s
                  </div>
                </div>
              </div>

              {/* CDN Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  CDN
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.cdn.enabled}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">CDN habilitado</span>
                  </label>
                  <div className="text-sm text-gray-600">
                    Proveedor: {config.cdn.provider}
                  </div>
                  <div className="text-sm text-gray-600">
                    Regiones: {config.cdn.regions.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
