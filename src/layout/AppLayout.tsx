import { type ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react"; // Иконка гамбургера

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-white">
            {/* Сайдбар (передаем ему состояние) */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Основной контент */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Мобильная шапка (видна только на md и меньше) */}
                <div className="md:hidden flex items-center p-4 border-b border-[#E9E9E7] bg-white sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="ml-3 font-semibold text-[#37352F]">MyDashboard</span>
                </div>

                {/* Контент страницы */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}