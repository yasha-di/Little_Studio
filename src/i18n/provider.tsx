import * as React from "react";

import { storageKeys } from "@/core/constants";

import {
  I18nContext,
  translate,
  translateCount,
  type I18n,
  type Locale,
  type MessageKey,
  type TranslateParams,
} from "./context";

function readStoredLocale(): Locale {
  try {
    return window.localStorage.getItem(storageKeys.language) === "ru" ? "ru" : "en";
  } catch {
    return "en";
  }
}

/**
 * Owns the active locale: restores the stored choice on launch, persists
 * changes, and keeps `<html lang>` in sync for assistive technology.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(readStoredLocale);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(storageKeys.language, next);
    } catch {
      // Storage unavailable — the choice still applies for this session.
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = React.useMemo<I18n>(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey, params?: TranslateParams) => translate(locale, key, params),
      tCount: (base: string, count: number, params?: TranslateParams) =>
        translateCount(locale, base, count, params),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
