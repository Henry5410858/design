'use client';
import { useSearchParams } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import UnifiedEditor from '../../components/editors/UnifiedEditor';
import AppLayout from '../../components/layout/AppLayout';

export default function EditorPage() {
  const searchParams = useSearchParams();
  const editorType = searchParams.get('type') as 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document' | 'brochure' | 'square-post' | 'marketplace-flyer' | 'fb-feed-banner' | 'digital-badge' || 'flyer';
  const templateKey = searchParams.get('template') || '';
  const templateId = searchParams.get('id') || 'new';

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedEditor 
        id={templateId}
        editorType={editorType}
        templateKey={templateKey}
      />
    </div>
  );
}
