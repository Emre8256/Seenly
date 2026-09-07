import React, { createContext, useState, useContext, useEffect } from 'react';

// Import English JSON locales
import enUi from '../content/locales/en/ui.json';

// Import Turkish JSON locales
import trUi from '../content/locales/tr/ui.json';

const uiTranslations = { en: enUi, tr: trUi };

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [extendedTranslations, setExtendedTranslations] = useState(null);
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('seenly_locale') || 'tr';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem('seenly_locale', locale);
  }, [locale]);

  useEffect(() => {
    let active = true;
    const loadExtendedTranslations = () => import('./extendedLocales').then(({ default: resources }) => {
      if (active) setExtendedTranslations(resources);
    });
    const idleId = window.requestIdleCallback?.(loadExtendedTranslations);
    if (idleId === undefined) loadExtendedTranslations();
    return () => {
      active = false;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
    };
  }, []);

  /**
   * Helper to translate a key within a category.
   * If key is not found, returns key as fallback.
   */
  const t = (category, key) => {
    if (category === 'ui') return uiTranslations[locale]?.[key] || key;
    return extendedTranslations?.[locale]?.[category]?.[key] || key;
  };

  /**
   * Helper to retrieve a translated object (e.g. signature copy block).
   * Safe-guards with default nulls.
   */
  const getObject = (category, id) => {
    return extendedTranslations?.[locale]?.[category]?.[id] || null;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, getObject, faq: extendedTranslations?.[locale]?.faq }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
