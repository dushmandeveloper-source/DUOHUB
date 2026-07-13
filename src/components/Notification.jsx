import { Bell, X } from 'lucide-react';

// When rendered standalone, positions itself fixed top-center. When rendered
// inside a stacking container (stacked=true), the parent handles positioning
// and this just fills the row.
export default function Notification({ notification, onClose, stacked = false }) {
  if (!notification) return null;
  return (
    <div className={`${stacked ? 'relative w-full' : 'fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm'} z-[100] bg-white border-l-4 border-amber-500 shadow-2xl rounded-xl p-4 pr-12 animate-[slideDown_0.3s_ease-out]`}>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        <div className="bg-amber-100 text-amber-600 p-2 rounded-full shrink-0">
          <Bell size={20} />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-sm md:text-base">{notification.title}</h4>
          <p className="text-xs md:text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>
      </div>
    </div>
  );
}
