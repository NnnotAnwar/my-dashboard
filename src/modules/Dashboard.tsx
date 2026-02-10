import { useQuery } from "@tanstack/react-query";
import { Loader2, CloudRain, CheckSquare } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";

// 1. Функция получения погоды
async function fetchWeather(): Promise<number | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
                    const data = await res.json();
                    resolve(data.current.temperature_2m);
                } catch {
                    resolve(null);
                }
            },
            () => resolve(null)
        );
    });
}

// 2. Функция подсчета задач
async function fetchTaskCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return 0;
    const { count } = await supabase.from('todos').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_completed', false);
    return count || 0;
}

// 3. НОВАЯ ФУНКЦИЯ: Узнаем имя из Email
async function fetchUserName() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return "Friend";

    // Берем часть до собачки (anwar@... -> anwar)
    const namePart = user.email.split("@")[0];

    // Делаем первую букву большой (anwar -> Anwar)
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export function Dashboard() {
    const { t } = useLanguage();

    const { data: temp, isLoading: isWeatherLoading } = useQuery({
        queryKey: ['weather'],
        queryFn: fetchWeather,
        retry: false,
        refetchOnWindowFocus: false
    });

    const { data: taskCount, isError: isTaskCountError, refetch: refetchTaskCount } = useQuery({
        queryKey: ['taskCount'],
        queryFn: fetchTaskCount,
    });
    const { data: userName } = useQuery({ queryKey: ['userName'], queryFn: fetchUserName });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t.dashboard.greeting_morning;
        if (hour < 18) return t.dashboard.greeting_day;
        return t.dashboard.greeting_evening;
    };

    const showWeather = isWeatherLoading || (temp !== null && temp !== undefined);

    return (
        <div className="space-y-6">
            {isTaskCountError && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
                    <span>{t.errors.load_failed}</span>
                    <button onClick={() => refetchTaskCount()} className="underline font-bold">
                        {t.errors.retry}
                    </button>
                </div>
            )}
            <header>
                {/* 👇 ТЕПЕРЬ ИМЯ ДИНАМИЧЕСКОЕ */}
                <h1 className="text-4xl font-black text-[#202124] tracking-tight mb-2">
                    {getGreeting()}, {userName || "..."}! 👋
                </h1>
                <p className="text-gray-500 text-lg font-medium">
                    {t.dashboard.subtitle}
                </p>
            </header>

            <div className={`grid grid-cols-1 ${showWeather ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4`}>

                {/* Карточка задач */}
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <div className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">{t.dashboard.stat_tasks}</div>
                        <div className="text-5xl font-black text-gray-800">{taskCount ?? "-"}</div>
                    </div>

                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                        <CheckSquare size={24} />
                    </div>
                </div>

                {/* Карточка погоды */}
                {showWeather && (
                    <div className="p-6 bg-blue-500 rounded-3xl text-white shadow-lg shadow-blue-200 flex items-center justify-between transition-all">
                        <div>
                            <div className="text-blue-100 font-bold text-xs uppercase tracking-wider mb-1">{t.dashboard.stat_weather}</div>
                            <div className="text-5xl font-black">
                                {isWeatherLoading ? (
                                    <Loader2 className="animate-spin opacity-50" />
                                ) : (
                                    Math.round(temp!) + "°"
                                )}
                            </div>
                        </div>
                        <CloudRain size={48} className="text-blue-200" />
                    </div>
                )}
            </div>
        </div>
    );
}