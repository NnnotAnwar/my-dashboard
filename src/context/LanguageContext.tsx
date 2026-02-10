import React, { useState, useEffect, type ReactNode } from "react";
import { LanguageContext, TRANSLATIONS } from "./languageContext";

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<"en" | "ru">(() => {
        return (localStorage.getItem("app_lang") as "en" | "ru") || "en";
    });

    useEffect(() => {
        localStorage.setItem("app_lang", lang);
    }, [lang]);

    const toggleLang = () => setLang((prev) => (prev === "en" ? "ru" : "en"));

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t: TRANSLATIONS[lang] }}>
            {children}
        </LanguageContext.Provider>
    );
}
