import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, PenTool } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SignaturePad({ onSave, onClear }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawed, setHasDrawed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#3e2723'; // coffee-900
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle high DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support touch events
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawed(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawed(false);
    if (onClear) onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawed) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <PenTool size={16} className="text-coffee-600" />
          {t('report.signature_title')}
        </span>
        {hasDrawed && (
          <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded flex items-center gap-1">
            <Check size={12} /> Tergambar
          </span>
        )}
      </div>

      <div className="relative border border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 h-48 cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block"
        />
        {!hasDrawed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
            <p className="text-sm">{t('report.sign_prompt')}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={clearCanvas}
          disabled={!hasDrawed}
          className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Trash2 size={14} />
          {t('report.clear_btn')}
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={!hasDrawed}
          className="flex items-center gap-1 px-4 py-2 bg-coffee-800 text-white rounded-xl text-sm font-medium hover:bg-coffee-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
        >
          {t('report.sign_btn')}
        </button>
      </div>
    </div>
  );
}
