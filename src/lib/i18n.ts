import { create } from "zustand";
import en from "./locales/en.json";
import kn from "./locales/kn.json";
import hi from "./locales/hi.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import ml from "./locales/ml.json";

export type Lang = "en" | "kn" | "hi" | "ta" | "te" | "ml";

export const LANGUAGES: { code: Lang; label: string; native: string; speech: string; stt: string }[] = [
  { code: "en", label: "English", native: "English", speech: "en-IN", stt: "en" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN", stt: "kn" },
  { code: "hi", label: "Hindi", native: "हिंदी", speech: "hi-IN", stt: "hi" },
  { code: "ta", label: "Tamil", native: "தமிழ்", speech: "ta-IN", stt: "ta" },
  { code: "te", label: "Telugu", native: "తెలుగు", speech: "te-IN", stt: "te" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", speech: "ml-IN", stt: "ml" },
];

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = { en, kn, hi, ta, te, ml };

const STORAGE_KEY = "atlas.lang";

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGES.some((l) => l.code === stored) ? (stored as Lang) : "en";
}

type I18nState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  hydrate: () => void;
};

export const useI18n = create<I18nState>((set) => ({
  // Always "en" on first render so SSR and hydration match; hydrate() applies
  // the stored preference right after mount.
  lang: "en",
  setLang: (lang) => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, lang);
    set({ lang });
  },
  hydrate: () => set({ lang: readStoredLang() }),
}));

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let value = DICTS[lang]?.[key] ?? (en as Dict)[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
  }
  return value;
}

export function useT() {
  const lang = useI18n((s) => s.lang);
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export function t(key: string, vars?: Record<string, string | number>) {
  return translate(useI18n.getState().lang, key, vars);
}

export function currentSpeechLang() {
  const lang = useI18n.getState().lang;
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]!;
}
