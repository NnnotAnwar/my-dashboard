import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, Check, Loader2, AlertCircle } from "lucide-react";
// 1. Импортируем магию анимации
import { motion, AnimatePresence } from "framer-motion";

interface TodoItem {
    id: string;
    title: string;
    is_completed: boolean;
}

export function Todo() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const { data, error } = await supabase
                .from("todos")
                .select("*")
                .order("created_at", { ascending: false }); // Новые сверху

            if (error) throw error;
            setTodos(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        // 1. Сначала узнаем, КТО сейчас в сети
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError("Вы не авторизованы!");
            return;
        }

        // Оптимистичное обновление (показываем сразу)
        const tempId = Math.random().toString();
        const tempTodo = { id: tempId, title: newTodo, is_completed: false };

        setTodos([tempTodo, ...todos]);
        setNewTodo("");

        try {
            // 2. Явно отправляем user_id вместе с задачей
            const { data, error } = await supabase
                .from("todos")
                .insert([
                    {
                        title: tempTodo.title,
                        user_id: user.id  // <--- ВОТ ЭТО ИСПРАВЛЕНИЕ
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Заменяем фейковую задачу на настоящую из базы
            setTodos((prev) => prev.map(t => t.id === tempId ? data : t));
        } catch (err: any) {
            console.error("Ошибка Supabase:", err); // Смотри детали в консоли (F12)
            setError(err.message || "Не удалось добавить задачу");
            // Если не вышло — убираем фейковую задачу, чтобы не обманывать
            setTodos((prev) => prev.filter(t => t.id !== tempId));
        }
    };

    const toggleTodo = async (id: string, isCompleted: boolean) => {
        // Мгновенно меняем UI
        setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !isCompleted } : t));

        try {
            await supabase.from("todos").update({ is_completed: !isCompleted }).eq("id", id);
        } catch (err) {
            console.error("Ошибка обновления", err);
        }
    };

    const deleteTodo = async (id: string) => {
        // Анимация сработает автоматически при удалении из массива
        setTodos(todos.filter((t) => t.id !== id));

        try {
            await supabase.from("todos").delete().eq("id", id);
        } catch (err) {
            console.error("Ошибка удаления", err);
        }
    };

    if (loading) return <div className="p-8 text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin"/> Загружаем задачи...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-[#37352F] mb-6">Список задач</h1>

            {/* Форма добавления */}
            <form onSubmit={addTodo} className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Что нужно сделать?"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all shadow-sm"
                />
                <button
                    type="submit"
                    disabled={!newTodo.trim()}
                    className="bg-[#37352F] text-white px-6 rounded-lg hover:bg-black transition-colors disabled:opacity-50 font-medium"
                >
                    <Plus />
                </button>
            </form>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* АНИМИРОВАННЫЙ СПИСОК */}
            <ul className="space-y-3">
                <AnimatePresence initial={false}>
                    {todos.map((todo) => (
                        <motion.li
                            key={todo.id}
                            // Настройки анимации:
                            layout // Плавное перемещение других элементов
                            initial={{ opacity: 0, y: 20 }} // Появление: прозрачный и чуть ниже
                            animate={{ opacity: 1, y: 0 }}  // Статика: видно и на месте
                            exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }} // Удаление: влево
                            className="group flex items-center gap-3 p-4 bg-white border border-[#E9E9E7] rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id, todo.is_completed)}
                                className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all ${
                                    todo.is_completed
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "border-gray-300 hover:border-gray-400 text-transparent"
                                }`}
                            >
                                <Check size={14} strokeWidth={3} />
                            </button>

                            <span
                                className={`flex-1 text-[#37352F] transition-all ${
                                    todo.is_completed ? "line-through text-gray-400" : ""
                                }`}
                            >
                {todo.title}
              </span>

                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                                title="Удалить"
                            >
                                <Trash2 size={18} />
                            </button>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>

            {todos.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400 mt-10"
                >
                    Пока задач нет. Отдыхай! 🌴
                </motion.div>
            )}
        </div>
    );
}