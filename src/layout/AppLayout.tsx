import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F7F7F5]">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* 👇 ГЛАВНОЕ ИСПРАВЛЕНИЕ ТУТ: md:ml-64
                Мы говорим: "На десктопе (md) сделай отступ слева (ml)
                на 64 единицы (ширина меню)".
            */}
            <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300">

                {/* Мобильная шапка */}
                <header className="md:hidden flex items-center justify-between p-4 bg-[#F7F7F5] border-b border-[#E9E9E7] sticky top-0 z-30">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs">
                            A
                        </div>
                        AnwarApp
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-gray-600">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Контент */}
                <main className="p-4 md:p-8 max-w-5xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}