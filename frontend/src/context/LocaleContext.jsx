import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { locales, DEFAULT_LOCALE, CANONICAL_LOCALE, getSupportedLocales, resolveSupportedLocale } from '../content/locales/registry';
import trCore from '../content/locales/tr/core';
import enCore from '../content/locales/en/core';
import { updateOwnerLocale } from '../services/api';

const LocaleContext = createContext(null);

// In-memory cache for loaded core and extended resources
const resourceCache = {
  core: { tr: trCore, en: enCore },
  extended: {}
};

export { DEFAULT_LOCALE, CANONICAL_LOCALE };

/**
 * Detect primary preferred browser language.
 * Only if the primary language is Turkish (e.g. 'tr', 'tr-TR', 'tr-CY') returns 'tr'.
 * All other languages (en, de, fr, es, etc.) or invalid/empty return 'en'.
 */
export function detectBrowserPrimaryLocale(nav = (typeof navigator !== 'undefined' ? navigator : null)) {
  if (!nav) return CANONICAL_LOCALE;
  let primary = '';
  if (Array.isArray(nav.languages) && nav.languages.length > 0) {
    primary = nav.languages[0];
  } else if (typeof nav.language === 'string') {
    primary = nav.language;
  }
  if (!primary || typeof primary !== 'string') return CANONICAL_LOCALE;
  const clean = primary.toLowerCase().trim();
  if (clean === 'tr' || clean.startsWith('tr-') || clean.startsWith('tr_')) {
    return 'tr';
  }
  return CANONICAL_LOCALE;
}

/**
 * Resolves initial locale based on deterministic priority:
 * 1. Logged-in account preferredLocale (if authenticated in browser)
 * 2. Explicit manual user preference saved in browser
 * 3. Primary browser language detection
 * 4. Fallback 'en'
 */
export function resolveInitialLocale(defaultLocale = DEFAULT_LOCALE) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultLocale && locales[defaultLocale] ? defaultLocale : CANONICAL_LOCALE;
  }
  try {
    // 1. Account backend preferredLocale (source of truth for authenticated account)
    const accountLocale = localStorage.getItem('tensignal_account_locale');
    if (accountLocale && locales[accountLocale]) {
      return accountLocale;
    }

    // 2. Explicit manual choice saved previously by user
    const isManual = localStorage.getItem('tensignal_locale_manual') === 'true';
    const saved = localStorage.getItem('tensignal_locale') || localStorage.getItem('seenly_locale');
    if (isManual && saved && locales[saved]) {
      return saved;
    }

    // Existing user migration compatibility: if saved exists from legacy session without manual marker
    if (saved && locales[saved] && localStorage.getItem('tensignal_locale_manual') === null) {
      return saved;
    }

    // Explicit prop override passed to Provider (e.g. in tests)
    if (defaultLocale && defaultLocale !== DEFAULT_LOCALE && locales[defaultLocale]) {
      return defaultLocale;
    }

    // 3. First visit: browser primary language detection
    return detectBrowserPrimaryLocale();
  } catch {
    return CANONICAL_LOCALE;
  }
}

export function LocaleProvider({ children, defaultLocale = DEFAULT_LOCALE }) {
  const [locale, setLocaleState] = useState(() => resolveInitialLocale(defaultLocale));
  const localeUpdateSeqRef = useRef(0);

  const [coreResources, setCoreResources] = useState(() => resourceCache.core);
  const [extendedResources, setExtendedResources] = useState(() => resourceCache.extended);

  // Manual locale change
  const setLocale = useCallback((newLocale) => {
    const resolved = resolveSupportedLocale(newLocale);
    setLocaleState(resolved);

    try {
      localStorage.setItem('tensignal_locale_manual', 'true');
      localStorage.setItem('tensignal_locale', resolved);
      localStorage.setItem('seenly_locale', resolved);
    } catch (e) {
      // Ignore quota errors
    }

    const ownerToken = localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');
    if (ownerToken) {
      const seq = ++localeUpdateSeqRef.current;
      try {
        localStorage.setItem('tensignal_account_locale', resolved);
      } catch (e) {}

      updateOwnerLocale(ownerToken, resolved).catch((err) => {
        if (seq === localeUpdateSeqRef.current) {
          console.warn('[i18n] Failed to sync preferredLocale to backend:', err);
        }
      });
    }
  }, []);

  // Synchronize account preference on login or dashboard load
  const syncAccountLocale = useCallback((backendPreferredLocale) => {
    const ownerToken = localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');

    if (backendPreferredLocale && locales[backendPreferredLocale]) {
      // Account preferredLocale in DB takes precedence
      try {
        localStorage.setItem('tensignal_account_locale', backendPreferredLocale);
        localStorage.setItem('tensignal_locale_manual', 'true');
        localStorage.setItem('tensignal_locale', backendPreferredLocale);
        localStorage.setItem('seenly_locale', backendPreferredLocale);
      } catch (e) {}
      setLocaleState(backendPreferredLocale);
    } else if (!backendPreferredLocale && ownerToken) {
      // Account has no preferredLocale yet in DB (null). Initialize DB with active locale
      const activeLocale = localStorage.getItem('tensignal_locale') || locale || DEFAULT_LOCALE;
      const resolved = resolveSupportedLocale(activeLocale);
      try {
        localStorage.setItem('tensignal_account_locale', resolved);
      } catch (e) {}
      updateOwnerLocale(ownerToken, resolved).catch((e) => {
        console.warn('[i18n] Failed to initialize backend preferredLocale:', e);
      });
    }
  }, [locale]);

  // Reset account locale on logout to prevent preference leaking to subsequent users
  const resetAccountLocale = useCallback(() => {
    try {
      localStorage.removeItem('tensignal_account_locale');
      localStorage.removeItem('tensignal_locale_manual');
    } catch (e) {}
    const cleanLocale = detectBrowserPrimaryLocale();
    setLocaleState(cleanLocale);
    try {
      localStorage.setItem('tensignal_locale', cleanLocale);
      localStorage.setItem('seenly_locale', cleanLocale);
    } catch (e) {}
  }, []);

  /**
   * Deep key resolver supporting dot notation
   */
  const resolveKey = useCallback((dict, keyPath) => {
    if (!dict || !keyPath) return undefined;
    const parts = keyPath.split('.');
    let current = dict;
    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }, []);

  /**
   * Central translation function
   * Supports:
   * - t('auth.loginTitle')
   * - t('auth.loginTitle', { email })
   * - t('auth.loginTitle', { email }, 'en')
   * - t('ui', 'nav_dashboard') [legacy backwards compatibility]
   * - t('signatures', id) [legacy backwards compatibility]
   */
  const t = useCallback((keyOrCategory, varsOrKey, varsOrOverrideLocale, overrideLocaleArg) => {
    let key = keyOrCategory;
    let variables = varsOrKey;
    let overrideLocale = typeof varsOrOverrideLocale === 'string' && (varsOrOverrideLocale === 'en' || varsOrOverrideLocale === 'tr') ? varsOrOverrideLocale : overrideLocaleArg;

    // Handle legacy two-argument signature t('category', 'key', vars)
    if (typeof varsOrKey === 'string') {
      key = `${keyOrCategory}.${varsOrKey}`;
      variables = varsOrOverrideLocale;
      overrideLocale = overrideLocaleArg;
    }

    if (!key || typeof key !== 'string') return '';

    const effectiveLocale = overrideLocale || locale;
    const currentCore = coreResources[effectiveLocale] || resourceCache.core[effectiveLocale];
    const canonicalCore = coreResources[CANONICAL_LOCALE] || resourceCache.core[CANONICAL_LOCALE];
    const currentExt = extendedResources[effectiveLocale] || resourceCache.extended[effectiveLocale];
    const canonicalExt = extendedResources[CANONICAL_LOCALE] || resourceCache.extended[CANONICAL_LOCALE];

    // Check pluralization if count is provided in variables
    let rawTranslation = undefined;
    if (variables && typeof variables.count === 'number') {
      try {
        const pr = new Intl.PluralRules(effectiveLocale);
        const pluralForm = pr.select(variables.count);
        rawTranslation = resolveKey(currentCore, `${key}_${pluralForm}`) ||
                         resolveKey(currentCore, `${key}.${pluralForm}`) ||
                         resolveKey(currentExt, `${key}_${pluralForm}`) ||
                         resolveKey(currentExt, `${key}.${pluralForm}`);
      } catch {
        // Fallback below
      }
    }

    // Direct lookup in target locale (core then extended)
    if (rawTranslation === undefined) {
      rawTranslation = resolveKey(currentCore, key);
    }
    if (rawTranslation === undefined && currentExt) {
      rawTranslation = resolveKey(currentExt, key);
    }

    // Legacy flat lookup in ui if key has no dots
    if (rawTranslation === undefined && !key.includes('.')) {
      rawTranslation = currentCore?.common?.[key] ||
                       currentCore?.navigation?.[key] ||
                       currentCore?.home?.[key] ||
                       currentCore?.auth?.[key] ||
                       currentCore?.errors?.[key] ||
                       currentExt?.quiz?.[key] ||
                       currentExt?.participant?.[key] ||
                       currentExt?.dashboard?.[key] ||
                       currentExt?.settings?.[key] ||
                       currentExt?.billing?.[key];
    }

    // Fallback to canonical locale (English)
    if (rawTranslation === undefined && effectiveLocale !== CANONICAL_LOCALE) {
      rawTranslation = resolveKey(canonicalCore, key);
      if (rawTranslation === undefined && canonicalExt) {
        rawTranslation = resolveKey(canonicalExt, key);
      }
      if (rawTranslation === undefined && !key.includes('.')) {
        rawTranslation = canonicalCore?.common?.[key] ||
                         canonicalCore?.navigation?.[key] ||
                         canonicalCore?.home?.[key] ||
                         canonicalCore?.auth?.[key] ||
                         canonicalCore?.errors?.[key] ||
                         canonicalExt?.quiz?.[key] ||
                         canonicalExt?.participant?.[key] ||
                         canonicalExt?.dashboard?.[key] ||
                         canonicalExt?.settings?.[key] ||
                         canonicalExt?.billing?.[key];
      }
    }

    // Missing key warning in development
    if (rawTranslation === undefined) {
      const isExtendedKey = ['quiz', 'dashboard', 'settings', 'billing', 'legal', 'participant'].includes(key.split('.')[0]);
      const extendedLoaded = Boolean(extendedResources[effectiveLocale] || resourceCache.extended[effectiveLocale]);
      if (import.meta.env.DEV && (!isExtendedKey || extendedLoaded)) {
        console.warn(`[i18n] Missing translation key: "${key}" in locale: "${effectiveLocale}"`);
      }
      return key;
    }

    if (typeof rawTranslation !== 'string') {
      return rawTranslation;
    }

    // Variable interpolation {variable}
    if (variables && typeof variables === 'object') {
      return rawTranslation.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
        return variables[varName] !== undefined ? String(variables[varName]) : match;
      });
    }

    return rawTranslation;
  }, [locale, coreResources, extendedResources, resolveKey]);

  // Sync document language, title, meta and localStorage
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locales[locale]?.direction || 'ltr';
    localStorage.setItem('tensignal_locale', locale);
    localStorage.setItem('seenly_locale', locale);
    const title = t('common.metaTitle');
    if (title && title !== 'common.metaTitle') {
      document.title = title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const desc = t('common.metaDescription');
      if (desc && desc !== 'common.metaDescription') {
        metaDesc.setAttribute('content', desc);
      }
    }
  }, [locale, t]);

  // Load core resources for active locale if not yet cached
  useEffect(() => {
    let active = true;
    if (!resourceCache.core[locale]) {
      const loader = locales[locale]?.loadCore;
      if (loader) {
        loader().then((loadedCore) => {
          if (!active) return;
          resourceCache.core[locale] = loadedCore;
          setCoreResources((prev) => ({ ...prev, [locale]: loadedCore }));
        }).catch((err) => {
          console.error(`[i18n] Failed to load core locale for "${locale}":`, err);
        });
      }
    }
    return () => { active = false; };
  }, [locale]);

  // Load extended resources (signatures, questions, gaps, faq, etc.) via idle callback or immediately for subroutes
  useEffect(() => {
    let active = true;
    const loadExtendedForLocale = (targetLocale) => {
      if (resourceCache.extended[targetLocale]) return;
      const loader = locales[targetLocale]?.loadExtended;
      if (!loader) return;
      loader().then((loadedExtended) => {
        if (!active) return;
        resourceCache.extended[targetLocale] = loadedExtended;
        setExtendedResources((prev) => ({ ...prev, [targetLocale]: loadedExtended }));
      }).catch((err) => {
        console.error(`[i18n] Failed to load extended locale for "${targetLocale}":`, err);
      });
    };

    const isSubroute = typeof window !== 'undefined' && window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#';

    let idleCallback;
    if (isSubroute) {
      loadExtendedForLocale(locale);
      if (locale !== CANONICAL_LOCALE) {
        loadExtendedForLocale(CANONICAL_LOCALE);
      }
    } else {
      idleCallback = window.requestIdleCallback?.(() => {
        loadExtendedForLocale(locale);
        if (locale !== CANONICAL_LOCALE) {
          loadExtendedForLocale(CANONICAL_LOCALE);
        }
      });

      if (idleCallback === undefined) {
        loadExtendedForLocale(locale);
        if (locale !== CANONICAL_LOCALE) {
          loadExtendedForLocale(CANONICAL_LOCALE);
        }
      }
    }

    const onHashChange = () => {
      loadExtendedForLocale(locale);
      if (locale !== CANONICAL_LOCALE) {
        loadExtendedForLocale(CANONICAL_LOCALE);
      }
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      active = false;
      if (idleCallback !== undefined) window.cancelIdleCallback?.(idleCallback);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [locale]);

  // Synchronize document HTML lang, title, and meta description dynamically at runtime
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    const pageTitle = t('home.metaTitle');
    if (pageTitle && pageTitle !== 'home.metaTitle') {
      document.title = pageTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    const pageDesc = t('home.metaDescription');
    if (metaDesc && pageDesc && pageDesc !== 'home.metaDescription') {
      metaDesc.setAttribute('content', pageDesc);
    }
  }, [locale, t]);

  /**
   * Helper to retrieve translated objects (signatures, gaps, families, readerStyles)
   */
  const getObject = useCallback((category, id) => {
    const current = extendedResources[locale]?.[category]?.[id];
    if (category === 'legal') {
      const fallback = extendedResources[CANONICAL_LOCALE]?.[category]?.[id];
      if (!current) return fallback;
      if (!current.sections && fallback?.sections) {
        return { ...fallback, ...current, sections: fallback.sections, isFallbackBody: locale !== CANONICAL_LOCALE };
      }
      return current;
    }
    if (current) return current;
    const fallback = extendedResources[CANONICAL_LOCALE]?.[category]?.[id];
    if (fallback) return fallback;
    return null;
  }, [locale, extendedResources]);

  /**
   * Intl Formatting helpers
   */
  const formatNumber = useCallback((value, options) => {
    try {
      return new Intl.NumberFormat(locale, options).format(value);
    } catch {
      return String(value);
    }
  }, [locale]);

  const formatDate = useCallback((date, options) => {
    try {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch {
      return String(date);
    }
  }, [locale]);

  const formatCurrency = useCallback((amount, currency = 'USD', options) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  }, [locale]);

  const formatPercent = useCallback((value, options) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'percent', ...options }).format(value);
    } catch {
      return `${value}%`;
    }
  }, [locale]);

  const formatRelativeTime = useCallback((value, unit, options) => {
    try {
      return new Intl.RelativeTimeFormat(locale, options).format(value, unit);
    } catch {
      return `${value} ${unit} ago`;
    }
  }, [locale]);

  /**
   * Stable API error mapping
   */
  const formatApiError = useCallback((error) => {
    if (!error) return t('errors.generic');
    if (typeof error === 'string') return error;

    const status = error.status || error.statusCode;
    if (status) {
      const statusKey = `errors.status_${status}`;
      const msg = t(statusKey);
      if (msg !== statusKey) return msg;
    }

    if (error.code && t(`errors.${error.code}`) !== `errors.${error.code}`) {
      return t(`errors.${error.code}`);
    }

    if (error.message && error.message.toLowerCase().includes('network')) {
      return t('errors.network');
    }

    return error.message || t('errors.generic');
  }, [t]);

  const contextValue = useMemo(() => ({
    locale,
    setLocale,
    syncAccountLocale,
    resetAccountLocale,
    t,
    getObject,
    supportedLocales: getSupportedLocales(),
    faq: extendedResources[locale]?.faq || extendedResources[CANONICAL_LOCALE]?.faq || [],
    formatNumber,
    formatDate,
    formatCurrency,
    formatPercent,
    formatRelativeTime,
    formatApiError
  }), [
    locale,
    setLocale,
    syncAccountLocale,
    resetAccountLocale,
    t,
    getObject,
    extendedResources,
    formatNumber,
    formatDate,
    formatCurrency,
    formatPercent,
    formatRelativeTime,
    formatApiError
  ]);

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}

// Fallback default context for components rendered without Provider (e.g. unit tests)
const defaultFallbackContext = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  syncAccountLocale: () => {},
  resetAccountLocale: () => {},
  t: (keyOrCategory, varsOrKey, varsOrOverrideLocale, overrideLocaleArg) => {
    let key = keyOrCategory;
    let variables = varsOrKey;
    let overrideLocale = typeof varsOrOverrideLocale === 'string' && (varsOrOverrideLocale === 'en' || varsOrOverrideLocale === 'tr') ? varsOrOverrideLocale : overrideLocaleArg;

    if (typeof varsOrKey === 'string') {
      key = `${keyOrCategory}.${varsOrKey}`;
      variables = varsOrOverrideLocale;
      overrideLocale = overrideLocaleArg;
    }

    const dict = overrideLocale === 'en' ? enCore : trCore;
    const parts = key.split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur && typeof cur === 'object') cur = cur[p];
      else { cur = undefined; break; }
    }
    if (typeof cur === 'string') {
      if (variables && typeof variables === 'object') {
        return cur.replace(/\{([a-zA-Z0-9_]+)\}/g, (m, v) => variables[v] !== undefined ? String(variables[v]) : m);
      }
      return cur;
    }
    return key;
  },
  getObject: () => null,
  supportedLocales: getSupportedLocales(),
  faq: [],
  formatNumber: (val) => String(val),
  formatDate: (val) => String(val),
  formatCurrency: (val, c = 'USD') => `${c} ${val}`,
  formatPercent: (val) => `${val}%`,
  formatRelativeTime: (val, u) => `${val} ${u}`,
  formatApiError: (err) => err?.message || 'Error'
};

export function useLocale() {
  const ctx = useContext(LocaleContext);
  return ctx || defaultFallbackContext;
}
