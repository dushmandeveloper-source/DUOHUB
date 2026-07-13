// One-tap date choices so users rarely need the calendar picker.
// variant="muted" is for form contexts (sets a single field's value) — smaller
// and quieter than the default, which is meant to stand out as a list filter.
export default function QuickDates({ value, onChange, options, variant = 'default' }) {
  const muted = variant === 'muted';
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          type="button"
          key={o.label}
          onClick={() => onChange(o.date)}
          className={
            muted
              ? `text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${value === o.date ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-transparent text-gray-400 border-gray-200 hover:border-gray-300'}`
              : `text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${value === o.date ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
