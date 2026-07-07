export function NavItem({ icon, label, active, onClick, color }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${active ? `bg-gray-100 ${color} shadow-sm border border-gray-200` : 'text-gray-500 hover:bg-gray-50'}`}>
      {icon}<span>{label}</span>
    </button>
  );
}

export function MobileNavItem({ icon, label, active, onClick, color }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-[20%] gap-1 transition-all ${active ? color : 'text-gray-400'}`}>
      <div className={`p-1.5 rounded-full ${active ? 'bg-gray-100 scale-110' : ''}`}>{icon}</div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
