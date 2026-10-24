import { GoogleGenAI } from "@google/genai";
import { analyzeFirWithGemini } from "./firAnalysis";

/**
 * Two modes:
 *  - Server mode (browser / Windows desktop): talks to the local Express server (/api/...).
 *  - Standalone mode (Android app, built with `vite build --mode android`): there is no server,
 *    so the API key lives in this device's storage and Gemini is called straight from the app.
 */
declare const __STANDALONE__: boolean;
export const STANDALONE: boolean = typeof __STANDALONE__ !== "undefined" && __STANDALONE__;

const KEY_STORAGE = "bfr.geminiApiKey";

export interface SettingsInfo {
  hasApiKey: boolean;
  keyHint: string;
}

const hintFor = (key: string) => (key ? `\u2022\u2022\u2022\u2022${key.slice(-4)}` : "");

const readLocalKey = (): string => {
  try {
    return (localStorage.getItem(KEY_STORAGE) || "").trim();
  } catch {
    return "";
  }
};

export function cleanApiKey(raw: string): string {
  const key = (raw || "").trim().replace(/^["']|["']$/g, "");
  if (key.length < 20 || /\s/.test(key)) {
    throw new Error("That does not look like a valid Gemini API key.");
  }
  return key;
}

export async function getSettings(): Promise<SettingsInfo> {
  if (STANDALONE) {
    const key = readLocalKey();
    return { hasApiKey: !!key, keyHint: hintFor(key) };
  }
  const res = await fetch("/api/settings");
  const json = await res.json();
  return { hasApiKey: !!json.hasApiKey, keyHint: json.keyHint || "" };
}

export async function saveApiKey(raw: string): Promise<void> {
  if (STANDALONE) {
    const key = cleanApiKey(raw);
    try {
      localStorage.setItem(KEY_STORAGE, key);
    } catch {
      throw new Error("Could not save the API key on this device.");
    }
    return;
  }
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: raw }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Could not save the API key.");
}

export async function removeApiKey(): Promise<void> {
  if (STANDALONE) {
    try {
      localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* ignore */
    }
    return;
  }
  const res = await fetch("/api/settings", { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Could not remove the API key.");
  }
}

const ANALYZE_TIMEOUT_MS = 180_000;

/** Reads the FIR with Gemini. Returns the raw extracted fields (caller proofreads them). */
export function analyzeFir(fileData: string, mimeType: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            "Reading the FIR took longer than 3 minutes. Check your internet connection, then try again (a clearer, smaller photo or a shorter PDF also helps)."
          )
        ),
      ANALYZE_TIMEOUT_MS
    );
    analyzeFirInner(fileData, mimeType).then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

async function analyzeFirInner(fileData: string, mimeType: string): Promise<any> {
  if (STANDALONE) {
    const apiKey = readLocalKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not set. Tap the "API Key" button at the top and paste your key.');
    }
    const ai = new GoogleGenAI({ apiKey });
    return analyzeFirWithGemini(ai, fileData, mimeType);
  }

  const response = await fetch("/api/analyze-fir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileData, mimeType }),
  });
  if (!response.ok) {
    const errRes = await response.json().catch(() => ({}));
    throw new Error(errRes.error || "Failed to analyze the document.");
  }
  return response.json();
}
