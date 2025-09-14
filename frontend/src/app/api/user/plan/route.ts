import { NextRequest, NextResponse } from 'next/server';

// This route should be statically generated
export const dynamic = 'auto';

// Mock user plans - in a real app, this would come from a database
// These represent actual user subscription plans, not template-based plans
const mockUserPlans: Record<string, 'Gratis' | 'Premium' | 'Ultra-Premium'> = {
  // Free tier users
  'user1': 'Gratis',
  'john_doe': 'Gratis',
  'jane_smith': 'Gratis',
  
  // Premium tier users
  'user2': 'Premium',
  'designer_pro': 'Premium',
  'marketing_team': 'Premium',
  'freelancer_123': 'Premium',
  
  // Ultra-Premium tier users
  'user3': 'Ultra-Premium',
  'agency_corp': 'Ultra-Premium',
  'big_company': 'Ultra-Premium',
  'creative_studio': 'Ultra-Premium',
  
  // Default fallback
  'default': 'Gratis'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const templateId = searchParams.get('templateId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // In a real app, you would:
    // 1. Validate the user's authentication token from cookies/headers
    // 2. Query the database for the user's subscription plan
    // 3. Check if the user has access to the specific template (if provided)
    
    // For now, we'll use mock data based on user ID
    // In production, this would come from your user database
    let userPlan: 'Gratis' | 'Premium' | 'Ultra-Premium' = 'Gratis';
    
    // Check by user ID - this is the user's actual subscription plan
    userPlan = mockUserPlans[userId] || mockUserPlans['default'];
    
    // Note: templateId is now only used for access control, not plan determination
    // The user's plan is their subscription level, regardless of which template they're editing

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      plan: userPlan,
      userId: userId || 'unknown',
      templateId: templateId || 'unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user plan' },
      { status: 500 }
    );
  }
}
