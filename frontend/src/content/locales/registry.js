/**
 * Central Locale Registry for 10Signal
 * Adding a new locale only requires:
 * 1. Adding the locale files under `src/content/locales/<locale>/`
 * 2. Registering the locale in this file
 * No application components require editing.
 */

import trCore from './tr/core';
import enCore from './en/core';

export const locales = {
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    direction: 'ltr',
    loadCore: () => Promise.resolve(trCore),
    loadExtended: () => import('./tr/extended.js').then((m) => m.default),
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    loadCore: () => Promise.resolve(enCore),
    loadExtended: () => import('./en/extended.js').then((m) => m.default),
  },
};

export const DEFAULT_LOCALE = 'en';
export const CANONICAL_LOCALE = 'en';

export function getSupportedLocales() {
  return Object.values(locales);
}

export function getLocaleConfig(code) {
  return locales[code] || locales[DEFAULT_LOCALE];
}

export function resolveSupportedLocale(code) {
  if (!code || typeof code !== 'string') return DEFAULT_LOCALE;
  const normalized = code.toLowerCase().split(/[-_]/)[0];
  if (locales[normalized]) return normalized;
  return DEFAULT_LOCALE;
}

export function registerLocale(code, config) {
  locales[code] = {
    code,
    name: config.name || config.label || code,
    nativeName: config.nativeName || config.label || code,
    direction: config.direction || 'ltr',
    loadCore: config.loadCore || (() => Promise.resolve({})),
    loadExtended: config.loadExtended || (() => Promise.resolve({}))
  };
}
