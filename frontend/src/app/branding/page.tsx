'use client';
import { useState } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import AppLayout from '../../components/layout/AppLayout';
import { FiImage, FiDownload, FiEdit3, FiEye, FiPlus, FiShare2, FiType, FiDroplet } from 'react-icons/fi';

interface BrandAsset {
  id: string;
  name: string;
  type: 'logo' | 'color' | 'font' | 'icon';
  file?: string;
  preview?: string;
  category: string;
  lastUpdated: string;
}

export default function BrandingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const brandAssets: BrandAsset[] = [
    {
      id: '1',
      name: 'Logo Principal',
      type: 'logo',
      file: '/api/brand-assets/logo-main',
      preview: '/api/brand-assets/logo-main/preview',
      category: 'logos',
      lastUpdated: '2024-08-25'
    },
    {
      id: '2',
      name: 'Paleta de Colores',
      type: 'color',
      category: 'colors',
      lastUpdated: '2024-08-25'
    },
    {
      id: '3',
      name: 'Tipografía Inter',
      type: 'font',
      category: 'fonts',
      lastUpdated: '2024-08-25'
    },
    {
      id: '4',
      name: 'Iconos del Sistema',
      type: 'icon',
      category: 'icons',
      lastUpdated: '2024-08-25'
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos', icon: <FiImage />, count: brandAssets.length },
    { id: 'logos', name: 'Logos', icon: <FiImage />, count: brandAssets.filter(a => a.type === 'logo').length },
    { id: 'colors', name: 'Colores', icon: <FiDroplet />, count: brandAssets.filter(a => a.type === 'color').length },
    { id: 'fonts', name: 'Tipografías', icon: <FiType />, count: brandAssets.filter(a => a.type === 'font').length },
    { id: 'icons', name: 'Iconos', icon: <FiImage />, count: brandAssets.filter(a => a.type === 'icon').length }
  ];

  const filteredAssets = brandAssets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center">
              <FiImage className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Marca</h1>
              <p className="text-gray-600">Administra todos los elementos de tu identidad de marca</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-6 text-white shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <FiPlus className="w-8 h-8" />
              <span className="text-sm opacity-90">Nuevo</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Crear Asset</h3>
            <p className="text-sm opacity-90">Sube nuevos elementos de marca</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <FiDownload className="w-8 h-8 text-brand-primary" />
              <span className="text-sm text-gray-500">Descargar</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kit Completo</h3>
            <p className="text-sm text-gray-600">Descarga todos los assets en un ZIP</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <FiShare2 className="w-8 h-8 text-brand-secondary" />
              <span className="text-sm text-gray-500">Compartir</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Compartir</h3>
            <p className="text-sm text-gray-600">Comparte tu kit con el equipo</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.icon}
                  {category.name}
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
              />
              <FiEye className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
            >
              {/* Asset Preview */}
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {asset.type === 'logo' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiImage className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {asset.type === 'color' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl"></div>
                  </div>
                )}
                {asset.type === 'font' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiType className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {asset.type === 'icon' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiImage className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-2">
                    <button className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
                      <FiEdit3 className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors">
                      <FiDownload className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {asset.name}
                  </h3>
                  <span className="text-xs text-gray-500 capitalize">
                    {asset.type}
                  </span>
                </div>
                
                <p className="text-gray-600 text-xs mb-3">
                  Categoría: {asset.category}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Actualizado: {asset.lastUpdated}</span>
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-400 hover:text-brand-primary transition-colors">
                      <FiEdit3 className="w-3 h-3" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-brand-primary transition-colors">
                      <FiDownload className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAssets.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiImage className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron assets
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros o crear nuevos elementos de marca
            </p>
          </div>
        )}

        {/* Brand Guidelines Section */}
        <div className="mt-12 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-2xl p-8 border border-brand-primary/20">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Guías de Marca
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiImage className="w-6 h-6 text-brand-primary" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Uso de Logos</h4>
              <p className="text-sm text-gray-600">Guía para el uso correcto de logos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiDroplet className="w-6 h-6 text-brand-secondary" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Paleta de Colores</h4>
              <p className="text-sm text-gray-600">Colores principales y secundarios</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiType className="w-6 h-6 text-success" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Tipografía</h4>
              <p className="text-sm text-gray-600">Fuentes y jerarquía de texto</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiImage className="w-6 h-6 text-warning" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Espaciado</h4>
              <p className="text-sm text-gray-600">Sistema de espaciado y márgenes</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
