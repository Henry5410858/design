'use client';
import { useState } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FiFileText, FiPlus, FiSearch, FiFilter, FiEdit3, FiEye, FiDownload, FiTrash2, FiClock, FiDollarSign, FiUser, FiCalendar, FiCheck, FiX } from 'react-icons/fi';

interface Proposal {
  id: string;
  title: string;
  client: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  amount: number;
  currency: string;
  createdAt: string;
  expiresAt: string;
  lastModified: string;
}

export default function ProposalPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const proposals: Proposal[] = [
    {
      id: '1',
      title: 'Rediseño de Sitio Web Corporativo',
      client: 'TechCorp S.L.',
      status: 'approved',
      amount: 5000,
      currency: 'EUR',
      createdAt: '2024-08-20',
      expiresAt: '2024-09-20',
      lastModified: '2024-08-25'
    },
    {
      id: '2',
      title: 'Identidad Visual para Startup',
      client: 'InnovateLab',
      status: 'sent',
      amount: 3000,
      currency: 'EUR',
      createdAt: '2024-08-22',
      expiresAt: '2024-09-22',
      lastModified: '2024-08-24'
    },
    {
      id: '3',
      title: 'Campaña de Marketing Digital',
      client: 'Retail Solutions',
      status: 'draft',
      amount: 7500,
      currency: 'EUR',
      createdAt: '2024-08-23',
      expiresAt: '2024-09-23',
      lastModified: '2024-08-25'
    },
    {
      id: '4',
      title: 'Packaging para Producto',
      client: 'EcoProducts',
      status: 'rejected',
      amount: 2500,
      currency: 'EUR',
      createdAt: '2024-08-15',
      expiresAt: '2024-09-15',
      lastModified: '2024-08-18'
    }
  ];

  const statuses = [
    { id: 'all', name: 'Todos', count: proposals.length },
    { id: 'draft', name: 'Borradores', count: proposals.filter(p => p.status === 'draft').length },
    { id: 'sent', name: 'Enviadas', count: proposals.filter(p => p.status === 'sent').length },
    { id: 'approved', name: 'Aprobadas', count: proposals.filter(p => p.status === 'approved').length },
    { id: 'rejected', name: 'Rechazadas', count: proposals.filter(p => p.status === 'rejected').length },
    { id: 'expired', name: 'Expiradas', count: proposals.filter(p => p.status === 'expired').length }
  ];

  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = selectedStatus === 'all' || proposal.status === selectedStatus;
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         proposal.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FiClock className="w-4 h-4" />;
      case 'sent': return <FiFileText className="w-4 h-4" />;
      case 'approved': return <FiCheck className="w-4 h-4" />;
      case 'rejected': return <FiX className="w-4 h-4" />;
      case 'expired': return <FiClock className="w-4 h-4" />;
      default: return <FiFileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviada';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'expired': return 'Expirada';
      default: return status;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Propuestas</h1>
              <p className="text-gray-600">Gestiona y crea propuestas profesionales para tus clientes</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-brand-primary" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{proposals.length}</h3>
            <p className="text-sm text-gray-600">Propuestas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <FiCheck className="w-6 h-6 text-success" />
              </div>
              <span className="text-sm text-gray-500">Aprobadas</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {proposals.filter(p => p.status === 'approved').length}
            </h3>
            <p className="text-sm text-gray-600">Aprobadas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <FiClock className="w-6 h-6 text-warning" />
              </div>
              <span className="text-sm text-gray-500">Pendientes</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {proposals.filter(p => p.status === 'sent').length}
            </h3>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-info" />
              </div>
              <span className="text-sm text-gray-500">Valor Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(proposals.reduce((sum, p) => sum + p.amount, 0), 'EUR')}
            </h3>
            <p className="text-sm text-gray-600">Valor Total</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-6 text-white shadow-soft mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">¿Listo para crear una nueva propuesta?</h3>
              <p className="text-white/90">Utiliza nuestras plantillas profesionales para crear propuestas atractivas</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-brand-primary rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
            >
              <FiPlus className="w-5 h-5" />
              Crear Propuesta
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar propuestas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
              />
              <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedStatus === status.id
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.name}
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                    {status.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propuesta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProposals.map(proposal => (
                  <tr key={proposal.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                        <div className="text-sm text-gray-500">ID: {proposal.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center mr-3">
                          <FiUser className="w-4 h-4 text-brand-primary" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{proposal.client}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {getStatusIcon(proposal.status)}
                        {getStatusText(proposal.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(proposal.amount, proposal.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{proposal.createdAt}</div>
                      <div className="text-sm text-gray-500">Expira: {proposal.expiresAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors duration-200">
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors duration-200">
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors duration-200">
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors duration-200">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredProposals.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiFileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron propuestas
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros o crear tu primera propuesta
            </p>
          </div>
        )}

        {/* Templates Section */}
        <div className="mt-12 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-8 border border-brand-primary/20">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Plantillas de Propuestas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiFileText className="w-6 h-6 text-brand-primary" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2 text-center">Diseño Web</h4>
              <p className="text-sm text-gray-600 text-center mb-4">Plantilla para proyectos de diseño web</p>
              <button className="w-full px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-dark transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1">
                Usar Plantilla
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
              <div className="w-12 h-12 bg-brand-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiFileText className="w-6 h-6 text-brand-secondary" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2 text-center">Branding</h4>
              <p className="text-sm text-gray-600 text-center mb-4">Plantilla para proyectos de branding</p>
              <button className="w-full px-4 py-2 bg-brand-secondary text-white rounded-xl font-medium hover:bg-brand-secondary-dark transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1">
                Usar Plantilla
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FiFileText className="w-6 h-6 text-success" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2 text-center">Marketing</h4>
              <p className="text-sm text-gray-600 text-center mb-4">Plantilla para campañas de marketing</p>
              <button className="w-full px-4 py-2 bg-success text-white rounded-xl font-medium hover:bg-success/90 transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1">
                Usar Plantilla
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
