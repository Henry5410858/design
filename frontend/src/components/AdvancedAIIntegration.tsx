'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  AdvancedAIManager, 
  AdvancedAIRequest, 
  AdvancedAIResponse,
  VoiceTranscriptionResult,
  ObjectRecognitionResult,
  DesignAnalytics
} from '@/utils/advancedAI';
import { 
  Brain, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  Eye, 
  BarChart3, 
  Zap,
  Settings,
  Download,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Play,
  Pause,
  Square,
  Upload,
  Wand2,
  Target,
  Palette,
  Type,
  Layout
} from 'lucide-react';

interface AdvancedAIIntegrationProps {
  onClose?: () => void;
  onImageGenerated?: (imageUrl: string) => void;
  onTextGenerated?: (text: string) => void;
  onAnalysisComplete?: (analytics: DesignAnalytics) => void;
}

export default function AdvancedAIIntegration({ 
  onClose, 
  onImageGenerated, 
  onTextGenerated,
  onAnalysisComplete 
}: AdvancedAIIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'voice' | 'analysis' | 'recognition'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AdvancedAIResponse[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form state
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState({
    maxTokens: 1000,
    temperature: 0.7,
    quality: 'standard' as 'standard' | 'hd',
    size: '1024x1024' as '1024x1024' | '1792x1024' | '1024x1792',
    style: 'vivid' as 'vivid' | 'natural',
    responseFormat: 'text' as 'json' | 'text' | 'verbose_json'
  });

  const advancedAI = new AdvancedAIManager();

  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = useCallback(async () => {
    const models = await advancedAI.getAvailableModels();
    setAvailableModels(models);
  }, [advancedAI]);

  const handleGenerateText = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    try {
      const request: AdvancedAIRequest = {
        type: 'text',
        model: selectedModel as any,
        prompt,
        options
      };

      const result = await advancedAI.generateAdvancedText(request);
      setResults([result]);
      
      if (result.success && result.data && onTextGenerated) {
        onTextGenerated(typeof result.data === 'string' ? result.data : JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Error generating text:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [prompt, selectedModel, options, advancedAI, onTextGenerated]);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    try {
      const request: AdvancedAIRequest = {
        type: 'image',
        model: 'dall-e-3',
        prompt,
        options
      };

      const result = await advancedAI.generateImage(request);
      setResults([result]);
      
      if (result.success && result.data && onImageGenerated) {
        onImageGenerated(result.data.url);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [prompt, options, advancedAI, onImageGenerated]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRecording]);

  const handleTranscribeVoice = useCallback(async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const result = await advancedAI.transcribeVoice(audioBlob, {
        language: 'es',
        responseFormat: 'verbose_json'
      });

      setResults([result]);
      
      if (result.success && result.data && onTextGenerated) {
        const transcription = result.data as VoiceTranscriptionResult;
        onTextGenerated(transcription.text);
      }
    } catch (error) {
      console.error('Error transcribing voice:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, advancedAI, onTextGenerated]);

  const handleAnalyzeDesign = useCallback(async () => {
    // This would typically receive design data from the canvas
    const mockDesignData = {
      elements: ['logo', 'text', 'image'],
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      layout: 'grid',
      typography: ['Arial', 'Helvetica']
    };

    setIsProcessing(true);
    try {
      const result = await advancedAI.analyzeDesign(mockDesignData);
      setResults([result]);
      
      if (result.success && result.data && onAnalysisComplete) {
        onAnalysisComplete(result.data as DesignAnalytics);
      }
    } catch (error) {
      console.error('Error analyzing design:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [advancedAI, onAnalysisComplete]);

  const handleRecognizeObjects = useCallback(async () => {
    // This would typically receive image data from the canvas
    const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    setIsProcessing(true);
    try {
      const result = await advancedAI.recognizeObjects(mockImageData);
      setResults([result]);
    } catch (error) {
      console.error('Error recognizing objects:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [advancedAI]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTabIcon = (tab: string) => {
    const icons = {
      text: <Brain className="w-4 h-4" />,
      image: <ImageIcon className="w-4 h-4" />,
      voice: <Mic className="w-4 h-4" />,
      analysis: <BarChart3 className="w-4 h-4" />,
      recognition: <Eye className="w-4 h-4" />
    };
    return icons[tab as keyof typeof icons];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            IA Avanzada - GPT-4, DALL-E, Whisper
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'text', label: 'Texto Avanzado' },
            { id: 'image', label: 'Generación de Imágenes' },
            { id: 'voice', label: 'Voz a Texto' },
            { id: 'analysis', label: 'Análisis de Diseño' },
            { id: 'recognition', label: 'Reconocimiento Visual' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {getTabIcon(tab.id)}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Modelo de IA
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Prompt Input */}
            {activeTab !== 'analysis' && activeTab !== 'recognition' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Prompt / Descripción
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={
                    activeTab === 'text' ? 'Describe el contenido que quieres generar...' :
                    activeTab === 'image' ? 'Describe la imagen que quieres crear...' :
                    'Describe lo que quieres analizar...'
                  }
                />
              </div>
            )}

            {/* Voice Recording */}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                <div className="text-center">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
                    >
                      <Mic className="w-5 h-5" />
                      Iniciar Grabación
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-2xl font-mono text-red-600">
                        {formatTime(recordingTime)}
                      </div>
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors mx-auto"
                      >
                        <Square className="w-5 h-5" />
                        Detener Grabación
                      </button>
                    </div>
                  )}
                </div>

                {audioBlob && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Audio grabado</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Duración: {formatTime(recordingTime)} | Tamaño: {(audioBlob.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Controls */}
            {activeTab === 'analysis' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Análisis de Diseño</span>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Analiza automáticamente la composición, colores, tipografía y layout del diseño actual.
                </p>
                <button
                  onClick={handleAnalyzeDesign}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Analizar Diseño Actual
                </button>
              </div>
            )}

            {/* Recognition Controls */}
            {activeTab === 'recognition' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Reconocimiento Visual</span>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Identifica objetos, elementos de diseño y proporciona sugerencias de mejora.
                </p>
                <button
                  onClick={handleRecognizeObjects}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Analizar Imagen Actual
                </button>
              </div>
            )}

            {/* Advanced Options */}
            <div>
              <button
                onClick={() => setOptions(prev => ({ ...prev, maxTokens: prev.maxTokens === 1000 ? 2000 : 1000 }))}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Opciones Avanzadas
              </button>
              
              <div className="mt-2 space-y-2 text-xs text-gray-600">
                <div>Tokens máximos: {options.maxTokens}</div>
                <div>Temperatura: {options.temperature}</div>
                {activeTab === 'image' && (
                  <>
                    <div>Calidad: {options.quality}</div>
                    <div>Tamaño: {options.size}</div>
                    <div>Estilo: {options.style}</div>
                  </>
                )}
              </div>
            </div>

            {/* Generate Button */}
            {activeTab !== 'analysis' && activeTab !== 'recognition' && (
              <button
                onClick={
                  activeTab === 'text' ? handleGenerateText :
                  activeTab === 'image' ? handleGenerateImage :
                  handleTranscribeVoice
                }
                disabled={isProcessing || (!prompt.trim() && activeTab !== 'voice') || (activeTab === 'voice' && !audioBlob)}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    {activeTab === 'text' ? 'Generar Texto' :
                     activeTab === 'image' ? 'Generar Imagen' :
                     'Transcribir Audio'}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Resultados</h3>
              {results.length > 0 && (
                <button
                  onClick={() => setResults([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpiar
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Los resultados aparecerán aquí</p>
                <p className="text-sm">Genera contenido para ver los resultados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    {result.success ? (
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800">
                              {result.model} - Resultado {index + 1}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.processingTime}ms | {result.tokensUsed} tokens | ${result.cost?.toFixed(4)}
                          </div>
                        </div>

                        {/* Display results based on type */}
                        {activeTab === 'text' && (
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-800">
                                {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyToClipboard(typeof result.data === 'string' ? result.data : JSON.stringify(result.data))}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                              >
                                <Copy className="w-3 h-3" />
                                Copiar
                              </button>
                              {onTextGenerated && (
                                <button
                                  onClick={() => onTextGenerated(typeof result.data === 'string' ? result.data : JSON.stringify(result.data))}
                                  className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm"
                                >
                                  <Target className="w-3 h-3" />
                                  Usar
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {activeTab === 'image' && result.data?.url && (
                          <div className="space-y-3">
                            <img
                              src={result.data.url}
                              alt="Generated"
                              className="w-full rounded border"
                            />
                            {result.data.revisedPrompt && (
                              <p className="text-sm text-gray-600 italic">
                                "Prompt revisado: {result.data.revisedPrompt}"
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => window.open(result.data.url, '_blank')}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                              >
                                <Download className="w-3 h-3" />
                                Descargar
                              </button>
                              {onImageGenerated && (
                                <button
                                  onClick={() => onImageGenerated(result.data.url)}
                                  className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm"
                                >
                                  <Target className="w-3 h-3" />
                                  Usar
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {activeTab === 'voice' && result.data && (
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded border">
                              <p className="text-gray-800">{(result.data as VoiceTranscriptionResult).text}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyToClipboard((result.data as VoiceTranscriptionResult).text)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                              >
                                <Copy className="w-3 h-3" />
                                Copiar
                              </button>
                              {onTextGenerated && (
                                <button
                                  onClick={() => onTextGenerated((result.data as VoiceTranscriptionResult).text)}
                                  className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm"
                                >
                                  <Target className="w-3 h-3" />
                                  Usar
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {activeTab === 'analysis' && result.data && (
                          <div className="space-y-3">
                            <DesignAnalyticsDisplay analytics={result.data as DesignAnalytics} />
                            {onAnalysisComplete && (
                              <button
                                onClick={() => onAnalysisComplete(result.data as DesignAnalytics)}
                                className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm"
                              >
                                <Target className="w-3 h-3" />
                                Aplicar Análisis
                              </button>
                            )}
                          </div>
                        )}

                        {/* Metadata */}
                        {result.metadata && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                              {result.metadata.confidence && (
                                <span>Confianza: {(result.metadata.confidence * 100).toFixed(1)}%</span>
                              )}
                              {result.metadata.suggestions && result.metadata.suggestions.length > 0 && (
                                <div className="mt-1">
                                  <strong>Sugerencias:</strong>
                                  <ul className="list-disc list-inside ml-2">
                                    {result.metadata.suggestions.map((suggestion, i) => (
                                      <li key={i}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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

// Component for displaying design analytics
function DesignAnalyticsDisplay({ analytics }: { analytics: DesignAnalytics }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(analytics.overallScore)}`}>
          <BarChart3 className="w-5 h-5" />
          Puntuación General: {analytics.overallScore}/100
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Composición</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Balance:</span>
              <span className={getScoreColor(analytics.composition.balance).split(' ')[0]}>
                {analytics.composition.balance}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Contraste:</span>
              <span className={getScoreColor(analytics.composition.contrast).split(' ')[0]}>
                {analytics.composition.contrast}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Armonía:</span>
              <span className={getScoreColor(analytics.composition.harmony).split(' ')[0]}>
                {analytics.composition.harmony}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Colores</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Armonía:</span>
              <span className={getScoreColor(analytics.colorAnalysis.colorHarmony).split(' ')[0]}>
                {analytics.colorAnalysis.colorHarmony}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Accesibilidad:</span>
              <span className={getScoreColor(analytics.colorAnalysis.accessibility).split(' ')[0]}>
                {analytics.colorAnalysis.accessibility}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Estado de ánimo: {analytics.colorAnalysis.mood}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-green-600" />
            <span className="font-medium">Tipografía</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Legibilidad:</span>
              <span className={getScoreColor(analytics.typography.readability).split(' ')[0]}>
                {analytics.typography.readability}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Jerarquía:</span>
              <span className={getScoreColor(analytics.typography.hierarchy).split(' ')[0]}>
                {analytics.typography.hierarchy}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-orange-600" />
            <span className="font-medium">Layout</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Espaciado:</span>
              <span className={getScoreColor(analytics.layout.spacing).split(' ')[0]}>
                {analytics.layout.spacing}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Alineación:</span>
              <span className={getScoreColor(analytics.layout.alignment).split(' ')[0]}>
                {analytics.layout.alignment}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analytics.recommendations && analytics.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Recomendaciones:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {analytics.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
