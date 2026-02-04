import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CheckSquare, CloudSun, Calculator, Calendar, LogOut, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { clsx } from "clsx";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: "Главная", path: "/" },
        { icon: CheckSquare, label: "Задачи", path: "/todo" },
        { icon: Calendar, label: "Календарь", path: "/calendar" },
        { icon: CloudSun, label: "Погода", path: "/weather" },
        { icon: Calculator, label: "Калькулятор", path: "/calculator" },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <>
            {/* 1. Затемнение фона (Overlay) - только на мобильном, когда меню открыто */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* 2. Само меню */}
            <div
                className={clsx(
                    // Было h-full, стало min-h-screen:
                    "fixed top-0 left-0 min-h-screen w-64 bg-[#F7F7F5] border-r border-[#E9E9E7] p-4 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Заголовок и кнопка закрытия (для мобильных) */}
                <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-2 font-bold text-[#37352F]">
                        <div className="w-6 h-6 bg-[#37352F] rounded flex items-center justify-center text-white text-xs">
                            M
                        </div>
                        MyDashboard
                    </div>
                    {/* Кнопка крестик (видна только на мобильном) */}
                    <button onClick={onClose} className="md:hidden p-1 text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Список пунктов */}
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose} // Закрываем меню при клике на ссылку (на мобильном)
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors",
                                    isActive
                                        ? "bg-[#EFEFEF] text-[#37352F] font-medium"
                                        : "text-gray-600 hover:bg-[#EFEFEF]"
                                )}
                            >
                                <item.icon size={18} className={isActive ? "opacity-100" : "opacity-70"} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Кнопка выхода */}
                <div className="mt-auto pt-4 border-t border-[#E9E9E7]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                    >
                        <LogOut size={18} className="opacity-70" />
                        Выйти
                    </button>
                </div>
            </div>
        </>
    );
}