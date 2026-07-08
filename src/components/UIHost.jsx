import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { bindUI } from '../ui';

const TOAST_STYLES = {
  success: { bg: 'bg-emerald-600', Icon: CheckCircle2 },
  error: { bg: 'bg-red-500', Icon: AlertCircle },
  info: { bg: 'bg-gray-800', Icon: Info },
};

export default function UIHost() {
  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => bindUI(
    setConfirmState,
    (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    }
  ), []);

  const close = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <>
      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => close(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-[popIn_0.15s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{confirmState.title || 'Are you sure?'}</h3>
            <p className="text-sm text-gray-500 mb-6 break-words">{confirmState.message}</p>
            <div className="flex gap-3">
              <button onClick={() => close(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={() => close(true)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                {confirmState.confirmLabel || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[210] flex flex-col items-end gap-2 w-[90%] max-w-xs pointer-events-none">
        {toasts.map(t => {
          const { bg, Icon } = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          return (
            <div key={t.id} className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white animate-[toastIn_0.2s_ease-out] ${bg}`}>
              <Icon size={17} className="shrink-0" />
              <span className="break-words">{t.message}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
