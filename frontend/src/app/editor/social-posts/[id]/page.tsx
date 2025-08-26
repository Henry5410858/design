import SocialPostsEditor from '../../../../components/editors/SocialPostsEditor';

export default async function SocialPostsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id || id === 'undefined' || id === 'null') {
    return <div>Error: Invalid template ID</div>;
  }
  
  return <SocialPostsEditor id={id} />;
}
