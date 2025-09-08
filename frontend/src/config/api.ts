// API Configuration
// For production, you need to deploy your backend separately and update this URL
// Options: Railway, Render, Heroku, DigitalOcean, etc.

// API Configuration for development and production
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Determine API base URL based on environment
let API_BASE_URL;
if (isDevelopment) {
  // Development: use localhost backend
  API_BASE_URL = 'http://localhost:4000';
} else if (isProduction) {
  // Production: use separate backend deployment
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turbo-enigma-backend-nutq.vercel.app';
} else {
  // Fallback
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turbo-enigma-backend-nutq.vercel.app';
}

export const API_ENDPOINTS = {
  // Auth endpoints
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  SIGNIN: `${API_BASE_URL}/api/auth/signin`,
  VALIDATE: `${API_BASE_URL}/api/auth/validate`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/auth/update-profile`,
  
  // Template endpoints
  TEMPLATES: `${API_BASE_URL}/api/templates`,
  TEMPLATE_BY_ID: (id: string) => `${API_BASE_URL}/api/templates/get?id=${id}`,
  TEMPLATE_BY_KEY: (key: string) => `${API_BASE_URL}/api/templates/by-key/${key}`,
  SAVE_DESIGN: `${API_BASE_URL}/api/templates/save-design`,
  SAVE_DESIGN_LARGE: `${API_BASE_URL}/api/templates/save-design-large`,
  GET_DESIGN: (filename: string) => `${API_BASE_URL}/api/templates/design?filename=${filename}`,
  UPLOAD_THUMBNAIL: (id: string) => `${API_BASE_URL}/api/templates/${id}/thumbnail`,
  UPLOAD_FILE: `${API_BASE_URL}/api/templates/upload-file`,
  UPLOAD_IMAGE: `${API_BASE_URL}/api/templates/upload-image`,
  UPLOAD_MULTIPLE: `${API_BASE_URL}/api/templates/upload-multiple`,
  DUPLICATE_TEMPLATE: (id: string) => `${API_BASE_URL}/api/templates/${id}/duplicate`,
  DELETE_TEMPLATE: (id: string) => `${API_BASE_URL}/api/templates/${id}`,
  DELETE_FILE: (filename: string) => `${API_BASE_URL}/api/templates/file/${filename}`,
  LIST_FILES: `${API_BASE_URL}/api/templates/files`,
  CLEANUP_ORPHANED: `${API_BASE_URL}/api/templates/cleanup-orphaned-files`,
  
  // Brand Kit endpoints
  BRAND_KIT: `${API_BASE_URL}/api/brand-kit`,
  BRAND_KIT_LOGO: `${API_BASE_URL}/api/brand-kit/logo`,
  BRAND_KIT_TEST: `${API_BASE_URL}/api/brand-kit/test`,
  BRAND_KIT_TEST_AUTH: `${API_BASE_URL}/api/brand-kit/test-auth`,
  
  // User endpoints
  USER_PLAN: `${API_BASE_URL}/api/user/plan`,
  
  // AI endpoints
  AI_TEXT: `${API_BASE_URL}/api/ai-text`,
  
  // Upload endpoints
  UPLOADS: `${API_BASE_URL}/uploads`,
  UPLOADS_FILES: `${API_BASE_URL}/uploads/files`,
  UPLOADS_IMAGES: `${API_BASE_URL}/uploads/images`,
  UPLOADS_DESIGNS: `${API_BASE_URL}/uploads/designs`,
};

export default API_ENDPOINTS;
