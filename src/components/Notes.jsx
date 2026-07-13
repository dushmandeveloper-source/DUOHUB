import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, ImagePlus, Loader2 } from 'lucide-react';
import { confirmDialog, toast } from '../ui';
import SelectMenu from './SelectMenu';
import RichTextEditor, { richTextStyles } from './RichTextEditor';
import * as db from '../lib/db';
import { isCloudEnabled } from '../lib/supabase';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function ImagePicker({ images, onAdd, onRemove, uploadingCount, setUploadingCount }) {
  const fileInputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast(`${file.name} is not an image`, 'error');
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast(`${file.name} is larger than 5MB`, 'error');
        continue;
      }
      setUploadingCount(c => c + 1);
      try {
        const url = isCloudEnabled ? await db.uploadNoteImage(file) : URL.createObjectURL(file);
        onAdd(url);
      } catch (err) {
        console.error('Image upload failed:', err);
        toast('Image upload failed', 'error');
      } finally {
        setUploadingCount(c => c - 1);
      }
    }
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadingCount > 0}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploadingCount > 0 ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {uploadingCount > 0 ? 'Uploading…' : 'Add Image'}
      </button>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {images.map((url) => (
            <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                title="Remove image"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function Notes({ notes, onAdd, onEdit, onDelete, users, currentUser }) {
  const [ownerFilter, setOwnerFilter] = useState(currentUser.id);
  const [isComposing, setIsComposing] = useState(false);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftOwner, setDraftOwner] = useState('shared');
  const [draftContent, setDraftContent] = useState('');
  const [draftImages, setDraftImages] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOwner, setEditOwner] = useState('shared');
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [editUploadingCount, setEditUploadingCount] = useState(0);

  useEffect(() => {
    setOwnerFilter(currentUser.id);
  }, [currentUser.id]);

  const resetDraft = () => {
    setDraftTitle('');
    setDraftOwner('shared');
    setDraftContent('');
    setDraftImages([]);
    setIsComposing(false);
  };

  const handleSave = () => {
    if (!draftTitle.trim() && !draftContent.trim()) return;
    onAdd({ title: draftTitle.trim(), owner: draftOwner, content: draftContent, images: draftImages });
    toast('Note added');
    resetDraft();
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditOwner(note.owner);
    setEditContent(note.content);
    setEditImages(note.images || []);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id) => {
    onEdit(id, { title: editTitle.trim(), owner: editOwner, content: editContent, images: editImages });
    toast('Note updated');
    setEditingId(null);
  };

  const handleDelete = async (note) => {
    const hasImages = (note.images || []).length > 0;
    const ok = await confirmDialog({
      title: 'Delete note?',
      message: hasImages
        ? `"${note.title || 'Untitled'}" and its attached images will be removed for both of you.`
        : `"${note.title || 'Untitled'}" will be removed for both of you.`,
    });
    if (!ok) return;
    onDelete(note.id);
    toast('Note deleted');
    if (isCloudEnabled) {
      for (const url of note.images || []) {
        db.deleteNoteImage(url);
      }
    }
  };

  const filteredNotes = notes.filter(n => {
    if (ownerFilter === 'u1' && n.owner !== 'u1' && n.owner !== 'shared') return false;
    if (ownerFilter === 'u2' && n.owner !== 'u2' && n.owner !== 'shared') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="text-lg font-bold mb-4">Add Note</h3>
        {!isComposing ? (
          <button
            onClick={() => setIsComposing(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Plus size={16} /> Write a new note
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Note title..."
                autoFocus
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <SelectMenu
                className="w-full md:w-40 shrink-0"
                value={draftOwner}
                onChange={setDraftOwner}
                options={[
                  { value: 'shared', label: 'Shared' },
                  { value: 'u1', label: users[0].name },
                  { value: 'u2', label: users[1].name },
                ]}
              />
            </div>
            <RichTextEditor content={draftContent} onChange={setDraftContent} placeholder="Write your note..." />
            <ImagePicker
              images={draftImages}
              onAdd={(url) => setDraftImages(prev => [...prev, url])}
              onRemove={(url) => setDraftImages(prev => prev.filter(u => u !== url))}
              uploadingCount={uploadingCount}
              setUploadingCount={setUploadingCount}
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={resetDraft}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploadingCount > 0}
                className="bg-gray-900 text-white rounded-xl px-6 py-2.5 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} /> Save Note
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold">Notes</h3>
          <div className="flex bg-gray-200 rounded-xl md:rounded-full p-1 w-full md:w-auto">
            <button onClick={() => setOwnerFilter('all')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium ${ownerFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setOwnerFilter('u1')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${ownerFilter === 'u1' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{users[0].name}</button>
            <button onClick={() => setOwnerFilter('u2')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${ownerFilter === 'u2' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>{users[1].name}</button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotes.map(note => {
            const ownerName = note.owner === 'shared' ? 'Shared' : users.find(u => u.id === note.owner)?.name;
            const ownerColor = note.owner === 'u1' ? 'text-blue-500 bg-blue-50' : note.owner === 'u2' ? 'text-rose-500 bg-rose-50' : 'text-gray-500 bg-gray-100';

            if (editingId === note.id) {
              return (
                <div key={note.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <SelectMenu
                      className="w-full md:w-40 shrink-0"
                      value={editOwner}
                      onChange={setEditOwner}
                      options={[
                        { value: 'shared', label: 'Shared' },
                        { value: 'u1', label: users[0].name },
                        { value: 'u2', label: users[1].name },
                      ]}
                    />
                  </div>
                  <RichTextEditor key={note.id} content={editContent} onChange={setEditContent} placeholder="Write your note..." />
                  <ImagePicker
                    images={editImages}
                    onAdd={(url) => setEditImages(prev => [...prev, url])}
                    onRemove={(url) => setEditImages(prev => prev.filter(u => u !== url))}
                    uploadingCount={editUploadingCount}
                    setUploadingCount={setEditUploadingCount}
                  />
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => saveEdit(note.id)} disabled={editUploadingCount > 0} className="text-gray-300 hover:text-green-500 transition-colors p-1 disabled:opacity-50" title="Save note">
                      <Check size={18} />
                    </button>
                    <button onClick={cancelEdit} className="text-gray-300 hover:text-gray-500 transition-colors p-1" title="Cancel edit">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={note.id} className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 shadow-sm p-4 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-gray-800 break-words">{note.title || 'Untitled'}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${ownerColor}`}>{ownerName}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(note)} className="text-gray-300 hover:text-blue-500 transition-colors p-1" title="Edit note">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(note)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Delete note">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className={`${richTextStyles} text-sm text-gray-600 mt-2`} dangerouslySetInnerHTML={{ __html: note.content }} />
                {note.images && note.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {note.images.map(url => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 block">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-3">{formatTimestamp(note.updatedAt)}</p>
              </div>
            );
          })}
          {filteredNotes.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-medium text-sm">No notes yet — add your first one above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
