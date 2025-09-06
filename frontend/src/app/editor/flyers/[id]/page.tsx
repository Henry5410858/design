import FlyersEditor from '@/components/editors/FlyersEditor';

export default async function FlyersEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Console log for template editor page ID
  console.log('🎯 Template Editor Page - Flyers Editor');
  console.log('📝 Template ID:', id);
  console.log('📋 Editor Type: flyer');
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ FlyersEditorPage: Invalid template ID:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <FlyersEditor id={id} />;
}
