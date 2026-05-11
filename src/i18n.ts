import en from "./locales/en.json";
import es from "./locales/es.json";

type Lang = "en" | "es";

const dictionaries: Record<Lang, Record<string, unknown>> = {
  en,
  es
};

function getInitialLang(): Lang {
  if (typeof navigator === "undefined" || !navigator.language) return "es";
  const normalized = navigator.language.toLowerCase();
  return normalized.startsWith("en") ? "en" : "es";
}

let currentLang: Lang = getInitialLang();

export function setLanguage(lang: Lang) {
  currentLang = lang;
}

export function getLanguage(): Lang {
  return currentLang;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = dictionaries[currentLang] ?? dictionaries.es;
  const parts = key.split(".");

  let value: unknown = dict;
  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value !== "string") return key;

  if (!vars) return value;

  // Reemplazo simple de interpolación: `{{var}}`
  return value.replace(/{{\s*([^}]+)\s*}}/g, (_match, varName: string) => {
    const v = vars[varName];
    return v === undefined ? "" : String(v);
  });
}

