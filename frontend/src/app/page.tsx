'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  FiPlus, 
  FiTrendingUp, 
  FiUsers, 
  FiDownload, 
  FiStar, 
  FiClock, 
  FiCheckCircle, 
  FiBarChart, 
  FiCalendar, 
  FiTarget, 
  FiZap, 
  FiImage,
  FiArrowRight,
  FiEye,
  FiHeart
} from 'react-icons/fi';

export default function Dashboard() {
  const stats = [
    {
      title: 'Templates Creados',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: <FiTrendingUp className="w-6 h-6" />,
      description: 'Este mes'
    },
    {
      title: 'Descargas',
      value: '156',
      change: '+8%',
      changeType: 'positive',
      icon: <FiDownload className="w-6 h-6" />,
      description: 'Este mes'
    },
    {
      title: 'Proyectos Activos',
      value: '8',
      change: '+2',
      changeType: 'positive',
      icon: <FiUsers className="w-6 h-6" />,
      description: 'Este mes'
    },
    {
      title: 'Tiempo Ahorrado',
      value: '32h',
      change: '+5h',
      changeType: 'positive',
      icon: <FiClock className="w-6 h-6" />,
      description: 'Este mes'
    }
  ];

  const recentTemplates = [
    {
      id: '1',
      name: 'Flyer Promocional',
      category: 'Flyers',
      lastModified: 'Hace 2 horas',
      thumbnail: '/api/placeholder/300/200',
      isPremium: false,
      views: 45,
      downloads: 12
    },
    {
      id: '2',
      name: 'Banner Redes Sociales',
      category: 'Banners',
      lastModified: 'Hace 1 día',
      thumbnail: '/api/placeholder/300/200',
      isPremium: true,
      views: 89,
      downloads: 23
    },
    {
      id: '3',
      name: 'Presentación Empresarial',
      category: 'Documentos',
      lastModified: 'Hace 3 días',
      thumbnail: '/api/placeholder/300/200',
      isPremium: false,
      views: 67,
      downloads: 18
    }
  ];

  const quickActions = [
    {
      title: 'Crear Template',
      description: 'Diseña desde cero',
      icon: <FiPlus className="w-8 h-8" />,
      action: () => console.log('Crear template'),
      variant: 'gradient' as const
    },
    {
      title: 'Importar Diseño',
      description: 'Sube tu archivo',
      icon: <FiDownload className="w-8 h-8" />,
      action: () => console.log('Importar diseño'),
      variant: 'outline' as const
    },
    {
      title: 'Ver Tutoriales',
      description: 'Aprende más',
      icon: <FiStar className="w-8 h-8" />,
      action: () => console.log('Ver tutoriales'),
      variant: 'ghost' as const
    }
  ];

  const insights = [
    {
      title: 'Rendimiento del Mes',
      value: '94%',
      description: 'Mejor que el mes pasado',
      icon: <FiBarChart className="w-5 h-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Metas Alcanzadas',
      value: '8/10',
      description: '80% de objetivos cumplidos',
      icon: <FiTarget className="w-5 h-5" />,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      title: 'Productividad',
      value: '+23%',
      description: 'Incremento en eficiencia',
      icon: <FiZap className="w-5 h-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Welcome Section */}
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent rounded-2xl p-6 sm:p-8 lg:p-12 text-white"
        >
          <div className="relative z-10">
            <motion.div 
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium opacity-90">Bienvenido de vuelta</span>
            </motion.div>
            
            <motion.h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              ¡Hola! 👋
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl lg:text-2xl opacity-90 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Continúa creando diseños increíbles con nuestras herramientas profesionales
            </motion.p>
            
            <motion.div 
              className="mt-6 lg:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm w-full sm:w-auto"
                leftIcon={<FiPlus />}
              >
                Nuevo Proyecto
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 w-full sm:w-auto"
                rightIcon={<FiArrowRight />}
              >
                Ver Estadísticas
              </Button>
            </motion.div>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 sm:w-32 lg:w-32 h-24 sm:h-32 lg:h-32 bg-white/5 rounded-full blur-2xl"></div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card 
                variant="elevated" 
                className="group hover:scale-105 transition-all duration-300"
                shadow="lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-2xl group-hover:from-brand-primary/20 group-hover:to-brand-secondary/20 transition-all duration-300">
                    <div className="text-brand-primary group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    stat.changeType === 'positive' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-error/10 text-error'
                  }`}>
                    {stat.change}
                  </div>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
                  {stat.title}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {stat.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Insights Row */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
        >
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card 
                variant="outlined" 
                border="brand"
                className="border-l-4 border-l-brand-primary"
                shadow="sm"
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 ${insight.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <div className={insight.color}>
                      {insight.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                      {insight.value}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Acciones Rápidas
              </h2>
              <p className="text-gray-600 text-sm lg:text-base">
                Accede rápidamente a las herramientas más utilizadas
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card
                  variant="interactive"
                  onClick={action.action}
                  className="group text-center border-2 border-transparent hover:border-brand-primary/20 transition-all duration-300"
                  shadow="lg"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl mx-auto mb-4 lg:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="text-white">
                      {action.icon}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 lg:mb-3">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-xs lg:text-sm leading-relaxed">
                    {action.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Templates */}
        <motion.div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Templates Recientes
              </h2>
              <p className="text-gray-600 text-sm lg:text-base">
                Tus diseños más recientes y populares
              </p>
            </div>
            <Button variant="secondary" size="lg" leftIcon={<FiDownload />} className="w-full sm:w-auto">
              Ver Todos
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {recentTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card
                  variant="interactive"
                  padding="none"
                  className="group overflow-hidden border-2 border-transparent hover:border-brand-primary/20 transition-all duration-300"
                  shadow="lg"
                >
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <div className="text-center">
                        <FiImage className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-500 text-xs sm:text-sm font-medium">Vista previa</span>
                      </div>
                    </div>
                    
                    {template.isPremium && (
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                        PREMIUM
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-3 sm:p-4 w-full">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30 text-xs sm:text-sm"
                        >
                          Editar en Canva
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2">
                        {template.name}
                      </h3>
                      {template.isPremium && (
                        <FiStar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {template.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {template.lastModified}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <FiEye className="w-3 h-3" />
                        <span>{template.views} vistas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiDownload className="w-3 h-3" />
                        <span>{template.downloads} descargas</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Professional Tips Section */}
        <motion.div>
          <Card 
            variant="outlined" 
            border="medium"
            className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-gray-200"
            shadow="lg"
          >
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FiCheckCircle className="w-6 h-6 lg:w-8 lg:h-8 text-brand-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  Consejo Profesional del Día
                </h3>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4">
                  Mantén consistencia en tu marca usando la paleta de colores de tu brand kit en todos tus diseños. 
                  Esto creará una identidad visual cohesiva que tu audiencia reconocerá inmediatamente.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <Button variant="primary" size="sm" leftIcon={<FiStar />} className="w-full sm:w-auto">
                    Aplicar Consejo
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    Leer Más
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats Footer */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-3 lg:p-4 text-center border border-blue-200/50">
            <div className="text-xl lg:text-2xl font-bold text-blue-600 mb-1">98%</div>
            <div className="text-xs lg:text-sm text-blue-700 font-medium">Satisfacción</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-3 lg:p-4 text-center border border-green-200/50">
            <div className="text-xl lg:text-2xl font-bold text-green-600 mb-1">24/7</div>
            <div className="text-xs lg:text-sm text-green-700 font-medium">Soporte</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-3 lg:p-4 text-center border border-purple-200/50">
            <div className="text-xl lg:text-2xl font-bold text-purple-600 mb-1">500+</div>
            <div className="text-xs lg:text-sm text-purple-700 font-medium">Templates</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-3 lg:p-4 text-center border border-orange-200/50">
            <div className="text-xl lg:text-2xl font-bold text-orange-600 mb-1">50K+</div>
            <div className="text-xs lg:text-sm text-orange-700 font-medium">Usuarios</div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
export const dynamic = "force-dynamic"; 
