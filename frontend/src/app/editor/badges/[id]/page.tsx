import BadgesEditor from '@/components/editors/BadgesEditor';

export default async function BadgesEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Console log for template editor page ID
  console.log('🎯 Template Editor Page - Badges Editor');
  console.log('📝 Template ID:', id);
  console.log('📋 Editor Type: badge');
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ BadgesEditorPage: Invalid template ID:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <BadgesEditor id={id} />;
}
