'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FiUpload, FiSave, FiType, FiImage, FiCheck, FiDroplet } from 'react-icons/fi';

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
          setLogoPreview(`http://localhost:4000${data.logo}`);
        }
      }
    } catch (error) {
      console.error('Error fetching brand kit:', error);
      setMessage({ type: 'error', text: 'Failed to load brand kit' });
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

      const response = await fetch('http://localhost:4000/api/brand-kit/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBrandKit(prev => ({ ...prev, logo: data.logo }));
        setLogoPreview(`http://localhost:4000${data.logo}`);
        setLogoFile(null);
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      } else {
        throw new Error('Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo' });
    }
  };

  const handleSave = async () => {
    if (!brandKit) return;

    setSaving(true);
    try {
      const response = await fetch('http://localhost:4000/api/brand-kit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandKit),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Brand kit saved successfully!' });
      } else {
        throw new Error('Failed to save brand kit');
      }
    } catch (error) {
      console.error('Error saving brand kit:', error);
      setMessage({ type: 'error', text: 'Failed to save brand kit' });
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Kit</h1>
          <p className="text-gray-600">Manage your brand identity, colors, and typography</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Brand Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo & Basic Branding */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiImage className="w-5 h-5 text-blue-600" />
                </div>
                Logo & Brand Identity
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                  <input
                    type="text"
                    value={brandKit?.brandName || ''}
                    onChange={(e) => updateBrandKit({ brandName: e.target.value })}
                    placeholder="Enter your brand name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={brandKit?.tagline || ''}
                    onChange={(e) => updateBrandKit({ tagline: e.target.value })}
                    placeholder="Enter your brand tagline"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <div className="w-20 h-20 border-2 border-gray-200 rounded-xl overflow-hidden">
                        <img 
                          src={logoPreview} 
                          alt="Brand logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {logoFile && (
                        <button
                          onClick={uploadLogo}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Upload Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiDroplet className="w-5 h-5 text-purple-600" />
                </div>
                Brand Colors
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
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
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
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
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Used for headings and primary elements</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
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
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
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
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Used for accents and secondary elements</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
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
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
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
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Used for highlights and special elements</p>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiType className="w-5 h-5 text-green-600" />
                </div>
                Typography
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font</label>
                  <select
                    value={brandKit?.fonts?.heading || 'Inter'}
                    onChange={(e) => updateBrandKit({
                      fonts: { 
                        heading: e.target.value,
                        body: brandKit?.fonts?.body || 'Inter'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
                  <select
                    value={brandKit?.fonts?.body || 'Inter'}
                    onChange={(e) => updateBrandKit({
                      fonts: { 
                        heading: brandKit?.fonts?.heading || 'Inter',
                        body: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-6 h-6" />
                    Save Brand Kit
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Your brand elements will automatically apply to all templates
              </p>
            </div>
          </div>

          {/* Right Column - Brand Preview */}
          <div className="space-y-6">
            {/* Brand Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiImage className="w-5 h-5 text-blue-600" />
                </div>
                Brand Preview
              </h2>
              
              <div className="space-y-6">
                {/* Logo Display */}
                {logoPreview && (
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <img 
                      src={logoPreview} 
                      alt="Brand logo" 
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
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Color Palette</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-200"
                          style={{ backgroundColor: brandKit.colors.primary }}
                        ></div>
                        <span className="text-xs text-gray-500">Primary</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-200"
                          style={{ backgroundColor: brandKit.colors.secondary }}
                        ></div>
                        <span className="text-xs text-gray-500">Secondary</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-200"
                          style={{ backgroundColor: brandKit.colors.accent }}
                        ></div>
                        <span className="text-xs text-gray-500">Accent</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Typography Preview */}
                {brandKit?.fonts && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Typography</h4>
                    <div className="space-y-2">
                      <div 
                        className="text-lg font-semibold"
                        style={{ fontFamily: brandKit.fonts.heading }}
                      >
                        Heading Font: {brandKit.fonts.heading}
                      </div>
                      <div 
                        className="text-sm"
                        style={{ fontFamily: brandKit.fonts.body }}
                      >
                        Body Font: {brandKit.fonts.body}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
