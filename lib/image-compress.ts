// Client-side Canvas image resizer & compressor for crisp, ultra-fast profile avatars (~35-80 KB).
// Prevents Next.js 1MB Server Action body crashes even when users pick 8MB+ phone camera photos.

export interface CompressedAvatar {
  blob: Blob;
  dataUrl: string;
  contentType: string;
}

export async function compressAvatarImage(
  file: File,
  maxDimension = 512,
  quality = 0.82
): Promise<CompressedAvatar> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
      el.src = objectUrl;
    });

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.max(1, Math.round((height * maxDimension) / width));
        width = maxDimension;
      } else {
        width = Math.max(1, Math.round((width * maxDimension) / height));
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('تعذر تهيئة معالج الصور في المتصفح.');
    }

    // Fill light neutral background for transparent PNGs converted to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const contentType = 'image/jpeg';
    const dataUrl = canvas.toDataURL(contentType, quality);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('تعذر ضغط الصورة.'));
        },
        contentType,
        quality
      );
    });

    return { blob, dataUrl, contentType };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
