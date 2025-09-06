import StoriesEditor from '@/components/editors/StoriesEditor';

export default async function StoriesEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Console log for template editor page ID
  console.log('🎯 Template Editor Page - Stories Editor');
  console.log('📝 Template ID:', id);
  console.log('📋 Editor Type: story');
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ StoriesEditorPage: Invalid template ID:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <StoriesEditor id={id} />;
}
