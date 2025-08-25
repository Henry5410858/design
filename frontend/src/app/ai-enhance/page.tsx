'use client';
import { useState } from 'react';

export default function AIEnhancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Image Enhancement</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && (
        <div className="mt-4 flex gap-4">
          <div>
            <div className="font-semibold mb-2">Original</div>
            <img src={preview} alt="Original" className="h-40 rounded" />
          </div>
          <div>
            <div className="font-semibold mb-2">Enhanced (placeholder)</div>
            <div className="h-40 w-40 bg-gray-200 flex items-center justify-center rounded">AI result here</div>
          </div>
        </div>
      )}
    </div>
  );
}
