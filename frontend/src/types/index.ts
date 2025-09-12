// User types
export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Premium' | 'Ultra-Premium';
  avatar?: string;
}

// Template types
export interface Template {
  id: string;
  category: string;
  name: string;
  thumbnail: string;
  thumbnailFilename?: string; // PNG filename for actual template preview
  link: string;
  dimensions: string;
  description: string;
  plan: 'Free' | 'Premium' | 'Ultra-Premium';
}

// Brand kit types
export interface BrandKit {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
}

// Plan comparison
export const PLAN_LEVELS = {
  'Free': 0,
  'Premium': 1,
  'Ultra-Premium': 2
} as const;

export type PlanLevel = keyof typeof PLAN_LEVELS;

// Auth types
export interface AuthToken {
  token: string;
  expiresAt: number;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: number;
}

// Export types
export interface ExportOptions {
  format: 'PNG' | 'PDF';
  quality?: 'low' | 'medium' | 'high';
  selectedTemplates: string[];
}

// Feature gate types
export interface FeatureGateProps {
  requiredPlan: PlanLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
