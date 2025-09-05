'use client';
import { useState, useEffect } from 'react';

// This page should be statically generated
export const dynamic = 'auto';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Image as ImageIcon, Palette, TextT, FloppyDisk } from 'phosphor-react';
import { api, getApiBaseUrl } from '../../utils/api';
interface BrandKit {
  _id?: string;
  logo?: string | null;
  brandName?: string;
  tagline?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
  font?: string;
}

export default function BrandPage() {
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch brand kit on component mount
  useEffect(() => {
    fetchBrandKit();
  }, []);

  const fetchBrandKit = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/brand-kit');
      if (response.ok) {
        const data = await response.json();
        setBrandKit(data);
        if (data.logo) {
          setLogoPreview(`${getApiBaseUrl()}${data.logo}`);
        }
      }
    } catch (error) {
      console.error('Error fetching brand kit:', error);
      setMessage({ type: 'error', text: 'Error al cargar el kit de marca' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await api.uploadBrandKitLogo(formData);

      if (response.ok) {
        const data = await response.json();
        setBrandKit(prev => ({ ...prev, logo: data.logo }));
        setLogoPreview(`${getApiBaseUrl()}${data.logo}`);
        setLogoFile(null);
        setMessage({ type: 'success', text: '¡Logo subido exitosamente!' });
      } else {
        throw new Error('Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Error al subir el logo' });
    }
  };

  const handleSave = async () => {
    if (!brandKit) return;

    setSaving(true);
    try {
      const response = await api.saveBrandKit(brandKit);

      if (response.ok) {
        setMessage({ type: 'success', text: '¡Kit de marca guardado exitosamente!' });
      } else {
        throw new Error('Failed to save brand kit');
      }
    } catch (error) {
      console.error('Error saving brand kit:', error);
      setMessage({ type: 'error', text: 'Error al guardar el kit de marca' });
    } finally {
      setSaving(false);
    }
  };

  const updateBrandKit = (updates: Partial<BrandKit>) => {
    setBrandKit(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex min-h-screen">
        {/* Brand Kit Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Kit de Marca</h2>
            <nav className="space-y-2">
              <a href="#logo" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <ImageIcon size={16} />
                Logo e Identidad
              </a>
              <a href="#colors" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <Palette size={16} />
                Colores
              </a>
              <a href="#typography" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <TextT size={16} />
                Tipografía
              </a>
              <a href="#preview" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <ImageIcon size={16} />
                Vista Previa
              </a>
            </nav>
            
            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
                >
                  <FloppyDisk size={16} />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <span>🔄</span>
                  Recargar
                </button>
              </div>
            </div>
            
            {/* Brand Status */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Estado de la Marca</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Logo:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    logoPreview ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {logoPreview ? 'Configurado' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Colores:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    brandKit?.colors ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {brandKit?.colors ? 'Configurado' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tipografía:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    brandKit?.fonts ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {brandKit?.fonts ? 'Configurado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kit de Marca</h1>
          <p className="text-gray-600">Gestiona tu identidad de marca, colores y tipografía</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-success/10 border border-success/20 text-success' 
              : 'bg-error/10 border border-error/20 text-error'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Brand Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo & Basic Branding */}
            <div id="logo" className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-xl">
                  <ImageIcon size={5} className="w-5 h-5 text-brand-primary" />
                </div>
                Logo e Identidad de Marca
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Marca</label>
                  <input
                    type="text"
                    value={brandKit?.brandName || ''}
                    onChange={(e) => updateBrandKit({ brandName: e.target.value })}
                    placeholder="Ingresa el nombre de tu marca"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slogan</label>
                  <input
                    type="text"
                    value={brandKit?.tagline || ''}
                    onChange={(e) => updateBrandKit({ tagline: e.target.value })}
                    placeholder="Ingresa el slogan de tu marca"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <div className="w-20 h-20 border-2 border-gray-200 rounded-xl overflow-hidden">
                        <img 
                          src={logoPreview} 
                          alt="Logo de marca" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 transition-colors duration-200"
                      />
                      {logoFile && (
                        <button
                          onClick={uploadLogo}
                          className="mt-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-primary-dark transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
                        >
                          Subir Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div id="colors" className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-brand-secondary/10 rounded-xl">
                  <Palette size={5} className="w-5 h-5 text-brand-secondary" />
                </div>
                Colores de Marca
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Primario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandKit?.colors?.primary || '#3B82F6'}
                      onChange={(e) => updateBrandKit({
                        colors: { 
                          primary: e.target.value,
                          secondary: brandKit?.colors?.secondary || '#F59E0B',
                          accent: brandKit?.colors?.accent || '#10B981'
                        }
                      })}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-brand-primary transition-colors duration-200"
                    />
                    <input
                      type="text"
                      value={brandKit?.colors?.primary || '#3B82F6'}
                      onChange={(e) => updateBrandKit({
                        colors: { 
                          primary: e.target.value,
                          secondary: brandKit?.colors?.secondary || '#F59E0B',
                          accent: brandKit?.colors?.accent || '#10B981'
                        }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Usado para títulos y elementos principales</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Secundario</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandKit?.colors?.secondary || '#F59E0B'}
                      onChange={(e) => updateBrandKit({
                        colors: { 
                          primary: brandKit?.colors?.primary || '#3B82F6',
                          secondary: e.target.value,
                          accent: brandKit?.colors?.accent || '#10B981'
                        }
                      })}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-brand-secondary transition-colors duration-200"
                    />
                    <input
                      type="text"
                      value={brandKit?.colors?.secondary || '#F59E0B'}
                      onChange={(e) => updateBrandKit({
                        colors: { 
                          primary: brandKit?.colors?.primary || '#3B82F6',
                          secondary: e.target.value,
                          accent: brandKit?.colors?.accent || '#10B981'
                        }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Usado para acentos y elementos secundarios</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color de Acento</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandKit?.colors?.accent || '#10B981'}
                      onChange={(e) => updateBrandKit({
                        colors: { 
                          primary: brandKit?.colors?.primary || '#3B82F6',
                          secondary: brandKit?.colors?.secondary || '#F59E0B',
                          accent: e.target.value
                        }
                      })}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-success transition-colors duration-200"
                    />
                    <input
                      type="text"
                      value={brandKit?.colors?.accent || '#10B981'}
                      onChange={(e) => updateBrandKit({
                        colors: { 
                          primary: brandKit?.colors?.primary || '#3B82F6',
                          secondary: brandKit?.colors?.secondary || '#F59E0B',
                          accent: e.target.value
                        }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-success focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Usado para destacados y elementos especiales</p>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div id="typography" className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-xl">
                  <TextT size={5} className="w-5 h-5 text-success" />
                </div>
                Tipografía
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuente de Títulos</label>
                  <select
                    value={brandKit?.fonts?.heading || 'Inter'}
                    onChange={(e) => updateBrandKit({
                      fonts: { 
                        heading: e.target.value,
                        body: brandKit?.fonts?.body || 'Inter'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Lato">Lato</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuente del Cuerpo</label>
                  <select
                    value={brandKit?.fonts?.body || 'Inter'}
                    onChange={(e) => updateBrandKit({
                      fonts: { 
                        heading: brandKit?.fonts?.heading || 'Inter',
                        body: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Lato">Lato</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold text-lg shadow-soft hover:shadow-elevated transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FloppyDisk size={6} className="w-6 h-6" />
                    Guardar Kit de Marca
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Tus elementos de marca se aplicarán automáticamente a todas las plantillas
              </p>
            </div>
          </div>

          {/* Right Column - Brand Preview */}
          <div className="space-y-6">
            {/* Brand Preview */}
            <div id="preview" className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-xl">
                  <ImageIcon size={5} className="w-5 h-5 text-brand-primary" />
                </div>
                Vista Previa de Marca
              </h2>
              
              <div className="space-y-6">
                {/* Logo Display */}
                {logoPreview && (
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <img 
                      src={logoPreview} 
                      alt="Logo de marca" 
                      className="max-w-full max-h-32 mx-auto object-contain"
                    />
                  </div>
                )}

                {/* Brand Name & Tagline */}
                {brandKit?.brandName && (
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{brandKit.brandName}</h3>
                    {brandKit.tagline && (
                      <p className="text-gray-600">{brandKit.tagline}</p>
                    )}
                  </div>
                )}

                {/* Color Palette */}
                {brandKit?.colors && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Paleta de Colores</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-xl mx-auto mb-2 border border-gray-200"
                          style={{ backgroundColor: brandKit.colors.primary }}
                        ></div>
                        <span className="text-xs text-gray-500">Primario</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-xl mx-auto mb-2 border border-gray-200"
                          style={{ backgroundColor: brandKit.colors.secondary }}
                        ></div>
                        <span className="text-xs text-gray-500">Secundario</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-xl mx-auto mb-2 border border-gray-200"
                          style={{ backgroundColor: brandKit.colors.accent }}
                        ></div>
                        <span className="text-xs text-gray-500">Acento</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Typography Preview */}
                {brandKit?.fonts && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Tipografía</h4>
                    <div className="space-y-2">
                      <div 
                        className="text-lg font-semibold"
                        style={{ fontFamily: brandKit.fonts.heading }}
                      >
                        Fuente de Títulos: {brandKit.fonts.heading}
                      </div>
                      <div 
                        className="text-sm"
                        style={{ fontFamily: brandKit.fonts.body }}
                      >
                        Fuente del Cuerpo: {brandKit.fonts.body}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
