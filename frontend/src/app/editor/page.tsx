'use client';
import { useSearchParams } from 'next/navigation';

// Force dynamic rendering for this page
export const dynamic = 'auto';
import UnifiedEditor from '../../components/editors/UnifiedEditor';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function EditorPage() {
  const searchParams = useSearchParams();
  const editorType = searchParams.get('type') as 'flyer' | 'social' | 'story' | 'badge' | 'banner' | 'document' | 'brochure' || 'flyer';
  const templateKey = searchParams.get('template') || '';
  const templateId = searchParams.get('id') || 'new';

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Editor de Diseños
            </h1>
            <p className="mt-2 text-gray-600">
              {templateKey ? `Editando: ${templateKey}` : 'Creando nuevo diseño'}
            </p>
          </div>
          
          <UnifiedEditor 
            id={templateId}
            editorType={editorType}
            templateKey={templateKey}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
