import SocialPostsEditor from '@/components/editors/SocialPostsEditor';

export default async function SocialPostsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Console log for template editor page ID
  console.log('🎯 Template Editor Page - Social Posts Editor');
  console.log('📝 Template ID:', id);
  console.log('📋 Editor Type: social');
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ SocialPostsEditorPage: Invalid template ID:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <SocialPostsEditor id={id} />;
}
