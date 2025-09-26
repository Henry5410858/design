'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  FileText as FilePdf,
  Upload,
  Plus,
  Trash2,
  Wand2,
  Building,
  MapPin,
  DollarSign,
  User,
  Mail,
  Phone,
  Globe,
  X,
  Eye
} from 'lucide-react';
import API_ENDPOINTS from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import NotificationManager from '@/components/ui/NotificationManager';

// Simple helper to show toasts via the global NotificationManager
const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title = '') => {
  try {
    (window as any).showNotification?.({
      type,
      title: title ||
        (type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : type === 'warning' ? 'Aviso' : 'Info'),
      message,
      duration: 4000
    });
  } catch {}
};

interface PropertyItem {
  id: string;
  title: string;
  location?: string;
  price?: number;
  keyFacts?: string;
  description: string;
  imageUrl?: string;
  imageFile?: File;
}

interface ClientInfo {
  name: string;
  industry?: string;
  valueProps?: string[];
}

interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  website?: string;
}

interface BrandTheme {
  primary: string;
  secondary: string;
  logoUrl?: string;
}

const TEMPLATE_OPTIONS = [
  {
    id: 'comparative-short',
    name: 'Comparativa Corta',
    description: '2-3 propiedades, 2 páginas',
    icon: '📊'
  },
  {
    id: 'simple-proposal',
    name: 'Propuesta Simple',
    description: '4-6 páginas con fotos y detalles',
    icon: '📄'
  },
  {
    id: 'dossier-express',
    name: 'Dossier Express',
    description: 'Resumen ejecutivo de 1 página',
    icon: '📋'
  }
];

export default function ProposalPage() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Form data
  const [client, setClient] = useState<ClientInfo>({ name: '', industry: '', valueProps: [''] });
  const [introText, setIntroText] = useState('');
  const [properties, setProperties] = useState<PropertyItem[]>([
    { id: '1', title: '', description: '', price: undefined }
  ]);
  const [contact, setContact] = useState<ContactInfo>({});
  const [selectedTemplate, setSelectedTemplate] = useState('comparative-short');
  const [brandTheme, setBrandTheme] = useState<BrandTheme>({
    primary: '#1f2937',
    secondary: '#6366f1'
  });

  // Load brand kit if available
  useEffect(() => {
    const loadBrandKit = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(API_ENDPOINTS.BRAND_KIT, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const brandKit = await response.json();
          if (brandKit) {
            setBrandTheme({
              primary: brandKit.primaryColor || '#1f2937',
              secondary: brandKit.secondaryColor || '#6366f1',
              logoUrl: brandKit.logoUrl
            });
          }
        }
      } catch (error) {
        console.error('Error loading brand kit:', error);
      }
    };

    loadBrandKit();
  }, [user?.id]);

  const handlePropertyChange = useCallback((index: number, field: keyof PropertyItem, value: any) => {
    setProperties(prev => prev.map((prop, i) =>
      i === index ? { ...prop, [field]: value } : prop
    ));
  }, []);

  const addProperty = useCallback(() => {
    setProperties(prev => [...prev, {
      id: Date.now().toString(),
      title: '',
      description: '',
      price: undefined
    }]);
  }, []);

  const removeProperty = useCallback((index: number) => {
    setProperties(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageUpload = useCallback((index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      handlePropertyChange(index, 'imageUrl', imageUrl);
      handlePropertyChange(index, 'imageFile', file);
    };
    reader.readAsDataURL(file);
  }, [handlePropertyChange]);

  const enhanceIntro = useCallback(async () => {
    if (!introText.trim()) {
      notify('Por favor escribe algo de texto para mejorar', 'warning');
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch(API_ENDPOINTS.PROPOSAL_ENHANCE_INTRO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: introText,
          clientName: client.name,
          industry: client.industry,
          valueProps: client.valueProps?.filter(v => v.trim())
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIntroText(data.enhancedText);
        notify('Texto mejorado exitosamente', 'success');
      } else {
        throw new Error('Error al mejorar el texto');
      }
    } catch (error) {
      console.error('Error enhancing intro:', error);
      notify('Error al mejorar el texto', 'error');
    } finally {
      setIsEnhancing(false);
    }
  }, [introText, client]);

  const generatePDF = useCallback(async () => {
    if (!client.name.trim()) {
      notify('Por favor ingresa el nombre del cliente', 'warning');
      return;
    }

    if (properties.length === 0 || properties.some(p => !p.title.trim() || !p.description.trim())) {
      notify('Por favor completa al menos una propiedad con título y descripción', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare form data for file uploads
      const formData = new FormData();

      // Add client data
      formData.append('client', JSON.stringify(client));

      // Add properties (with image files if any)
      const processedProperties = properties.map(prop => ({
        ...prop,
        // Do NOT include inline base64 image data in JSON payload
        imageUrl: undefined,
        imageFile: undefined,
        price: prop.price || undefined,
        keyFacts: prop.keyFacts || undefined
      }));

      formData.append('items', JSON.stringify(processedProperties));
      formData.append('contact', JSON.stringify(contact));
      formData.append('theme', JSON.stringify(brandTheme));
      formData.append('template', selectedTemplate);
      formData.append('introText', introText);

      // Add image files
      properties.forEach((prop, index) => {
        if (prop.imageFile) {
          formData.append(`propertyImage_${index}`, prop.imageFile);
        }
      });

      const response = await fetch(API_ENDPOINTS.PROPOSAL_GENERATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        // Create download link without mutating React-managed DOM
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `propuesta-${client.name}-${Date.now()}.pdf`;
        // Trigger download without inserting into the DOM (prevents NotFoundError with concurrent rendering)
        a.click();
        // Revoke URL on next tick
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 0);

        // Defer notification to next tick to avoid interfering with concurrent rendering commit
        setTimeout(() => notify('PDF generado exitosamente', 'success'), 0);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al generar el PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      notify('Error al generar el PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [client, properties, contact, brandTheme, selectedTemplate, introText]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center">
              <FilePdf size={24} className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Generador de Propuestas</h1>
              <p className="text-gray-600">Crea propuestas comerciales profesionales con propiedades y productos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Client Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User size={20} className="text-brand-primary" />
                Información del Cliente
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Ej: Empresa XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industria
                  </label>
                  <input
                    type="text"
                    value={client.industry}
                    onChange={(e) => setClient(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Ej: Inmobiliaria, Retail, etc."
                  />
                </div>
              </div>
            </div>

            {/* Introduction Text */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FilePdf size={20} className="text-brand-primary" />
                Texto de Introducción
              </h2>

              <div className="space-y-4">
                <textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="Escribe una introducción personalizada o deja vacío para generar automáticamente..."
                />

                <button
                  onClick={enhanceIntro}
                  disabled={isEnhancing || !introText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Wand2 size={16} />
                  {isEnhancing ? 'Mejorando...' : 'Mejorar con IA'}
                </button>
              </div>
            </div>

            {/* Properties */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Building size={20} className="text-brand-primary" />
                  Propiedades/Productos
                </h2>
                <button
                  onClick={addProperty}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  <Plus size={16} />
                  Agregar Propiedad
                </button>
              </div>

              <div className="space-y-6">
                {properties.map((property, index) => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4 relative">
                    {properties.length > 1 && (
                      <button
                        onClick={() => removeProperty(index)}
                        className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título *
                        </label>
                        <input
                          type="text"
                          value={property.title}
                          onChange={(e) => handlePropertyChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          placeholder="Ej: Apartamento Centro"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={property.location || ''}
                          onChange={(e) => handlePropertyChange(index, 'location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          placeholder="Ej: Madrid Centro"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio (€)
                        </label>
                        <input
                          type="number"
                          value={property.price || ''}
                          onChange={(e) => handlePropertyChange(index, 'price', parseFloat(e.target.value) || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          placeholder="Ej: 250000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Foto
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])}
                            className="hidden"
                            id={`image-upload-${index}`}
                          />
                          <label
                            htmlFor={`image-upload-${index}`}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                          >
                            <Upload size={16} />
                            Subir Foto
                          </label>
                          {property.imageUrl && (
                            <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                              <img src={property.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Características Clave
                      </label>
                      <input
                        type="text"
                        value={property.keyFacts || ''}
                        onChange={(e) => handlePropertyChange(index, 'keyFacts', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        placeholder="Ej: 3 habitaciones, 2 baños, terraza"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción *
                      </label>
                      <textarea
                        value={property.description}
                        onChange={(e) => handlePropertyChange(index, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        placeholder="Describe la propiedad o producto..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mail size={20} className="text-brand-primary" />
                Información de Contacto
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={contact.name || ''}
                    onChange={(e) => setContact(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contact.email || ''}
                    onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={contact.phone || ''}
                    onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={contact.company || ''}
                    onChange={(e) => setContact(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={contact.address || ''}
                    onChange={(e) => setContact(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={contact.website || ''}
                    onChange={(e) => setContact(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
              <h3 className="text-lg font-semibold mb-4">Seleccionar Plantilla</h3>

              <div className="space-y-3">
                {TEMPLATE_OPTIONS.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Preview */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
              <h3 className="text-lg font-semibold mb-4">Vista Previa de Marca</h3>

              <div className="space-y-4">
                {brandTheme.logoUrl && (
                  <div className="flex justify-center">
                    <img src={brandTheme.logoUrl} alt="Logo" className="h-12 object-contain" />
                  </div>
                )}

                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: brandTheme.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: brandTheme.secondary }}
                  />
                </div>

                <p className="text-sm text-gray-600">
                  Los colores y logo de tu marca se aplicarán automáticamente al PDF.
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-semibold hover:from-brand-primary/90 hover:to-brand-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FilePdf size={20} />
                  Generar PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}