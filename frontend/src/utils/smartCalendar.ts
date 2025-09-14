/**
 * Smart Campaign Calendar System
 * AI-powered event management and scheduling
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: 'campaign' | 'milestone' | 'deadline' | 'meeting' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  campaignId?: string;
  deliverables: string[];
  attendees?: string[];
  location?: string;
  tags: string[];
  aiGenerated: boolean;
  color: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'paused' | 'completed';
  goals: string[];
  targetAudience: string;
  budget: number;
  events: CalendarEvent[];
  milestones: CampaignMilestone[];
  deliverables: CampaignDeliverable[];
  aiSuggestions: AISuggestion[];
}

export interface CampaignMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  deliverables: string[];
  dependencies: string[];
}

export interface CampaignDeliverable {
  id: string;
  name: string;
  type: 'design' | 'content' | 'video' | 'photo' | 'document';
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  description: string;
}

export interface AISuggestion {
  id: string;
  type: 'schedule' | 'content' | 'timing' | 'optimization';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  action: string;
  data: any;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day';
  currentDate: Date;
  events: CalendarEvent[];
  campaigns: Campaign[];
}

export interface SchedulingContext {
  campaignGoals: string[];
  targetAudience: string;
  budget: number;
  timeline: number; // weeks
  teamSize: number;
  industry: string;
  seasonality: string[];
  constraints: string[];
}

export class SmartCalendarManager {
  private events: Map<string, CalendarEvent> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private currentView: CalendarView;

  constructor() {
    this.currentView = {
      type: 'month',
      currentDate: new Date(),
      events: [],
      campaigns: []
    };
  }

  /**
   * Add new campaign
   */
  addCampaign(campaign: Omit<Campaign, 'id' | 'events' | 'milestones' | 'deliverables' | 'aiSuggestions'>): Campaign {
    const id = this.generateId();
    const newCampaign: Campaign = {
      ...campaign,
      id,
      events: [],
      milestones: [],
      deliverables: [],
      aiSuggestions: []
    };

    this.campaigns.set(id, newCampaign);
    this.generateAISuggestions(newCampaign);
    return newCampaign;
  }

  /**
   * Add event to campaign
   */
  addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const id = this.generateId();
    const newEvent: CalendarEvent = {
      ...event,
      id
    };

    this.events.set(id, newEvent);
    
    // Add to campaign if specified
    if (event.campaignId) {
      const campaign = this.campaigns.get(event.campaignId);
      if (campaign) {
        campaign.events.push(newEvent);
      }
    }

    this.currentView.events.push(newEvent);
    return newEvent;
  }

  /**
   * Generate AI suggestions for campaign
   */
  private generateAISuggestions(campaign: Campaign): void {
    const suggestions: AISuggestion[] = [];

    // Optimal posting times suggestion
    suggestions.push({
      id: this.generateId(),
      type: 'timing',
      title: 'Horarios Óptimos de Publicación',
      description: `Basado en su audiencia objetivo "${campaign.targetAudience}", los mejores horarios para publicar son entre 10:00-12:00 y 18:00-20:00.`,
      confidence: 85,
      impact: 'high',
      action: 'Programar publicaciones en estos horarios',
      data: { optimalTimes: ['10:00-12:00', '18:00-20:00'] }
    });

    // Content calendar suggestion
    suggestions.push({
      id: this.generateId(),
      type: 'schedule',
      title: 'Calendario de Contenido Sugerido',
      description: `Para una campaña de ${Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))} semanas, recomendamos 3-4 publicaciones por semana con variedad de formatos.`,
      confidence: 78,
      impact: 'medium',
      action: 'Crear calendario de contenido detallado',
      data: { postsPerWeek: 3, formats: ['imagen', 'video', 'carousel', 'historia'] }
    });

    // Budget optimization suggestion
    if (campaign.budget > 0) {
      suggestions.push({
        id: this.generateId(),
        type: 'optimization',
        title: 'Optimización de Presupuesto',
        description: `Con un presupuesto de $${campaign.budget.toLocaleString()}, recomendamos asignar 60% a publicidad pagada y 40% a contenido orgánico.`,
        confidence: 82,
        impact: 'high',
        action: 'Redistribuir presupuesto según recomendación',
        data: { 
          paid: campaign.budget * 0.6, 
          organic: campaign.budget * 0.4,
          dailyBudget: campaign.budget / Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // Milestone suggestions
    const campaignDuration = Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const milestoneWeeks = [Math.floor(campaignDuration * 0.25), Math.floor(campaignDuration * 0.5), Math.floor(campaignDuration * 0.75)];
    
    milestoneWeeks.forEach((week, index) => {
      suggestions.push({
        id: this.generateId(),
        type: 'schedule',
        title: `Hito Semana ${week + 1}`,
        description: `Evaluar progreso y ajustar estrategia en la semana ${week + 1} de la campaña.`,
        confidence: 90,
        impact: 'medium',
        action: `Programar revisión para semana ${week + 1}`,
        data: { week, milestoneType: ['inicial', 'intermedia', 'final'][index] }
      });
    });

    campaign.aiSuggestions = suggestions;
  }

  /**
   * Get optimal scheduling suggestions
   */
  getOptimalScheduling(context: SchedulingContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Industry-specific suggestions
    const industryTimings = this.getIndustryOptimalTimings(context.industry);
    suggestions.push({
      id: this.generateId(),
      type: 'timing',
      title: `Horarios Óptimos para ${context.industry}`,
      description: `Basado en datos de la industria ${context.industry}, los mejores días son ${industryTimings.bestDays.join(', ')}.`,
      confidence: industryTimings.confidence,
      impact: 'high',
      action: 'Programar contenido en estos días',
      data: industryTimings
    });

    // Budget-based suggestions
    if (context.budget > 10000) {
      suggestions.push({
        id: this.generateId(),
        type: 'optimization',
        title: 'Estrategia Premium Recomendada',
        description: 'Con su presupuesto, recomendamos una estrategia multicanal con influencer marketing.',
        confidence: 88,
        impact: 'high',
        action: 'Implementar estrategia premium',
        data: { 
          channels: ['instagram', 'facebook', 'youtube', 'influencers'],
          influencerBudget: context.budget * 0.3
        }
      });
    }

    // Timeline optimization
    if (context.timeline < 4) {
      suggestions.push({
        id: this.generateId(),
        type: 'schedule',
        title: 'Campaña Express Optimizada',
        description: `Para ${context.timeline} semanas, recomendamos enfoque en canales de alto impacto y contenido pre-producido.`,
        confidence: 75,
        impact: 'high',
        action: 'Ajustar estrategia para timeline corto',
        data: { 
          focusChannels: ['instagram', 'facebook'],
          contentRatio: { preProduced: 0.7, realTime: 0.3 }
        }
      });
    }

    return suggestions;
  }

  /**
   * Get industry-specific optimal timings
   */
  private getIndustryOptimalTimings(industry: string): any {
    const timings: { [key: string]: any } = {
      'retail': {
        bestDays: ['lunes', 'miércoles', 'viernes'],
        bestTimes: ['10:00-12:00', '15:00-17:00', '19:00-21:00'],
        confidence: 85
      },
      'technology': {
        bestDays: ['martes', 'miércoles', 'jueves'],
        bestTimes: ['09:00-11:00', '14:00-16:00', '20:00-22:00'],
        confidence: 80
      },
      'healthcare': {
        bestDays: ['lunes', 'martes', 'jueves'],
        bestTimes: ['08:00-10:00', '13:00-15:00', '18:00-20:00'],
        confidence: 78
      },
      'education': {
        bestDays: ['lunes', 'martes', 'jueves', 'viernes'],
        bestTimes: ['07:00-09:00', '12:00-14:00', '17:00-19:00'],
        confidence: 82
      },
      'food': {
        bestDays: ['martes', 'jueves', 'sábado'],
        bestTimes: ['11:00-13:00', '18:00-20:00', '20:00-22:00'],
        confidence: 87
      }
    };

    return timings[industry.toLowerCase()] || timings['retail'];
  }

  /**
   * Get calendar view
   */
  getCalendarView(type: 'month' | 'week' | 'day', date: Date): CalendarView {
    this.currentView.type = type;
    this.currentView.currentDate = date;
    
    // Filter events based on view type
    const startDate = this.getViewStartDate(type, date);
    const endDate = this.getViewEndDate(type, date);
    
    this.currentView.events = Array.from(this.events.values()).filter(event => 
      event.startDate >= startDate && event.startDate <= endDate
    );
    
    this.currentView.campaigns = Array.from(this.campaigns.values()).filter(campaign =>
      campaign.startDate <= endDate && campaign.endDate >= startDate
    );

    return this.currentView;
  }

  /**
   * Export to calendar formats
   */
  exportToICS(events: CalendarEvent[]): string {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Smart Calendar//EN\n';
    
    events.forEach(event => {
      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `UID:${event.id}@smartcalendar.com\n`;
      icsContent += `DTSTART:${this.formatDateForICS(event.startDate)}\n`;
      icsContent += `DTEND:${this.formatDateForICS(event.endDate)}\n`;
      icsContent += `SUMMARY:${event.title}\n`;
      icsContent += `DESCRIPTION:${event.description}\n`;
      if (event.location) {
        icsContent += `LOCATION:${event.location}\n`;
      }
      icsContent += `STATUS:${event.status.toUpperCase()}\n`;
      icsContent += 'END:VEVENT\n';
    });
    
    icsContent += 'END:VCALENDAR\n';
    return icsContent;
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getViewStartDate(type: string, date: Date): Date {
    switch (type) {
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1);
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek;
      case 'day':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      default:
        return date;
    }
  }

  private getViewEndDate(type: string, date: Date): Date {
    switch (type) {
      case 'month':
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      case 'week':
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() + (6 - date.getDay()));
        return endOfWeek;
      case 'day':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      default:
        return date;
    }
  }

  private formatDateForICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  /**
   * Get all campaigns
   */
  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get all events
   */
  getAllEvents(): CalendarEvent[] {
    return Array.from(this.events.values());
  }

  /**
   * Update campaign
   */
  updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
    const campaign = this.campaigns.get(id);
    if (campaign) {
      const updatedCampaign = { ...campaign, ...updates };
      this.campaigns.set(id, updatedCampaign);
      return updatedCampaign;
    }
    return null;
  }

  /**
   * Update event
   */
  updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const event = this.events.get(id);
    if (event) {
      const updatedEvent = { ...event, ...updates };
      this.events.set(id, updatedEvent);
      return updatedEvent;
    }
    return null;
  }

  /**
   * Delete campaign
   */
  deleteCampaign(id: string): boolean {
    return this.campaigns.delete(id);
  }

  /**
   * Delete event
   */
  deleteEvent(id: string): boolean {
    return this.events.delete(id);
  }
}

// Export default instance
export const smartCalendarManager = new SmartCalendarManager();
