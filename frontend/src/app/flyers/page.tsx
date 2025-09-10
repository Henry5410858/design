"use client";
import { useEffect, useState } from 'react';

// This page should be statically generated
export const dynamic = 'auto';
import FlyerEditor from '../../components/flyers/FlyerEditor';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import Icon from '@/components/ui/Icon';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { withContextPreservation, safeAsync } from '../../utils/contextManager';

import API_ENDPOINTS from '@/config/api';
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
  // Safely get user context - handle case where it might not be available during SSR
  let user: any = null;
  try {
    const userContext = useAuth();
    user = userContext.user;
  } catch (error) {
    // User context not available during SSR - this is expected
    console.log('User context not available during SSR');
  }
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlyer, setEditingFlyer] = useState<Flyer | null>(null);
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const perPage = 6;

  const fetchFlyers = withContextPreservation(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.TEMPLATES + '?category=' + flyers);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setFlyers(data);
    } catch (error) {
      console.error('Error fetching flyers:', error);
      // Set empty array as fallback
      setFlyers([]);
    } finally {
      setLoading(false);
    }
  }, {
    onError: (error) => {
      console.error('Context-aware fetchFlyers failed:', error);
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchFlyers();
  }, []);

  const handleEdit = (flyer: Flyer) => {
    setEditingFlyer(flyer);
  };

  const handleSave = withContextPreservation(async (flyer: Partial<Flyer> & { _id?: string }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      if (flyer._id) {
        // Update existing flyer
        const response = await fetch(API_ENDPOINTS.TEMPLATE_BY_ID(flyer._id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(flyer),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update flyer: ${response.status}`);
        }
      } else {
        // Create new flyer
        const response = await fetch(API_ENDPOINTS.TEMPLATES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(flyer),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create flyer: ${response.status}`);
        }
      }
      
      setEditingFlyer(null);
      await fetchFlyers();
    } catch (error) {
      console.error('Error saving flyer:', error);
      throw error; // Re-throw to be handled by context preservation
    }
  }, {
    onError: (error) => {
      console.error('Context-aware handleSave failed:', error);
    }
  });

  const handleDelete = withContextPreservation(async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar este volante?')) {
      return;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.TEMPLATE_BY_ID(id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete flyer: ${response.status}`);
      }
      
      await fetchFlyers();
    } catch (error) {
      console.error('Error deleting flyer:', error);
      throw error; // Re-throw to be handled by context preservation
    }
  }, {
    onError: (error) => {
      console.error('Context-aware handleDelete failed:', error);
    }
  });

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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => setEditingFlyer(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 hover:bg-gray-100 p-2 rounded-xl transition-colors"
            >
              <Icon name="edit-pencil" size={5} className="w-5 h-5" />
              Volver a Volantes
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Editar Volante</h1>
          </div>
          <FlyerEditor flyer={editingFlyer} onSave={handleSave} onCancel={() => setEditingFlyer(null)} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Volantes</h1>
          <p className="text-gray-600">Crea y gestiona tus volantes promocionales</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por título..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                />
                <Icon name="gallery" size={4} className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <input
                type="color"
                value={colorFilter}
                onChange={e => { setColorFilter(e.target.value); setPage(1); }}
                className="w-12 h-12 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-brand-primary transition-colors duration-200"
                title="Filtrar por color"
              />
              <button 
                onClick={() => { setSearch(''); setColorFilter(''); setPage(1); }} 
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                Limpiar
              </button>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-medium hover:from-brand-primary-dark hover:to-brand-secondary-dark transition-all duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
            >
              <Icon name="image-add" size={4} className="w-4 h-4" />
              Crear Nuevo Volante
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear Nuevo Volante</h2>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedFlyers.map(flyer => (
                <div key={flyer._id} className="bg-white rounded-2xl border border-gray-200 shadow-soft hover:shadow-elevated transition-all duration-300 overflow-hidden hover:-translate-y-1">
                  {flyer.previewImage && (
                    <div className="relative">
                      <Image 
                        src={flyer.previewImage.startsWith('http') ? flyer.previewImage : `${API_ENDPOINTS.UPLOADS}${flyer.previewImage}`}
                        alt={flyer.title} 
                        width={400} 
                        height={200} 
                        className="w-full h-48 object-cover" 
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700">
                          {flyer.color || 'Predeterminado'}
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
                          <span className="text-gray-400">+{flyer.content.length - 2} más</span>
                        )}
                      </div>
                    )}
                    {(user && user.id === flyer.createdBy) && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(flyer)} 
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors duration-200"
                        >
                          <Icon name="edit-pencil" size={4} className="w-4 h-4" />
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(flyer._id)} 
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-colors duration-200"
                        >
                          <Icon name="edit-pencil" size={4} className="w-4 h-4" />
                          Eliminar
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
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors duration-200"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-700">Página {page} de {totalPages}</span>
                <button 
                  disabled={page === totalPages} 
                  onClick={() => setPage(page + 1)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors duration-200"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
