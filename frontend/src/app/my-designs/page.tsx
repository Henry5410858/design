'use client';
import { useState } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import AppLayout from '../../components/layout/AppLayout';
import { 
  SquaresFour, 
  Image as ImageIcon, 
  Pencil, 
  Export, 
  Star 
} from 'phosphor-react';
interface Design {
  id: string;
  name: string;
  type: 'flyer' | 'banner' | 'social' | 'document';
  thumbnail: string;
  status: 'draft' | 'published' | 'archived';
  lastModified: string;
  size: string;
  isFavorite: boolean;
}

export default function MyDesignsPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const designs: Design[] = [
    {
      id: '1',
      name: 'Flyer Venta de Verano',
      type: 'flyer',
      thumbnail: '/api/designs/1/thumbnail',
      status: 'published',
      lastModified: '2024-08-25',
      size: 'A4',
      isFavorite: true
    },
    {
      id: '2',
      name: 'Banner Promocional',
      type: 'banner',
      thumbnail: '/api/designs/2/thumbnail',
      status: 'draft',
      lastModified: '2024-08-24',
      size: '1920x1080',
      isFavorite: false
    },
    {
      id: '3',
      name: 'Post Redes Sociales',
      type: 'social',
      thumbnail: '/api/designs/3/thumbnail',
      status: 'published',
      lastModified: '2024-08-23',
      size: '1080x1080',
      isFavorite: true
    },
    {
      id: '4',
      name: 'Documento Corporativo',
      type: 'document',
      thumbnail: '/api/designs/4/thumbnail',
      status: 'archived',
      lastModified: '2024-08-20',
      size: 'A4',
      isFavorite: false
    }
  ];

  const types = [
    { id: 'all', name: 'Todos', icon: <SquaresFour size={24} className="" />, count: designs.length },
    { id: 'flyer', name: 'Flyers', icon: <ImageIcon size={24} className="" />, count: designs.filter(d => d.type === 'flyer').length },
    { id: 'banner', name: 'Banners', icon: <ImageIcon size={24} className="" />, count: designs.filter(d => d.type === 'banner').length },
    { id: 'social', name: 'Redes Sociales', icon: <ImageIcon size={24} className="" />, count: designs.filter(d => d.type === 'social').length },
    { id: 'document', name: 'Documentos', icon: <Pencil size={24} className="" />, count: designs.filter(d => d.type === 'document').length }
  ];

  const statuses = [
    { id: 'all', name: 'Todos', count: designs.length },
    { id: 'draft', name: 'Borradores', count: designs.filter(d => d.status === 'draft').length },
    { id: 'published', name: 'Publicados', count: designs.filter(d => d.status === 'published').length },
    { id: 'archived', name: 'Archivados', count: designs.filter(d => d.status === 'archived').length }
  ];

  const filteredDesigns = designs.filter(design => {
    const matchesType = selectedType === 'all' || design.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || design.status === selectedStatus;
    const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flyer': return <ImageIcon size={16} className="w-4 h-4" />;
      case 'banner': return <ImageIcon size={16} className="w-4 h-4" />;
      case 'social': return <ImageIcon size={16} className="w-4 h-4" />;
      case 'document': return <Pencil size={16} className="w-4 h-4" />;
      default: return <ImageIcon size={16} className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center">
              <SquaresFour size={24} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Diseños</h1>
              <p className="text-gray-600">Gestiona y organiza todos tus diseños creados</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-6 text-white shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <ImageIcon size={32} className="w-8 h-8" />
              <span className="text-sm opacity-90">Nuevo</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Crear Diseño</h3>
            <p className="text-sm opacity-90">Comienza un nuevo proyecto</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <Export size={32} className="w-8 h-8 text-brand-primary" />
              <span className="text-sm text-gray-500">Descargar</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Exportar Todo</h3>
            <p className="text-sm text-gray-600">Descarga todos los diseños</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <Star size={32} className="w-8 h-8 text-warning" />
              <span className="text-sm text-gray-500">Favoritos</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Favoritos</h3>
            <p className="text-sm text-gray-600">{designs.filter(d => d.isFavorite).length} diseños</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <Pencil size={32} className="w-8 h-8 text-info" />
              <span className="text-sm text-gray-500">Recientes</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Recientes</h3>
            <p className="text-sm text-gray-600">Últimos modificados</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Buscar diseños..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
              />
              <SquaresFour size={16} className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-brand-primary shadow-soft' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <SquaresFour size={16} className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-brand-primary shadow-soft' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <SquaresFour size={16} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              {types.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedType === type.id
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.icon}
                  {type.name}
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {type.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedStatus === status.id
                      ? 'bg-brand-secondary text-white shadow-md'
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

        {/* Designs Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDesigns.map(design => (
              <div
                key={design.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={64} className="w-16 h-16 text-gray-400" />
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(design.status)}`}>
                      {design.status === 'draft' ? 'Borrador' : 
                       design.status === 'published' ? 'Publicado' : 'Archivado'}
                    </span>
                  </div>

                  {/* Favorite Badge */}
                  {design.isFavorite && (
                    <div className="absolute top-3 right-3">
                      <Star size={20} className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex gap-2">
                      <button className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
                        <Pencil size={20} className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
                        <Export size={20} className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
                        <Pencil size={20} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                      {design.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {getTypeIcon(design.type)}
                    <span className="text-xs text-gray-500 capitalize">
                      {design.type === 'flyer' ? 'Flyer' : 
                       design.type === 'banner' ? 'Banner' : 
                       design.type === 'social' ? 'Redes Sociales' : 'Documento'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{design.size}</span>
                    <span>{design.lastModified}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDesigns.map(design => (
              <div
                key={design.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={32} className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {design.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {design.isFavorite && (
                          <Star size={20} className="w-5 h-5 text-yellow-500 fill-current" />
                        )}
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(design.status)}`}>
                          {design.status === 'draft' ? 'Borrador' : 
                           design.status === 'published' ? 'Publicado' : 'Archivado'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(design.type)}
                        {design.type === 'flyer' ? 'Flyer' : 
                         design.type === 'banner' ? 'Banner' : 
                         design.type === 'social' ? 'Redes Sociales' : 'Documento'}
                      </span>
                      <span>•</span>
                      <span>{design.size}</span>
                      <span>•</span>
                      <span>Modificado: {design.lastModified}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors">
                      <Pencil size={16} className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors">
                      <Export size={16} className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors">
                      <Pencil size={16} className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                      <Pencil size={16} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredDesigns.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SquaresFour size={32} className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron diseños
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros o crear tu primer diseño
            </p>
          </div>
        )}

        {/* Statistics Section */}
        <div className="mt-12 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-8 border border-brand-primary/20">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Estadísticas de Diseños
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <SquaresFour size={24} className="w-6 h-6 text-brand-primary" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-1">{designs.length}</h4>
              <p className="text-sm text-gray-600">Total de Diseños</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="w-6 h-6 text-success" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-1">{designs.filter(d => d.isFavorite).length}</h4>
              <p className="text-sm text-gray-600">Favoritos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Pencil size={24} className="w-6 h-6 text-warning" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-1">{designs.filter(d => d.status === 'draft').length}</h4>
              <p className="text-sm text-gray-600">Borradores</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Export size={24} className="w-6 h-6 text-info" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-1">{designs.filter(d => d.status === 'published').length}</h4>
              <p className="text-sm text-gray-600">Publicados</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
