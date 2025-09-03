'use client';
import { useState, useRef } from 'react';
import { 
  ArrowsOutCardinal, 
  FloppyDisk, 
  Download, 
  TextT, 
  Image as ImageIcon, 
  Square 
} from 'phosphor-react';
interface DocumentsEditorProps {
  id: string;
}

export default function DocumentsEditor({ id }: DocumentsEditorProps) {
  const [canvasSize, setCanvasSize] = useState('1200x1600'); // Document size
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [objects, setObjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const canvasSizes = [
    { value: '1200x1600', label: 'Documento A4 (1200×1600)', width: 1200, height: 1600 },
    { value: '1200x1800', label: 'Brochure (1200×1800)', width: 1200, height: 1800 },
    { value: '800x1200', label: 'Documento Pequeño (800×1200)', width: 800, height: 1200 }
  ];

  const getCurrentCanvasSize = () => {
    const size = canvasSizes.find(s => s.value === canvasSize);
    return size || { width: 1200, height: 1600 };
  };

  const addText = () => {
    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Tu texto aquí',
      x: 100,
      y: 100,
      fontSize: 48,
      color: '#000000',
      fontFamily: 'Arial'
    };
    setObjects([...objects, newText]);
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: `image-${Date.now()}`,
            type: 'image',
            src: e.target?.result,
            x: 100,
            y: 100,
            width: 200,
            height: 200
          };
          setObjects([...objects, newImage]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addShape = () => {
    const newShape = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shape: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      color: '#3b82f6'
    };
    setObjects([...objects, newShape]);
  };

  const addImagePlaceholder = () => {
    const newPlaceholder = {
      id: `placeholder-${Date.now()}`,
      type: 'placeholder',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      color: '#e5e7eb'
    };
    setObjects([...objects, newPlaceholder]);
  };

  const renderObject = (obj: any) => {
    switch (obj.type) {
      case 'text':
        return (
          <div
            key={obj.id}
            className="absolute cursor-move select-none"
            style={{
              left: obj.x,
              top: obj.y,
              fontSize: obj.fontSize,
              color: obj.color,
              fontFamily: obj.fontFamily
            }}
            onClick={() => setSelectedId(obj.id)}
          >
            {obj.content}
          </div>
        );
      case 'image':
        return (
          <img
            key={obj.id}
            src={obj.src}
            alt=""
            className="absolute cursor-move"
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height
            }}
            onClick={() => setSelectedId(obj.id)}
          />
        );
      case 'shape':
        return (
          <div
            key={obj.id}
            className="absolute cursor-move"
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height,
              backgroundColor: obj.color
            }}
            onClick={() => setSelectedId(obj.id)}
          />
        );
      case 'placeholder':
        return (
          <div
            key={obj.id}
            className="absolute cursor-move border-2 border-dashed border-gray-400 flex items-center justify-center"
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height,
              backgroundColor: obj.color
            }}
            onClick={() => setSelectedId(obj.id)}
          >
            <span className="text-gray-500 text-sm">Image Placeholder</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editor de Documentos</h1>
              <p className="text-gray-600">Template ID: {id}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <ArrowsOutCardinal size={4} className="w-4 h-4 inline mr-2" />
                Deshacer
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <ArrowsOutCardinal size={4} className="w-4 h-4 inline mr-2" />
                Rehacer
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FloppyDisk size={4} className="w-4 h-4 inline mr-2" />
                Guardar
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download size={4} className="w-4 h-4 inline mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Tools Row */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Herramientas</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Canvas Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño</label>
              <select
                value={canvasSize}
                onChange={(e) => setCanvasSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {canvasSizes.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fondo</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuente</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onChange={(e) => {
                  const selectedFont = e.target.value;
                  if (selectedId) {
                    setObjects(objects.map(obj => 
                      obj.id === selectedId && obj.type === 'text' 
                        ? { ...obj, fontFamily: selectedFont }
                        : obj
                    ));
                  }
                }}
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Lucida Console">Lucida Console</option>
              </select>
            </div>

            {/* Add Text */}
            <div>
              <button
                onClick={addText}
                className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <TextT size={4} className="w-4 h-4" />
                Texto
              </button>
            </div>

            {/* Add Image */}
            <div>
              <button
                onClick={addImage}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
              >
                <ImageIcon size={4} className="w-4 h-4" />
                Imagen
              </button>
            </div>

            {/* Add Shape */}
            <div>
              <button
                onClick={addShape}
                className="w-full flex items-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <Square size={4} className="w-4 h-4" />
                Forma
              </button>
            </div>

            {/* Add Image Placeholder */}
            <div>
              <button
                onClick={addImagePlaceholder}
                className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                <ImageIcon size={4} className="w-4 h-4" />
                Placeholder
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvas del Documento</h3>
          
          <div className="flex justify-center">
            <div
              ref={canvasRef}
              className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg w-full"
              style={{
                aspectRatio: `${getCurrentCanvasSize().width} / ${getCurrentCanvasSize().height}`,
                background: backgroundColor
              }}
            >
              {objects.map(renderObject)}
              
              {objects.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-lg font-medium">¡Comienza a crear tu documento!</p>
                    <p className="text-sm">Usa las herramientas para agregar elementos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
