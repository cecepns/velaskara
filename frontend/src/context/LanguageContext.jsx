import React, { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('velaskara_lang') || 'id');

  const toggleLanguage = () => {
    const nextLang = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);
    localStorage.setItem('velaskara_lang', nextLang);
  };

  const t = (key, fallback = '') => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
