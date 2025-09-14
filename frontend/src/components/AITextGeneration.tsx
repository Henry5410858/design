'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  AITextGenerationManager, 
  TextGenerationRequest, 
  TextGenerationResult, 
  BrandVoice, 
  TextTemplate,
  TEXT_TEMPLATES,
  DEFAULT_BRAND_VOICES
} from '@/utils/aiTextGeneration';
import { 
  Wand2, 
  Copy, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Target,
  Type,
  MessageSquare,
  Mail,
  FileText,
  Megaphone,
  Zap,
  Settings,
  Star,
  ThumbsUp,
  ThumbsDown,
  Download
} from 'lucide-react';

interface AITextGenerationProps {
  onTextGenerated?: (text: string) => void;
  onClose?: () => void;
  initialText?: string;
}

export default function AITextGeneration({ onTextGenerated, onClose, initialText }: AITextGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<TextGenerationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TextGenerationResult | null>(null);
  const [apiKeyValid, setApiKeyValid] = useState(false);
  
  // Generation settings
  const [settings, setSettings] = useState<TextGenerationRequest>({
    prompt: initialText || '',
    type: 'headline',
    tone: 'professional',
    length: 'medium',
    language: 'spanish',
    context: '',
    keywords: [],
    targetAudience: '',
    industry: 'retail'
  });
  
  // Brand voice
  const [selectedBrandVoice, setSelectedBrandVoice] = useState<string>('professional');
  const [customBrandVoice, setCustomBrandVoice] = useState<BrandVoice>(DEFAULT_BRAND_VOICES.professional);
  
  // UI state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBrandVoice, setShowBrandVoice] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const aiTextGenerator = new AITextGenerationManager();

  // Validate API key on mount
  useEffect(() => {
    validateAPIKey();
  }, []);

  const validateAPIKey = useCallback(async () => {
    const isValid = await aiTextGenerator.validateAPIKey();
    setApiKeyValid(isValid);
  }, []);

  const handleGenerateText = useCallback(async () => {
    if (!settings.prompt.trim()) {
      alert('Por favor, ingresa un prompt para generar texto');
      return;
    }

    setIsGenerating(true);
    setGeneratedResults([]);
    setSelectedResult(null);

    try {
      const request: TextGenerationRequest = {
        ...settings,
        brandVoice: selectedBrandVoice === 'custom' ? customBrandVoice : DEFAULT_BRAND_VOICES[selectedBrandVoice]
      };

      const results = await aiTextGenerator.generateVariations(request, 3);
      setGeneratedResults(results);
      if (results.length > 0) {
        setSelectedResult(results[0]);
      }
    } catch (error) {
      console.error('Error generating text:', error);
      alert('Error al generar texto. Verifica tu API key de OpenAI.');
    } finally {
      setIsGenerating(false);
    }
  }, [settings, selectedBrandVoice, customBrandVoice, aiTextGenerator]);

  const handleGenerateFromTemplate = useCallback(async (template: TextTemplate) => {
    setIsGenerating(true);
    setGeneratedResults([]);
    setSelectedResult(null);

    try {
      const result = await aiTextGenerator.generateFromTemplate(template.id, {
        prompt: settings.prompt,
        tone: template.tone as any,
        type: template.category as any,
        brandVoice: selectedBrandVoice === 'custom' ? customBrandVoice : DEFAULT_BRAND_VOICES[selectedBrandVoice]
      });

      setGeneratedResults([result]);
      setSelectedResult(result);
    } catch (error) {
      console.error('Error generating from template:', error);
      alert('Error al generar texto desde plantilla.');
    } finally {
      setIsGenerating(false);
    }
  }, [settings, selectedBrandVoice, customBrandVoice, aiTextGenerator]);

  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  }, []);

  const handleUseText = useCallback((text: string) => {
    if (onTextGenerated) {
      onTextGenerated(text);
    }
    if (onClose) {
      onClose();
    }
  }, [onTextGenerated, onClose]);

  const handleExportText = useCallback(() => {
    if (generatedResults.length > 0) {
      const allTexts = generatedResults
        .filter(result => result.success && result.content)
        .map(result => result.content)
        .join('\n\n---\n\n');
      
      const blob = new Blob([allTexts], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ai-generated-texts.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [generatedResults]);

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      headline: <Type className="w-4 h-4" />,
      description: <FileText className="w-4 h-4" />,
      cta: <Target className="w-4 h-4" />,
      social: <MessageSquare className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      blog: <FileText className="w-4 h-4" />,
      ad: <Megaphone className="w-4 h-4" />,
      proposal: <FileText className="w-4 h-4" />,
      custom: <Wand2 className="w-4 h-4" />
    };
    return icons[type] || <Wand2 className="w-4 h-4" />;
  };

  const getToneColor = (tone: string) => {
    const colors: { [key: string]: string } = {
      professional: 'bg-blue-100 text-blue-800',
      casual: 'bg-green-100 text-green-800',
      friendly: 'bg-yellow-100 text-yellow-800',
      persuasive: 'bg-red-100 text-red-800',
      informative: 'bg-purple-100 text-purple-800',
      creative: 'bg-pink-100 text-pink-800',
      humorous: 'bg-orange-100 text-orange-800'
    };
    return colors[tone] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" />
            Generación de Texto con IA
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

        {/* API Key Status */}
        {!apiKeyValid && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">API Key de OpenAI no configurada</p>
                <p className="text-sm text-yellow-700">
                  Configura NEXT_PUBLIC_OPENAI_API_KEY en tu archivo .env para usar la generación de texto con IA.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Quick Templates */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Plantillas Rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                {TEXT_TEMPLATES.slice(0, 6).map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleGenerateFromTemplate(template)}
                    disabled={!apiKeyValid || isGenerating}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(template.category)}
                      <span className="font-medium text-sm">{template.name}</span>
                    </div>
                    <p className="text-xs text-gray-600">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generation Settings */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Configuración de Generación</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Prompt / Descripción
                  </label>
                  <textarea
                    value={settings.prompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe lo que quieres generar..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tipo de Contenido
                    </label>
                    <select
                      value={settings.type}
                      onChange={(e) => setSettings(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="headline">Titular</option>
                      <option value="description">Descripción</option>
                      <option value="cta">Call-to-Action</option>
                      <option value="social">Redes Sociales</option>
                      <option value="email">Email</option>
                      <option value="blog">Blog</option>
                      <option value="ad">Anuncio</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tono
                    </label>
                    <select
                      value={settings.tone}
                      onChange={(e) => setSettings(prev => ({ ...prev, tone: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="professional">Profesional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Amigable</option>
                      <option value="persuasive">Persuasivo</option>
                      <option value="informative">Informativo</option>
                      <option value="creative">Creativo</option>
                      <option value="humorous">Divertido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Longitud
                    </label>
                    <select
                      value={settings.length}
                      onChange={(e) => setSettings(prev => ({ ...prev, length: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="short">Corta</option>
                      <option value="medium">Media</option>
                      <option value="long">Larga</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Idioma
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="spanish">Español</option>
                      <option value="english">English</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
                  >
                    <Settings className="w-4 h-4" />
                    Configuración Avanzada
                  </button>
                  
                  {showAdvanced && (
                    <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Contexto Adicional
                        </label>
                        <textarea
                          value={settings.context}
                          onChange={(e) => setSettings(prev => ({ ...prev, context: e.target.value }))}
                          rows={2}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Información adicional sobre el contexto..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Audiencia Objetivo
                        </label>
                        <input
                          type="text"
                          value={settings.targetAudience}
                          onChange={(e) => setSettings(prev => ({ ...prev, targetAudience: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ej: Mujeres 25-35 años"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Industria
                        </label>
                        <select
                          value={settings.industry}
                          onChange={(e) => setSettings(prev => ({ ...prev, industry: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="retail">Retail</option>
                          <option value="technology">Tecnología</option>
                          <option value="healthcare">Salud</option>
                          <option value="education">Educación</option>
                          <option value="food">Alimentación</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand Voice */}
                <div>
                  <button
                    onClick={() => setShowBrandVoice(!showBrandVoice)}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
                  >
                    <Star className="w-4 h-4" />
                    Voz de Marca
                  </button>
                  
                  {showBrandVoice && (
                    <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Estilo de Voz
                        </label>
                        <select
                          value={selectedBrandVoice}
                          onChange={(e) => setSelectedBrandVoice(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="professional">Profesional</option>
                          <option value="casual">Casual</option>
                          <option value="luxury">Lujo</option>
                          <option value="playful">Divertido</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateText}
              disabled={!apiKeyValid || isGenerating || !settings.prompt.trim()}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generar Texto con IA
                </>
              )}
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Resultados Generados</h3>
              {generatedResults.length > 0 && (
                <button
                  onClick={handleExportText}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              )}
            </div>

            {generatedResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Wand2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Los resultados aparecerán aquí</p>
                <p className="text-sm">Genera texto para ver las opciones</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedResult === result 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {result.success ? (
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Variación {index + 1}</span>
                            <span className={`px-2 py-1 rounded text-xs ${getToneColor(settings.tone)}`}>
                              {settings.tone}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedResult(result)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Seleccionar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyText(result.content || '')}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copiar"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-3 rounded border mb-3">
                          <p className="text-gray-800">{result.content}</p>
                        </div>
                        
                        {result.alternatives && result.alternatives.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-600 mb-2">Alternativas:</p>
                            <div className="space-y-1">
                              {result.alternatives.map((alt, altIndex) => (
                                <div key={altIndex} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  {alt}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{result.tokensUsed} tokens</span>
                          <span>${result.cost?.toFixed(4)}</span>
                          <span>{result.processingTime}ms</span>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleUseText(result.content || '')}
                            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            Usar este Texto
                          </button>
                          <button
                            onClick={() => handleCopyText(result.content || '')}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{result.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
