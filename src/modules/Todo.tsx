import { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Trash2, Check, Loader2, AlertCircle, Sparkles,
    Calendar as CalendarIcon, Clock, CheckCheck, ShieldAlert, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AdminPanel } from "./AdminPanel";

// --- 1. ТИПЫ И КОНСТАНТЫ ---
interface TodoItem {
    id: string;
    title: string;
    is_completed: boolean;
    due_date: string | null;
    category: string;
}

const CATEGORIES = [
    { id: "home", label: "Дом", color: "bg-green-100 text-green-700 border-green-200", icon: "🏠" },
    { id: "work", label: "Работа", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "💼" },
    { id: "study", label: "Учеба", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "🎓" },
    { id: "shop", label: "Покупки", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "🛒" },
];

// --- 2. API ФУНКЦИИ (КУРЬЕРЫ) ---

// Получить текущего юзера (хелпер)
const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Нет авторизации");
    return user;
};

// Загрузка задач
const fetchTodos = async () => {
    const user = await getUser();
    const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id) // Важно: фильтруем по юзеру
        .order("is_completed", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TodoItem[];
};

// Проверка роли админа
const fetchUserRole = async () => {
    const user = await getUser();
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (error) return "user";
    return data?.role || "user";
};

// Добавление задачи
const createTodo = async (newItem: { title: string; date: string | null; category: string }) => {
    const user = await getUser();
    const { data, error } = await supabase
        .from("todos")
        .insert([{
            title: newItem.title,
            user_id: user.id,
            due_date: newItem.date ? new Date(newItem.date).toISOString() : null,
            category: newItem.category
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Переключение статуса (Галочка)
const toggleTodoStatus = async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
    const { error } = await supabase
        .from("todos")
        .update({ is_completed: !isCompleted })
        .eq("id", id);
    if (error) throw error;
};

// Удаление одной задачи
const deleteTodoItem = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) throw error;
};

// Удаление выполненных
const deleteCompletedTodos = async () => {
    const user = await getUser();
    const { error } = await supabase
        .from("todos")
        .delete()
        .eq("user_id", user.id)
        .eq("is_completed", true);
    if (error) throw error;
};

// Отметить все как выполненные
const markAllAsCompleted = async () => {
    const user = await getUser();
    const { error } = await supabase
        .from("todos")
        .update({ is_completed: true })
        .eq("user_id", user.id)
        .eq("is_completed", false);
    if (error) throw error;
};


// --- 3. КОМПОНЕНТ ---
export function Todo() {
    // Локальное состояние только для формы (UI)
    const [newTodo, setNewTodo] = useState("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("home");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient(); // Главный пульт управления кэшем

    // --- HOOKS: ЗАПРОСЫ (READ) ---

    // 1. Грузим задачи
    const { data: todos = [], isLoading, isError } = useQuery({
        queryKey: ['todos'],
        queryFn: fetchTodos,
    });

    // 2. Грузим роль
    const { data: userRole } = useQuery({
        queryKey: ['userRole'],
        queryFn: fetchUserRole,
    });

    const isAdmin = userRole === 'admin';

    // --- HOOKS: МУТАЦИИ (WRITE) ---
    // Общая функция обновления кэша: после любого изменения мы просим "Перезагрузи список!"
    const onSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.invalidateQueries({ queryKey: ['weather'] }); // Обновим и счетчик на дашборде
    };

    const addMutation = useMutation({ mutationFn: createTodo, onSuccess });
    const toggleMutation = useMutation({ mutationFn: toggleTodoStatus, onSuccess });
    const deleteMutation = useMutation({ mutationFn: deleteTodoItem, onSuccess });
    const deleteCompletedMutation = useMutation({ mutationFn: deleteCompletedTodos, onSuccess: () => { onSuccess(); setShowDeleteModal(false); } });
    const markAllMutation = useMutation({ mutationFn: markAllAsCompleted, onSuccess });

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        // Вызываем мутацию
        addMutation.mutate({
            title: newTodo,
            date: selectedDate || null,
            category: selectedCategory
        });

        setNewTodo("");
        setSelectedDate("");
    };

    const handleAiGenerate = async () => {
        if (!newTodo.trim()) { setAiError("Напиши тему задачи!"); return; }
        setAiLoading(true); setAiError("");

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Или 2.0, если доступна

            const prompt = `Задача: "${newTodo}". Разбей на 3-5 конкретных коротких шагов. Ответ дай только списком через запятую, без лишних слов.`;
            const result = await model.generateContent(prompt);
            const textAnswer = result.response.text();

            if (textAnswer) {
                const tasks = textAnswer.split(",").map((t) => t.trim());
                for (const task of tasks) {
                    if (task) {
                        // Используем mutateAsync, чтобы ждать завершения каждой задачи
                        await addMutation.mutateAsync({
                            title: task,
                            date: selectedDate || null,
                            category: selectedCategory
                        });
                        // Небольшая задержка для красоты
                        await new Promise(r => setTimeout(r, 150));
                    }
                }
                setNewTodo(""); setSelectedDate("");
            }
        } catch (_) {
            setAiError("Ошибка AI. Проверь ключ.");
        } finally {
            setAiLoading(false);
        }
    };

    // Хелперы для отображения
    const formatDate = (d: string) => d ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(d)) : null;
    const isOverdue = (d: string) => d ? new Date(d) < new Date(new Date().setHours(0,0,0,0)) : false;
    const getCategoryStyle = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

    // --- РЕНДЕР ---

    if (showAdminPanel) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <button onClick={() => setShowAdminPanel(false)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black font-medium transition-colors">
                    <ArrowLeft size={20} /> Назад к моим задачам
                </button>
                <AdminPanel />
            </div>
        );
    }

    if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={32}/></div>;

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black text-[#202124] tracking-tight">Мои планы</h1>
                {isAdmin && (
                    <button onClick={() => setShowAdminPanel(true)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm border border-red-100">
                        <ShieldAlert size={16} /> Admin Console
                    </button>
                )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 whitespace-nowrap ${selectedCategory === cat.id ? cat.color + " ring-2 ring-gray-100 border-transparent scale-105" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"}`}>
                            <span>{cat.icon}</span> {cat.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 relative mb-4">
                    <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(e)} placeholder="Что планируем сегодня?" className="w-full p-4 pl-5 pr-12 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all text-gray-700" />
                    <button type="button" onClick={() => dateInputRef.current?.showPicker()} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${selectedDate ? 'text-blue-600' : 'text-gray-400'}`}><CalendarIcon size={20} /></button>
                    <input type="date" ref={dateInputRef} onChange={(e) => setSelectedDate(e.target.value)} value={selectedDate} className="absolute opacity-0 w-0 h-0" />
                </div>
                {selectedDate && <div className="text-xs text-blue-600 mb-4 font-bold flex items-center gap-2 bg-blue-50 p-2 rounded-lg w-fit"><Clock size={14}/> Срок: {formatDate(selectedDate)} <button onClick={() => setSelectedDate("")} className="text-gray-400 hover:text-red-500 ml-2">✕</button></div>}
                <div className="flex gap-3">
                    <button onClick={handleManualSubmit} disabled={!newTodo.trim() || aiLoading || addMutation.isPending} className="flex-1 bg-[#202124] text-white py-3.5 rounded-xl hover:bg-black transition-all font-bold flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50">
                        {addMutation.isPending ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>} Добавить
                    </button>
                    <button onClick={handleAiGenerate} disabled={!newTodo.trim() || aiLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl hover:opacity-90 transition-all font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100">
                        {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} AI План
                    </button>
                </div>
            </div>

            {(isError || aiError) && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex gap-3 items-center border border-red-100 animate-shake"><AlertCircle size={20}/> {aiError || "Ошибка загрузки данных"}</div>}

            {todos.length > 0 && (
                <div className="flex justify-between items-center mb-6 px-1">
                    {todos.some(t => !t.is_completed) ? (
                        <button onClick={() => markAllMutation.mutate()} className="text-xs flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold transition-colors"><CheckCheck size={16} /> Выполнить все</button>
                    ) : (
                        <span className="text-xs text-green-600 font-bold flex items-center gap-2"><Check size={16} /> Все цели достигнуты!</span>
                    )}
                    {todos.some(t => t.is_completed) && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="text-xs flex items-center gap-2 text-red-500 hover:text-red-700 font-bold"
                        >
                            <Trash2 size={16} /> Очистить
                        </button>
                    )}
                </div>
            )}

            <ul className="space-y-4 pb-20">
                <AnimatePresence initial={false}>
                    {todos.map((todo) => {
                        const catStyle = getCategoryStyle(todo.category);
                        return (
                            <motion.li key={todo.id} layout initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, x: -20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className="group flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                                <button
                                    onClick={() => toggleMutation.mutate({ id: todo.id, isCompleted: todo.is_completed })}
                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todo.is_completed ? "bg-green-500 border-green-500 text-white" : "border-gray-200 hover:border-blue-400"}`}
                                >
                                    <Check size={14} strokeWidth={4} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-black tracking-wider uppercase ${catStyle.color}`}>{catStyle.icon} {catStyle.label}</span>
                                        {todo.due_date && !todo.is_completed && <span className={`text-[10px] flex items-center gap-1 font-bold ${isOverdue(todo.due_date) ? "text-red-500" : "text-gray-400"}`}><Clock size={12}/> {formatDate(todo.due_date)}</span>}
                                    </div>
                                    <span className={`block break-words text-lg font-medium leading-tight ${todo.is_completed ? "line-through text-gray-300" : "text-gray-800"}`}>{todo.title}</span>
                                </div>
                                <button onClick={() => deleteMutation.mutate(todo.id)} className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                            </motion.li>
                        );
                    })}
                </AnimatePresence>
            </ul>

            {/* КАСТОМНОЕ МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><Trash2 size={24} /></div>
                            <h3 className="text-xl font-black text-gray-800 mb-2">Удалить задачи?</h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">Все выполненные задачи будут стерты навсегда. Это действие нельзя отменить.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors">Отмена</button>
                                <button onClick={() => deleteCompletedMutation.mutate()} className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95">
                                    {deleteCompletedMutation.isPending ? "Удаление..." : "Да, удалить"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}