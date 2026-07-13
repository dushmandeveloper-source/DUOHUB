import { useRef, useEffect, useState } from 'react';
import { Eraser, Undo2, Trash2 } from 'lucide-react';
import { confirmDialog } from '../ui';

const PEN_COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed'];
const LINE_WIDTHS = [2, 5, 10];
const MAX_UNDO = 15;

function fillWhite(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export default function DrawingCanvas({ value, onChange }) {
  const [showCanvas, setShowCanvas] = useState(!value);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const undoStackRef = useRef([]);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [lineWidth, setLineWidth] = useState(LINE_WIDTHS[1]);
  const [erasing, setErasing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      // The canvas can mount while its parent is display:none (e.g. the
      // Write/Draw tab starts on "write"), which reports a 0x0 rect — skip
      // sizing until it actually has real dimensions, and retry via the
      // ResizeObserver below once the tab becomes visible.
      if (rect.width === 0 || rect.height === 0) return;
      // Once already sized to these dimensions, don't re-size (which would
      // wipe the drawing) just because the observer fired again — e.g. a
      // window resize that doesn't actually change this element's box.
      if (canvas.width === Math.round(rect.width * dpr) && canvas.height === Math.round(rect.height * dpr)) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;
      fillWhite(ctx, rect.width, rect.height);
      undoStackRef.current = [];
      setCanUndo(false);
    };

    sizeCanvas();
    const observer = new ResizeObserver(sizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [showCanvas]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushUndoSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift();
    setCanUndo(true);
  };

  const handlePointerDown = (e) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    pushUndoSnapshot();
    drawingRef.current = true;
    const { x, y } = getPos(e);
    const width = erasing ? lineWidth * 1.5 : lineWidth * (e.pressure > 0 ? (0.5 + e.pressure) : 1);
    ctx.strokeStyle = erasing ? '#ffffff' : penColor;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { x, y } = getPos(e);
    const width = erasing ? lineWidth * 1.5 : lineWidth * (e.pressure > 0 ? (0.5 + e.pressure) : 1);
    ctx.strokeStyle = erasing ? '#ffffff' : penColor;
    ctx.lineWidth = width;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const handleUndo = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || undoStackRef.current.length === 0) return;
    const snapshot = undoStackRef.current.pop();
    ctx.putImageData(snapshot, 0, 0);
    setCanUndo(undoStackRef.current.length > 0);
    onChange(canvas.toDataURL('image/png'));
  };

  const handleClear = async () => {
    const ok = await confirmDialog({
      title: 'Clear drawing?',
      message: 'This will erase everything on the canvas.',
    });
    if (!ok) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    fillWhite(ctx, canvas.width / dpr, canvas.height / dpr);
    undoStackRef.current = [];
    setCanUndo(false);
    onChange(canvas.toDataURL('image/png'));
  };

  const handleClearAndRedraw = () => {
    setShowCanvas(true);
    onChange(null);
  };

  if (!showCanvas) {
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <img src={value} alt="Drawing" className="w-full h-[300px] object-contain bg-white" />
        <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 flex justify-end">
          <button
            type="button"
            onClick={handleClearAndRedraw}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Trash2 size={14} /> Clear &amp; redraw
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-100 px-2 py-1.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 px-1">
          {PEN_COLORS.map(hex => (
            <button
              key={hex}
              type="button"
              title={hex}
              onClick={() => { setPenColor(hex); setErasing(false); }}
              className={`w-5 h-5 rounded-full border shrink-0 ${!erasing && penColor === hex ? 'ring-2 ring-indigo-500 border-white' : 'border-gray-200'}`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 px-1 border-l border-gray-200">
          {LINE_WIDTHS.map(w => (
            <button
              key={w}
              type="button"
              title={`Line width ${w}`}
              onClick={() => setLineWidth(w)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${lineWidth === w ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
            >
              <span
                className="rounded-full bg-gray-700"
                style={{ width: w, height: w }}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          title="Eraser"
          onClick={() => setErasing(e => !e)}
          className={`p-1.5 rounded-lg transition-colors ${erasing ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Eraser size={16} />
        </button>
        <button
          type="button"
          title="Undo"
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          title="Clear"
          onClick={handleClear}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ml-auto"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-[300px] touch-none block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      />
    </div>
  );
}
