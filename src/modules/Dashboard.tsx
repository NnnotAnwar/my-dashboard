// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
    CheckCircle2,
    CloudSun,
    Calendar,
    ArrowRight,
    Plus,
    Calculator,
    Loader2
} from "lucide-react";
import {useQuery} from "@tanstack/react-query";

async function fetchWeather() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.61&current=temperature_2m");
        const data = await res.json();
        const temperature: number = data.current.temperature_2m;
        return temperature;
    } catch {
        return null;
    }
}

async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function fetchTasksCount(userId: string) {
    const {count} = await supabase
        .from("todos")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", false)
        .eq("user_id", userId);
    return count;
}

export function Dashboard() {
    const { data: weatherTemp, isLoading: isWeatherLoading } = useQuery({
        queryKey: ['weather'], // Уникальное имя для кэша
        queryFn: fetchWeather, // Наша функция-курьер
    });
    const { data : user, isLoading: isUserLoading } = useQuery({
        queryKey: ['user'],
        queryFn: fetchUser
    })
    const {data: tasksCount} = useQuery(
        {
            queryKey: ['tasks', user?.id],
            queryFn: () => fetchTasksCount(user?.id || ""),
            enabled: !!user?.id,
        }
    )

    const getUserName = () => {
        if (!user?.email) return "Друг";
        const name = user.email.split("@")[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    }


    // Определяем приветствие по времени суток
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return "Доброй ночи";
        if (hour < 12) return "Доброе утро";
        if (hour < 18) return "Добрый день";
        return "Добрый вечер";
    };

    if (isWeatherLoading || isUserLoading) {
        return (
            <div className="p-8 flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" /> Загрузка дашборда...
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* 1. Блок Приветствия */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-[#37352F] mb-2">
                    {getGreeting()}, {getUserName()}.
                </h1>
                <p className="text-gray-500 text-lg">
                    {(tasksCount || 0) > 0
                        ? `У тебя ${tasksCount} незаконченных дел. Пора за работу!`
                        : "Все задачи выполнены. Ты великолепен!"}
                </p>
            </div>

            {/* 2. Сетка Виджетов */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

                {/* Виджет: Задачи */}
                <Link to="/todo" className="group bg-white p-6 rounded-xl border border-[#E9E9E7] shadow-sm hover:shadow-md transition-all hover:border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-2xl font-bold text-[#37352F]">{tasksCount}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Мои задачи</div>
                    <div className="text-xs text-gray-400 group-hover:text-blue-500 flex items-center gap-1 transition-colors">
                        Перейти к списку <ArrowRight size={12} />
                    </div>
                </Link>

                {/* Виджет: Погода */}
                <Link to="/weather" className="group bg-white p-6 rounded-xl border border-[#E9E9E7] shadow-sm hover:shadow-md transition-all hover:border-orange-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                            <CloudSun size={24} />
                        </div>
                        {typeof weatherTemp === 'number' && (
                            <span className="text-2xl font-bold text-[#37352F]">
                                {Math.round(weatherTemp)}°
                            </span>
                        )}
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Погода</div>
                    <div className="text-xs text-gray-400 group-hover:text-orange-500 flex items-center gap-1 transition-colors">
                        Подробнее <ArrowRight size={12} />
                    </div>
                </Link>

                {/* Виджет: Календарь (Дата) */}
                <Link to="/calendar" className="group bg-white p-6 rounded-xl border border-[#E9E9E7] shadow-sm hover:shadow-md transition-all hover:border-red-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <span className="text-xl font-bold text-[#37352F]">
              {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
                    </div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Календарь</div>
                    <div className="text-xs text-gray-400 group-hover:text-red-500 flex items-center gap-1 transition-colors">
                        Открыть <ArrowRight size={12} />
                    </div>
                </Link>
            </div>

            {/* 3. Быстрые действия (Quick Actions) */}
            <h2 className="text-lg font-semibold text-[#37352F] mb-4">Быстрый доступ</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to="/todo" className="flex items-center gap-3 p-3 bg-white border border-[#E9E9E7] rounded-lg hover:bg-gray-50 transition-colors">
                    <Plus size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Новая задача</span>
                </Link>

                <Link to="/calculator" className="flex items-center gap-3 p-3 bg-white border border-[#E9E9E7] rounded-lg hover:bg-gray-50 transition-colors">
                    <Calculator size={18} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Посчитать</span>
                </Link>
            </div>
        </div>
    );
}