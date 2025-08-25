import TemplateEditor from '../../../components/templates/TemplateEditor';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('🔍 EditorPage: Received params:', { id });
  
  if (!id || id === 'undefined' || id === 'null') {
    console.error('❌ EditorPage: Invalid ID in params:', id);
    return <div>Error: Invalid template ID</div>;
  }
  
  return <TemplateEditor id={id} />;
}
