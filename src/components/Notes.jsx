import { useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, Search, ArrowLeft, Palette } from 'lucide-react';
import { confirmDialog, toast } from '../ui';
import SelectMenu from './SelectMenu';
import RichTextEditor, { richTextStyles } from './RichTextEditor';
import DrawingCanvas from './DrawingCanvas';
import ImagePicker from './ImagePicker';
import { NOTE_COLORS } from '../lib/noteColors';
import * as db from '../lib/db';
import { isCloudEnabled } from '../lib/supabase';

const uploadImage = (file) => (isCloudEnabled ? db.uploadNoteImage(file) : Promise.resolve(URL.createObjectURL(file)));

function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || '').trim();
}

function truncate(text, max = 120) {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + '…';
}

const emptyDraft = {
  title: '',
  owner: 'shared',
  content: '',
  images: [],
  color: 'yellow',
  drawing: null,
};

// Picks a color different from the most recently created note, so
// consecutive notes don't all default to the same swatch.
function nextAutoColor(notes) {
  const last = notes[0]?.color;
  const options = last ? NOTE_COLORS.filter(c => c.id !== last) : NOTE_COLORS;
  return options[Math.floor(Math.random() * options.length)].id;
}

export default function Notes({ notes, onAdd, onEdit, onDelete, users, currentUser }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'view' | 'edit'
  const [activeNote, setActiveNote] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const [title, setTitle] = useState(emptyDraft.title);
  const [owner, setOwner] = useState(emptyDraft.owner);
  const [content, setContent] = useState(emptyDraft.content);
  const [images, setImages] = useState(emptyDraft.images);
  const [color, setColor] = useState(emptyDraft.color);
  const [drawing, setDrawing] = useState(emptyDraft.drawing);
  const [inputMode, setInputMode] = useState('write');
  const [uploadingCount, setUploadingCount] = useState(0);
  const [savingDrawing, setSavingDrawing] = useState(false);

  const openNew = () => {
    setActiveNote(null);
    setTitle(emptyDraft.title);
    setOwner(emptyDraft.owner);
    setContent(emptyDraft.content);
    setImages(emptyDraft.images);
    setColor(nextAutoColor(notes));
    setDrawing(emptyDraft.drawing);
    setInputMode('write');
    setViewMode('edit');
  };

  const loadNoteIntoDraft = (note) => {
    setActiveNote(note);
    setTitle(note.title || '');
    setOwner(note.owner || 'shared');
    setContent(note.content || '');
    setImages(note.images || []);
    setColor(note.color || 'yellow');
    setDrawing(note.drawing || null);
    setInputMode('write');
  };

  const openExisting = (note) => {
    loadNoteIntoDraft(note);
    setExpanded(false);
    setViewMode('view');
  };

  const startEditingActive = () => {
    loadNoteIntoDraft(activeNote);
    setViewMode('edit');
  };

  const backToGrid = () => {
    setViewMode('grid');
    setActiveNote(null);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && !drawing) return;

    let finalDrawing = drawing;
    if (drawing && drawing.startsWith('data:')) {
      setSavingDrawing(true);
      try {
        const blob = await fetch(drawing).then(r => r.blob());
        const file = new File([blob], 'drawing.png', { type: 'image/png' });
        finalDrawing = isCloudEnabled ? await db.uploadNoteImage(file) : URL.createObjectURL(file);
      } catch (err) {
        console.error('Drawing upload failed:', err);
        toast('Drawing upload failed', 'error');
        setSavingDrawing(false);
        return;
      }
      setSavingDrawing(false);
    }

    const payload = { title: title.trim(), owner, content, images, color, drawing: finalDrawing };

    if (activeNote) {
      onEdit(activeNote.id, payload);
      toast('Note updated');
    } else {
      onAdd(payload);
      toast('Note added');
    }
    backToGrid();
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    const hasImages = (activeNote.images || []).length > 0;
    const ok = await confirmDialog({
      title: 'Delete note?',
      message: hasImages
        ? `"${activeNote.title || 'Untitled'}" and its attached images will be removed for both of you.`
        : `"${activeNote.title || 'Untitled'}" will be removed for both of you.`,
    });
    if (!ok) return;
    onDelete(activeNote.id);
    toast('Note deleted');
    if (isCloudEnabled) {
      for (const url of activeNote.images || []) {
        db.deleteNoteImage(url);
      }
      if (activeNote.drawing) {
        db.deleteNoteImage(activeNote.drawing);
      }
    }
    backToGrid();
  };

  const filteredNotes = notes.filter(n => {
    if (ownerFilter === 'u1' && n.owner !== 'u1' && n.owner !== 'shared') return false;
    if (ownerFilter === 'u2' && n.owner !== 'u2' && n.owner !== 'shared') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = `${n.title || ''} ${stripHtml(n.content)}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (viewMode === 'view' && activeNote) {
    const plainText = stripHtml(content);
    const isLong = plainText.length > 400;
    const ownerName = owner === 'shared' ? 'Shared' : users.find(u => u.id === owner)?.name;
    return (
      <div className="space-y-5 pb-10">
        <div className="flex items-center justify-between">
          <button
            onClick={backToGrid}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 -ml-2 rounded-lg"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={startEditingActive}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1"
              title="Edit note"
            >
              <Pencil size={16} /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
              title="Delete note"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        <div className={`note-card-${color || 'yellow'} rounded-3xl shadow-sm p-5 md:p-6 space-y-4`}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-800 break-words">{title || 'Untitled'}</h2>
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-black/10 text-gray-700 shrink-0">{ownerName}</span>
          </div>

          {drawing && (
            <div className="rounded-xl overflow-hidden border border-black/10 bg-white">
              <img src={drawing} alt="Drawing" className="w-full max-h-80 object-contain" />
            </div>
          )}

          {content && (
            <div className="relative">
              <div
                className={`${richTextStyles} text-sm text-gray-700 ${!expanded && isLong ? 'max-h-40 overflow-hidden' : ''}`}
                dangerouslySetInnerHTML={{ __html: content }}
              />
              {isLong && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="text-xs font-bold text-gray-700/80 hover:text-gray-900 mt-2 underline"
                >
                  {expanded ? 'Show less' : 'View more'}
                </button>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map(url => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border border-black/10 shrink-0 block">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}

          <p className="text-[10px] text-gray-500">{formatTimestamp(activeNote.updatedAt)}</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'edit') {
    return (
      <div className="space-y-5 pb-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (activeNote ? setViewMode('view') : backToGrid())}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 -ml-2 rounded-lg"
          >
            <ArrowLeft size={18} /> {activeNote ? 'Cancel' : 'Back'}
          </button>
          {activeNote && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
              title="Delete note"
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            autoFocus
            className="w-full text-xl font-bold bg-transparent border-none border-b border-transparent focus:border-b focus:border-gray-200 focus:outline-none py-1 transition-colors"
          />

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <SelectMenu
              className="w-full md:w-48"
              value={owner}
              onChange={setOwner}
              options={[
                { value: 'shared', label: 'Shared' },
                { value: 'u1', label: users[0].name },
                { value: 'u2', label: users[1].name },
              ]}
            />
            <div className="flex items-center gap-2">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  title={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full border shrink-0 transition-all ${color === c.id ? 'ring-2 ring-offset-2 ring-indigo-500 border-white' : 'border-gray-200'}`}
                  style={{ backgroundColor: c.light }}
                />
              ))}
            </div>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1 w-full md:w-64">
            <button
              onClick={() => setInputMode('write')}
              className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${inputMode === 'write' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              Write
            </button>
            <button
              onClick={() => setInputMode('draw')}
              className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${inputMode === 'draw' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              Draw
            </button>
          </div>

          <div className={inputMode === 'write' ? '' : 'hidden'}>
            <RichTextEditor key={activeNote?.id ?? 'new'} content={content} onChange={setContent} placeholder="Write your note..." />
          </div>
          <div className={inputMode === 'draw' ? '' : 'hidden'}>
            <DrawingCanvas value={drawing} onChange={setDrawing} />
          </div>

          <ImagePicker
            images={images}
            onAdd={(url) => setImages(prev => [...prev, url])}
            onRemove={(url) => setImages(prev => prev.filter(u => u !== url))}
            uploadingCount={uploadingCount}
            setUploadingCount={setUploadingCount}
            uploadFn={uploadImage}
          />

          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              onClick={backToGrid}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={uploadingCount > 0 || savingDrawing}
              className="bg-gray-900 text-white rounded-xl px-6 py-2.5 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingDrawing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Save Note
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h3 className="text-lg font-bold">Notes</h3>
          <div className="flex bg-gray-200 rounded-xl md:rounded-full p-1 w-full md:w-auto">
            <button onClick={() => setOwnerFilter('all')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium ${ownerFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setOwnerFilter('u1')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${ownerFilter === 'u1' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{users[0].name}</button>
            <button onClick={() => setOwnerFilter('u2')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${ownerFilter === 'u2' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>{users[1].name}</button>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-white border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 text-gray-400 font-medium text-sm">
          {notes.length === 0 ? 'No notes yet — tap + to add your first one.' : 'No notes match your search.'}
        </div>
      ) : (
        <div className="[column-fill:_balance] sm:columns-2 lg:columns-3 gap-4">
          {filteredNotes.map(note => {
            const ownerName = note.owner === 'shared' ? 'Shared' : users.find(u => u.id === note.owner)?.name;
            const preview = truncate(stripHtml(note.content), 120);
            const imgs = note.images || [];
            const shownImgs = imgs.slice(0, 3);
            const overflow = imgs.length - shownImgs.length;

            return (
              <div
                key={note.id}
                onClick={() => openExisting(note)}
                className={`note-card-${note.color || 'yellow'} mb-4 break-inside-avoid rounded-3xl p-4 cursor-pointer hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-bold text-gray-800 break-words">{note.title || 'Untitled'}</span>
                  {note.drawing && <Palette size={14} className="text-gray-500 shrink-0 mt-0.5" />}
                </div>
                {preview && <p className="text-sm text-gray-700 whitespace-pre-line">{preview}</p>}
                {shownImgs.length > 0 && (
                  <div className="flex gap-1.5 mt-3">
                    {shownImgs.map(url => (
                      <div key={url} className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                        +{overflow}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-black/10 text-gray-700">{ownerName}</span>
                  <span className="text-[10px] text-gray-500">{formatTimestamp(note.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={openNew}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
        title="New note"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
