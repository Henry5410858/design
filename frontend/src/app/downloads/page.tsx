'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';

interface DownloadedDesign {
  id: string;
  name: string;
  category: string;
  downloadedAt: string;
  format: 'PNG' | 'PDF';
  size: string;
  thumbnail: string;
}

const DownloadsPage: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedDesign[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for downloads - memoized to prevent recreation
  const mockDownloads = useMemo((): DownloadedDesign[] => [
    {
      id: '1',
      name: 'Post Cuadrado Minimalista',
      category: 'IG/FB Square Post',
      downloadedAt: '2024-01-15T10:30:00Z',
      format: 'PNG',
      size: '2.4 MB',
      thumbnail: '/thumbnails/square-post-1.jpg'
    },
    {
      id: '2',
      name: 'Flyer Profesional',
      category: 'Marketplace Flyer',
      downloadedAt: '2024-01-14T15:45:00Z',
      format: 'PDF',
      size: '1.8 MB',
      thumbnail: '/thumbnails/flyer-1.jpg'
    },
    {
      id: '3',
      name: 'Banner Profesional',
      category: 'FB Feed Banner',
      downloadedAt: '2024-01-13T09:20:00Z',
      format: 'PNG',
      size: '3.1 MB',
      thumbnail: '/thumbnails/banner-1.jpg'
    }
  ], []);

  // Load mock data on mount
  useEffect(() => {
    setDownloads(mockDownloads);
  }, [mockDownloads]);

  // Memoize filtered downloads to prevent recalculation
  const filteredDownloads = useMemo(() => 
    downloads.filter(download => {
      const matchesFormat = selectedFormat === 'all' || download.format === selectedFormat;
      const matchesSearch = download.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           download.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFormat && matchesSearch;
    }), 
    [downloads, selectedFormat, searchQuery]
  );

  // Memoize computed values
  const totalDownloads = useMemo(() => downloads.length, [downloads]);
  const pngCount = useMemo(() => downloads.filter(d => d.format === 'PNG').length, [downloads]);
  const pdfCount = useMemo(() => downloads.filter(d => d.format === 'PDF').length, [downloads]);
  const hasDownloads = useMemo(() => downloads.length > 0, [downloads]);
  const hasFilteredResults = useMemo(() => filteredDownloads.length > 0, [filteredDownloads]);
  const showEmptyState = useMemo(() => 
    downloads.length === 0 && !searchQuery && selectedFormat === 'all', 
    [downloads.length, searchQuery, selectedFormat]
  );

  // Format date helper - memoized
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Download again handler - memoized
  const handleDownloadAgain = useCallback((design: DownloadedDesign) => {
    // In a real implementation, this would trigger the actual download
    alert(`Descargando ${design.name} en formato ${design.format}`);
  }, []);

  // Delete download handler - memoized
  const handleDelete = useCallback((designId: string) => {
    setDownloads(prev => prev.filter(d => d.id !== designId));
  }, []);

  // Event handlers - memoized
  const handleFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormat(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium mb-4 border border-orange-200">
            <span>📥</span>
            <span>Gestión de Descargas</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Mis Diseños Descargados
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Organiza y gestiona todos tus diseños descargados en un solo lugar
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Descargas</p>
                <p className="text-3xl font-bold text-gray-900">{totalDownloads}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archivos PNG</p>
                <p className="text-3xl font-bold text-green-600">{pngCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archivos PDF</p>
                <p className="text-3xl font-bold text-red-600">{pdfCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Última Descarga</p>
                <p className="text-3xl font-bold text-purple-600">Hoy</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Format Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
              <select
                value={selectedFormat}
                onChange={handleFormatChange}
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                <option value="all">Todos los formatos</option>
                <option value="PNG">Solo PNG</option>
                <option value="PDF">Solo PDF</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">{filteredDownloads.length}</span> de{' '}
              <span className="font-semibold text-gray-900">{downloads.length}</span> descargas
            </p>
          </div>
        </div>

        {/* Downloads List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Diseños Descargados ({filteredDownloads.length})
            </h2>
          </div>

          {!hasFilteredResults ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📥</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay descargas
              </h3>
              <p className="text-gray-600">
                {searchQuery || selectedFormat !== 'all' 
                  ? 'Intenta ajustar tus filtros de búsqueda'
                  : 'Comienza descargando algunas plantillas desde la galería'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDownloads.map((download) => (
                <DownloadItem
                  key={download.id}
                  download={download}
                  onDownloadAgain={handleDownloadAgain}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty State for No Downloads */}
        {showEmptyState && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center mt-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📥</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No hay descargas aún
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Comienza a descargar plantillas desde nuestra galería para verlas aquí
            </p>
            <a
              href="/templates"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              🎨 Explorar Plantillas
            </a>
          </div>
        )}
      </div>
    </AppLayout>
  );
});

// Separate memoized download item component
const DownloadItem: React.FC<{
  download: DownloadedDesign;
  onDownloadAgain: (design: DownloadedDesign) => void;
  onDelete: (designId: string) => void;
  formatDate: (dateString: string) => string;
}> = React.memo(({ download, onDownloadAgain, onDelete, formatDate }) => {
  const handleDownload = useCallback(() => {
    onDownloadAgain(download);
  }, [onDownloadAgain, download]);

  const handleDelete = useCallback(() => {
    onDelete(download.id);
  }, [onDelete, download.id]);

  const getFormatIcon = (format: string) => {
    return format === 'PNG' ? '🖼️' : '📄';
  };

  const getFormatColor = (format: string) => {
    return format === 'PNG' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors duration-200 group">
      <div className="flex items-center space-x-4">
        {/* Format Icon */}
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <span className="text-xl">{getFormatIcon(download.format)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {download.name}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getFormatColor(download.format)}`}>
              {download.format}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{download.category}</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(download.downloadedAt)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{download.size}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            <span>📥</span>
            <span>Descargar</span>
          </button>
          
          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-all duration-200 transform hover:scale-105"
          >
            <span>🗑️</span>
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
});

DownloadItem.displayName = 'DownloadItem';
DownloadsPage.displayName = 'DownloadsPage';

export default DownloadsPage;
