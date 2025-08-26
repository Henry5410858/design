import StoriesEditor from '../../../../components/editors/StoriesEditor';

export default async function StoriesEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id || id === 'undefined' || id === 'null') {
    return <div>Error: Invalid template ID</div>;
  }
  
  return <StoriesEditor id={id} />;
}
