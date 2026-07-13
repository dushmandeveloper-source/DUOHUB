import { useState } from 'react';
import { Plus, Trash2, Sparkles, Pencil } from 'lucide-react';
import { confirmDialog, toast } from '../ui';

const EMOJI_CHOICES = ['✨', '✈️', '🍜', '🏖️', '🎬', '🏔️', '💍', '🎡', '🍰'];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Us({ bucketList, onAdd, onToggleDone, onEdit, onDelete, users }) {
  const [isComposing, setIsComposing] = useState(false);
  const [emoji, setEmoji] = useState('✨');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editEmoji, setEditEmoji] = useState('✨');
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditEmoji(item.emoji || '✨');
    setEditTitle(item.title);
    setEditNote(item.note || '');
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    onEdit(editingId, { emoji: editEmoji, title: editTitle.trim(), note: editNote.trim() });
    toast('Dream updated 💫');
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ emoji, title: title.trim(), note: note.trim() });
    toast('Dream added ✨');
    setTitle('');
    setNote('');
    setEmoji('✨');
    setIsComposing(false);
  };

  const handleDelete = async (item) => {
    const ok = await confirmDialog({ title: 'Delete this dream?', message: `"${item.title}" will be removed for both of you.` });
    if (ok) { onDelete(item.id); toast('Removed'); }
  };

  const nameFor = (id) => users.find(u => u.id === id)?.name || id;
  const colorFor = (id) => id === 'u1' ? 'text-blue-500 bg-blue-50' : id === 'u2' ? 'text-rose-500 bg-rose-50' : 'text-gray-500 bg-gray-100';

  const active = bucketList.filter(b => !b.done).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const done = bucketList.filter(b => b.done).sort((a, b) => new Date(b.doneAt || b.createdAt) - new Date(a.doneAt || a.createdAt));

  const renderCard = (item) => item.id === editingId ? (
    <div key={item.id} className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4">
      <form onSubmit={saveEdit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map(e => (
            <button
              type="button"
              key={e}
              onClick={() => setEditEmoji(e)}
              className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${editEmoji === e ? 'bg-rose-100 ring-2 ring-rose-400' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
        />
        <input
          type="text"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          placeholder="Add a note (optional)"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditingId(null)} className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" className="bg-rose-500 text-white rounded-xl px-5 py-2 font-medium hover:bg-rose-600 transition-colors active:scale-95 text-sm">
            Save
          </button>
        </div>
      </form>
    </div>
  ) : (
    <div key={item.id} className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${item.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'}`}>
      <button
        type="button"
        onClick={() => onToggleDone(item.id)}
        title={item.done ? 'Mark as not done' : 'Mark as done together'}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${item.done ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-300'}`}
      >
        {item.done && <span className="text-xs">✓</span>}
      </button>
      <span className="text-2xl shrink-0 leading-none mt-0.5">{item.emoji || '✨'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm md:text-base font-semibold break-words ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.title}</p>
        {item.note && <p className={`text-sm mt-0.5 break-words ${item.done ? 'text-gray-400' : 'text-gray-500'}`}>{item.note}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${colorFor(item.createdBy)}`}>added by {nameFor(item.createdBy)}</span>
          {item.done && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-md text-emerald-600 bg-emerald-50">Done together ✓ {formatDate(item.doneAt)}</span>
          )}
        </div>
      </div>
      <button onClick={() => startEdit(item)} className="text-gray-300 hover:text-gray-600 transition-colors p-1 shrink-0" title="Edit">
        <Pencil size={16} />
      </button>
      <button onClick={() => handleDelete(item)} className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0" title="Delete">
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">When we're together 💑</h1>
        <p className="text-gray-500 text-sm mt-1">Dreams and plans for when the distance is zero.</p>
      </div>

      {!isComposing ? (
        <button
          onClick={() => setIsComposing(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Plus size={16} /> Add a dream
        </button>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h3 className="text-lg font-bold mb-4">Add a Dream</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map(e => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-2xl w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${emoji === e ? 'bg-rose-100 ring-2 ring-rose-400' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the dream? (e.g. Road trip through Japan)"
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsComposing(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-rose-500 text-white rounded-xl px-6 py-2.5 font-medium hover:bg-rose-600 transition-colors active:scale-95 text-sm shrink-0 flex items-center gap-2">
                <Plus size={16} /> Add
              </button>
            </div>
          </form>
        </div>
      )}

      {bucketList.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-400 py-16">
          <Sparkles size={32} className="mb-2 opacity-30" />
          <p className="text-sm font-medium">Nothing here yet — add the first dream ✨</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map(renderCard)}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">Memories made ✨</h3>
              <div className="space-y-2">
                {done.map(renderCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
