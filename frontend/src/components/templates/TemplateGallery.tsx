import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { FiEdit3, FiDownload, FiFilter, FiGrid, FiImage, FiFileText, FiVideo, FiSmartphone, FiMonitor, FiShare2, FiBookOpen } from 'react-icons/fi';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  dimensions: string;
  description: string;
  thumbnail: string;
  editorType?: 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document' | 'brochure';
  templateKey?: string; // For real estate templates
}

interface TemplateGalleryProps {
  onDownloadTemplate?: (templateId: string) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onDownloadTemplate
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | TemplateItem['category']>('all');
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

  // Enhanced templates with editor types and template keys
  const sampleTemplates: TemplateItem[] = [
    // Social Posts
    {
      id: '1',
      name: 'IG/FB Square Post',
      category: 'social-posts',
      dimensions: '1080x1080',
      thumbnail: '/api/placeholder/400/300',
      description: 'Post cuadrado optimizado para Instagram y Facebook',
      editorType: 'social',
      templateKey: 'luxuryHouse'
    },
    {
      id: '2',
      name: 'Post Promocional',
      category: 'social-posts',
      dimensions: '1080x1080',
      thumbnail: '/api/placeholder/400/300',
      description: 'Diseño atractivo para promociones en redes sociales',
      editorType: 'social',
      templateKey: 'modernFamily'
    },
    // Story Templates
    {
      id: '3',
      name: 'IG/FB/WSP Story',
      category: 'stories',
      dimensions: '1080x1920',
      thumbnail: '/api/placeholder/400/700',
      description: 'Story vertical para Instagram, Facebook y WhatsApp',
      editorType: 'story',
      templateKey: 'dreamHome'
    },
    {
      id: '4',
      name: 'Story Promocional',
      category: 'stories',
      dimensions: '1080x1920',
      thumbnail: '/api/placeholder/400/700',
      description: 'Story con elementos promocionales atractivos',
      editorType: 'story',
      templateKey: 'cityRealEstate'
    },
    // Flyer Templates
    {
      id: '5',
      name: 'Marketplace Flyer',
      category: 'flyers',
      thumbnail: '/api/placeholder/400/300',
      description: 'Flyer optimizado para marketplace y ventas',
      editorType: 'flyer',
      templateKey: 'luxuryHouse'
    },
    {
      id: '6',
      name: 'Flyer Evento',
      category: 'flyers',
      thumbnail: '/api/placeholder/400/300',
      description: 'Flyer para eventos y conferencias',
      editorType: 'flyer',
      templateKey: 'modernFamily'
    },
    // Banner Templates
    {
      id: '7',
      name: 'FB Feed Banner',
      category: 'banners',
      thumbnail: '/api/placeholder/400/200',
      description: 'Banner optimizado para Facebook Feed',
      editorType: 'banner',
      templateKey: 'cityRealEstate'
    },
    {
      id: '8',
      name: 'Banner Web',
      category: 'banners',
      thumbnail: '/api/placeholder/400/200',
      description: 'Banner para sitios web y landing pages',
      editorType: 'banner',
      templateKey: 'modernFamily'
    },
    // Badge Templates
    {
      id: '9',
      name: 'Badge Vendido',
      category: 'badges',
      thumbnail: '/api/placeholder/400/400',
      description: 'Badge para propiedades vendidas',
      editorType: 'badge',
      templateKey: 'luxuryHouse'
    },
    {
      id: '10',
      name: 'Badge Reservado',
      category: 'badges',
      thumbnail: '/api/placeholder/400/400',
      description: 'Badge para propiedades reservadas',
      editorType: 'badge',
      templateKey: 'modernFamily'
    },
    // Brochure Templates
    {
      id: '11',
      name: 'Brochure Trifold',
      category: 'documents',
      thumbnail: '/api/placeholder/400/300',
      description: 'Brochure profesional trifold para villas',
      editorType: 'brochure',
      templateKey: 'trifoldBrochure'
    },
    {
      id: '12',
      name: 'Documento Propiedad',
      category: 'documents',
      thumbnail: '/api/placeholder/400/300',
      description: 'Documento detallado de propiedad',
      editorType: 'document',
      templateKey: 'dreamHome'
    }
  ];

  // Function to open Canva editor with specific template
  const openCanvaEditor = (templateId: string) => {
    // Direct link to Canva editor with template
    const canvaUrl = `https://www.canva.com/design/${templateId}`;
    window.open(canvaUrl, '_blank');
  };

  // Ensure templates is always an array and filter safely
  const safeTemplates = Array.isArray(sampleTemplates) ? sampleTemplates : [];
  
  const filteredTemplates = safeTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEditTemplate = (template: TemplateItem) => {
    if (template.editorType && template.templateKey) {
      // Navigate to the unified editor with template information
      router.push(`/editor?type=${template.editorType}&template=${template.templateKey}&id=${template.id}`);
    } else {
      // Fallback to default editor
      router.push(`/editor?type=${template.category === 'social-posts' ? 'social' : template.category === 'documents' ? 'document' : template.category.slice(0, -1)}&id=${template.id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Galería de Templates
          </h1>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            Selecciona un template para comenzar a diseñar o crea uno desde cero
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            onClick={() => router.push('/editor?type=flyer&id=new')}
            className="flex items-center space-x-2"
          >
            <FiEdit3 className="w-4 h-4" />
            <span>Crear Nuevo Diseño</span>
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
              onClick={() => setSelectedCategory(category.id as 'all' | TemplateItem['category'])}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-brand-primary text-white shadow-md'
                  : theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
              {category.icon}
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
              className={`w-full pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-brand-primary focus:shadow-sm transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            <div className={`relative aspect-[4/3] overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className={`w-full h-full flex items-center justify-center ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800' 
                  : 'bg-gradient-to-br from-gray-50 to-gray-100'
              }`}>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    theme === 'dark' ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {template.category === 'stories' ? <FiSmartphone className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} /> :
                     template.category === 'documents' ? <FiBookOpen className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} /> :
                     template.category === 'banners' ? <FiMonitor className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} /> :
                     template.category === 'badges' ? <FiImage className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} /> :
                     <FiImage className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />}
                  </div>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{template.name}</span>
                </div>
              </div>
              
              {/* Hover Overlay */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center ${
                theme === 'dark' ? 'bg-black/60' : 'bg-black/40'
              }`}>
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FiEdit3 className="w-6 h-6" />
                  </div>
                  <p className="font-medium">Editar en Editor</p>
                  <p className="text-sm opacity-80">Click para abrir</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-semibold text-sm line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {template.name}
                </h3>
                {template.templateKey && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                    🏠 Preset
                  </span>
                )}
              </div>
              
              <p className={`text-xs mb-3 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {template.description}
              </p>
              
              {/* Category Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {categories.find(c => c.id === template.category)?.name}
                </span>
                
                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadTemplate?.(template.id);
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
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiImage className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No se encontraron templates
          </h3>
          <p className="text-gray-300">
            Intenta ajustar los filtros o la búsqueda
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
