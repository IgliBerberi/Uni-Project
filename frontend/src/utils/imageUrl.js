const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_URL || '';

/**
 * Resolve product image for <img src> (uploads path or legacy full URL).
 */
export function productImageSrc(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/uploads/')) {
    return `${UPLOADS_BASE}${imageUrl}`;
  }
  return imageUrl;
}
