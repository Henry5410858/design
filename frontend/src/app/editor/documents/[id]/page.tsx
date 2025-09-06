import DocumentsEditor from '@/components/editors/DocumentsEditor';

export default async function DocumentsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Console log for template editor page ID
  console.log('🎯 Template Editor Page - Documents Editor');
  console.log('📝 Template ID:', id);
  console.log('📋 Editor Type: document');
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ DocumentsEditorPage: Invalid template ID:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <DocumentsEditor id={id} />;
}
