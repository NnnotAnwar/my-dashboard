import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Lang = 'en' | 'ru';

// СЛОВАРЬ ВСЕГО ПРИЛОЖЕНИЯ
const TRANSLATIONS = {
    en: {
        nav: {
            dashboard: "Dashboard",
            todo: "Tasks",
            weather: "Weather",
            calculator: "Calculator",
            calendar: "Calendar",
            admin: "Admin",
            logout: "Log out",
            lang: "Language"
        },
        notFound: {
            title: "404",
            description: "Page not found"
        },
        dashboard: {
            greeting_morning: "Good morning",
            greeting_day: "Good afternoon",
            greeting_evening: "Good evening",
            subtitle: "Ready to conquer the day?",
            stat_tasks: "Pending tasks",
            stat_weather: "Current weather"
        },

        todo: {
            title: "Tasks",
            active: "active",
            add: "Add",
            placeholder: "New task...",
            ai_placeholder: "AI Plan...",
            all_done: "Done all",
            clear: "Clear"
        }
    },
    ru: {
        nav: {
            dashboard: "Дашборд",
            todo: "Задачи",
            weather: "Погода",
            calculator: "Калькулятор",
            calendar: "Календарь",
            admin: "Админ",
            logout: "Выйти",
            lang: "Язык"
        },
        notFound: {
            title: "404",
            description: "Страница не найдена"
        },
        dashboard: {
            greeting_morning: "Доброе утро",
            greeting_day: "Добрый день",
            greeting_evening: "Добрый вечер",
            subtitle: "Готовы покорять вершины?",
            stat_tasks: "Задач в работе",
            stat_weather: "Погода сейчас"
        },
        todo: {
            title: "Задачи",
            active: "активных",
            add: "Добавить",
            placeholder: "Новая задача...",
            ai_placeholder: "AI План...",
            all_done: "Все готово",
            clear: "Очистить"
        }
    }
};

type LanguageContextType = {
    lang: Lang;
    toggleLang: () => void;
    t: typeof TRANSLATIONS['en']; // Типизация словаря
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>(() => {
        return (localStorage.getItem('app_lang') as Lang) || 'en';
    });

    useEffect(() => {
        localStorage.setItem('app_lang', lang);
    }, [lang]);

    const toggleLang = () => setLang(prev => prev === 'en' ? 'ru' : 'en');

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t: TRANSLATIONS[lang] }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Хук для использования в любом компоненте
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
    return context;
}