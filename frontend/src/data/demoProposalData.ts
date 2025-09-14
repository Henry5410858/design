/**
 * Demo Proposal Data
 * Example data for testing the PDF Proposal Generator
 */

import { ProposalData } from '@/utils/pdfProposalGenerator';

export const DEMO_REAL_ESTATE_PROPOSAL: ProposalData = {
  title: 'Servicios Inmobiliarios Premium',
  subtitle: 'Su Socio de Confianza en Bienes Raíces',
  clientName: 'María González',
  companyName: 'Inversiones del Caribe S.A.',
  date: '2024-01-15',
  executiveSummary: 'Ofrecemos servicios inmobiliarios integrales que combinan experiencia local, tecnología avanzada y un enfoque personalizado para maximizar el valor de sus inversiones inmobiliarias. Nuestro equipo de profesionales certificados le brindará asesoría experta desde la búsqueda hasta la transacción final.',
  objectives: [
    'Identificar propiedades con mayor potencial de valorización',
    'Optimizar el proceso de compra-venta inmobiliaria',
    'Proporcionar asesoría legal y financiera especializada',
    'Maximizar el retorno de inversión en bienes raíces',
    'Ofrecer servicios de gestión y mantenimiento post-venta'
  ],
  methodology: 'Utilizamos un enfoque sistemático que incluye análisis de mercado, evaluación de propiedades, negociación estratégica y seguimiento continuo. Nuestro proceso incluye visitas técnicas, análisis de documentos legales, evaluación de riesgos y recomendaciones personalizadas basadas en sus objetivos financieros.',
  deliverables: [
    'Reporte de análisis de mercado detallado',
    'Lista de propiedades preseleccionadas',
    'Asesoría legal y documentación completa',
    'Plan de inversión personalizado',
    'Seguimiento mensual y reportes de rendimiento',
    'Servicios de mantenimiento y gestión de propiedades'
  ],
  timeline: 'El proyecto se desarrollará en 3 fases: Fase 1 (Análisis y Búsqueda - 2 semanas), Fase 2 (Evaluación y Negociación - 3 semanas), Fase 3 (Transacción y Seguimiento - 2 semanas). Total: 7 semanas con entregables semanales.',
  pricing: {
    total: 15000,
    breakdown: [
      { item: 'Consultoría y Análisis Inicial', amount: 3000 },
      { item: 'Búsqueda y Evaluación de Propiedades', amount: 4000 },
      { item: 'Asesoría Legal y Documentación', amount: 3500 },
      { item: 'Gestión de Transacción', amount: 2500 },
      { item: 'Seguimiento Post-Venta (6 meses)', amount: 2000 }
    ]
  },
  contact: {
    name: 'Carlos Rodríguez',
    email: 'carlos@inmobiliariapremium.com',
    phone: '+1 (555) 123-4567',
    website: 'https://www.inmobiliariapremium.com'
  },
  primaryColor: '#2563eb',
  secondaryColor: '#64748b'
};

export const DEMO_BUSINESS_PROPOSAL: ProposalData = {
  title: 'Transformación Digital Empresarial',
  subtitle: 'Modernizando su Negocio para el Futuro',
  clientName: 'Roberto Silva',
  companyName: 'TechSolutions Corp.',
  date: '2024-01-15',
  executiveSummary: 'Proponemos una transformación digital integral que modernizará sus procesos empresariales, mejorará la eficiencia operacional y posicionará su empresa como líder en innovación. Nuestro enfoque combina tecnología de vanguardia con metodologías probadas para garantizar resultados medibles.',
  objectives: [
    'Digitalizar procesos críticos del negocio',
    'Implementar sistemas de gestión integrados',
    'Mejorar la experiencia del cliente',
    'Aumentar la eficiencia operacional en 40%',
    'Establecer métricas de rendimiento en tiempo real',
    'Capacitar al equipo en nuevas tecnologías'
  ],
  methodology: 'Aplicamos metodología Agile con sprints de 2 semanas, análisis de procesos actuales, diseño de soluciones personalizadas, implementación gradual y capacitación continua. Incluye auditoría tecnológica, roadmap de transformación, desarrollo de MVP y escalamiento progresivo.',
  deliverables: [
    'Auditoría tecnológica completa',
    'Roadmap de transformación digital',
    'Sistema ERP personalizado',
    'Portal de clientes y proveedores',
    'Dashboard de métricas en tiempo real',
    'Plan de capacitación del personal',
    'Documentación técnica completa',
    'Soporte técnico 24/7 por 6 meses'
  ],
  timeline: 'Fase 1: Auditoría y Planificación (4 semanas), Fase 2: Desarrollo MVP (8 semanas), Fase 3: Implementación y Testing (6 semanas), Fase 4: Capacitación y Go-Live (4 semanas). Total: 22 semanas con entregables quincenales.',
  pricing: {
    total: 85000,
    breakdown: [
      { item: 'Auditoría y Consultoría Inicial', amount: 12000 },
      { item: 'Desarrollo de Sistema ERP', amount: 35000 },
      { item: 'Portal Web y Móvil', amount: 18000 },
      { item: 'Integración de Sistemas', amount: 10000 },
      { item: 'Capacitación y Documentación', amount: 5000 },
      { item: 'Soporte Técnico (6 meses)', amount: 5000 }
    ]
  },
  contact: {
    name: 'Ana Martínez',
    email: 'ana@techsolutions.com',
    phone: '+1 (555) 987-6543',
    website: 'https://www.techsolutions.com'
  },
  primaryColor: '#059669',
  secondaryColor: '#374151'
};

export const DEMO_MARKETING_PROPOSAL: ProposalData = {
  title: 'Estrategia de Marketing Digital',
  subtitle: 'Impulsando su Marca hacia el Éxito Online',
  clientName: 'Laura Fernández',
  companyName: 'Boutique Fashion Store',
  date: '2024-01-15',
  executiveSummary: 'Desarrollamos una estrategia de marketing digital integral que posicionará su boutique de moda como referente en el mercado online. Combinamos creatividad, data analytics y tecnología para crear campañas que conecten emocionalmente con su audiencia y generen resultados medibles.',
  objectives: [
    'Aumentar el reconocimiento de marca en 60%',
    'Generar 500 leads calificados mensualmente',
    'Incrementar ventas online en 80%',
    'Mejorar engagement en redes sociales',
    'Optimizar conversión del sitio web',
    'Establecer presencia en marketplaces digitales'
  ],
  methodology: 'Utilizamos metodología Growth Hacking con enfoque en experimentación, análisis de datos y optimización continua. Incluye investigación de mercado, creación de buyer personas, desarrollo de contenido estratégico, ejecución de campañas multicanal y medición de ROI.',
  deliverables: [
    'Auditoría de marca y competencia',
    'Estrategia de contenido para 6 meses',
    'Rediseño de sitio web optimizado',
    'Campañas en Google Ads y Facebook',
    'Estrategia de redes sociales',
    'Programa de email marketing',
    'Presencia en Instagram Shopping',
    'Reportes mensuales de rendimiento'
  ],
  timeline: 'Mes 1: Auditoría y Estrategia, Mes 2-3: Desarrollo y Lanzamiento, Mes 4-6: Ejecución y Optimización. Entregables semanales con reportes de rendimiento y ajustes estratégicos.',
  pricing: {
    total: 25000,
    breakdown: [
      { item: 'Auditoría y Estrategia Digital', amount: 4000 },
      { item: 'Rediseño de Sitio Web', amount: 8000 },
      { item: 'Campañas Publicitarias (3 meses)', amount: 6000 },
      { item: 'Gestión de Redes Sociales', amount: 3000 },
      { item: 'Email Marketing y Automatización', amount: 2000 },
      { item: 'Reportes y Análisis', amount: 2000 }
    ]
  },
  contact: {
    name: 'Diego Herrera',
    email: 'diego@marketingdigital.com',
    phone: '+1 (555) 456-7890',
    website: 'https://www.marketingdigital.com'
  },
  primaryColor: '#7c3aed',
  secondaryColor: '#4b5563'
};

export const DEMO_PROPOSALS = {
  realEstate: DEMO_REAL_ESTATE_PROPOSAL,
  business: DEMO_BUSINESS_PROPOSAL,
  marketing: DEMO_MARKETING_PROPOSAL
};
