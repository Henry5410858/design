import DocumentsEditor from '@/components/editors/DocumentsEditor';

export default async function DocumentsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id || id === 'undefined' || id === 'null') {
    return <div>Error: Invalid template ID</div>;
  }
  
  return <DocumentsEditor id={id} />;
}
