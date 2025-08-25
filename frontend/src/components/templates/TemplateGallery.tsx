import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FiEdit3, FiDownload, FiFilter, FiGrid, FiImage, FiFileText, FiVideo } from 'react-icons/fi';

export interface Template {
  id: string;
  name: string;
  category: 'flyers' | 'banners' | 'stories' | 'docs';
  thumbnail: string;
  description: string;
  isPremium: boolean;
}

interface TemplateGalleryProps {
  templates?: Template[];
  onEditTemplate: (templateId: string) => void;
  onDownloadTemplate: (templateId: string) => void;
  onUpgradeRequired?: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates = [],
  onEditTemplate,
  onDownloadTemplate,
  onUpgradeRequired
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | Template['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'Todos', icon: <FiGrid /> },
    { id: 'flyers', name: 'Flyers', icon: <FiImage /> },
    { id: 'banners', name: 'Banners', icon: <FiImage /> },
    { id: 'stories', name: 'Stories', icon: <FiVideo /> },
    { id: 'docs', name: 'Documentos', icon: <FiFileText /> }
  ];

  // Ensure templates is always an array and filter safely
  const safeTemplates = Array.isArray(templates) ? templates : [];
  
  const filteredTemplates = safeTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEditTemplate = (template: Template) => {
    if (template.isPremium && onUpgradeRequired) {
      onUpgradeRequired();
      return;
    }
    onEditTemplate(template.id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Biblioteca de Templates
          </h1>
          <p className="text-gray-600 text-lg">
            Diseños profesionales para todos tus proyectos
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<FiDownload />}
            onClick={() => {/* Batch export functionality */}}
          >
            Exportar Todo
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as 'all' | Template['category'])}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-primary focus:shadow-sm transition-all duration-200"
            />
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map(template => (
          <Card
            key={template.id}
            variant="interactive"
            padding="none"
            className="group overflow-hidden"
            onClick={() => handleEditTemplate(template)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Premium Badge */}
              {template.isPremium && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  PREMIUM
                </div>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FiEdit3 className="w-6 h-6" />
                  </div>
                  <p className="font-medium">Editar en Canva</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                  {template.name}
                </h3>
                {template.isPremium && (
                  <FiImage className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2" />
                )}
              </div>
              
              <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                {template.description}
              </p>
              
              {/* Category Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {categories.find(c => c.id === template.category)?.name}
                </span>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadTemplate(template.id);
                    }}
                    className="p-1 h-8 w-8"
                  >
                    <FiDownload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiImage className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron templates
          </h3>
          <p className="text-gray-600">
            Intenta ajustar los filtros o la búsqueda
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
