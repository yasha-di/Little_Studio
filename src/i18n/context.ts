import * as React from "react";

import { en, type MessageKey } from "./messages/en";
import { ru } from "./messages/ru";

/**
 * Minimal, dependency-free i18n. English is the reference dictionary;
 * translations are typed against its keys. Adding a language = one new
 * dictionary file + one entry in `dictionaries` and `localeNames`.
 */

export type Locale = "en" | "ru";

export const LOCALES: readonly Locale[] = ["en", "ru"];

/** Native language names for the selector — deliberately never translated. */
export const localeNames: Record<Locale, string> = { en: "English", ru: "Русский" };

const dictionaries: Record<Locale, Record<string, string | undefined>> = { en, ru };

export type TranslateParams = Record<string, string | number>;
/** Translate a key, interpolating `{param}` placeholders. */
export type Translate = (key: MessageKey, params?: TranslateParams) => string;
/** Translate a plural family (`base.one` / `.few` / `.many` / `.other`). */
export type TranslateCount = (base: string, count: number, params?: TranslateParams) => string;

export function formatMessage(template: string, params?: TranslateParams): string {
  if (params === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
}

export function translate(locale: Locale, key: MessageKey, params?: TranslateParams): string {
  return formatMessage(dictionaries[locale][key] ?? en[key], params);
}

const pluralRules: Record<Locale, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  ru: new Intl.PluralRules("ru"),
};

export function translateCount(
  locale: Locale,
  base: string,
  count: number,
  params?: TranslateParams,
): string {
  const dict = dictionaries[locale];
  const category = pluralRules[locale].select(count);
  const template = dict[`${base}.${category}`] ?? dict[`${base}.other`] ?? base;
  return formatMessage(template, { count, ...params });
}

export interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  tCount: TranslateCount;
}

export const I18nContext = React.createContext<I18n | null>(null);

export function useI18n(): I18n {
  const context = React.useContext(I18nContext);
  if (context === null) throw new Error("useI18n must be used inside <I18nProvider>.");
  return context;
}

/** For primitives that may render outside the provider (falls back to null). */
export function useMaybeI18n(): I18n | null {
  return React.useContext(I18nContext);
}

/** The everyday hook: just the translate function. */
export function useT(): Translate {
  return useI18n().t;
}

export { type MessageKey };
