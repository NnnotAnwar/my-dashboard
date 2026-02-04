import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Plus, Trash2, Check, Loader2, AlertCircle, Sparkles, Calendar as CalendarIcon, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TodoItem {
    id: string;
    title: string;
    is_completed: boolean;
    due_date: string | null; // Новое поле
}

export function Todo() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [selectedDate, setSelectedDate] = useState<string>(""); // Выбранная дата
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState("");

    // Ссылка на скрытый инпут календаря
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const { data, error } = await supabase
                .from("todos")
                .select("*")
                .order("is_completed", { ascending: true }) // Сначала невыполненные
                .order("due_date", { ascending: true, nullsFirst: false }) // Потом по дате (горящие сверху)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTodos(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (title: string, date: string | null = null) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const tempId = Math.random().toString();
        const tempTodo = { id: tempId, title: title, is_completed: false, due_date: date };

        setTodos((prev) => [tempTodo, ...prev]);

        try {
            const { data, error } = await supabase
                .from("todos")
                .insert([{ title: title, user_id: user.id, due_date: date ? new Date(date).toISOString() : null }])
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
        addTodo(newTodo, selectedDate || null);
        setNewTodo("");
        setSelectedDate(""); // Сбрасываем дату после добавления
    };

    const handleAiGenerate = async () => {
        if (!newTodo.trim()) { setError("Напиши тему задачи!"); return; }
        setAiLoading(true); setError("");

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Задача: "${newTodo}". Разбей на 3-5 шагов. Ответ только списком через запятую.`;
            const result = await model.generateContent(prompt);
            const textAnswer = result.response.text();

            if (textAnswer) {
                const tasks = textAnswer.split(",").map((t) => t.trim());
                for (const task of tasks) {
                    if (task) await addTodo(task, selectedDate || null); // AI тоже ставит дату, если выбрана
                }
                setNewTodo("");
                setSelectedDate("");
            }
        } catch (err) {
            setError("Ошибка AI. Попробуй позже.");
        } finally {
            setAiLoading(false);
        }
    };

    const deleteCompleted = async () => {
        if (!window.confirm("Удалить выполненные?")) return;
        setTodos((prev) => prev.filter(t => !t.is_completed));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from("todos").delete().eq("user_id", user.id).eq("is_completed", true);
    };

    const toggleTodo = async (id: string, isCompleted: boolean) => {
        setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !isCompleted } : t));
        await supabase.from("todos").update({ is_completed: !isCompleted }).eq("id", id);
    };

    const deleteTodo = async (id: string) => {
        setTodos(todos.filter((t) => t.id !== id));
        await supabase.from("todos").delete().eq("id", id);
    };

    // Функция для красивого формата даты (например "25 окт")
    const formatDate = (dateString: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
    };

    // Проверка на просрочку
    const isOverdue = (dateString: string) => {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Обнуляем время, сравниваем только даты
        return new Date(dateString) < today;
    };

    if (loading) return <div className="p-8 text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin"/> Загрузка...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-[#37352F] mb-6">Мои планы</h1>

            {/* ФОРМА ВВОДА */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2 relative">
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(e)}
                        placeholder="Что нужно сделать?"
                        className="w-full p-3 pl-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/5 outline-none transition-all shadow-sm"
                    />

                    {/* Кнопка выбора даты внутри инпута */}
                    <button
                        type="button"
                        onClick={() => dateInputRef.current?.showPicker()} // Открываем нативный календарь
                        className={`absolute right-2 top-2 bottom-2 px-2 rounded hover:bg-gray-100 transition-colors ${selectedDate ? 'text-blue-600' : 'text-gray-400'}`}
                        title="Выбрать дату"
                    >
                        <CalendarIcon size={20} />
                    </button>

                    {/* Скрытый инпут даты */}
                    <input
                        type="date"
                        ref={dateInputRef}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        value={selectedDate}
                        className="absolute opacity-0 w-0 h-0" // Скрываем, но он работает
                    />
                </div>

                {/* Отображение выбранной даты (если есть) */}
                {selectedDate && (
                    <div className="text-sm text-blue-600 flex items-center gap-1 ml-1">
                        <Clock size={14}/>
                        Срок: {formatDate(selectedDate)}
                        <button onClick={() => setSelectedDate("")} className="text-gray-400 hover:text-red-500 ml-2">✕</button>
                    </div>
                )}

                {/* Кнопки */}
                <div className="flex gap-2">
                    <button
                        onClick={handleManualSubmit}
                        disabled={!newTodo.trim() || aiLoading}
                        className="flex-1 bg-[#37352F] text-white py-3 rounded-lg hover:bg-black transition-colors font-medium flex justify-center items-center gap-2"
                    >
                        <Plus size={18}/> Добавить
                    </button>

                    <button
                        onClick={handleAiGenerate}
                        disabled={!newTodo.trim() || aiLoading}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium shadow-md"
                    >
                        {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        <span>AI Магия</span>
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

            {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
            {todos.length > 0 && todos.some(t => t.is_completed) && (
                <div className="flex justify-end mb-4">
                    <button onClick={deleteCompleted} className="text-xs flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded transition-colors">
                        <Trash2 size={14} /> Очистить выполненные
                    </button>
                </div>
            )}

            {/* СПИСОК ЗАДАЧ */}
            <ul className="space-y-3 pb-20">
                <AnimatePresence initial={false}>
                    {todos.map((todo) => (
                        <motion.li
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="group flex items-start gap-3 p-4 bg-white border border-[#E9E9E7] rounded-lg shadow-sm"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id, todo.is_completed)}
                                className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                    todo.is_completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent"
                                }`}
                            >
                                <Check size={12} strokeWidth={3} />
                            </button>

                            <div className="flex-1 min-w-0">
                <span className={`block break-words ${todo.is_completed ? "line-through text-gray-400" : "text-[#37352F]"}`}>
                  {todo.title}
                </span>

                                {/* ОТОБРАЖЕНИЕ ДАТЫ */}
                                {todo.due_date && !todo.is_completed && (
                                    <div className={`text-xs mt-1 flex items-center gap-1 ${isOverdue(todo.due_date) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                        <CalendarIcon size={12}/>
                                        {formatDate(todo.due_date)}
                                        {isOverdue(todo.due_date) && " (Просрочено!)"}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => deleteTodo(todo.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={18} />
                            </button>
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </div>
    );
}