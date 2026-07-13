import { useState } from 'react';
import { X, Send } from 'lucide-react';

const QUICK_EMOJIS = ['💖', '😘', '🤗', '💋', '🌙', '☀️'];

// Small popup for sending a "thinking of you" ping to the partner: tapping
// a quick emoji sends immediately (with the typed note, if any).
export default function ThinkingOfYouModal({ partner, onSend, onClose }) {
  const [message, setMessage] = useState('');

  const handleSend = (emoji) => {
    onSend({ emoji, message: message.trim() });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-[popIn_0.15s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-800">Thinking of {partner.name}? 💌</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors p-1 shrink-0" title="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Send a little something to make {partner.name} smile.</p>

        <div className="grid grid-cols-6 gap-2 mb-5">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleSend(emoji)}
              className="text-3xl hover:scale-110 transition-transform bg-gray-50 rounded-2xl py-2 flex items-center justify-center"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a little note…"
            maxLength={120}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
          />
          <button
            onClick={() => handleSend('💖')}
            className="bg-rose-500 text-white rounded-xl px-4 py-3 font-medium hover:bg-rose-600 transition-colors active:scale-95 text-sm shrink-0 flex items-center gap-1.5"
            title="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
