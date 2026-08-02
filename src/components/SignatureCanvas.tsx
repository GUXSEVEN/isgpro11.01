import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, X, PenTool, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface SignatureCanvasProps {
  onConfirm: (signatureDataUrl: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  signerName?: string;
  confirmButtonText?: string;
  strokeColor?: string;
}

export default function SignatureCanvas({
  onConfirm,
  onClose,
  title = "Islak İmza Onayı",
  subtitle = "Lütfen sözleşmeleri onaylamak için aşağıdaki alana imzanızı çiziniz.",
  signerName,
  confirmButtonText = "İmzala ve Ödemeye Geç",
  strokeColor = "#1d4ed8" // Royal Ink Blue
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set high resolution canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [strokeColor]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) {
      // Prevent screen scrolling while drawing on mobile
      if (e.cancelable) e.preventDefault();
    }
    const pos = getCoordinates(e);
    setIsDrawing(true);
    lastPosRef.current = pos;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const currentPos = getCoordinates(e);

    if (ctx && lastPosRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      lastPosRef.current = currentPos;
      if (!hasSignature) {
        setHasSignature(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    // Export as transparent PNG so signature sits seamlessly on PDF background like seller signature
    const dataUrl = canvas.toDataURL('image/png');
    try {
      localStorage.setItem('isg_user_signature', dataUrl);
    } catch (e) {
      console.warn('Could not save signature to localStorage:', e);
    }
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 text-left">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="text-indigo-600 dark:text-indigo-400" size={18} />
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {signerName && (
            <div className="flex items-center justify-between text-xs bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl px-3.5 py-2.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">İmzalayan Kişi:</span>
              <span className="font-extrabold text-indigo-900 dark:text-indigo-200">{signerName}</span>
            </div>
          )}

          {/* Signature Box */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">İmza Alanı (Fare veya Dokunmatik İle Çiziniz)</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Temizle
              </button>
            </div>

            <div className="relative bg-white border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 sm:h-48 cursor-crosshair block bg-transparent"
              />

              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400/60 dark:text-slate-500/60 gap-1 select-none">
                  <PenTool size={28} className="stroke-[1.5]" />
                  <span className="text-xs font-semibold">İmzanızı buraya atınız</span>
                </div>
              )}

              {/* Watermark / Line for signature */}
              <div className="absolute bottom-6 left-6 right-6 border-b border-slate-200 dark:border-slate-700/50 pointer-events-none flex items-center justify-between text-[10px] text-slate-300 dark:text-slate-600 font-mono">
                <span>X ____________________________</span>
                <span>Dijital Islak İmza</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <p>
              Çizilen bu dijital imza, 5070 Sayılı Elektronik İmza Kanunu ve 6502 Sayılı Tüketicinin Korunması Hakkında Kanun gereğince tarafınıza ait sözleşme PDF nüshalarına aktarılacak ve saklanacaktır.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={!hasSignature}
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              hasSignature
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
            }`}
          >
            <CheckCircle size={14} />
            {confirmButtonText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
