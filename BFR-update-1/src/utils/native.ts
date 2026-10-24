/** True when running inside the Android app (Capacitor WebView). */
export const isNativeApp = (): boolean => {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

/** Letters/digits/underscore only - safe for Android file names and share sheets. */
export const asciiFileName = (base: string, fallback = "Evidence"): string => {
  const cleaned = (base || "").replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return cleaned || fallback;
};

/**
 * Android: save a PDF (base64, no data: prefix) to the app cache and open the system
 * share sheet so the user can save it to Files/Drive, print it, or send it on WhatsApp.
 */
export async function savePdfOnAndroid(base64Pdf: string, fileName: string): Promise<void> {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  await Filesystem.writeFile({ path: fileName, data: base64Pdf, directory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
  try {
    await Share.share({
      title: fileName,
      url: uri,
      dialogTitle: "Save or share the court PDF",
    });
  } catch (err: any) {
    // Closing the share sheet without choosing anything is not an error.
    if (!/cancel/i.test(String(err?.message || err))) throw err;
  }
}
