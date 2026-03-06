import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-sm font-medium text-gray-700"
      title={language === 'en' ? 'Switch to Arabic' : 'التبديل للإنجليزية'}
    >
      <span className="text-base">{language === 'en' ? '🇸🇦' : '🇬🇧'}</span>
      <span>{language === 'en' ? 'عربي' : 'English'}</span>
    </button>
  );
}
