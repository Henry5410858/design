// SquarePost Templates (1080×1080)
export { SquarePostTemplate1, SquarePostTemplate2 } from './SquarePost';

// Story Templates (1080×1920)
export { StoryTemplate1, StoryTemplate2 } from './Story';

// Flyer Templates (A4/1200×1500)
export { FlyerTemplate1, FlyerTemplate2 } from './Flyer';

// Banner Templates (1200×628)
export { BannerTemplate1, BannerTemplate2 } from './Banner';

// Badge Templates (800×800)
export { BadgeTemplate1, BadgeTemplate2 } from './Badge';

// Brochure Templates (A4/1200×1500)
export { BrochureTemplate1, BrochureTemplate2 } from './Brochure';

// Template Types
export interface TemplateProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  logo?: string;
  ctaText?: string;
}

// Template Categories
export const TEMPLATE_CATEGORIES = {
  SQUARE_POST: 'SquarePost',
  STORY: 'Story',
  FLYER: 'Flyer',
  BANNER: 'Banner',
  BADGE: 'Badge',
  BROCHURE: 'Brochure'
} as const;

// Template Dimensions
export const TEMPLATE_DIMENSIONS = {
  SQUARE_POST: { width: 1080, height: 1080 },
  STORY: { width: 1080, height: 1920 },
  FLYER: { width: 1200, height: 1500 },
  BANNER: { width: 1200, height: 628 },
  BADGE: { width: 800, height: 800 },
  BROCHURE: { width: 1200, height: 1500 }
} as const;
