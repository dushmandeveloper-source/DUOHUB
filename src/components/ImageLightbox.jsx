import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function distance(touches) {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// Full-screen popup viewer for one or more images: keyboard/on-screen
// prev-next navigation, a bottom thumbnail strip for jumping directly to one,
// pinch-to-zoom (touch) and wheel/button zoom (desktop), and download.
export default function ImageLightbox({ images, index, onClose, onIndexChange }) {
  const hasMultiple = images.length > 1;
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });
  const panRef = useRef({ active: false, startX: 0, startY: 0, startOffset: { x: 0, y: 0 } });

  const resetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const goPrev = () => { resetZoom(); onIndexChange((index - 1 + images.length) % images.length); };
  const goNext = () => { resetZoom(); onIndexChange((index + 1) % images.length); };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (hasMultiple && e.key === 'ArrowLeft') goPrev();
      if (hasMultiple && e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length]);

  if (index == null || !images[index]) return null;

  const zoomIn = () => setScale(s => Math.min(MAX_SCALE, s + 0.5));
  const zoomOut = () => setScale(s => {
    const next = Math.max(MIN_SCALE, s - 0.5);
    if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
    return next;
  });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchRef.current = { active: true, startDist: distance(e.touches), startScale: scale };
    } else if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      panRef.current = { active: true, startX: t.clientX, startY: t.clientY, startOffset: offset };
    }
  };

  const handleTouchMove = (e) => {
    if (pinchRef.current.active && e.touches.length === 2) {
      e.preventDefault();
      const ratio = distance(e.touches) / pinchRef.current.startDist;
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchRef.current.startScale * ratio)));
    } else if (panRef.current.active && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      setOffset({
        x: panRef.current.startOffset.x + (t.clientX - panRef.current.startX),
        y: panRef.current.startOffset.y + (t.clientY - panRef.current.startY),
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) pinchRef.current.active = false;
    if (e.touches.length < 1) panRef.current.active = false;
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = images[index];
    a.download = '';
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10" onClick={(e) => e.stopPropagation()}>
        {hasMultiple ? (
          <span className="text-xs font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
            {index + 1} / {images.length}
          </span>
        ) : <span />}
        <div className="flex items-center gap-1.5">
          <button onClick={zoomOut} disabled={scale <= MIN_SCALE} className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors p-2 rounded-full" title="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button onClick={zoomIn} disabled={scale >= MAX_SCALE} className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors p-2 rounded-full" title="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button onClick={handleDownload} className="text-white/70 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-full" title="Download">
            <Download size={18} />
          </button>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 transition-colors p-2 rounded-full" title="Close">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image stage */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden px-4">
        {hasMultiple && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="hidden sm:flex absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white hover:bg-white/10 transition-colors p-2.5 bg-white/5 rounded-full"
            title="Previous image"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <img
          key={images[index]}
          src={images[index]}
          alt=""
          className="max-w-full max-h-[75vh] object-contain rounded-lg select-none animate-[popIn_0.15s_ease-out]"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: pinchRef.current.active || panRef.current.active ? 'none' : 'transform 0.15s ease-out',
            touchAction: 'none',
            cursor: scale > 1 ? 'grab' : 'default',
          }}
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={(e) => { e.stopPropagation(); scale > 1 ? resetZoom() : setScale(2); }}
          draggable={false}
        />

        {hasMultiple && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="hidden sm:flex absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white hover:bg-white/10 transition-colors p-2.5 bg-white/5 rounded-full"
            title="Next image"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Bottom thumbnail strip */}
      {hasMultiple && (
        <div
          className="w-full max-w-md overflow-x-auto flex gap-2 px-4 pb-6 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => { resetZoom(); onIndexChange(i); }}
              className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === index ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
