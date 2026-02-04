import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TodoItem {
    id: string;
    title: string;
    is_completed: boolean;
}

export function Todo() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false); // Состояние загрузки AI
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const { data, error } = await supabase
                .from("todos")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setTodos(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Обычное добавление задачи
    const addTodo = async (title: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const tempId = Math.random().toString();
        const tempTodo = { id: tempId, title: title, is_completed: false };

        setTodos((prev) => [tempTodo, ...prev]);

        try {
            const { data, error } = await supabase
                .from("todos")
                .insert([{ title: title, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            setTodos((prev) => prev.map(t => t.id === tempId ? data : t));
        } catch (err) {
            setTodos((prev) => prev.filter(t => t.id !== tempId));
            console.error(err);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        addTodo(newTodo);
        setNewTodo("");
    };

    // --- МАГИЯ AI (Через официальную библиотеку) ---
    const handleAiGenerate = async () => {
        if (!newTodo.trim()) {
            setError("Напиши тему задачи!");
            return;
        }

        setAiLoading(true);
        setError("");

        try {
            // 1. Подключаемся к Google AI
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

            // 2. Выбираем модель (самая быстрая и стабильная сейчас)
            //const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Я хочу выполнить задачу: "${newTodo}". 
      Разбей её на 3-5 коротких, конкретных подзадач. 
      Ответь только списком задач через запятую, без нумерации. 
      Пример: Купить билеты, Собрать вещи`;

            // 3. Спрашиваем
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textAnswer = response.text();

            if (textAnswer) {
                // Чистим ответ и разбиваем на массив
                const tasks = textAnswer.split(",").map((t) => t.trim());

                for (const task of tasks) {
                    if (task) await addTodo(task);
                }
                setNewTodo("");
            }
        } catch (err: any) {
            console.error("Ошибка AI:", err);
            // Если и тут ошибка - значит проблема в Ключе или Стране
            setError("Не удалось получить ответ. Проверь консоль (F12).");
        } finally {
            setAiLoading(false);
        }
    };

    const deleteTodo = async (id: string) => {
        setTodos(todos.filter((t) => t.id !== id));
        await supabase.from("todos").delete().eq("id", id);
    };

    const toggleTodo = async (id: string, isCompleted: boolean) => {
        setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !isCompleted } : t));
        await supabase.from("todos").update({ is_completed: !isCompleted }).eq("id", id);
    };

    if (loading) return <div className="p-8 text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin"/> Загрузка...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-[#37352F] mb-6">Список задач</h1>

            {/* Форма */}
            <div className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(e)}
                    placeholder="Например: Устроить вечеринку..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all shadow-sm"
                />

                {/* Кнопка ручного добавления */}
                <button
                    onClick={handleManualSubmit}
                    disabled={!newTodo.trim() || aiLoading}
                    className="bg-white border border-gray-300 text-gray-700 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Просто добавить"
                >
                    <Plus />
                </button>

                {/* Кнопка AI Магии */}
                <button
                    onClick={handleAiGenerate}
                    disabled={!newTodo.trim() || aiLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium shadow-md"
                    title="Придумать план с AI"
                >
                    {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    <span className="hidden md:inline">AI План</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Список */}
            <ul className="space-y-3">
                <AnimatePresence initial={false}>
                    {todos.map((todo) => (
                        <motion.li
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="group flex items-center gap-3 p-4 bg-white border border-[#E9E9E7] rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id, todo.is_completed)}
                                className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all ${
                                    todo.is_completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent"
                                }`}
                            >
                                <Check size={14} />
                            </button>
                            <span className={`flex-1 ${todo.is_completed ? "line-through text-gray-400" : ""}`}>
                {todo.title}
              </span>
                            <button onClick={() => deleteTodo(todo.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                                <Trash2 size={18} />
                            </button>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </div>
    );
}