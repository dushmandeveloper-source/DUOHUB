import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// Custom dropdown with icons and search — native <select> can't render icons.
export default function CategoryPicker({ categories, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = categories.find(c => c.id === value);
  const SelectedIcon = selected?.icon;
  const filtered = categories.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const groups = [
    { label: 'Everyday', items: filtered.filter(c => c.type === 'Variable') },
    { label: 'Fixed Bills', items: filtered.filter(c => c.type === 'Fixed') },
  ];

  const choose = (id) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="flex items-center gap-2 truncate text-gray-700">
          {SelectedIcon && <SelectedIcon size={16} className="text-gray-500 shrink-0" />}
          <span className="truncate">{selected?.name || 'Select category'}</span>
        </span>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0 ml-1" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full text-sm focus:outline-none bg-transparent py-1"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {groups.map(group => group.items.length > 0 && (
              <div key={group.label}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">{group.label}</p>
                {group.items.map(c => {
                  const Icon = c.icon;
                  const active = c.id === value;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => choose(c.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${active ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Icon size={16} className={`shrink-0 ${active ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No matching category</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
