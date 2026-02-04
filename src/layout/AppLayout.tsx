import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white text-[#37352F]">
            {/* Левая часть - Меню */}
            <Sidebar />

            {/* Правая часть - Контент */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto p-8 sm:p-12">
                    {children}
                </div>
            </main>
        </div>
    );
}