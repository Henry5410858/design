'use client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { FiCalendar, FiPlus, FiClock, FiMapPin, FiUsers, FiTag, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function CampaignCalendarPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario de Campañas</h1>
          <p className="text-gray-600">Planifica y programa tus campañas de diseño y actividades de marketing</p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary-dark transition-colors duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1">
                Hoy
              </button>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
              <span className="text-lg font-semibold text-gray-900">Agosto 2024</span>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-medium hover:from-brand-primary-dark hover:to-brand-secondary-dark transition-all duration-200 shadow-soft hover:shadow-elevated transform hover:-translate-y-1">
              <FiPlus className="w-4 h-4" />
              Agregar Evento
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Previous month days */}
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`prev-${i}`} className="min-h-[120px] p-2 border-r border-b border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-400">28</span>
              </div>
            ))}
            
            {/* Current month days */}
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const hasEvent = [5, 12, 19, 26].includes(day); // Sample events
              const isToday = day === 25; // Sample today
              
              return (
                <div key={day} className={`min-h-[120px] p-2 border-r border-b border-gray-200 relative ${
                  isToday ? 'bg-brand-primary/10' : ''
                }`}>
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-brand-primary' : 'text-gray-900'
                  }`}>
                    {day}
                  </span>
                  
                  {hasEvent && (
                    <div className="mt-1">
                      <div className="text-xs bg-brand-secondary/20 text-brand-secondary px-2 py-1 rounded truncate">
                        Lanzamiento de Campaña
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Next month days */}
            {Array.from({ length: 2 }, (_, i) => (
              <div key={`next-${i}`} className="min-h-[120px] p-2 border-r border-b border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-400">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiClock className="w-5 h-5 text-brand-primary" />
              Próximos Eventos
            </h3>
            <div className="space-y-4">
              {[
                { title: 'Campaña de Venta de Verano', date: '28 Ago', time: '9:00 AM', type: 'Marketing' },
                { title: 'Lanzamiento de Producto', date: '2 Sep', time: '2:00 PM', type: 'Producto' },
                { title: 'Renovación de Marca', date: '5 Sep', time: '10:00 AM', type: 'Branding' },
              ].map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {event.time}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-xs rounded-full">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiTag className="w-5 h-5 text-success" />
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <button className="w-full p-3 text-left bg-brand-primary/5 hover:bg-brand-primary/10 rounded-xl transition-colors duration-200 group hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors duration-200">
                    <FiPlus className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Crear Nueva Campaña</h4>
                    <p className="text-sm text-gray-600">Configura una nueva campaña de marketing</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-3 text-left bg-success/5 hover:bg-success/10 rounded-xl transition-colors duration-200 group hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/20 transition-colors duration-200">
                    <FiUsers className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Reunión de Equipo</h4>
                    <p className="text-sm text-gray-600">Programa una reunión de revisión de diseño</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-3 text-left bg-brand-secondary/5 hover:bg-brand-secondary/10 rounded-xl transition-colors duration-200 group hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-secondary/20 transition-colors duration-200">
                    <FiMapPin className="w-5 h-5 text-brand-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Planificación de Eventos</h4>
                    <p className="text-sm text-gray-600">Planifica eventos próximos y fechas límite</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
