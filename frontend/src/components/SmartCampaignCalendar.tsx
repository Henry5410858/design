'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  smartCalendarManager, 
  Campaign, 
  CalendarEvent, 
  AISuggestion, 
  SchedulingContext 
} from '@/utils/smartCalendar';
import { 
  Calendar, 
  Plus, 
  Filter, 
  Download, 
  Zap, 
  Target, 
  Clock, 
  Users, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface SmartCampaignCalendarProps {
  onClose?: () => void;
}

export default function SmartCampaignCalendar({ onClose }: SmartCampaignCalendarProps) {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    goals: [''],
    targetAudience: '',
    budget: 0,
    industry: 'retail'
  });

  // Load initial data
  useEffect(() => {
    loadCalendarData();
  }, [currentView, currentDate]);

  const loadCalendarData = useCallback(() => {
    const view = smartCalendarManager.getCalendarView(currentView, currentDate);
    setCampaigns(view.campaigns);
    setEvents(view.events);
  }, [currentView, currentDate]);

  const handleCreateCampaign = useCallback(() => {
    const campaign = smartCalendarManager.addCampaign({
      name: newCampaign.name,
      description: newCampaign.description,
      startDate: new Date(newCampaign.startDate),
      endDate: new Date(newCampaign.endDate),
      status: 'planning',
      goals: newCampaign.goals.filter(goal => goal.trim() !== ''),
      targetAudience: newCampaign.targetAudience,
      budget: newCampaign.budget
    });

    setCampaigns(prev => [...prev, campaign]);
    setShowNewCampaign(false);
    
    // Reset form
    setNewCampaign({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      goals: [''],
      targetAudience: '',
      budget: 0,
      industry: 'retail'
    });
  }, [newCampaign]);

  const handleGenerateAISuggestions = useCallback(() => {
    const context: SchedulingContext = {
      campaignGoals: newCampaign.goals.filter(goal => goal.trim() !== ''),
      targetAudience: newCampaign.targetAudience,
      budget: newCampaign.budget,
      timeline: Math.ceil((new Date(newCampaign.endDate).getTime() - new Date(newCampaign.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)),
      teamSize: 3,
      industry: newCampaign.industry,
      seasonality: ['verano', 'invierno'],
      constraints: ['presupuesto', 'timeline']
    };

    const suggestions = smartCalendarManager.getOptimalScheduling(context);
    setAiSuggestions(suggestions);
    setShowAISuggestions(true);
  }, [newCampaign]);

  const handleExportCalendar = useCallback(() => {
    const icsContent = smartCalendarManager.exportToICS(events);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendario-campanas-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [events, currentDate]);

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    const colors = {
      campaign: 'bg-blue-500',
      milestone: 'bg-green-500',
      deadline: 'bg-red-500',
      meeting: 'bg-purple-500',
      reminder: 'bg-yellow-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const renderCalendarGrid = () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startDate.getDay();
    const daysInMonth = endDate.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = events.filter(event => 
        event.startDate.getDate() === day && 
        event.startDate.getMonth() === currentDate.getMonth()
      );
      
      days.push(
        <div key={day} className="h-24 border border-gray-200 p-1 relative">
          <div className="font-medium text-sm mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded text-white ${getEventTypeColor(event.type)}`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Calendario Inteligente de Campañas
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

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('month')}
                className={`px-3 py-1 rounded ${currentView === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Mes
              </button>
              <button
                onClick={() => setCurrentView('week')}
                className={`px-3 py-1 rounded ${currentView === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Semana
              </button>
              <button
                onClick={() => setCurrentView('day')}
                className={`px-3 py-1 rounded ${currentView === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Día
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium min-w-[200px] text-center">
                {currentDate.toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCalendar}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={() => setShowNewCampaign(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Campaña
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {currentView === 'month' && (
          <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="bg-gray-100 p-2 text-center font-medium text-sm">
                {day}
              </div>
            ))}
            {renderCalendarGrid()}
          </div>
        )}

        {/* Campaigns List */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Campañas Activas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{campaign.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                    campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    <span>{campaign.targetAudience}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    <span>${campaign.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {campaign.startDate.toLocaleDateString()} - {campaign.endDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Ver Detalles
                  </button>
                  <button
                    onClick={() => setShowAISuggestions(true)}
                    className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Campaign Modal */}
        {showNewCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Nueva Campaña</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre de la Campaña
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Campaña de Verano 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe los objetivos y estrategia de la campaña..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={newCampaign.startDate}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={newCampaign.endDate}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Audiencia Objetivo
                  </label>
                  <input
                    type="text"
                    value={newCampaign.targetAudience}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Mujeres 25-35 años, amantes de la moda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Presupuesto
                  </label>
                  <input
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Industria
                  </label>
                  <select
                    value={newCampaign.industry}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="retail">Retail</option>
                    <option value="technology">Tecnología</option>
                    <option value="healthcare">Salud</option>
                    <option value="education">Educación</option>
                    <option value="food">Alimentación</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateAISuggestions}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Sugerencias IA
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Crear Campaña
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestions Modal */}
        {showAISuggestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Sugerencias de IA
              </h3>
              
              <div className="space-y-4">
                {aiSuggestions.map(suggestion => (
                  <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          suggestion.confidence >= 80 ? 'bg-green-100 text-green-800' :
                          suggestion.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {suggestion.confidence}% confianza
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                          suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {suggestion.impact} impacto
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{suggestion.description}</p>
                    <p className="text-sm text-blue-600 font-medium">{suggestion.action}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Aplicar Sugerencias
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
