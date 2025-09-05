/**
 * API utility functions for handling backend requests
 */

// Get the API base URL from environment variables or default to localhost for development
export const getApiBaseUrl = (): string => {
  // In production (Vercel), use the environment variable
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.vercel.app';
  }
  
  // In development, use localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

// Create a full API URL
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Common API request headers
export const getApiHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API request function
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> => {
  const url = createApiUrl(endpoint);
  const headers = {
    ...getApiHeaders(token),
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

// Specific API functions for common endpoints
export const api = {
  // Templates
  getTemplates: (token?: string) => apiRequest('api/templates', { method: 'GET' }, token),
  getTemplate: (id: string, token?: string) => apiRequest(`api/templates/${id}`, { method: 'GET' }, token),
  getTemplateByKey: (key: string, token?: string) => apiRequest(`api/templates/by-key/${key}`, { method: 'GET' }, token),
  createTemplate: (data: any, token?: string) => apiRequest('api/templates', { method: 'POST', body: JSON.stringify(data) }, token),
  updateTemplate: (id: string, data: any, token?: string) => apiRequest(`api/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deleteTemplate: (id: string, token?: string) => apiRequest(`api/templates/${id}`, { method: 'DELETE' }, token),
  duplicateTemplate: (id: string, token?: string) => apiRequest(`api/templates/${id}/duplicate`, { method: 'POST' }, token),
  
  // Template designs
  getTemplateDesign: (filename: string, token?: string) => apiRequest(`api/templates/design/${filename}`, { method: 'GET' }, token),
  saveTemplateDesign: (data: any, token?: string) => apiRequest('api/templates/save-design', { method: 'POST', body: JSON.stringify(data) }, token),
  
  // Brand Kit
  getBrandKit: (token?: string) => apiRequest('api/brand-kit', { method: 'GET' }, token),
  saveBrandKit: (data: any, token?: string) => apiRequest('api/brand-kit', { method: 'POST', body: JSON.stringify(data) }, token),
  getBrandKitLogo: (token?: string) => apiRequest('api/brand-kit/logo', { method: 'GET' }, token),
  uploadBrandKitLogo: (formData: FormData, token?: string) => {
    const url = createApiUrl('api/brand-kit/upload-logo');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { method: 'POST', body: formData, headers });
  },
  
  // File uploads
  uploadFile: (formData: FormData, token?: string) => {
    const url = createApiUrl('api/templates/upload');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { method: 'POST', body: formData, headers });
  },
};
