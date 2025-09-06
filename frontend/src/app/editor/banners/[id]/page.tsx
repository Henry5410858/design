import BannersEditor from '@/components/editors/BannersEditor';

export default async function BannersEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Console log for template editor page ID
  console.log('🎯 Template Editor Page - Banners Editor');
  console.log('📝 Template ID:', id);
  console.log('📋 Editor Type: banner');
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server-side');
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ BannersEditorPage: Invalid template ID:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <BannersEditor id={id} />;
}
