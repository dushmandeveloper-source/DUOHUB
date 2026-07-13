function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function NavItem({ icon, label, active, onClick, color, badge }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${active ? `bg-gray-100 ${color} shadow-sm border border-gray-200` : 'text-gray-500 hover:bg-gray-50'}`}>
      <span className="relative inline-block">{icon}<Badge count={badge} /></span><span>{label}</span>
    </button>
  );
}

export function MobileNavItem({ icon, label, active, onClick, color, badge }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-all min-w-0 ${active ? color : 'text-gray-400'}`}>
      <div className={`relative inline-block p-1 rounded-full ${active ? 'bg-gray-100 scale-110' : ''}`}>{icon}<Badge count={badge} /></div>
      <span className="text-[9px] font-bold truncate max-w-full">{label}</span>
    </button>
  );
}
