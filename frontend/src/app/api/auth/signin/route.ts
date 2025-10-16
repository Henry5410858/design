import { NextRequest, NextResponse } from 'next/server';

/**
 * ⚠️ DEPRECATION NOTICE
 * 
 * This fallback route should NOT be used in production.
 * It exists only for backward compatibility during development.
 * 
 * All authentication MUST go through the backend API endpoint directly.
 * The frontend should not connect directly to the database.
 * 
 * For production deployment:
 * 1. Set NEXT_PUBLIC_API_URL to your Render backend URL
 * 2. Ensure CORS is properly configured on the backend
 * 3. Remove this file or return an error
 */

export async function POST(request: NextRequest) {
  console.error('❌ SECURITY WARNING: Frontend fallback signin route was called!');
  console.error('This route should not be used in production.');
  console.error('Ensure NEXT_PUBLIC_API_URL is set to your backend API URL.');
  
  return NextResponse.json(
    { 
      error: 'Frontend authentication is disabled in production. Please ensure backend API is accessible.',
      hint: 'Set NEXT_PUBLIC_API_URL environment variable to your backend URL'
    },
    { status: 501 } // Not Implemented
  );
}
