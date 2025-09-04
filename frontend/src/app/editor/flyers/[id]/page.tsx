import FlyersEditor from '@/components/editors/FlyersEditor';

export default async function FlyersEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id || id === 'undefined' || id === 'null') {
    return <div>Error: Invalid template ID</div>;
  }
  
  return <FlyersEditor id={id} />;
}
