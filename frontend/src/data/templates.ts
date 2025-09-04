import { Template } from '@/types';

export const templatesData: Template[] = [
  // POST TEMPLATES
  {
    id: 'post-1',
    name: 'Post Profesional',
    description: 'Diseño optimizado para redes sociales con elementos modernos',
    category: 'post',
    dimensions: '1080×1080',
    plan: 'Free',
    link: 'https://www.canva.com/design/DAGxdbkH-eU/0mHiegMMx_daysssT71OHA/edit?ui=eyJEIjp7IlEiOnsiQSI6dHJ1ZX19fQ',
    thumbnail: '/api/templates/post-1/thumbnail.png'
  },
  {
    id: 'post-2',
    name: 'Post Creativo',
    description: 'Plantilla versátil para contenido de marketing digital',
    category: 'post',
    dimensions: '1080×1080',
    plan: 'Premium',
    link: 'https://www.canva.com/design/DAGxdcrPvo8/l4SoWSoiWEDB96vcuFaYiw/edit?ui=eyJEIjp7IlEiOnsiQSI6dHJ1ZX19fQ',
    thumbnail: '/api/templates/post-2/thumbnail.png'
  },

  // STORY TEMPLATES
  {
    id: 'story-1',
    name: 'Story Impactante',
    description: 'Diseño vertical optimizado para Instagram y Facebook Stories',
    category: 'story',
    dimensions: '1080×1920',
    plan: 'Free',
    link: 'https://www.canva.com/design/DAGxdSZO4eo/_4ZG6SFuZthazYyP50DVFg/edit?ui=eyJEIjp7IlEiOnsiQSI6dHJ1ZX19fQ',
    thumbnail: '/api/templates/story-1/thumbnail.png'
  },
  {
    id: 'story-2',
    name: 'Story Profesional',
    description: 'Plantilla elegante para historias corporativas',
    category: 'story',
    dimensions: '1080×1920',
    plan: 'Premium',
    link: 'https://www.canva.com/design/DAGxdfuWuGk/xeVnIsK0SJ-HxtgbhS_1Vw/edit?ui=eyJEIjp7IlEiOnsiQSI6dHJ1ZX19fQ',
    thumbnail: '/api/templates/story-2/thumbnail.png'
  },

  // FLYER TEMPLATES
  {
    id: 'flyer-1',
    name: 'Flyer Clásico',
    description: 'Diseño tradicional para eventos y promociones',
    category: 'flyer',
    dimensions: '210×297',
    plan: 'Free',
    link: 'https://www.canva.com/design/DAGxdbRtp84/BQguFbAvqWdiorVNzA7Geg/edit',
    thumbnail: '/api/templates/flyer-1/thumbnail.png'
  },
  {
    id: 'flyer-2',
    name: 'Flyer Moderno',
    description: 'Plantilla contemporánea con elementos visuales atractivos',
    category: 'flyer',
    dimensions: '210×297',
    plan: 'Premium',
    link: 'https://www.canva.com/design/DAGxdko4uls/5HqQf0ytSvyxw-ipbragTg/edit?ui=eyJEIjp7IlEiOnsiQSI6dHJ1ZX19fQ',
    thumbnail: '/api/templates/flyer-2/thumbnail.png'
  },

  // BANNER TEMPLATES
  {
    id: 'banner-1',
    name: 'Banner Web',
    description: 'Diseño optimizado para sitios web y landing pages',
    category: 'banner',
    dimensions: '1200×628',
    plan: 'Free',
    link: 'https://www.canva.com/design/DAGxdhfSWIw/R_DlhmK4Chs54SVnMfUW1g/edit',
    thumbnail: '/api/templates/banner-1/thumbnail.png'
  },
  {
    id: 'banner-2',
    name: 'Banner Promocional',
    description: 'Plantilla llamativa para campañas publicitarias',
    category: 'banner',
    dimensions: '1200×628',
    plan: 'Premium',
    link: 'https://www.canva.com/design/DAGxdooAZzo/ha0vJgUnXhoZz60kYCwMQ/edit',
    thumbnail: '/api/templates/banner-2/thumbnail.png'
  },

  // DIGITAL BADGE TEMPLATES
  {
    id: 'badge-1',
    name: 'Digital Badge',
    description: 'Insignia digital profesional para certificaciones',
    category: 'badge',
    dimensions: '1080×1350',
    plan: 'Premium',
    link: 'https://www.canva.com/design/DAGxYvR7hSE/yMsvz0ZhYYNnGq1RteSMBQ/edit',
    thumbnail: '/api/templates/badge-1/thumbnail.png'
  },
  {
    id: 'badge-2',
    name: 'Visual Card',
    description: 'Tarjeta visual para presentaciones profesionales',
    category: 'badge',
    dimensions: '1080×1350',
    plan: 'Ultra-Premium',
    link: 'https://www.canva.com/design/DAGxY89PGpE/fLdIOIwzFgtmk0fURknlsA/edit',
    thumbnail: '/api/templates/badge-2/thumbnail.png'
  },

  // BROCHURE TEMPLATES
  {
    id: 'brochure-1',
    name: 'Brochure Simple',
    description: 'Folleto de una página para información básica - A4 (2480×3508 px, 300 dpi)',
    category: 'brochure',
    dimensions: '2480×3508',
    plan: 'Premium',
    link: 'https://www.canva.com/design/DAGxYwoU2Ug/8tbsPHPa_KtxP4DI7xe5WA/edit',
    thumbnail: '/api/templates/brochure-1/thumbnail.png'
  },
  {
    id: 'brochure-2',
    name: 'Documento Profesional',
    description: 'Plantilla elegante para documentos corporativos - A4 (2480×3508 px, 300 dpi)',
    category: 'brochure',
    dimensions: '2480×3508',
    plan: 'Ultra-Premium',
    link: 'https://www.canva.com/design/DAGxYzQ57GU/QfU9hr25Ux_Kk3YxA529pQ/edit',
    thumbnail: '/api/templates/badge-2/thumbnail.png'
  }
];

export default templatesData;
