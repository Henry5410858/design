'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { PDFProposalGenerator, ProposalData, ProposalVariant, PROPOSAL_VARIANTS } from '@/utils/pdfProposalGenerator';
import { DEMO_PROPOSALS } from '@/data/demoProposalData';
import { FileText, Download, Wand2, Building, Home, Megaphone, User, Mail, Phone, Globe, DollarSign, Calendar, CheckCircle, Zap } from 'lucide-react';

interface ProposalGeneratorProps {
  onClose?: () => void;
  initialData?: Partial<ProposalData>;
}

export default function ProposalGenerator({ onClose, initialData }: ProposalGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPDF, setGeneratedPDF] = useState<Blob | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProposalVariant>(PROPOSAL_VARIANTS[0]);
  const [proposalData, setProposalData] = useState<ProposalData>({
    title: 'Propuesta de Servicios',
    subtitle: 'Solución Profesional para su Negocio',
    clientName: '',
    companyName: '',
    date: new Date().toLocaleDateString('es-ES'),
    executiveSummary: '',
    objectives: [''],
    methodology: '',
    deliverables: [''],
    timeline: '',
    pricing: {
      total: 0,
      breakdown: [
        { item: 'Servicio Principal', amount: 0 }
      ]
    },
    contact: {
      name: '',
      email: '',
      phone: '',
      website: ''
    },
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    ...initialData
  });

  const generator = useMemo(() => new PDFProposalGenerator(), []);

  const handleInputChange = useCallback((field: string, value: any) => {
    setProposalData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const handleArrayChange = useCallback((field: string, index: number, value: string) => {
    setProposalData(prev => {
      const array = [...(prev as any)[field]];
      array[index] = value;
      return {
        ...prev,
        [field]: array
      };
    });
  }, []);

  const addArrayItem = useCallback((field: string) => {
    setProposalData(prev => ({
      ...prev,
      [field]: [...(prev as any)[field], '']
    }));
  }, []);

  const removeArrayItem = useCallback((field: string, index: number) => {
    setProposalData(prev => {
      const array = [...(prev as any)[field]];
      array.splice(index, 1);
      return {
        ...prev,
        [field]: array
      };
    });
  }, []);

  const addPricingItem = useCallback(() => {
    setProposalData(prev => {
      const breakdown = [...prev.pricing.breakdown, { item: '', amount: 0 }];
      const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          breakdown,
          total
        }
      };
    });
  }, []);

  const removePricingItem = useCallback((index: number) => {
    setProposalData(prev => {
      const breakdown = prev.pricing.breakdown.filter((_, i) => i !== index);
      const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
      return {
        ...prev,
        pricing: {
          ...prev.pricing,
          breakdown,
          total
        }
      };
    });
  }, []);



  const loadDemoData = useCallback((variantId: string) => {
    let demoData: ProposalData;
    
    switch (variantId) {
      case 'real-estate':
        demoData = DEMO_PROPOSALS.realEstate;
        break;
      case 'business':
        demoData = DEMO_PROPOSALS.business;
        break;
      case 'marketing':
        demoData = DEMO_PROPOSALS.marketing;
        break;
      default:
        demoData = DEMO_PROPOSALS.business;
    }
    
    setProposalData(demoData);
  }, []);

  const handleGeneratePDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      const pdfBlob = await generator.generateProposal(proposalData, selectedVariant);
      setGeneratedPDF(pdfBlob);
      console.log('✨ PDF proposal generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  }, [proposalData, selectedVariant, generator]);

  // Safe download without mutating document.body to avoid React DOM conflicts
  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener';
    // Clicking without appending is supported in modern browsers and avoids DOM mutations
    link.click();
    // Revoke after a delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const handleDownloadPDF = useCallback(() => {
    if (generatedPDF) {
      triggerDownload(generatedPDF, `propuesta-${proposalData.clientName || 'cliente'}-${proposalData.date}.pdf`);
    }
  }, [generatedPDF, proposalData.clientName, proposalData.date, triggerDownload]);

  const getVariantIcon = (variantId: string) => {
    switch (variantId) {
      case 'real-estate': return <Home className="w-5 h-5" />;
      case 'business': return <Building className="w-5 h-5" />;
      case 'marketing': return <Megaphone className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Generador de Propuestas PDF
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Variant Selection & Basic Info */}
          <div className="space-y-6">
            {/* Variant Selection */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Tipo de Propuesta</h3>
              <div className="space-y-2">
                {PROPOSAL_VARIANTS.map((variant) => (
                  <div key={variant.id} className="space-y-2">
                    <button
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full p-3 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                        selectedVariant.id === variant.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {getVariantIcon(variant.id)}
                      <div className="text-left">
                        <div className="font-medium">{variant.name}</div>
                        <div className="text-xs text-gray-500">{variant.description}</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => loadDemoData(variant.id)}
                      className="w-full p-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      Cargar Datos de Ejemplo
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Información Básica</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Título de la Propuesta
                  </label>
                  <input
                    type="text"
                    value={proposalData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Propuesta de Servicios de Marketing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={proposalData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Solución Integral para su Empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={proposalData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={proposalData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Empresa ABC S.A."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={proposalData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Content */}
          <div className="space-y-6">
            {/* Executive Summary */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Resumen Ejecutivo</h3>
              <textarea
                value={proposalData.executiveSummary}
                onChange={(e) => handleInputChange('executiveSummary', e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describa brevemente la propuesta y sus beneficios principales..."
              />
            </div>

            {/* Objectives */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Objetivos</h3>
              {proposalData.objectives.map((objective, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Objetivo ${index + 1}`}
                  />
                  <button
                    onClick={() => removeArrayItem('objectives', index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => addArrayItem('objectives')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Agregar Objetivo
              </button>
            </div>

            {/* Methodology */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Metodología</h3>
              <textarea
                value={proposalData.methodology}
                onChange={(e) => handleInputChange('methodology', e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describa el enfoque y metodología que utilizará..."
              />
            </div>

            {/* Deliverables */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Entregables</h3>
              {proposalData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => handleArrayChange('deliverables', index, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Entregable ${index + 1}`}
                  />
                  <button
                    onClick={() => removeArrayItem('deliverables', index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => addArrayItem('deliverables')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Agregar Entregable
              </button>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Cronograma</h3>
              <textarea
                value={proposalData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describa el cronograma del proyecto..."
              />
            </div>
          </div>

          {/* Right Column - Pricing & Contact */}
          <div className="space-y-6">
            {/* Pricing */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Precios
              </h3>
              <div className="space-y-3">
                {proposalData.pricing.breakdown.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => {
                        const breakdown = [...proposalData.pricing.breakdown];
                        breakdown[index].item = e.target.value;
                        setProposalData(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, breakdown }
                        }));
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descripción"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        const breakdown = [...proposalData.pricing.breakdown];
                        breakdown[index].amount = parseFloat(e.target.value) || 0;
                        setProposalData(prev => {
                          const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
                          return {
                            ...prev,
                            pricing: { 
                              ...prev.pricing, 
                              breakdown,
                              total
                            }
                          };
                        });
                      }}
                      className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <button
                      onClick={() => removePricingItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addPricingItem}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Agregar Item
                </button>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>${proposalData.pricing.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Información de Contacto
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={proposalData.contact.name}
                    onChange={(e) => handleInputChange('contact.name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Su nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={proposalData.contact.email}
                    onChange={(e) => handleInputChange('contact.email', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="su@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={proposalData.contact.phone}
                    onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    value={proposalData.contact.website}
                    onChange={(e) => handleInputChange('contact.website', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.sitioweb.com"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="space-y-3">
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating || !proposalData.title || !proposalData.clientName}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generar Propuesta PDF
                  </>
                )}
              </button>

              {generatedPDF && (
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
