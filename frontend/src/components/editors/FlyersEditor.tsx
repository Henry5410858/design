'use client';
import { useState, useRef } from 'react';
import { FiImage, FiType, FiSquare, FiDownload, FiSave, FiUndo, FiRedo } from 'react-icons/fi';

interface FlyersEditorProps {
  id: string;
}

export default function FlyersEditor({ id }: FlyersEditorProps) {
  const [canvasSize, setCanvasSize] = useState('1200x800'); // Flyer size
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [objects, setObjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const canvasSizes = [
    { value: '1200x800', label: 'Flyer Estándar (1200×800)', width: 1200, height: 800 },
    { value: '1200x600', label: 'Flyer Ancho (1200×600)', width: 1200, height: 600 },
    { value: '800x1200', label: 'Flyer Vertical (800×1200)', width: 800, height: 1200 }
  ];

  const getCurrentCanvasSize = () => {
    const size = canvasSizes.find(s => s.value === canvasSize);
    return size || { width: 1200, height: 800 };
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
      fontFamily: 'Inter'
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
              <h1 className="text-2xl font-bold text-gray-900">Editor de Flyers</h1>
              <p className="text-gray-600">Template ID: {id}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <FiUndo className="w-4 h-4 inline mr-2" />
                Deshacer
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <FiRedo className="w-4 h-4 inline mr-2" />
                Rehacer
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FiSave className="w-4 h-4 inline mr-2" />
                Guardar
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <FiDownload className="w-4 h-4 inline mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Herramientas para Flyers</h3>
            
            {/* Canvas Size */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño del Flyer</label>
              <select
                value={canvasSize}
                onChange={(e) => setCanvasSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {canvasSizes.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>

            {/* Background Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Color de Fondo</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {/* Add Elements */}
            <div className="space-y-3">
              <button
                onClick={addText}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FiType className="w-5 h-5" />
                Agregar Texto
              </button>
              <button
                onClick={addImage}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FiImage className="w-5 h-5" />
                Agregar Imagen
              </button>
              <button
                onClick={addShape}
                className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <FiSquare className="w-5 h-5" />
                Agregar Forma
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvas del Flyer</h3>
            
            <div className="flex justify-center">
              <div
                ref={canvasRef}
                className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg"
                style={{
                  width: getCurrentCanvasSize().width / 3,
                  height: getCurrentCanvasSize().height / 3,
                  background: backgroundColor
                }}
              >
                {objects.map(renderObject)}
                
                {objects.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-lg font-medium">¡Comienza a crear tu flyer!</p>
                      <p className="text-sm">Usa las herramientas para agregar elementos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
