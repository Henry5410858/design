import BadgesEditor from '../../../../components/editors/BadgesEditor';

export default async function BadgesEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id || id === 'undefined' || id === 'null') {
    return <div>Error: Invalid template ID</div>;
  }
  
  return <BadgesEditor id={id} />;
}
