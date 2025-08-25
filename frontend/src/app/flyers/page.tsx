"use client";
import { useEffect, useState } from 'react';
import FlyerEditor from '../../components/flyers/FlyerEditor';
import Image from 'next/image';
import { useUser } from '../../context/UserContext';
import { FiPlus, FiSearch, FiFilter, FiEdit3, FiTrash2, FiEye } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout';

type Flyer = {
  _id: string;
  title: string;
  previewImage: string;
  categories: string[];
  color?: string;
  content?: { type: string; value: string }[];
  createdBy: string;
};

export default function FlyersPage() {
  const { user } = useUser();
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlyer, setEditingFlyer] = useState<Flyer | null>(null);
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const perPage = 6;

  const fetchFlyers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/templates?category=flyers');
      const data = await res.json();
      setFlyers(data);
    } catch (error) {
      console.error('Error fetching flyers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlyers();
  }, []);

  const handleEdit = (flyer: Flyer) => {
    setEditingFlyer(flyer);
  };

  const handleSave = async (flyer: Partial<Flyer> & { _id?: string }) => {
    const token = localStorage.getItem('token');
    try {
      if (flyer._id) {
        // Update existing flyer
        await fetch(`http://localhost:4000/api/templates/${flyer._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(flyer),
        });
      } else {
        // Create new flyer
        await fetch('http://localhost:4000/api/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(flyer),
        });
      }
      setEditingFlyer(null);
      fetchFlyers();
    } catch (error) {
      console.error('Error saving flyer:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Are you sure you want to delete this flyer?')) return;
    
    try {
      await fetch(`http://localhost:4000/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchFlyers();
    } catch (error) {
      console.error('Error deleting flyer:', error);
    }
  };

  // Filter and search
  const filteredFlyers = flyers.filter(flyer =>
    (!search || flyer.title.toLowerCase().includes(search.toLowerCase())) &&
    (!colorFilter || flyer.color === colorFilter)
  );
  const totalPages = Math.ceil(filteredFlyers.length / perPage);
  const paginatedFlyers = filteredFlyers.slice((page - 1) * perPage, page * perPage);

  if (editingFlyer) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setEditingFlyer(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Flyers
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Flyer</h1>
          </div>
          <FlyerEditor flyer={editingFlyer} onSave={handleSave} onCancel={() => setEditingFlyer(null)} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flyer Management</h1>
          <p className="text-gray-600">Create and manage your promotional flyers</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <input
                type="color"
                value={colorFilter}
                onChange={e => { setColorFilter(e.target.value); setPage(1); }}
                className="w-12 h-12 border-2 border-gray-200 rounded-xl cursor-pointer"
                title="Filter by color"
              />
              <button 
                onClick={() => { setSearch(''); setColorFilter(''); setPage(1); }} 
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Clear
              </button>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              Create New Flyer
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Flyer</h2>
            <FlyerEditor 
              flyer={undefined} 
              onSave={(flyer) => {
                handleSave(flyer);
                setShowCreateForm(false);
              }} 
              onCancel={() => setShowCreateForm(false)} 
            />
          </div>
        )}

        {/* Flyers Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedFlyers.map(flyer => (
                <div key={flyer._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {flyer.previewImage && (
                    <div className="relative">
                      <Image 
                        src={flyer.previewImage.startsWith('http') ? flyer.previewImage : `http://localhost:4000${flyer.previewImage}`}
                        alt={flyer.title} 
                        width={400} 
                        height={200} 
                        className="w-full h-48 object-cover" 
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700">
                          {flyer.color || 'Default'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{flyer.title}</h3>
                    {flyer.content && flyer.content.length > 0 && (
                      <div className="text-sm text-gray-600 mb-4">
                        {flyer.content.slice(0, 2).map((block, idx) => (
                          <div key={idx} className="mb-1">
                            {typeof block === 'string' ? block : block.value}
                          </div>
                        ))}
                        {flyer.content.length > 2 && (
                          <span className="text-gray-400">+{flyer.content.length - 2} more</span>
                        )}
                      </div>
                    )}
                    {(user && user.id === flyer.createdBy) && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(flyer)} 
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <FiEdit3 className="w-4 h-4" />
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(flyer._id)} 
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">Page {page} of {totalPages}</span>
                <button 
                  disabled={page === totalPages} 
                  onClick={() => setPage(page + 1)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
