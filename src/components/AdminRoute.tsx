import { Navigate } from "react-router-dom";
import { useUserRole } from "../hooks/useUserRole";
import { AdminPanel } from "../modules/AdminPanel";
import { Loader2 } from "lucide-react";

export function AdminRoute() {
    const { isAdmin, isLoading } = useUserRole();

    if (isLoading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <AdminPanel />;
}
