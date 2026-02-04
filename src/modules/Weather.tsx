import { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSun, Sun, Snowflake, Loader2, Search, MapPin } from "lucide-react";

interface WeatherData {
    temperature: number;
    weatherCode: number;
    cityName: string;
}

export function Weather() {
    const [cityQuery, setCityQuery] = useState(""); // Что ввел пользователь
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // По умолчанию попробуем загрузить погоду для какого-то города (например, Москва), чтобы не было пусто
    useEffect(() => {
        handleSearch("Prague");
    }, []);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Сначала ищем координаты города по названию
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=ru&format=json`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error("Город не найден");
            }

            const { latitude, longitude, name } = geoData.results[0];

            // 2. Теперь берем погоду по этим координатам
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();

            setWeather({
                temperature: weatherData.current.temperature_2m,
                weatherCode: weatherData.current.weather_code,
                cityName: name,
            });

        } catch (err) {
            setError("Не удалось найти город или данные о погоде");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch(cityQuery);
        }
    };

    // Хелперы для иконок (остались те же)
    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun size={64} className="text-orange-400" />;
        if (code >= 1 && code <= 3) return <CloudSun size={64} className="text-gray-400" />;
        if (code >= 51 && code <= 67) return <CloudRain size={64} className="text-blue-400" />;
        if (code >= 71 && code <= 86) return <Snowflake size={64} className="text-cyan-300" />;
        return <Cloud size={64} className="text-gray-400" />;
    };

    const getDescription = (code: number) => {
        if (code === 0) return "Ясно";
        if (code >= 1 && code <= 3) return "Облачно";
        if (code >= 51 && code <= 67) return "Дождь";
        if (code >= 71 && code <= 86) return "Снег";
        return "Пасмурно";
    };

    return (
        <div className="max-w-md">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#37352F] mb-2">Погода</h1>
                <p className="text-gray-500">Узнай погоду в любой точке мира.</p>
            </div>

            {/* Поле поиска */}
            <div className="flex items-center gap-3 mb-6 p-2 rounded border border-[#E9E9E7] bg-white focus-within:ring-2 ring-blue-100 transition-all">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите город (например: London)..."
                    className="flex-1 bg-transparent border-none outline-none text-[#37352F] placeholder:text-gray-400 h-8"
                />
                {loading && <Loader2 className="animate-spin text-gray-400" size={18} />}
            </div>

            {error && (
                <div className="mb-4 text-red-500 text-sm bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            {weather && !loading && (
                <div className="flex items-center gap-8 p-8 rounded-xl border border-[#E9E9E7] bg-white shadow-sm transition-all hover:shadow-md">
                    {/* Иконка */}
                    <div>{getWeatherIcon(weather.weatherCode)}</div>

                    {/* Информация */}
                    <div>
                        <div className="text-5xl font-bold text-[#37352F] mb-1">
                            {Math.round(weather.temperature)}°
                        </div>
                        <div className="text-xl text-gray-500 font-medium mb-1">
                            {getDescription(weather.weatherCode)}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider">
                            <MapPin size={12} />
                            {weather.cityName}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}