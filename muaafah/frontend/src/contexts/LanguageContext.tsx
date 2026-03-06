import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Language } from '../types';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';

const translations = { en, ar };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('muaafah_language');
    return (saved as Language) || 'en';
  });

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.style.fontFamily = isRTL
      ? "'Cairo', 'Tajawal', Arial, sans-serif"
      : "'Inter', system-ui, sans-serif";
    localStorage.setItem('muaafah_language', language);
  }, [language, isRTL, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const dict = translations[language] as Record<string, unknown>;
    return getNestedValue(dict, key) || getNestedValue(translations.en as Record<string, unknown>, key) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
