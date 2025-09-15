'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  advancedSecurity,
  SecurityEvent,
  ThreatDetection,
  ComplianceReport,
  SecurityConfig
} from '@/utils/advancedSecurity';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Eye, 
  EyeOff,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Activity,
  Clock,
  User,
  Globe,
  Database,
  FileText,
  Zap,
  AlertCircle,
  Info,
  X,
  Check,
  Filter,
  Search
} from 'lucide-react';

interface SecurityDashboardProps {
  onClose?: () => void;
  onExport?: (data: any) => void;
}

export default function SecurityDashboard({ onClose, onExport }: SecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'threats' | 'compliance' | 'settings'>('overview');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [threats, setThreats] = useState<ThreatDetection[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSecurityData();
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      const events = advancedSecurity.getSecurityEvents(100);
      const threatsData = advancedSecurity.getThreats(50);
      const reports = advancedSecurity.getComplianceReports();
      const configData = advancedSecurity.getConfig();

      setSecurityEvents(events);
      setThreats(threatsData);
      setComplianceReports(reports);
      setConfig(configData);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      events: securityEvents,
      threats,
      compliance: complianceReports,
      config,
      timestamp: new Date().toISOString()
    };

    if (onExport) {
      onExport(exportData);
    } else {
      // Download as JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'security-report.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [securityEvents, threats, complianceReports, config, onExport]);

  const resolveThreat = useCallback((threatId: string) => {
    const resolved = advancedSecurity.resolveThreat(threatId);
    if (resolved) {
      loadSecurityData();
    }
  }, [loadSecurityData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'text-red-600 bg-red-100';
      case 'investigating': return 'text-yellow-600 bg-yellow-100';
      case 'mitigated': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'non-compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSeverity = filterSeverity === 'all' || event.severity === filterSeverity;
    const matchesSearch = searchTerm === '' || 
      event.type.includes(searchTerm) ||
      event.details?.reason?.includes(searchTerm) ||
      event.ipAddress.includes(searchTerm);
    
    return matchesSeverity && matchesSearch;
  });

  const filteredThreats = threats.filter(threat => {
    const matchesSeverity = filterSeverity === 'all' || threat.severity === filterSeverity;
    const matchesSearch = searchTerm === '' || 
      threat.type.includes(searchTerm) ||
      threat.source.includes(searchTerm);
    
    return matchesSeverity && matchesSearch;
  });

  const getTabIcon = (tab: string) => {
    const icons = {
      overview: <Activity className="w-4 h-4" />,
      events: <BarChart3 className="w-4 h-4" />,
      threats: <AlertTriangle className="w-4 h-4" />,
      compliance: <Shield className="w-4 h-4" />,
      settings: <Settings className="w-4 h-4" />
    };
    return icons[tab as keyof typeof icons];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Dashboard de Seguridad
              </h2>
              <p className="text-sm text-gray-600">
                Monitoreo de seguridad en tiempo real y gestión de amenazas
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
              onClick={loadSecurityData}
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
            { id: 'events', label: 'Eventos' },
            { id: 'threats', label: 'Amenazas' },
            { id: 'compliance', label: 'Cumplimiento' },
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

        {/* Filters */}
        {(activeTab === 'events' || activeTab === 'threats') && (
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las severidades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar eventos o amenazas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Events */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Eventos Totales</h3>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {securityEvents.length}
              </div>
              <div className="text-sm text-gray-600">Últimas 24 horas</div>
            </div>

            {/* Active Threats */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Amenazas Activas</h3>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {threats.filter(t => t.status === 'detected').length}
              </div>
              <div className="text-sm text-gray-600">Requieren atención</div>
            </div>

            {/* Compliance Score */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Puntuación Cumplimiento</h3>
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {complianceReports.length > 0 
                  ? Math.round(complianceReports.reduce((sum, r) => sum + r.score, 0) / complianceReports.length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Promedio general</div>
            </div>

            {/* Security Status */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Estado de Seguridad</h3>
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {threats.filter(t => t.severity === 'critical').length === 0 ? '🟢' : '🔴'}
              </div>
              <div className="text-sm text-gray-600">
                {threats.filter(t => t.severity === 'critical').length === 0 ? 'Seguro' : 'Crítico'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Eventos de Seguridad ({filteredEvents.length})
            </h3>
            
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron eventos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map(event => (
                  <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {event.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {event.details.reason || event.details.action || 'Evento de seguridad detectado'}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {event.ipAddress}
                          </span>
                          {event.userId && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {event.userId}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {event.resolved ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Amenazas Detectadas ({filteredThreats.length})
            </h3>
            
            {filteredThreats.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron amenazas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreats.map(threat => (
                  <div key={threat.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                            {threat.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {threat.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(threat.status)}`}>
                            {threat.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {threat.details.reason || `Amenaza ${threat.type} detectada`}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {threat.source}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {threat.target}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(threat.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {threat.status !== 'resolved' && (
                          <button
                            onClick={() => resolveThreat(threat.id)}
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm transition-colors"
                          >
                            Resolver
                          </button>
                        )}
                        {threat.status === 'resolved' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Reportes de Cumplimiento
            </h3>
            
            {complianceReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay reportes de cumplimiento disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complianceReports.map((report, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">{report.standard}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplianceStatusColor(report.status)}`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Puntuación</span>
                        <span className="text-2xl font-bold text-gray-800">{report.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            report.score >= 80 ? 'bg-green-500' : 
                            report.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${report.score}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Problemas Identificados ({report.issues.length})</h5>
                      {report.issues.length === 0 ? (
                        <p className="text-sm text-green-600">✅ Sin problemas identificados</p>
                      ) : (
                        <div className="space-y-2">
                          {report.issues.slice(0, 3).map((issue, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              • {issue.description}
                            </div>
                          ))}
                          {report.issues.length > 3 && (
                            <div className="text-xs text-gray-500">
                              ... y {report.issues.length - 3} más
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Última auditoría: {new Date(report.lastAudit).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && config && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Configuración de Seguridad
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Encryption Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Encriptación
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.encryption.enabled}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Encriptación habilitada</span>
                  </label>
                  <div className="text-sm text-gray-600">
                    Algoritmo: {config.encryption.algorithm}
                  </div>
                  <div className="text-sm text-gray-600">
                    Longitud de clave: {config.encryption.keyLength} bits
                  </div>
                </div>
              </div>

              {/* Authentication Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Autenticación
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.authentication.mfa}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Multi-factor authentication</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.authentication.biometric}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Autenticación biométrica</span>
                  </label>
                  <div className="text-sm text-gray-600">
                    Timeout de sesión: {config.authentication.sessionTimeout / 60000} minutos
                  </div>
                </div>
              </div>

              {/* Compliance Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Cumplimiento
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.compliance.gdpr}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">GDPR</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.compliance.soc2}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">SOC2</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.compliance.auditLogging}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Audit logging</span>
                  </label>
                </div>
              </div>

              {/* Monitoring Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Monitoreo
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.monitoring.enabled}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Monitoreo habilitado</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.monitoring.threatDetection}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Detección de amenazas</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.monitoring.realTimeAlerts}
                      readOnly
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Alertas en tiempo real</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
