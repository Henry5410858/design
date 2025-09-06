import TemplateEditor from '../../../components/templates/TemplateEditor';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Console log for template editor page ID
  console.log('🎯 Template Editor Page - Main Editor (by ID)');
  console.log('📝 Template ID:', id);
  console.log('📋 Editor Type: template');
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  console.log('🔍 EditorPage: Received params:', { id });
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ EditorPage: Invalid ID in params:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <TemplateEditor id={id} />;
}
