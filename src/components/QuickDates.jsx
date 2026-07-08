// One-tap date choices so users rarely need the calendar picker.
export default function QuickDates({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          type="button"
          key={o.label}
          onClick={() => onChange(o.date)}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${value === o.date ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
