import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type Flyer = {
  _id?: string;
  title: string;
  previewImage: string;
  categories: string[];
  color?: string;
  content?: { type: string; value: string }[];
};

type FlyerEditorProps = {
  flyer?: Flyer | null;
  onSave?: (flyer: Partial<Flyer> & { _id?: string }) => void;
  onCancel?: () => void;
};

const BLOCK_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'heading', label: 'Heading' },
  { value: 'image', label: 'Image' },
];

async function uploadImageToS3(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('http://localhost:4000/api/templates/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.url;
}

export default function FlyerEditor({ flyer, onSave, onCancel }: FlyerEditorProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [blocks, setBlocks] = useState<{ id: number; type: string; value: string }[]>([
    { id: 1, type: 'text', value: '' },
  ]);
  const [newBlockType, setNewBlockType] = useState('text');
  const dragItem = useRef<number | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (flyer) {
      setTitle(flyer.title || '');
      setColor(flyer.color || '#ffffff');
      setImage(flyer.previewImage || null);
      setBlocks(
        flyer.content && flyer.content.length > 0
          ? flyer.content.map((block, idx) => ({ id: idx + 1, type: block.type || 'text', value: block.value }))
          : [{ id: 1, type: 'text', value: '' }]
      );
    } else {
      setTitle('');
      setColor('#ffffff');
      setImage(null);
      setImageFile(null);
      setBlocks([{ id: 1, type: 'text', value: '' }]);
    }
  }, [flyer]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadImageToS3(e.target.files[0]);
        setImage(url);
      } catch {
        alert('Image upload failed');
      }
    }
  };

  const handleBlockChange = (id: number, value: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, value } : b));
  };

  const handleBlockImageChange = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadImageToS3(e.target.files[0]);
        setBlocks(blocks.map(b => b.id === id ? { ...b, value: url } : b));
      } catch {
        alert('Image upload failed');
      }
    }
  };

  const handleAddBlock = () => {
    setBlocks([...blocks, { id: Date.now(), type: newBlockType, value: '' }]);
  };

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };

  const handleDrop = (idx: number) => {
    if (dragItem.current === null) return;
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(dragItem.current, 1);
    newBlocks.splice(idx, 0, removed);
    setBlocks(newBlocks);
    dragItem.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const previewImage = image;
    // TODO: handle real image upload if imageFile is set
    const flyerData: Partial<Flyer> & { _id?: string } = {
      _id: flyer?._id,
      title,
      previewImage: previewImage || '',
      categories: ['flyers'],
      content: blocks.map(b => ({ type: b.type, value: b.value })),
      color,
    };
    if (onSave) {
      await onSave(flyerData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit} style={{ background: color }}>
        <input
          type="text"
          placeholder="Flyer Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-12 h-12 border-none"
          title="Pick flyer background color"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {image && (
          <div className="my-2">
            <Image src={image} alt="Flyer" width={400} height={160} className="rounded" />
          </div>
        )}
        <div>
          <label className="block font-semibold mb-2">Content Blocks (drag to reorder):</label>
          <div className="flex gap-2 mb-2">
            <select value={newBlockType} onChange={e => setNewBlockType(e.target.value)} className="border rounded px-2 py-1">
              {BLOCK_TYPES.map(bt => (
                <option key={bt.value} value={bt.value}>{bt.label}</option>
              ))}
            </select>
            <button type="button" onClick={handleAddBlock} className="px-3 py-1 bg-gray-200 rounded">Add Block</button>
          </div>
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              className="mb-2 p-2 border rounded bg-white"
            >
              {block.type === 'text' && (
                <textarea
                  value={block.value}
                  onChange={e => handleBlockChange(block.id, e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  placeholder={`Text Block ${idx + 1}`}
                />
              )}
              {block.type === 'heading' && (
                <input
                  type="text"
                  value={block.value}
                  onChange={e => handleBlockChange(block.id, e.target.value)}
                  className="w-full border-b-2 border-blue-400 text-lg font-bold px-2 py-1"
                  placeholder={`Heading Block ${idx + 1}`}
                />
              )}
              {block.type === 'image' && (
                <div>
                  <input type="file" accept="image/*" onChange={e => handleBlockImageChange(block.id, e)} />
                  {block.value && (
                    <Image src={block.value} alt={`Block ${idx + 1} image`} width={300} height={120} className="rounded mt-2" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {flyer ? 'Update Flyer' : 'Save Flyer'}
          </button>
          {flyer && onCancel && (
            <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
          )}
        </div>
      </form>
      {success && (
        <div className="mt-2 text-green-700 bg-green-100 border border-green-300 rounded px-4 py-2">
          Flyer saved successfully!
        </div>
      )}
    </>
  );
}
