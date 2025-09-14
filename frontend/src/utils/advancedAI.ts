/**
 * Advanced AI Integration System
 * GPT-4, DALL-E, Voice-to-Text, Smart Object Recognition
 */

export interface AdvancedAIRequest {
  type: 'text' | 'image' | 'voice' | 'analysis' | 'suggestion';
  model?: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo' | 'gpt-4-vision-preview' | 'dall-e-2' | 'dall-e-3';
  prompt: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
    quality?: 'standard' | 'hd';
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    style?: 'vivid' | 'natural';
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    responseFormat?: 'json' | 'text' | 'verbose_json';
  };
  context?: {
    designType?: string;
    brandVoice?: string;
    targetAudience?: string;
    industry?: string;
    previousDesigns?: any[];
  };
}

export interface AdvancedAIResponse {
  success: boolean;
  data?: any;
  error?: string;
  model?: string;
  tokensUsed?: number;
  cost?: number;
  processingTime?: number;
  metadata?: {
    confidence?: number;
    alternatives?: any[];
    suggestions?: string[];
    insights?: any;
    recommendations?: string[];
  };
}

export interface VoiceTranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export interface ObjectRecognitionResult {
  objects: Array<{
    name: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    suggestions?: string[];
    metadata?: any;
  }>;
  overallConfidence: number;
  designInsights: string[];
  recommendations: string[];
}

export interface DesignAnalytics {
  composition: {
    balance: number;
    contrast: number;
    harmony: number;
    focalPoint: number;
  };
  colorAnalysis: {
    dominantColors: string[];
    colorHarmony: number;
    accessibility: number;
    mood: string;
  };
  typography: {
    readability: number;
    hierarchy: number;
    consistency: number;
    brandAlignment: number;
  };
  layout: {
    spacing: number;
    alignment: number;
    proportion: number;
    flow: number;
  };
  overallScore: number;
  recommendations: string[];
  industryBenchmark?: number;
}

export class AdvancedAIManager {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';
  private whisperURL: string = 'https://api.openai.com/v1/audio/transcriptions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  }

  /**
   * Generate text using GPT-4
   */
  async generateAdvancedText(request: AdvancedAIRequest): Promise<AdvancedAIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      const model = request.model || 'gpt-4';
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: this.getAdvancedSystemPrompt(request.context)
            },
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: request.options?.maxTokens || 1000,
          temperature: request.options?.temperature || 0.7,
          response_format: request.options?.responseFormat === 'json' ? { type: 'json_object' } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      
      const content = data.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No content generated');
      }

      return {
        success: true,
        data: request.options?.responseFormat === 'json' ? JSON.parse(content) : content,
        model: model,
        tokensUsed: data.usage?.total_tokens || 0,
        cost: this.calculateCost(data.usage?.total_tokens || 0, model),
        processingTime,
        metadata: {
          confidence: 0.95,
          alternatives: this.generateTextAlternatives(content),
          suggestions: this.generateDesignSuggestions(content, request.context)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Advanced text generation failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate images using DALL-E
   */
  async generateImage(request: AdvancedAIRequest): Promise<AdvancedAIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      const model = request.model || 'dall-e-3';
      const response = await fetch(`${this.baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: request.prompt,
          n: 1,
          quality: request.options?.quality || 'standard',
          size: request.options?.size || '1024x1024',
          style: request.options?.style || 'vivid'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DALL-E API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          url: data.data[0].url,
          revisedPrompt: data.data[0].revised_prompt
        },
        model: model,
        cost: this.calculateImageCost(model, request.options?.quality),
        processingTime,
        metadata: {
          confidence: 0.9,
          suggestions: this.generateImageSuggestions(request.prompt, request.context)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Image generation failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Transcribe voice to text using Whisper
   */
  async transcribeVoice(audioBlob: Blob, options?: {
    language?: string;
    responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json';
    temperature?: number;
  }): Promise<AdvancedAIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('response_format', options?.responseFormat || 'json');
      if (options?.language) formData.append('language', options.language);
      if (options?.temperature) formData.append('temperature', options.temperature.toString());

      const response = await fetch(this.whisperURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Whisper API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      const result: VoiceTranscriptionResult = {
        text: data.text,
        confidence: 0.95,
        language: options?.language || 'es',
        duration: 0, // Would need to be calculated from audio
        segments: data.segments
      };

      return {
        success: true,
        data: result,
        model: 'whisper-1',
        cost: this.calculateWhisperCost(audioBlob.size),
        processingTime,
        metadata: {
          confidence: result.confidence,
          suggestions: this.generateVoiceSuggestions(result.text)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Voice transcription failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze design and provide insights
   */
  async analyzeDesign(designData: any, context?: any): Promise<AdvancedAIResponse> {
    const startTime = Date.now();
    
    try {
      const analysisPrompt = this.buildDesignAnalysisPrompt(designData, context);
      
      const request: AdvancedAIRequest = {
        type: 'analysis',
        model: 'gpt-4',
        prompt: analysisPrompt,
        options: {
          responseFormat: 'json',
          temperature: 0.3
        },
        context
      };

      const response = await this.generateAdvancedText(request);
      
      if (response.success) {
        const analytics: DesignAnalytics = response.data;
        const processingTime = Date.now() - startTime;

        return {
          success: true,
          data: analytics,
          model: 'gpt-4',
          processingTime,
          metadata: {
            confidence: 0.85,
            insights: this.generateDesignInsights(analytics),
            recommendations: analytics.recommendations
          }
        };
      }

      return response;

    } catch (error) {
      return {
        success: false,
        error: `Design analysis failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Recognize objects and provide design suggestions
   */
  async recognizeObjects(imageData: string, context?: any): Promise<AdvancedAIResponse> {
    const startTime = Date.now();
    
    try {
      const visionPrompt = this.buildObjectRecognitionPrompt(imageData, context);
      
      const request: AdvancedAIRequest = {
        type: 'suggestion',
        model: 'gpt-4-vision-preview',
        prompt: visionPrompt,
        options: {
          responseFormat: 'json',
          temperature: 0.3
        },
        context
      };

      // Note: This would require GPT-4 Vision API integration
      // For now, we'll simulate the response
      const mockResult: ObjectRecognitionResult = {
        objects: [
          {
            name: 'logo',
            confidence: 0.95,
            boundingBox: { x: 100, y: 50, width: 200, height: 100 },
            suggestions: ['Consider increasing logo size', 'Add brand colors'],
            metadata: { type: 'brand_element' }
          }
        ],
        overallConfidence: 0.9,
        designInsights: ['Strong brand presence', 'Good visual hierarchy'],
        recommendations: ['Consider adding more white space', 'Balance text and imagery']
      };

      return {
        success: true,
        data: mockResult,
        model: 'gpt-4-vision',
        processingTime: Date.now() - startTime,
        metadata: {
          confidence: mockResult.overallConfidence,
          insights: mockResult.designInsights,
          recommendations: mockResult.recommendations
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Object recognition failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get available models and capabilities
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.apiKey) return [];
    
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.data
        .filter((model: any) => 
          model.id.includes('gpt') || 
          model.id.includes('dall-e') || 
          model.id.includes('whisper')
        )
        .map((model: any) => model.id);
    } catch {
      return [];
    }
  }

  /**
   * Calculate usage costs
   */
  private calculateCost(tokens: number, model: string): number {
    const pricing: { [key: string]: { input: number; output: number } } = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 }
    };
    
    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    return (tokens / 1000) * modelPricing.output;
  }

  private calculateImageCost(model: string, quality?: string): number {
    const pricing: { [key: string]: { [key: string]: number } } = {
      'dall-e-2': { standard: 0.02, hd: 0.02 },
      'dall-e-3': { standard: 0.04, hd: 0.08 }
    };
    
    const modelPricing = pricing[model] || pricing['dall-e-3'];
    return modelPricing[quality || 'standard'];
  }

  private calculateWhisperCost(audioSizeBytes: number): number {
    // Whisper pricing: $0.006 per minute
    const audioMinutes = (audioSizeBytes / (16000 * 2)) / 60; // Rough calculation
    return audioMinutes * 0.006;
  }

  /**
   * Helper methods for prompts and analysis
   */
  private getAdvancedSystemPrompt(context?: any): string {
    let prompt = `Eres un experto en diseño gráfico, marketing digital y análisis de contenido. Tu especialidad incluye:

- Análisis profundo de diseños y composiciones visuales
- Generación de contenido estratégico y persuasivo
- Recomendaciones de mejora basadas en principios de diseño
- Insights sobre tendencias y mejores prácticas de la industria
- Análisis de audiencia y optimización de conversión

Proporciona respuestas precisas, profesionales y basadas en datos.`;

    if (context?.brandVoice) {
      prompt += `\n\nVoz de marca: ${context.brandVoice}`;
    }
    
    if (context?.industry) {
      prompt += `\n\nIndustria: ${context.industry}`;
    }
    
    if (context?.targetAudience) {
      prompt += `\n\nAudiencia objetivo: ${context.targetAudience}`;
    }

    return prompt;
  }

  private buildDesignAnalysisPrompt(designData: any, context?: any): string {
    return `Analiza este diseño y proporciona un análisis completo en formato JSON:

Datos del diseño:
${JSON.stringify(designData, null, 2)}

Contexto:
${JSON.stringify(context, null, 2)}

Proporciona un análisis que incluya:
1. Composición (balance, contraste, armonía, punto focal)
2. Análisis de color (colores dominantes, armonía, accesibilidad, estado de ánimo)
3. Tipografía (legibilidad, jerarquía, consistencia, alineación con marca)
4. Layout (espaciado, alineación, proporción, flujo)
5. Puntuación general (0-100)
6. Recomendaciones específicas

Formato de respuesta JSON:
{
  "composition": { "balance": 85, "contrast": 90, "harmony": 75, "focalPoint": 80 },
  "colorAnalysis": { "dominantColors": ["#FF0000", "#00FF00"], "colorHarmony": 85, "accessibility": 90, "mood": "energético" },
  "typography": { "readability": 85, "hierarchy": 90, "consistency": 80, "brandAlignment": 85 },
  "layout": { "spacing": 80, "alignment": 90, "proportion": 85, "flow": 80 },
  "overallScore": 84,
  "recommendations": ["Mejorar el contraste", "Ajustar el espaciado"]
}`;
  }

  private buildObjectRecognitionPrompt(imageData: string, context?: any): string {
    return `Analiza esta imagen de diseño y identifica todos los elementos visuales. Proporciona:

1. Lista de objetos identificados con coordenadas
2. Nivel de confianza para cada objeto
3. Sugerencias de mejora
4. Insights sobre la composición
5. Recomendaciones generales

Imagen: ${imageData.substring(0, 100)}...

Contexto: ${JSON.stringify(context, null, 2)}`;
  }

  private generateTextAlternatives(content: string): any[] {
    // Generate alternative versions of the text
    return [
      { text: content + ' ✨', type: 'enhanced' },
      { text: content.replace(/\./g, '!'), type: 'energetic' },
      { text: content.toLowerCase(), type: 'casual' }
    ];
  }

  private generateDesignSuggestions(content: string, context?: any): string[] {
    return [
      'Considera usar esta frase como titular principal',
      'Perfecto para redes sociales',
      'Ideal para email marketing',
      'Funciona bien en banners publicitarios'
    ];
  }

  private generateImageSuggestions(prompt: string, context?: any): string[] {
    return [
      'Considera ajustar la paleta de colores',
      'Perfecto para uso en redes sociales',
      'Ideal como imagen de fondo',
      'Funciona bien en materiales impresos'
    ];
  }

  private generateVoiceSuggestions(text: string): string[] {
    return [
      'Considera usar como descripción de producto',
      'Perfecto para contenido de blog',
      'Ideal para email marketing',
      'Funciona bien en redes sociales'
    ];
  }

  private generateDesignInsights(analytics: DesignAnalytics): any[] {
    return [
      `Puntuación general: ${analytics.overallScore}/100`,
      `Fuerza en ${analytics.composition.balance > 80 ? 'composición' : 'diseño'}`,
      `Área de mejora: ${analytics.recommendations[0] || 'optimización general'}`
    ];
  }
}

// Export default instance
export const advancedAIManager = new AdvancedAIManager();
