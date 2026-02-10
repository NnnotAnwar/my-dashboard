import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2, Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function Auth() {
    const { t, lang, toggleLang } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setMessageType(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage(t.auth.success_message);
                setMessageType("success");
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: unknown) {
            const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : t.auth.error_default;
            setMessage(msg);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F7F7F5] text-[#37352F]">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-[#E9E9E7] relative">
                <button
                    type="button"
                    onClick={toggleLang}
                    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors"
                    title={t.nav.lang}
                >
                    <Languages size={18} />
                    {lang === "en" ? "English" : "Русский"}
                </button>
                <h1 className="text-2xl font-bold mb-2 text-center">
                    {isSignUp ? t.auth.title_signup : t.auth.title_signin}
                </h1>
                <p className="text-gray-500 text-center mb-6">
                    {isSignUp ? t.auth.subtitle_signup : t.auth.subtitle_signin}
                </p>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {message && messageType && (
                        <div className={`text-sm p-2 rounded ${messageType === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            {message}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-[#37352F] text-white py-2 rounded hover:bg-black transition-colors flex justify-center items-center gap-2 font-medium"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {isSignUp ? t.auth.button_signup : t.auth.button_signin}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {isSignUp ? t.auth.switch_has_account : t.auth.switch_no_account}{" "}
                    <button
                        type="button"
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(""); setMessageType(null); }}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        {isSignUp ? t.auth.switch_signin : t.auth.switch_signup}
                    </button>
                </div>
            </div>
        </div>
    );
}