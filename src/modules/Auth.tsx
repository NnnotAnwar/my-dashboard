import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";

export function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false); // Режим: Вход или Регистрация
    const [message, setMessage] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            if (isSignUp) {
                // Регистрация
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage("Регистрация успешна! Теперь войдите.");
                setIsSignUp(false); // Переключаем на вход
            } else {
                // Вход
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage(error.message || "Ошибка авторизации");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F7F7F5] text-[#37352F]">
            <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-[#E9E9E7]">
                <h1 className="text-2xl font-bold mb-2 text-center">
                    {isSignUp ? "Создать аккаунт" : "С возвращением"}
                </h1>
                <p className="text-gray-500 text-center mb-6">
                    {isSignUp ? "Зарегистрируйтесь, чтобы сохранять данные" : "Войдите, чтобы увидеть свои задачи"}
                </p>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
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

                    {message && (
                        <div className={`text-sm p-2 rounded ${message.includes("успешна") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            {message}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-[#37352F] text-white py-2 rounded hover:bg-black transition-colors flex justify-center items-center gap-2 font-medium"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {isSignUp ? "Зарегистрироваться" : "Войти"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {isSignUp ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        {isSignUp ? "Войти" : "Создать"}
                    </button>
                </div>
            </div>
        </div>
    );
}