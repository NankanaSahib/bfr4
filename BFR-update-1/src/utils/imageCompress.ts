/**
 * Phone photos are often 4-12 MB. Uploading them over mobile data is slow and makes the
 * AI take longer, so large photos are shrunk (still ~3000 px, plenty for Urdu text) before sending.
 * Returns null when no change is needed (PDFs, small images) or if anything goes wrong.
 */
const MIN_BYTES_TO_SHRINK = 1.2 * 1024 * 1024;
const MAX_SIDE = 3000;

export async function shrinkImageIfLarge(
  file: File,
  mimeType: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    if (!mimeType.startsWith("image/") || file.size < MIN_BYTES_TO_SHRINK) return null;

    let width = 0;
    let height = 0;
    let source: CanvasImageSource;
    let cleanup = () => {};

    if (typeof createImageBitmap === "function") {
      const bmp = await createImageBitmap(file);
      width = bmp.width;
      height = bmp.height;
      source = bmp;
      cleanup = () => bmp.close();
    } else {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image load failed"));
        img.src = url;
      });
      width = img.naturalWidth;
      height = img.naturalHeight;
      source = img;
      cleanup = () => URL.revokeObjectURL(url);
    }

    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      cleanup();
      return null;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    cleanup();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    const base64 = dataUrl.split(",")[1];
    if (!base64 || base64.length * 0.75 >= file.size) return null; // not smaller: keep original
    return { base64, mimeType: "image/jpeg" };
  } catch {
    return null;
  }
}
