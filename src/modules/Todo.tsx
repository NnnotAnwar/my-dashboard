import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, Check, Loader2, AlertCircle, Sparkles, CheckCheck } from "lucide-react";
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

    // --- НОВЫЕ ФУНКЦИИ ---

    // 1. Отметить все как выполненные
    const markAllCompleted = async () => {
        // Сначала визуально обновляем интерфейс (чтобы было мгновенно)
        setTodos((prev) => prev.map(t => ({ ...t, is_completed: true })));

        // Потом отправляем запрос в базу
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from("todos")
                .update({ is_completed: true })
                .eq("user_id", user.id); // Обновляем ТОЛЬКО свои задачи
        }
    };

    // 2. Удалить ВСЕ задачи
    // Замени старую функцию deleteAll на эту:

    const deleteCompleted = async () => {
        // 1. Считаем, сколько вообще выполнено
        const completedCount = todos.filter(t => t.is_completed).length;

        if (completedCount === 0) return; // Если удалять нечего, ничего не делаем

        if (!window.confirm(`Удалить выполненные задачи (${completedCount} шт)?`)) {
            return;
        }

        // 2. Оставляем в интерфейсе только НЕвыполненные
        setTodos((prev) => prev.filter(t => !t.is_completed));

        // 3. Удаляем из базы только те, где is_completed = true
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from("todos")
                .delete()
                .eq("user_id", user.id)
                .eq("is_completed", true); // <--- Важное условие
        }
    };

    if (loading) return <div className="p-8 text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin"/> Загрузка...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-[#37352F] mb-6">Список задач</h1>

            {/* Форма */}
            {/* Адаптивная форма добавления */}
            <div className="flex flex-col md:flex-row gap-3 mb-8">
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(e)}
                    placeholder="Например: Устроить вечеринку..."
                    className="w-full md:flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all shadow-sm"
                />

                {/* Блок кнопок: на мобильном они растянутся, на ПК будут компактными */}
                <div className="flex gap-2">
                    {/* Кнопка ручного добавления */}
                    <button
                        onClick={handleManualSubmit}
                        disabled={!newTodo.trim() || aiLoading}
                        className="flex-1 md:flex-none bg-white border border-gray-300 text-gray-700 px-4 py-3 md:py-0 rounded-lg hover:bg-gray-50 transition-colors flex justify-center items-center"
                        title="Просто добавить"
                    >
                        <Plus />
                    </button>

                    {/* Кнопка AI Магии */}
                    <button
                        onClick={handleAiGenerate}
                        disabled={!newTodo.trim() || aiLoading}
                        className="flex-1 md:flex-none bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 md:py-0 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium shadow-md whitespace-nowrap"
                        title="Придумать план с AI"
                    >
                        {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        <span>AI План</span>
                    </button>
                </div>
            </div>
            {/* Панель массовых действий (видна, только если есть задачи) */}
            {/* Панель управления (показываем, если есть задачи) */}
            {todos.length > 0 && (
                <div className="flex justify-between items-center mb-4 px-1">
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Всего: {todos.length}
                    </div>

                    <div className="flex gap-2">
                        {/* Кнопка: Выполнить всё (видна, если есть НЕвыполненные) */}
                        {todos.some(t => !t.is_completed) && (
                            <button
                                onClick={markAllCompleted}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                                <CheckCheck size={14} />
                                Отметить всё
                            </button>
                        )}

                        {/* Кнопка: Очистить выполненные (видна ТОЛЬКО если есть выполненные) */}
                        {todos.some(t => t.is_completed) && (
                            <button
                                onClick={deleteCompleted}
                                className="text-xs flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                                <Trash2 size={14} />
                                Очистить ({todos.filter(t => t.is_completed).length})
                            </button>
                        )}
                    </div>
                </div>
            )}
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