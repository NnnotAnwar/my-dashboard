import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";

export async function fetchUserRole(): Promise<"user" | "admin"> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "user";
    const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
    if (error) return "user";
    return (data?.role === "admin" ? "admin" : "user") as "user" | "admin";
}

export function useUserRole() {
    const { data: role, isLoading } = useQuery({
        queryKey: ["userRole"],
        queryFn: fetchUserRole,
    });
    return { role: role ?? "user", isAdmin: role === "admin", isLoading };
}
