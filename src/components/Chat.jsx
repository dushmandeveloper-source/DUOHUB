import { useEffect, useRef, useState } from 'react';
import { Smile, Sticker, ImagePlus, Send, Trash2, Reply, Copy, X } from 'lucide-react';
import ImageLightbox from './ImageLightbox';
import { compressImage } from '../lib/imageCompression';
import { confirmDialog, toast } from '../ui';
import * as db from '../lib/db';

const EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😉', '😎', '🤩', '🥳', '😢', '😭', '😡', '😱', '🥺',
  '😴', '🤔', '🙄', '😅', '😇', '🤗', '🤭', '🤫', '🫡', '🤤', '😋', '🙃', '😜', '🤪', '😏', '🥴',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖', '💗', '💓', '💞', '💘', '💝', '💌',
  '👍', '👎', '👏', '🙌', '🙏', '🤝', '👋', '✌️', '🤙', '💪', '🍕', '🍔', '🍩', '🍫', '✈️', '🌙',
];

const STICKERS = [
  '😘', '😍', '🥰', '😙', '🤗', '🫂', '💏', '💑', '❤️', '💖', '💘', '💝', '💕', '💞', '💓', '💗',
  '🌹', '🌺', '🌻', '💐', '🧸', '🎀', '🍫', '🍓', '🥺', '😢', '😭', '😤', '😂', '🤣', '🌙', '✨',
];

function bubbleColor(userId) {
  return userId === 'u1' ? 'bg-blue-500' : 'bg-rose-500';
}

function formatDateSeparator(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(messages) {
  const groups = [];
  let currentKey = null;
  let currentGroup = null;
  for (const m of messages) {
    const key = new Date(m.createdAt).toDateString();
    if (key !== currentKey) {
      currentKey = key;
      currentGroup = { key, label: formatDateSeparator(m.createdAt), items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(m);
  }
  return groups;
}

function messagePreview(m) {
  if (!m) return 'Original message was deleted';
  if (m.kind === 'image') return `📷 Photo${m.body ? ` · ${m.body}` : ''}`;
  if (m.kind === 'video') return '🎥 Video';
  return m.body || '';
}

// Long-press (touch) or right-click opens the message action menu.
function usePressActions(onAction) {
  const timer = useRef(null);
  return {
    onTouchStart: () => { timer.current = setTimeout(onAction, 450); },
    onTouchEnd: () => clearTimeout(timer.current),
    onTouchMove: () => clearTimeout(timer.current),
    onContextMenu: (e) => { e.preventDefault(); onAction(); },
  };
}

function QuoteBlock({ quoted, isOwn, nameOf, onJumpTo }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (quoted) onJumpTo(quoted.id); }}
      className={`w-full text-left mb-1 px-2.5 py-1.5 rounded-lg border-l-2 ${isOwn ? 'bg-white/20 border-white/60' : 'bg-white border-gray-300'}`}
    >
      <span className={`block text-[11px] font-bold ${isOwn ? 'text-white/90' : 'text-gray-600'}`}>
        {quoted ? nameOf(quoted.sender) : ''}
      </span>
      <span className={`block text-xs truncate ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
        {messagePreview(quoted)}
      </span>
    </button>
  );
}

function MessageBubble({ msg, isOwn, personColor, onOpenImage, onAction, quoted, nameOf, onJumpTo }) {
  const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const press = usePressActions(() => onAction(msg));

  if (msg.kind === 'sticker') {
    return (
      <div id={`msg-${msg.id}`} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <span className="text-7xl leading-none select-none cursor-pointer" {...press}>{msg.body}</span>
        <MessageMeta time={time} isOwn={isOwn} seen={msg.seen} />
      </div>
    );
  }

  return (
    <div id={`msg-${msg.id}`} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[85%] min-w-0 select-none md:select-text ${msg.kind === 'text' ? 'px-3.5 py-2' : 'p-1.5'} rounded-2xl ${isOwn ? `${personColor} text-white rounded-br-md` : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}
        {...press}
      >
        {msg.replyTo != null && <QuoteBlock quoted={quoted} isOwn={isOwn} nameOf={nameOf} onJumpTo={onJumpTo} />}
        {msg.kind === 'text' && (
          <p className="whitespace-pre-wrap break-words text-sm">{msg.body}</p>
        )}
        {msg.kind === 'image' && (
          <>
            <img
              src={msg.mediaUrl}
              alt=""
              className="max-h-64 max-w-full rounded-xl object-cover cursor-pointer"
              onClick={() => onOpenImage(msg.mediaUrl)}
            />
            {msg.body && <p className="whitespace-pre-wrap break-words text-sm mt-1.5 px-1">{msg.body}</p>}
          </>
        )}
        {msg.kind === 'video' && (
          <video controls playsInline className="max-h-64 max-w-full rounded-xl" src={msg.mediaUrl} />
        )}
      </div>
      <MessageMeta time={time} isOwn={isOwn} seen={msg.seen} />
    </div>
  );
}

function MessageMeta({ time, isOwn, seen }) {
  return (
    <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-gray-400">
      <span>{time}</span>
      {isOwn && <span className={seen ? 'text-sky-500' : 'text-gray-400'}>{seen ? '✓✓' : '✓'}</span>}
    </div>
  );
}

export default function Chat({ messages, currentUser, partnerUser, partnerOnline, onSend, onDelete, onMarkSeen }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const pickerRef = useRef(null);
  const prevCountRef = useRef(0);
  const wasNearBottomRef = useRef(true);

  const personColor = bubbleColor(currentUser.id);

  useEffect(() => {
    onMarkSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onMarkSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const grew = messages.length > prevCountRef.current;
    const lastMsg = messages[messages.length - 1];
    const isOwnNew = grew && lastMsg && lastMsg.sender === currentUser.id;
    if (prevCountRef.current === 0 || wasNearBottomRef.current || isOwnNew) {
      bottomRef.current?.scrollIntoView({ behavior: prevCountRef.current === 0 ? 'auto' : 'smooth' });
    }
    prevCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    wasNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    if (!showEmoji && !showStickers) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowEmoji(false);
        setShowStickers(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmoji, showStickers]);

  const appendEmoji = (emoji) => {
    setText(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const pickSticker = (emoji) => {
    onSend({ kind: 'sticker', body: emoji, replyTo: replyTo?.id });
    setReplyTo(null);
    setShowStickers(false);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || uploading) return;
    onSend({ kind: 'text', body: trimmed, replyTo: replyTo?.id });
    setText('');
    setReplyTo(null);
    setShowEmoji(false);
    setShowStickers(false);
  };

  const msgById = {};
  for (const m of messages) msgById[m.id] = m;
  const nameOf = (id) => (id === currentUser.id ? 'You' : partnerUser.name);
  const jumpTo = (id) => document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    const lineHeight = 20;
    el.style.height = Math.min(el.scrollHeight, lineHeight * 4 + 16) + 'px';
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setUploading(true);
    try {
      if (isVideo) {
        if (file.size > 25 * 1024 * 1024) {
          toast('Video too big — keep it under 25 MB 🙈', 'error');
          setUploading(false);
          return;
        }
        const ext = (file.name.split('.').pop() || file.type.split('/')[1] || 'mp4').toLowerCase();
        const url = await db.uploadChatMedia(file, ext);
        onSend({ kind: 'video', mediaUrl: url, body: text.trim() || undefined, replyTo: replyTo?.id });
      } else {
        const compressed = await compressImage(file);
        const url = await db.uploadChatMedia(compressed, 'jpg');
        onSend({ kind: 'image', mediaUrl: url, body: text.trim() || undefined, replyTo: replyTo?.id });
      }
      setText('');
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      toast(err.message || 'Could not send that.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmDialog({ title: 'Delete message?', message: 'This will remove it for both of you.', confirmLabel: 'Delete' });
    if (ok) onDelete(id);
  };

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 shrink-0 mb-3">
        {partnerUser.avatarUrl ? (
          <img src={partnerUser.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${bubbleColor(partnerUser.id)}`}>
            {partnerUser.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">{partnerUser.name}</p>
          <p className={`text-xs font-medium ${partnerOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
            {partnerOnline ? 'online 💚' : 'offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-2">
            <span className="text-5xl">💬</span>
            <p className="font-medium">Say hi to {partnerUser.name} 👋</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {groups.map(group => (
              <div key={group.key} className="flex flex-col gap-3">
                <div className="flex justify-center">
                  <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">{group.label}</span>
                </div>
                {group.items.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.sender === currentUser.id}
                    personColor={personColor}
                    onOpenImage={setLightboxUrl}
                    onAction={setActionMsg}
                    quoted={msg.replyTo != null ? msgById[msg.replyTo] : null}
                    nameOf={nameOf}
                    onJumpTo={jumpTo}
                  />
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="relative shrink-0 pt-3">
        {(showEmoji || showStickers) && (
          <div ref={pickerRef} className="absolute bottom-full mb-2 left-0 right-0 md:right-auto md:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 p-2 max-h-56 overflow-y-auto">
            {showEmoji && (
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((emoji, i) => (
                  <button key={i} onClick={() => appendEmoji(emoji)} className="text-xl hover:bg-gray-100 rounded-lg p-1">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            {showStickers && (
              <div className="grid grid-cols-8 gap-1">
                {STICKERS.map((emoji, i) => (
                  <button key={i} onClick={() => pickSticker(emoji)} className="text-4xl hover:bg-gray-100 rounded-lg p-1">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {replyTo && (
          <div className="flex items-center gap-2 mb-2 bg-white border border-gray-100 shadow-sm rounded-2xl px-3 py-2">
            <div className={`w-1 self-stretch rounded-full shrink-0 ${bubbleColor(replyTo.sender)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-600">Replying to {nameOf(replyTo.sender)}</p>
              <p className="text-xs text-gray-400 truncate">{messagePreview(replyTo)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0" title="Cancel reply">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1.5 bg-white rounded-3xl shadow-sm border border-gray-100 p-2">
          <button
            onClick={() => { setShowEmoji(v => !v); setShowStickers(false); }}
            className={`p-2 rounded-full transition-colors shrink-0 ${showEmoji ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            title="Emoji"
          >
            <Smile size={20} />
          </button>
          <button
            onClick={() => { setShowStickers(v => !v); setShowEmoji(false); }}
            className={`p-2 rounded-full transition-colors shrink-0 ${showStickers ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            title="Stickers"
          >
            <Sticker size={20} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors shrink-0 disabled:opacity-40"
            title="Photo or video"
          >
            <ImagePlus size={20} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleFileChange} />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? 'Sending…' : 'Type a message'}
            disabled={uploading}
            rows={1}
            className="flex-1 resize-none bg-gray-50 rounded-2xl px-3.5 py-2.5 text-sm outline-none max-h-[96px] leading-5 disabled:opacity-60"
          />

          <button
            onClick={handleSend}
            disabled={uploading || !text.trim()}
            className={`p-2.5 rounded-full text-white transition-all active:scale-95 shrink-0 disabled:opacity-40 ${personColor}`}
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
        {uploading && <p className="text-xs text-gray-400 mt-1 px-2">Sending…</p>}
      </div>

      {actionMsg && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setActionMsg(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-2 animate-[popIn_0.15s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-gray-400 px-4 pt-2 pb-1 truncate">{messagePreview(actionMsg)}</p>
            <button
              onClick={() => { setReplyTo(actionMsg); setActionMsg(null); textareaRef.current?.focus(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <Reply size={18} className="text-gray-400" /> Reply
            </button>
            {actionMsg.kind === 'text' && actionMsg.body && (
              <button
                onClick={() => { navigator.clipboard?.writeText(actionMsg.body); toast('Copied'); setActionMsg(null); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                <Copy size={18} className="text-gray-400" /> Copy
              </button>
            )}
            {actionMsg.sender === currentUser.id && (
              <button
                onClick={() => { const id = actionMsg.id; setActionMsg(null); handleDelete(id); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-50 transition-colors text-sm font-medium text-red-500"
              >
                <Trash2 size={18} /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      {lightboxUrl && (
        <ImageLightbox images={[lightboxUrl]} index={0} onClose={() => setLightboxUrl(null)} onIndexChange={() => {}} />
      )}
    </div>
  );
}
