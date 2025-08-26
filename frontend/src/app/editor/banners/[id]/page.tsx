import BannersEditor from '../../../../components/editors/BannersEditor';

export default async function BannersEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id || id === 'undefined' || id === 'null') {
    return <div>Error: Invalid template ID</div>;
  }
  
  return <BannersEditor id={id} />;
}
