import React, { createContext, useState, useContext, useEffect } from 'react';

// Import English JSON locales
import enUi from '../content/locales/en/ui.json';
import enSignatures from '../content/locales/en/signatures.json';
import enFamilies from '../content/locales/en/families.json';
import enGaps from '../content/locales/en/gaps.json';
import enReaderStyles from '../content/locales/en/reader_styles.json';
import enQuestions from '../content/locales/en/questions.json';
import enFaq from '../content/locales/en/faq.json';

// Import Turkish JSON locales
import trUi from '../content/locales/tr/ui.json';
import trSignatures from '../content/locales/tr/signatures.json';
import trFamilies from '../content/locales/tr/families.json';
import trGaps from '../content/locales/tr/gaps.json';
import trReaderStyles from '../content/locales/tr/reader_styles.json';
import trQuestions from '../content/locales/tr/questions.json';
import trFaq from '../content/locales/tr/faq.json';

const translations = {
  en: {
    ui: enUi,
    signatures: enSignatures,
    families: enFamilies,
    gaps: enGaps,
    readerStyles: enReaderStyles,
    questions: enQuestions,
    faq: enFaq
  },
  tr: {
    ui: trUi,
    signatures: trSignatures,
    families: trFamilies,
    gaps: trGaps,
    readerStyles: trReaderStyles,
    questions: trQuestions,
    faq: trFaq
  }
};

const LocaleContext = createContext();

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('seenly_locale') || 'tr';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem('seenly_locale', locale);
  }, [locale]);

  /**
   * Helper to translate a key within a category.
   * If key is not found, returns key as fallback.
   */
  const t = (category, key) => {
    return translations[locale]?.[category]?.[key] || key;
  };

  /**
   * Helper to retrieve a translated object (e.g. signature copy block).
   * Safe-guards with default nulls.
   */
  const getObject = (category, id) => {
    return translations[locale]?.[category]?.[id] || null;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, getObject, faq: translations[locale]?.faq }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
