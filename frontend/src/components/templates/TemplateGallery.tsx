import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiFilter, FiGrid, FiImage, FiFileText, FiCalendar } from 'react-icons/fi';

const categories = [
  { label: 'All', value: 'all', icon: <FiGrid className="w-4 h-4" /> },
  { label: 'Flyers', value: 'flyer', icon: <FiFileText className="w-4 h-4" /> },
  { label: 'Banners', value: 'banner', icon: <FiImage className="w-4 h-4" /> },
  { label: 'Stories', value: 'story', icon: <FiImage className="w-4 h-4" /> },
  { label: 'Documents', value: 'document', icon: <FiFileText className="w-4 h-4" /> },
];

type Template = {
  _id: string;
  name: string;
  type: string;
  thumbnail: string;
  fileUrl?: string;
  objects?: any[];
  backgroundColor?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const defaultFlyer = {
  _id: 'default-flyer',
  name: 'Default Flyer',
  type: 'flyer',
  thumbnail: 'http://localhost:4000/uploads/default-flyer-thumb.png',
  fileUrl: '/flyers/default-flyer.json',
  isDefault: true,
};

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState('flyer');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/templates');
      const data = await res.json();
      setTemplates(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch('http://localhost:4000/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          type: newTemplateType,
        }),
      });
      
      if (res.ok) {
        const newTemplate = await res.json();
        setTemplates(prev => [...prev, newTemplate]);
        setShowCreateDialog(false);
        setNewTemplateName('');
        setNewTemplateType('flyer');
        router.push(`/editor/${newTemplate._id}`);
      } else {
        const error = await res.json();
        alert(`Failed to create template: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(templateId);
    try {
      const res = await fetch(`http://localhost:4000/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t._id !== templateId));
      } else {
        const error = await res.json();
        alert(`Failed to delete template: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = templates.filter(t =>
    (filter === 'all' || t.type === filter) &&
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const showDefaultFlyer = (filter === 'all' || filter === 'flyer') && !templates.some(t => t.type === 'flyer');
  const displayTemplates = showDefaultFlyer ? [defaultFlyer, ...filtered] : filtered;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Gallery</h1>
        <p className="text-gray-600">Choose from our collection of professional templates or create your own custom design</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === cat.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setFilter(cat.value)}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search and Create */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayTemplates.map(t => (
          <div
            key={t._id}
            className="group cursor-pointer"
            onClick={() => router.push(`/editor/${t._id}`)}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="relative">
                <img 
                  src={t.thumbnail.startsWith('/uploads/') ? `http://localhost:4000${t.thumbnail}` : t.thumbnail} 
                  alt={t.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 capitalize">
                    {t.type}
                  </span>
                </div>
                {!t.isDefault && (
                  <button
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(t._id);
                    }}
                    disabled={deleting === t._id}
                  >
                    {deleting === t._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      '×'
                    )}
                  </button>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {t.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 capitalize">{t.type}</span>
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Type</label>
                <select
                  value={newTemplateType}
                  onChange={e => setNewTemplateType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="flyer">Flyer</option>
                  <option value="banner">Banner</option>
                  <option value="story">Story</option>
                  <option value="document">Document</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={handleCreateTemplate}
                disabled={creating || !newTemplateName.trim()}
              >
                {creating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
