import {
    LayoutGrid,
    CheckSquare,
    CloudSun,
    Calculator,
    CalendarDays,
    Settings
} from "lucide-react";
import { NavLink } from "react-router-dom"; // Импортируем NavLink
import { clsx } from "clsx"; // Для удобного смешивания классов
import { supabase } from "../supabaseClient";
import { LogOut } from "lucide-react";

export function Sidebar() {
    const menuItems = [
        { icon: LayoutGrid, label: "Дашборд", path: "/" }, // path вместо id
        { icon: CheckSquare, label: "Задачи", path: "/todo" },
        { icon: CloudSun, label: "Погода", path: "/weather" },
        { icon: Calculator, label: "Калькулятор", path: "/calculator" },
        { icon: CalendarDays, label: "Календарь", path: "/calendar" },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // App.tsx сам заметит изменение и перекинет на экран входа
    };

    return (
        <aside className="w-64 h-screen bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col p-3 text-[#37352F]">
            {/* Профиль */}
            <div className="mb-6 px-3 py-2 flex items-center gap-2 hover:bg-[#EFEFEF] rounded cursor-pointer transition-colors">
                <div className="w-5 h-5 bg-orange-400 rounded text-xs flex items-center justify-center text-white font-bold">
                    A
                </div>
                <span className="font-medium text-sm">Моё Пространство</span>
            </div>

            {/* Меню */}
            <nav className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase">
                    Модули
                </div>

                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                "w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors text-left",
                                isActive
                                    ? "bg-[#EFEFEF] font-medium text-black" // Стиль активной кнопки
                                    : "text-gray-600 hover:bg-[#EFEFEF] hover:text-black" // Стиль обычной кнопки
                            )
                        }
                    >
                        <item.icon size={18} className="opacity-70" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Низ меню */}
            <div className="mt-auto pt-4 border-t border-[#E9E9E7]">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded hover:bg-[#EFEFEF] transition-colors text-left">
                    <Settings size={18} className="opacity-70" />
                    Настройки
                </button>
            </div>
            <div className="mt-auto pt-4 border-t border-[#E9E9E7]">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                >
                    <LogOut size={18} className="opacity-70" />
                    Выйти
                </button>
            </div>
        </aside>

    );
}