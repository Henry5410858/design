import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FiEdit3, FiDownload, FiFilter, FiGrid, FiImage, FiFileText, FiVideo, FiSmartphone, FiMonitor, FiShare2, FiBookOpen } from 'react-icons/fi';

export interface Template {
  id: string;
  name: string;
  category: 'social-posts' | 'stories' | 'flyers' | 'banners' | 'badges' | 'documents';
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
    { id: 'social-posts', name: 'Posts Redes', icon: <FiImage /> },
    { id: 'stories', name: 'Stories', icon: <FiSmartphone /> },
    { id: 'flyers', name: 'Flyers', icon: <FiShare2 /> },
    { id: 'banners', name: 'Banners', icon: <FiMonitor /> },
    { id: 'badges', name: 'Badges', icon: <FiImage /> },
    { id: 'documents', name: 'Documentos', icon: <FiBookOpen /> }
  ];

  // Sample templates for each category
  const sampleTemplates: Template[] = [
    // Social Posts
    {
      id: '1',
      name: 'IG/FB Square Post',
      category: 'social-posts',
      thumbnail: '/api/placeholder/400/300',
      description: 'Post cuadrado optimizado para Instagram y Facebook',
      isPremium: false
    },
    {
      id: '2',
      name: 'Post Promocional',
      category: 'social-posts',
      thumbnail: '/api/placeholder/400/300',
      description: 'Diseño atractivo para promociones en redes sociales',
      isPremium: true
    },
    {
      id: '3',
      name: 'Post Informativo',
      category: 'social-posts',
      thumbnail: '/api/placeholder/400/300',
      description: 'Layout limpio para información y noticias',
      isPremium: false
    },

    // Stories
    {
      id: '4',
      name: 'IG/FB/WSP Story',
      category: 'stories',
      thumbnail: '/api/placeholder/400/700',
      description: 'Story vertical para Instagram, Facebook y WhatsApp',
      isPremium: false
    },
    {
      id: '5',
      name: 'Story Promocional',
      category: 'stories',
      thumbnail: '/api/placeholder/400/700',
      description: 'Story con elementos promocionales atractivos',
      isPremium: true
    },
    {
      id: '6',
      name: 'Story Informativo',
      category: 'stories',
      thumbnail: '/api/placeholder/400/700',
      description: 'Story para compartir información importante',
      isPremium: false
    },

    // Flyers
    {
      id: '7',
      name: 'Marketplace Flyer',
      category: 'flyers',
      thumbnail: '/api/placeholder/400/300',
      description: 'Flyer optimizado para marketplace y ventas',
      isPremium: false
    },
    {
      id: '8',
      name: 'Flyer Evento',
      category: 'flyers',
      thumbnail: '/api/placeholder/400/300',
      description: 'Flyer para eventos y conferencias',
      isPremium: true
    },
    {
      id: '9',
      name: 'Flyer Promocional',
      category: 'flyers',
      thumbnail: '/api/placeholder/400/300',
      description: 'Flyer para promociones y ofertas',
      isPremium: false
    },

    // Banners
    {
      id: '10',
      name: 'FB Feed Banner',
      category: 'banners',
      thumbnail: '/api/placeholder/400/200',
      description: 'Banner optimizado para Facebook Feed',
      isPremium: false
    },
    {
      id: '11',
      name: 'Banner Web',
      category: 'banners',
      thumbnail: '/api/placeholder/400/200',
      description: 'Banner para sitios web y landing pages',
      isPremium: true
    },
    {
      id: '12',
      name: 'Banner Email',
      category: 'banners',
      thumbnail: '/api/placeholder/400/200',
      description: 'Banner para campañas de email marketing',
      isPremium: false
    },

    // Badges
    {
      id: '13',
      name: 'Digital Badge',
      category: 'badges',
      thumbnail: '/api/placeholder/300/300',
      description: 'Badge digital para certificaciones y logros',
      isPremium: false
    },
    {
      id: '14',
      name: 'Visual Card',
      category: 'badges',
      thumbnail: '/api/placeholder/300/300',
      description: 'Tarjeta visual para presentaciones',
      isPremium: true
    },
    {
      id: '15',
      name: 'Profile Badge',
      category: 'badges',
      thumbnail: '/api/placeholder/300/300',
      description: 'Badge para perfiles profesionales',
      isPremium: false
    },

    // Documents
    {
      id: '16',
      name: 'Brochure Simple',
      category: 'documents',
      thumbnail: '/api/placeholder/400/600',
      description: 'Brochure de una página simple y elegante',
      isPremium: false
    },
    {
      id: '17',
      name: 'Documento 1 Página',
      category: 'documents',
      thumbnail: '/api/placeholder/400/600',
      description: 'Documento de una página para presentaciones',
      isPremium: true
    },
    {
      id: '18',
      name: 'Folleto Informativo',
      category: 'documents',
      thumbnail: '/api/placeholder/400/600',
      description: 'Folleto informativo profesional',
      isPremium: false
    }
  ];

  // Use provided templates or fall back to sample templates
  const allTemplates = templates.length > 0 ? templates : sampleTemplates;

  // Ensure templates is always an array and filter safely
  const safeTemplates = Array.isArray(allTemplates) ? allTemplates : [];
  
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
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    {template.category === 'stories' ? <FiSmartphone className="w-6 h-6 text-gray-600" /> :
                     template.category === 'documents' ? <FiBookOpen className="w-6 h-6 text-gray-600" /> :
                     template.category === 'banners' ? <FiMonitor className="w-6 h-6 text-gray-600" /> :
                     template.category === 'badges' ? <FiImage className="w-6 h-6 text-gray-600" /> :
                     <FiImage className="w-6 h-6 text-gray-600" />}
                  </div>
                  <span className="text-gray-500 text-sm font-medium">{template.name}</span>
                </div>
              </div>
              
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
