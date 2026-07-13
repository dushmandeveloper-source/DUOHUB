// Client-side image compression before upload. Produces a single
// medium-high quality JPEG that's used both as the small grid thumbnail
// (via CSS sizing) and as the "full size" view — good enough to look
// crisp at any normal viewing size while being much lighter than a raw
// 12MP phone photo.

const SKIP_COMPRESSION_BYTES = 300 * 1024; // already small enough

function loadBitmapViaImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ image: img, width: img.naturalWidth, height: img.naturalHeight, revoke: () => URL.revokeObjectURL(url) });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export async function compressImage(file, { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = {}) {
  if (!file || file.size <= SKIP_COMPRESSION_BYTES) {
    return file;
  }

  let source = null;
  let width = 0;
  let height = 0;
  let cleanup = () => {};

  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      source = bitmap;
      width = bitmap.width;
      height = bitmap.height;
      cleanup = () => bitmap.close();
    } else {
      const { image, width: w, height: h, revoke } = await loadBitmapViaImageElement(file);
      source = image;
      width = w;
      height = h;
      cleanup = revoke;
    }

    let targetWidth = width;
    let targetHeight = height;
    const scale = Math.min(1, maxWidth / width, maxHeight / height); // never upscale
    if (scale < 1) {
      targetWidth = Math.round(width * scale);
      targetHeight = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), 'image/jpeg', quality);
    });

    const baseName = file.name.replace(/\.[^./\\]+$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch (err) {
    console.error('Image compression failed, using original file:', err);
    return file;
  } finally {
    cleanup();
  }
}
