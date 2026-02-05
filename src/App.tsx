import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { type Session } from "@supabase/supabase-js";
import { AppLayout } from "./layout/AppLayout";
import { Auth } from "./modules/Auth"; // Импорт авторизации

// Импорт модулей
import { Dashboard } from "./modules/Dashboard";
import { Todo } from "./modules/Todo";
import { Weather } from "./modules/Weather";
import { Calculator } from "./modules/Calculator";
import { Calendar } from "./modules/Calendar";
import { Loader2 } from "lucide-react";


function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Проверяем текущую сессию при запуске
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // 2. Подписываемся на изменения (вход/выход)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Пока проверяем вход - показываем крутилку
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#F7F7F5]">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    // Если нет сессии - показываем экран входа
    if (!session) {
        return <Auth />;
    }

    // Если вошли - показываем приложение
    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/todo" element={<Todo />} />
                    <Route path="/weather" element={<Weather />} />
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/calendar" element={<Calendar />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}

export default App;