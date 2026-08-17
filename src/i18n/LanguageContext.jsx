import React, { createContext, useContext, useState } from "react";
import { translations } from "./translations.js";

const LanguageContext = createContext({ lang: "en", setLang: () => {}, t: (key) => key });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("wosha_language") || "en");
  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem("wosha_language", code);
  };
  // Falls back to English, then to the raw key itself, so a string that
  // hasn't been translated yet never renders as blank or broken — it just
  // shows in English until it's added to the dictionary.
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
