'use client';

import React, { useState } from 'react';
import {
  SquarePostTemplate1,
  SquarePostTemplate2,
  StoryTemplate1,
  StoryTemplate2,
  FlyerTemplate1,
  FlyerTemplate2,
  BannerTemplate1,
  BannerTemplate2,
  BadgeTemplate1,
  BadgeTemplate2,
  BrochureTemplate1,
  BrochureTemplate2,
  TemplateProps
} from './index';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  dimensions: string;
  description: string;
  template: React.ComponentType<TemplateProps>;
  canvaTemplateId?: string; // Optional: for existing Canva templates
  canvaCategory: string; // Canva template category for search
  color: string;
  tags: string[];
}

const CanvaTemplateGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data for templates
  const sampleData: TemplateProps = {
    title: "Amazing Product Launch",
    subtitle: "Revolutionary Innovation",
    description: "Discover our latest breakthrough product that will transform your business. Built with cutting-edge technology and designed for maximum efficiency.",
    image: "/assets/sample-product.jpg",
    logo: "/assets/company-logo.png",
    ctaText: "Get Started Today"
  };

  // Template definitions with Canva integration
  const templates: TemplateItem[] = [
    // SquarePost Templates
    {
      id: 'square-post-1',
      name: 'Minimal Square Post',
      category: 'SquarePost',
      dimensions: '1080×1080',
      description: 'Clean, professional design for Instagram and Facebook',
      template: SquarePostTemplate1,
      canvaCategory: 'social-media',
      color: 'from-slate-400 to-slate-600',
      tags: ['social-media', 'minimal', 'professional']
    },
    {
      id: 'square-post-2',
      name: 'Vibrant Square Post',
      category: 'SquarePost',
      dimensions: '1080×1080',
      description: 'Bold, eye-catching design with modern aesthetics',
      template: SquarePostTemplate2,
      canvaCategory: 'social-media',
      color: 'from-purple-400 to-pink-500',
      tags: ['social-media', 'vibrant', 'modern']
    },
    // Story Templates
    {
      id: 'story-1',
      name: 'Minimal Story',
      category: 'Story',
      dimensions: '1080×1920',
      description: 'Professional story design for Instagram and WhatsApp',
      template: StoryTemplate1,
      canvaCategory: 'social-media',
      color: 'from-slate-400 to-slate-600',
      tags: ['story', 'minimal', 'professional']
    },
    {
      id: 'story-2',
      name: 'Vibrant Story',
      category: 'Story',
      dimensions: '1080×1920',
      description: 'Creative story design with bold colors and animations',
      template: StoryTemplate2,
      canvaCategory: 'social-media',
      color: 'from-indigo-400 to-pink-500',
      tags: ['story', 'vibrant', 'creative']
    },
    // Flyer Templates
    {
      id: 'flyer-1',
      name: 'Minimal Flyer',
      category: 'Flyer',
      dimensions: '1200×1500',
      description: 'Professional flyer design for print and digital',
      template: FlyerTemplate1,
      canvaCategory: 'flyers',
      color: 'from-slate-400 to-slate-600',
      tags: ['flyer', 'minimal', 'print']
    },
    {
      id: 'flyer-2',
      name: 'Vibrant Flyer',
      category: 'Flyer',
      dimensions: '1200×1500',
      description: 'Eye-catching flyer with modern design elements',
      template: FlyerTemplate2,
      canvaCategory: 'flyers',
      color: 'from-purple-400 to-orange-400',
      tags: ['flyer', 'vibrant', 'modern']
    },
    // Banner Templates
    {
      id: 'banner-1',
      name: 'Minimal Banner',
      category: 'Banner',
      dimensions: '1200×628',
      description: 'Professional banner for Facebook feed and ads',
      template: BannerTemplate1,
      canvaCategory: 'social-media',
      color: 'from-slate-400 to-slate-600',
      tags: ['banner', 'minimal', 'ads']
    },
    {
      id: 'banner-2',
      name: 'Vibrant Banner',
      category: 'Banner',
      dimensions: '1200×628',
      description: 'Attention-grabbing banner with bold colors',
      template: BannerTemplate2,
      canvaCategory: 'social-media',
      color: 'from-blue-400 to-pink-500',
      tags: ['banner', 'vibrant', 'ads']
    },
    // Badge Templates
    {
      id: 'badge-1',
      name: 'Minimal Badge',
      category: 'Badge',
      dimensions: '800×800',
      description: 'Clean badge design for digital and print use',
      template: BadgeTemplate1,
      canvaCategory: 'social-media',
      color: 'from-slate-400 to-slate-600',
      tags: ['badge', 'minimal', 'digital']
    },
    {
      id: 'badge-2',
      name: 'Vibrant Badge',
      category: 'Badge',
      dimensions: '800×800',
      description: 'Colorful badge with modern design elements',
      template: BadgeTemplate2,
      canvaCategory: 'social-media',
      color: 'from-emerald-400 to-cyan-500',
      tags: ['badge', 'vibrant', 'modern']
    },
    // Brochure Templates
    {
      id: 'brochure-1',
      name: 'Minimal Brochure',
      category: 'Brochure',
      dimensions: '1200×1500',
      description: 'Professional brochure layout for business use',
      template: BrochureTemplate1,
      canvaCategory: 'presentations',
      color: 'from-slate-400 to-slate-600',
      tags: ['brochure', 'minimal', 'business']
    },
    {
      id: 'brochure-2',
      name: 'Vibrant Brochure',
      category: 'Brochure',
      dimensions: '1200×1500',
      description: 'Creative brochure with bold design elements',
      template: BrochureTemplate2,
      canvaCategory: 'presentations',
      color: 'from-rose-400 to-purple-500',
      tags: ['brochure', 'vibrant', 'creative']
    }
  ];

  // Function to open Canva with specific template category
  const openCanvaCategory = (category: string) => {
    const canvaUrls = {
      'social-media': 'https://www.canva.com/templates/search/social-media/',
      'flyers': 'https://www.canva.com/templates/search/flyers/',
      'presentations': 'https://www.canva.com/templates/search/presentations/',
      'business': 'https://www.canva.com/templates/search/business/',
      'marketing': 'https://www.canva.com/templates/search/marketing/'
    };
    
    const url = canvaUrls[category as keyof typeof canvaUrls] || 'https://www.canva.com/';
    window.open(url, '_blank');
  };

  // Function to open Canva editor with specific template (if ID exists)
  const openCanvaEditor = (template: TemplateItem) => {
    if (template.canvaTemplateId) {
      // Direct link to specific Canva template
      const canvaUrl = `https://www.canva.com/design/${template.canvaTemplateId}`;
      window.open(canvaUrl, '_blank');
    } else {
      // Open Canva category search
      openCanvaCategory(template.canvaCategory);
    }
  };

  // Function to get appropriate scale for template preview
  const getTemplateScale = (dimensions: string) => {
    if (dimensions.includes('1080×1080')) return 'scale-50';
    if (dimensions.includes('1080×1920')) return 'scale-40';
    if (dimensions.includes('1200×1500')) return 'scale-40';
    if (dimensions.includes('1200×628')) return 'scale-50';
    if (dimensions.includes('800×800')) return 'scale-60';
    return 'scale-50';
  };

  // Filter templates based on category and search
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 Professional Design Templates
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our collection of professionally designed templates. 
            Click any template to open it directly in Canva's editor for customization.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105 border border-gray-100"
              onClick={() => openCanvaEditor(template)}
            >
              {/* Template Preview */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className={`${getTemplateScale(template.dimensions)} origin-top-left transform mx-auto`}>
                  <template.template {...sampleData} />
                </div>
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${template.color} text-white`}>
                    {template.category}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {template.dimensions}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span>🎨</span>
                  <span>{template.canvaTemplateId ? 'Edit in Canva' : 'Browse Similar'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or category filters
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🚀 How to Use These Templates
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Browse Templates</h3>
                  <p className="text-gray-600 text-sm">View all available templates with live previews</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Click to Edit</h3>
                  <p className="text-gray-600 text-sm">Click any template to open it directly in Canva</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Customize in Canva</h3>
                  <p className="text-gray-600 text-sm">Use Canva's powerful tools to customize your design</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Download & Use</h3>
                  <p className="text-gray-600 text-sm">Export your design and use it in your projects</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Options */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            🔗 Integration Options
          </h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p>• <strong>Direct Template Links:</strong> If you have specific Canva template IDs, you can add them to the <code>canvaTemplateId</code> field for direct editing</p>
            <p>• <strong>Category Search:</strong> Templates without specific IDs will open Canva's category search for similar designs</p>
            <p>• <strong>Custom Integration:</strong> You can also integrate with Canva's API for more advanced functionality</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvaTemplateGallery;
