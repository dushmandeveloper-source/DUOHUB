import { useRef } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from '../ui';
import { compressImage } from '../lib/imageCompression';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Shared image-attachment control used by both Notes and Todos: a button
// that opens a file picker, compresses each selected image client-side,
// uploads it via `uploadFn`, then reports the resulting URL via `onAdd`.
// Renders a small thumbnail grid below with hover-to-remove.
export default function ImagePicker({ images, onAdd, onRemove, uploadingCount, setUploadingCount, uploadFn }) {
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
        const compressed = await compressImage(file);
        const url = await uploadFn(compressed);
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
