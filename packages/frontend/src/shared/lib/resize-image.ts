// shared/lib: shrink a photo in the browser before it's uploaded. Two reasons, both about the
// file that ends up public:
// - size: a phone photo is 3-10 MB; one re-encoded at this width is ~100-300 KB, which keeps
//   storage and (much more importantly) CDN bandwidth small.
// - privacy: re-drawing through a canvas drops all EXIF metadata, including the GPS position a
//   phone camera embeds. Without this, a photo taken at home would publish where the host lives.
const MAX_EDGE_PX = 1200;
const QUALITY = 0.82;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Returns a WebP (or JPEG where the browser can't encode WebP) no larger than MAX_EDGE_PX on
 *  its longest side. Throws if the browser can't decode the file (e.g. HEIC outside Safari). */
export async function resizeImageForUpload(file: File): Promise<Blob> {
  // createImageBitmap applies the EXIF orientation by default, so portrait photos stay upright.
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Some browsers (older Safari) can't encode WebP and silently hand back a PNG instead, so the
  // result's type has to be checked rather than trusted.
  const webp = await canvasToBlob(canvas, 'image/webp');
  if (webp?.type === 'image/webp') return webp;

  const jpeg = await canvasToBlob(canvas, 'image/jpeg');
  if (jpeg?.type === 'image/jpeg') return jpeg;

  throw new Error('This browser could not encode the image');
}
