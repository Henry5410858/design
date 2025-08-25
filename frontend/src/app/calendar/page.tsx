'use client';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FiCalendar, FiPlus, FiClock, FiMapPin, FiUsers, FiTag } from 'react-icons/fi';

export default function CampaignCalendarPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Calendar</h1>
          <p className="text-gray-600">Plan and schedule your design campaigns and marketing activities</p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Today
              </button>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <span className="text-lg font-semibold text-gray-900">August 2024</span>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <FiPlus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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
                  isToday ? 'bg-blue-50' : ''
                }`}>
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day}
                  </span>
                  
                  {hasEvent && (
                    <div className="mt-1">
                      <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded truncate">
                        Campaign Launch
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
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiClock className="w-5 h-5 text-blue-600" />
              Upcoming Events
            </h3>
            <div className="space-y-4">
              {[
                { title: 'Summer Sale Campaign', date: 'Aug 28', time: '9:00 AM', type: 'Marketing' },
                { title: 'Product Launch', date: 'Sep 2', time: '2:00 PM', type: 'Product' },
                { title: 'Brand Refresh', date: 'Sep 5', time: '10:00 AM', type: 'Branding' },
              ].map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiTag className="w-5 h-5 text-green-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FiPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Create New Campaign</h4>
                    <p className="text-sm text-gray-600">Set up a new marketing campaign</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FiUsers className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Team Meeting</h4>
                    <p className="text-sm text-gray-600">Schedule a design review meeting</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <FiMapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Event Planning</h4>
                    <p className="text-sm text-gray-600">Plan upcoming events and deadlines</p>
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
