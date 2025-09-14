/**
 * AI Text Generation System
 * OpenAI-powered content creation with brand voice customization
 */

export interface TextGenerationRequest {
  prompt: string;
  type: 'headline' | 'description' | 'cta' | 'social' | 'email' | 'blog' | 'ad' | 'proposal' | 'custom';
  tone: 'professional' | 'casual' | 'friendly' | 'persuasive' | 'informative' | 'creative' | 'humorous';
  length: 'short' | 'medium' | 'long';
  language: 'spanish' | 'english';
  brandVoice?: BrandVoice;
  context?: string;
  keywords?: string[];
  targetAudience?: string;
  industry?: string;
}

export interface BrandVoice {
  personality: 'professional' | 'casual' | 'luxury' | 'playful' | 'authoritative' | 'empathetic';
  tone: 'formal' | 'informal' | 'conversational' | 'technical';
  style: 'concise' | 'detailed' | 'storytelling' | 'direct' | 'creative';
  values: string[];
  avoidWords: string[];
  preferredWords: string[];
}

export interface TextGenerationResult {
  success: boolean;
  content?: string;
  alternatives?: string[];
  error?: string;
  tokensUsed?: number;
  cost?: number;
  processingTime?: number;
}

export interface TextTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  promptTemplate: string;
  examples: string[];
  maxLength: number;
  tone: string;
}

export class AITextGenerationManager {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';
  private defaultModel: string = 'gpt-3.5-turbo';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  }

  /**
   * Generate text using OpenAI API
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      const prompt = this.buildPrompt(request);
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(request)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.getMaxTokens(request.length),
          temperature: this.getTemperature(request.tone),
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
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
        content,
        alternatives: this.generateAlternatives(content),
        tokensUsed: data.usage?.total_tokens || 0,
        cost: this.calculateCost(data.usage?.total_tokens || 0),
        processingTime
      };

    } catch (error) {
      return {
        success: false,
        error: `Text generation failed: ${error}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate multiple text variations
   */
  async generateVariations(request: TextGenerationRequest, count: number = 3): Promise<TextGenerationResult[]> {
    const results: TextGenerationResult[] = [];
    
    for (let i = 0; i < count; i++) {
      const variationRequest = {
        ...request,
        prompt: `${request.prompt} (Variación ${i + 1})`
      };
      
      const result = await this.generateText(variationRequest);
      results.push(result);
      
      // Add small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Generate text for specific template
   */
  async generateFromTemplate(templateId: string, request: Partial<TextGenerationRequest>): Promise<TextGenerationResult> {
    const template = TEXT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateId}`
      };
    }

    const fullRequest: TextGenerationRequest = {
      prompt: request.prompt || '',
      type: template.category as any,
      tone: template.tone as any,
      length: 'medium',
      language: 'spanish',
      ...request
    };

    fullRequest.prompt = template.promptTemplate.replace('{prompt}', fullRequest.prompt);
    
    return this.generateText(fullRequest);
  }

  /**
   * Build the complete prompt
   */
  private buildPrompt(request: TextGenerationRequest): string {
    let prompt = `Genera ${this.getTypeDescription(request.type)} en ${request.language === 'spanish' ? 'español' : 'inglés'}.`;
    
    prompt += `\n\nContenido solicitado: ${request.prompt}`;
    
    if (request.context) {
      prompt += `\n\nContexto: ${request.context}`;
    }
    
    if (request.targetAudience) {
      prompt += `\n\nAudiencia objetivo: ${request.targetAudience}`;
    }
    
    if (request.industry) {
      prompt += `\n\nIndustria: ${request.industry}`;
    }
    
    if (request.keywords && request.keywords.length > 0) {
      prompt += `\n\nPalabras clave a incluir: ${request.keywords.join(', ')}`;
    }
    
    prompt += `\n\nTono: ${this.getToneDescription(request.tone)}`;
    prompt += `\n\nLongitud: ${this.getLengthDescription(request.length)}`;
    
    if (request.brandVoice) {
      prompt += `\n\nVoz de marca: ${this.getBrandVoiceDescription(request.brandVoice)}`;
    }
    
    return prompt;
  }

  /**
   * Get system prompt for the AI
   */
  private getSystemPrompt(request: TextGenerationRequest): string {
    return `Eres un experto copywriter y especialista en marketing digital. Tu tarea es crear contenido ${request.language === 'spanish' ? 'en español' : 'en inglés'} que sea:
- Creativo y original
- Adaptado a la audiencia objetivo
- Optimizado para engagement
- Alineado con la voz de marca
- Call-to-action efectivo

Siempre responde únicamente con el contenido solicitado, sin explicaciones adicionales.`;
  }

  /**
   * Get type description
   */
  private getTypeDescription(type: string): string {
    const descriptions: { [key: string]: string } = {
      'headline': 'un titular impactante',
      'description': 'una descripción atractiva',
      'cta': 'un call-to-action persuasivo',
      'social': 'contenido para redes sociales',
      'email': 'contenido para email marketing',
      'blog': 'contenido para blog',
      'ad': 'copy publicitario',
      'proposal': 'contenido para propuesta',
      'custom': 'contenido personalizado'
    };
    return descriptions[type] || 'contenido';
  }

  /**
   * Get tone description
   */
  private getToneDescription(tone: string): string {
    const descriptions: { [key: string]: string } = {
      'professional': 'profesional y formal',
      'casual': 'casual y relajado',
      'friendly': 'amigable y cercano',
      'persuasive': 'persuasivo y convincente',
      'informative': 'informativo y educativo',
      'creative': 'creativo e innovador',
      'humorous': 'divertido y entretenido'
    };
    return descriptions[tone] || 'neutro';
  }

  /**
   * Get length description
   */
  private getLengthDescription(length: string): string {
    const descriptions: { [key: string]: string } = {
      'short': 'corta (1-2 frases)',
      'medium': 'media (3-5 frases)',
      'long': 'larga (6+ frases)'
    };
    return descriptions[length] || 'media';
  }

  /**
   * Get brand voice description
   */
  private getBrandVoiceDescription(voice: BrandVoice): string {
    let description = `Personalidad ${voice.personality}, tono ${voice.tone}, estilo ${voice.style}`;
    
    if (voice.values.length > 0) {
      description += `. Valores: ${voice.values.join(', ')}`;
    }
    
    if (voice.preferredWords.length > 0) {
      description += `. Palabras preferidas: ${voice.preferredWords.join(', ')}`;
    }
    
    if (voice.avoidWords.length > 0) {
      description += `. Evitar palabras: ${voice.avoidWords.join(', ')}`;
    }
    
    return description;
  }

  /**
   * Get max tokens based on length
   */
  private getMaxTokens(length: string): number {
    const tokens: { [key: string]: number } = {
      'short': 50,
      'medium': 150,
      'long': 300
    };
    return tokens[length] || 150;
  }

  /**
   * Get temperature based on tone
   */
  private getTemperature(tone: string): number {
    const temperatures: { [key: string]: number } = {
      'professional': 0.3,
      'informative': 0.4,
      'friendly': 0.6,
      'casual': 0.7,
      'persuasive': 0.8,
      'creative': 0.9,
      'humorous': 1.0
    };
    return temperatures[tone] || 0.7;
  }

  /**
   * Generate alternatives from the main content
   */
  private generateAlternatives(content: string): string[] {
    // Simple alternative generation by modifying the content
    const alternatives = [];
    
    // Alternative 1: Add emoji
    alternatives.push(content + ' ✨');
    
    // Alternative 2: Make it shorter
    const words = content.split(' ');
    if (words.length > 5) {
      alternatives.push(words.slice(0, Math.floor(words.length * 0.7)).join(' ') + '...');
    }
    
    // Alternative 3: Add urgency
    alternatives.push(content + ' ¡Actúa ahora!');
    
    return alternatives;
  }

  /**
   * Calculate cost based on tokens
   */
  private calculateCost(tokens: number): number {
    // GPT-3.5-turbo pricing: $0.002 per 1K tokens
    return (tokens / 1000) * 0.002;
  }

  /**
   * Validate API key
   */
  async validateAPIKey(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get available models
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
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id);
    } catch {
      return [];
    }
  }
}

// Predefined text templates
export const TEXT_TEMPLATES: TextTemplate[] = [
  {
    id: 'headline-main',
    name: 'Titular Principal',
    description: 'Titular impactante para campañas principales',
    category: 'headline',
    promptTemplate: 'Crea un titular impactante para: {prompt}',
    examples: [
      'Transforma tu negocio en 30 días',
      'La solución que estabas buscando',
      'Descubre el secreto del éxito'
    ],
    maxLength: 60,
    tone: 'persuasive'
  },
  {
    id: 'headline-social',
    name: 'Titular para Redes Sociales',
    description: 'Titulares optimizados para engagement en redes sociales',
    category: 'headline',
    promptTemplate: 'Crea un titular para redes sociales sobre: {prompt}',
    examples: [
      '¿Sabías que...? 🤔',
      'Esto te va a sorprender 😱',
      'El truco que nadie te cuenta 💡'
    ],
    maxLength: 100,
    tone: 'casual'
  },
  {
    id: 'description-product',
    name: 'Descripción de Producto',
    description: 'Descripción atractiva para productos o servicios',
    category: 'description',
    promptTemplate: 'Describe este producto/servicio de forma atractiva: {prompt}',
    examples: [
      'Diseñado para maximizar tu productividad y eficiencia',
      'La combinación perfecta de estilo y funcionalidad',
      'Revoluciona tu experiencia con tecnología de vanguardia'
    ],
    maxLength: 200,
    tone: 'professional'
  },
  {
    id: 'cta-urgent',
    name: 'Call-to-Action Urgente',
    description: 'CTA que genera acción inmediata',
    category: 'cta',
    promptTemplate: 'Crea un call-to-action urgente para: {prompt}',
    examples: [
      '¡Reserva tu lugar ahora antes de que se agoten!',
      'Oferta limitada - ¡Actúa ya!',
      'Solo quedan 24 horas - ¡No te lo pierdas!'
    ],
    maxLength: 80,
    tone: 'persuasive'
  },
  {
    id: 'social-engagement',
    name: 'Contenido para Engagement',
    description: 'Contenido diseñado para generar interacción',
    category: 'social',
    promptTemplate: 'Crea contenido para redes sociales sobre: {prompt}',
    examples: [
      '¿Cuál es tu mayor desafío? Comparte en comentarios 👇',
      'Etiqueta a alguien que necesita ver esto',
      '¿Te ha pasado esto? React con 👍 o ❤️'
    ],
    maxLength: 150,
    tone: 'friendly'
  },
  {
    id: 'email-subject',
    name: 'Asunto de Email',
    description: 'Asuntos de email que generan apertura',
    category: 'email',
    promptTemplate: 'Crea un asunto de email atractivo para: {prompt}',
    examples: [
      'Tu pedido está en camino 🚚',
      'Oferta especial solo para ti',
      'Actualización importante sobre tu cuenta'
    ],
    maxLength: 50,
    tone: 'friendly'
  },
  {
    id: 'blog-title',
    name: 'Título de Blog',
    description: 'Títulos optimizados para SEO y clicks',
    category: 'blog',
    promptTemplate: 'Crea un título de blog atractivo sobre: {prompt}',
    examples: [
      '10 Consejos para Mejorar tu Productividad',
      'La Guía Definitiva para Principiantes',
      'Errores que Debes Evitar en 2024'
    ],
    maxLength: 70,
    tone: 'informative'
  },
  {
    id: 'ad-copy',
    name: 'Copy Publicitario',
    description: 'Copy persuasivo para anuncios pagados',
    category: 'ad',
    promptTemplate: 'Crea copy publicitario convincente para: {prompt}',
    examples: [
      'Aumenta tus ventas en un 300%',
      'La herramienta que los expertos usan',
      'Resultados garantizados en 30 días'
    ],
    maxLength: 120,
    tone: 'persuasive'
  }
];

// Default brand voices
export const DEFAULT_BRAND_VOICES: { [key: string]: BrandVoice } = {
  professional: {
    personality: 'professional',
    tone: 'formal',
    style: 'concise',
    values: ['confiabilidad', 'excelencia', 'innovación'],
    avoidWords: ['genial', 'súper', 'increíble'],
    preferredWords: ['excelente', 'profesional', 'confiable']
  },
  casual: {
    personality: 'casual',
    tone: 'conversational',
    style: 'direct',
    values: ['autenticidad', 'simplicidad', 'accesibilidad'],
    avoidWords: ['formal', 'protocolo', 'ceremonioso'],
    preferredWords: ['genial', 'cool', 'fácil']
  },
  luxury: {
    personality: 'luxury',
    tone: 'formal',
    style: 'detailed',
    values: ['exclusividad', 'calidad', 'refinamiento'],
    avoidWords: ['barato', 'simple', 'común'],
    preferredWords: ['exclusivo', 'premium', 'sofisticado']
  },
  playful: {
    personality: 'playful',
    tone: 'informal',
    style: 'creative',
    values: ['diversión', 'creatividad', 'originalidad'],
    avoidWords: ['serio', 'formal', 'aburrido'],
    preferredWords: ['divertido', 'genial', 'súper']
  }
};

// Export default instance
export const aiTextGenerator = new AITextGenerationManager();
