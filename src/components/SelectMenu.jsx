import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Modern dropdown to replace native <select> — same pattern as CategoryPicker.
export default function SelectMenu({ value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between gap-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="truncate">{selected?.label ?? 'Select'}</span>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-44 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-[popIn_0.12s_ease-out]">
          <div className="max-h-64 overflow-y-auto p-1">
            {options.map(o => (
              <button
                type="button"
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${o.value === value ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
