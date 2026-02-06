import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import {
    LayoutDashboard, CheckSquare, CloudSun,
    Calculator, Calendar, LogOut, X, Languages
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { clsx } from "clsx";
import { useLanguage } from "../context/LanguageContext";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const { t, lang, toggleLang } = useLanguage();

    const menuItems = [
        { icon: LayoutDashboard, label: t.nav.dashboard, path: "/" },
        { icon: CheckSquare, label: t.nav.todo, path: "/todo" },
        { icon: Calendar, label: t.nav.calendar, path: "/calendar" },
        { icon: CloudSun, label: t.nav.weather, path: "/weather" },
        { icon: Calculator, label: t.nav.calculator, path: "/calculator" },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // --- КОНТЕНТ МЕНЮ ---
    const MenuContent = () => (
        <>
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3 font-black text-2xl text-[#37352F]">
                    <div className="w-8 h-8 bg-[#37352F] rounded-lg flex items-center justify-center text-white text-sm">A</div>
                    AnwarApp
                </div>
                {/* Кнопка закрытия (БОЛЬШАЯ и УДОБНАЯ) */}
                <button
                    onClick={onClose}
                    className="md:hidden p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <X size={28} />
                </button>
            </div>

            <nav className="space-y-2 flex-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={clsx(
                                "flex items-center gap-4 px-4 py-4 text-base rounded-2xl transition-all", // Увеличили отступы для пальцев
                                isActive
                                    ? "bg-black text-white shadow-lg shadow-gray-300 font-bold"
                                    : "text-gray-500 hover:bg-gray-100 font-medium"
                            )}
                        >
                            <item.icon size={24} className={isActive ? "opacity-100" : "opacity-70"} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto space-y-3 pt-6 border-t border-gray-100">
                <button
                    onClick={toggleLang}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-white border border-gray-100 text-gray-600 font-bold uppercase tracking-wider"
                >
                    <Languages size={20} /> {lang === 'en' ? 'English' : 'Русский'}
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-red-50 text-red-500 font-bold"
                >
                    <LogOut size={20} /> {t.nav.logout}
                </button>
            </div>
        </>
    );

    // 1. ДЕСКТОП (Слева, ширина 64)
    const desktopSidebar = (
        <div className="hidden md:flex fixed top-0 left-0 min-h-screen w-64 bg-[#F7F7F5] border-r border-[#E9E9E7] p-6 flex-col z-10">
            <MenuContent />
        </div>
    );

    // 2. МОБИЛЬНОЕ МЕНЮ (НА ВЕСЬ ЭКРАН)
    const mobileSidebar = isOpen ? createPortal(
        <div className="fixed inset-0 z-[99999] md:hidden bg-[#F7F7F5] p-6 flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* ☝️ ТУТ ГЛАВНОЕ:
                - fixed inset-0 (на весь экран)
                - z-[99999] (поверх всего)
                - bg-[#F7F7F5] (непрозрачный фон)
             */}
            <MenuContent />
        </div>,
        document.body
    ) : null;

    return (
        <>
            {desktopSidebar}
            {mobileSidebar}
        </>
    );
}