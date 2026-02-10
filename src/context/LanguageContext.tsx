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
            ai_placeholder: "AI Plan (e.g., Trip to Paris)...",
            all_done: "Done all",
            clear: "Clear",
            empty_text: "No tasks yet. Relax?",
            modal_title: "Are you sure?",
            modal_text: "Completed tasks will be permanently deleted.",
            modal_cancel: "Cancel",
            modal_confirm: "Yes, delete",
            categories: { home: "Home", work: "Work", study: "Study", shop: "Shop" }
        },
        auth: {
            title_signup: "Create account",
            title_signin: "Welcome back",
            subtitle_signup: "Sign up to save your data",
            subtitle_signin: "Sign in to see your tasks",
            email: "Email",
            password: "Password",
            success_message: "Sign-up successful! Please sign in.",
            error_default: "Authentication failed",
            button_signup: "Sign up",
            button_signin: "Sign in",
            switch_has_account: "Already have an account?",
            switch_no_account: "No account?",
            switch_signin: "Sign in",
            switch_signup: "Create"
        },
        weather: {
            title: "Weather",
            subtitle: "Check weather anywhere in the world.",
            placeholder: "Enter city (e.g. London)...",
            error_message: "Could not find city or weather data.",
            clear: "Clear", cloudy: "Cloudy", rain: "Rain", snow: "Snow", overcast: "Overcast"
        },
        calendar: {
            title_hint: "Click a date to create an event in Google Calendar",
            today: "Today",
            weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        },
        errors: {
            save_failed: "Could not save. Try again.",
            ai_failed: "AI failed. Try again.",
            load_failed: "Could not load. Try again.",
            retry: "Retry"
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
            ai_placeholder: "AI план (напр. Поездка в Питер)...",
            all_done: "Все готово",
            clear: "Очистить",
            empty_text: "Задач нет. Отдыхаем?",
            modal_title: "Вы уверены?",
            modal_text: "Выполненные задачи будут удалены навсегда.",
            modal_cancel: "Отмена",
            modal_confirm: "Да, удалить",
            categories: { home: "Дом", work: "Работа", study: "Учеба", shop: "Покупки" }
        },
        auth: {
            title_signup: "Создать аккаунт",
            title_signin: "С возвращением",
            subtitle_signup: "Зарегистрируйтесь, чтобы сохранять данные",
            subtitle_signin: "Войдите, чтобы увидеть свои задачи",
            email: "Email",
            password: "Пароль",
            success_message: "Регистрация успешна! Теперь войдите.",
            error_default: "Ошибка авторизации",
            button_signup: "Зарегистрироваться",
            button_signin: "Войти",
            switch_has_account: "Уже есть аккаунт?",
            switch_no_account: "Нет аккаунта?",
            switch_signin: "Войти",
            switch_signup: "Создать"
        },
        weather: {
            title: "Погода",
            subtitle: "Узнай погоду в любой точке мира.",
            placeholder: "Введите город (например: London)...",
            error_message: "Не удалось найти город или данные о погоде.",
            clear: "Ясно", cloudy: "Облачно", rain: "Дождь", snow: "Снег", overcast: "Пасмурно"
        },
        calendar: {
            title_hint: "Кликни на дату, чтобы создать событие в Google",
            today: "Сегодня",
            weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
        },
        errors: {
            save_failed: "Не удалось сохранить. Попробуйте снова.",
            ai_failed: "Ошибка AI. Попробуйте снова.",
            load_failed: "Не удалось загрузить. Попробуйте снова.",
            retry: "Повторить"
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