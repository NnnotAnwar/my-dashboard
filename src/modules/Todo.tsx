import { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Trash2, Check, Loader2, Sparkles,
    Calendar as CalendarIcon, Clock, CheckCheck,
    ShieldAlert, ArrowLeft, X, GripHorizontal
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AdminPanel } from "./AdminPanel";

// --- ТИПЫ И КОНСТАНТЫ ---
interface TodoItem {
    id: string;
    title: string;
    is_completed: boolean;
    due_date: string | null;
    category: string;
}

const CATEGORIES = [
    { id: "home", label: "Дом", color: "bg-emerald-100 text-emerald-700", icon: "🏠" },
    { id: "work", label: "Работа", color: "bg-blue-100 text-blue-700", icon: "💼" },
    { id: "study", label: "Учеба", color: "bg-violet-100 text-violet-700", icon: "🎓" },
    { id: "shop", label: "Покупки", color: "bg-orange-100 text-orange-700", icon: "🛒" },
];

// --- API ---
const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Нет авторизации");
    return user;
};

const fetchTodos = async () => {
    const user = await getUser();
    const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("is_completed", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data as TodoItem[];
};

const fetchUserRole = async () => {
    const user = await getUser();
    const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (error) return "user";
    return data?.role || "user";
};

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
        .select().single();
    if (error) throw error;
    return data;
};

const toggleTodoStatus = async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
    const { error } = await supabase.from("todos").update({ is_completed: !isCompleted }).eq("id", id);
    if (error) throw error;
};

const deleteTodoItem = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) throw error;
};

const deleteCompletedTodos = async () => {
    const user = await getUser();
    const { error } = await supabase.from("todos").delete().eq("user_id", user.id).eq("is_completed", true);
    if (error) throw error;
};

const markAllAsCompleted = async () => {
    const user = await getUser();
    const { error } = await supabase.from("todos").update({ is_completed: true }).eq("user_id", user.id).eq("is_completed", false);
    if (error) throw error;
};

// --- КОМПОНЕНТ ОДНОЙ ЗАДАЧИ (СВАЙПЫ) ---
function SwipeableTodoItem({ todo, toggle, remove }: { todo: TodoItem, toggle: any, remove: any }) {
    const x = useMotionValue(0);
    // Меняем цвет фона в зависимости от направления свайпа
    const background = useTransform(
        x,
        [-100, 0, 100],
        ["#ef4444", "#ffffff", "#22c55e"] // Red <- White -> Green
    );

    // Логика окончания свайпа
    const handleDragEnd = (_: any, info: any) => {
        const threshold = 100; // Насколько далеко нужно оттянуть (пиксели)

        if (info.offset.x > threshold) {
            // Свайп ВПРАВО -> Выполнить
            if (navigator.vibrate) navigator.vibrate(50); // Вибрация
            toggle.mutate({ id: todo.id, isCompleted: todo.is_completed });
        } else if (info.offset.x < -threshold) {
            // Свайп ВЛЕВО -> Удалить
            if (navigator.vibrate) navigator.vibrate(50);
            remove.mutate(todo.id);
        }
    };

    const catStyle = CATEGORIES.find(c => c.id === todo.category) || CATEGORIES[0];
    const formatDate = (d: string) => d ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(d)) : null;
    const isOverdue = (d: string) => d ? new Date(d) < new Date(new Date().setHours(0,0,0,0)) : false;

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="relative mb-3 group"
            style={{ touchAction: "pan-y" }} // Важно для скролла на мобильных
        >
            {/* ФОНОВЫЙ СЛОЙ (Иконки действий) */}
            <motion.div
                style={{ background }}
                className="absolute inset-0 rounded-2xl flex items-center justify-between px-6 z-0"
            >
                <Check className="text-white font-bold" size={24} /> {/* Слева (для свайпа вправо) */}
                <Trash2 className="text-white font-bold" size={24} /> {/* Справа (для свайпа влево) */}
            </motion.div>

            {/* ПЕРЕДНИЙ СЛОЙ (Карточка) */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Возвращаем карточку назад
                dragElastic={0.1} // Сопротивление при тяге
                onDragEnd={handleDragEnd}
                style={{ x, background: "white" }}
                className="relative z-10 flex items-start gap-4 p-4 pr-5 border border-gray-100 rounded-2xl shadow-sm active:shadow-lg transition-shadow"
            >
                <button
                    onClick={() => toggle.mutate({ id: todo.id, isCompleted: todo.is_completed })}
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${todo.is_completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-500"}`}
                >
                    {todo.is_completed && <Check size={14} className="text-white" strokeWidth={4} />}
                </button>

                <div className="flex-1 min-w-0 pt-0.5 pointer-events-none select-none"> {/* pointer-events-none чтобы текст не мешал свайпу */}
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${catStyle.color} bg-opacity-50`}>
                            {catStyle.label}
                        </span>
                        {todo.due_date && !todo.is_completed && (
                            <span className={`text-[11px] flex items-center gap-1 font-semibold ${isOverdue(todo.due_date) ? "text-red-500" : "text-gray-400"}`}>
                                <Clock size={10}/> {formatDate(todo.due_date)}
                            </span>
                        )}
                    </div>
                    <span className={`block break-words text-[17px] font-medium leading-snug transition-all ${todo.is_completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {todo.title}
                    </span>
                </div>

                {/* Иконка "хвата" для подсказки (видна только на мобильных или при наведении) */}
                <div className="text-gray-200 group-hover:text-gray-400 transition-colors">
                    <GripHorizontal size={20} />
                </div>
            </motion.div>
        </motion.li>
    );
}

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export function Todo() {
    const [newTodo, setNewTodo] = useState("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("home");
    const [aiMode, setAiMode] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: todos = [], isLoading } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
    const { data: userRole } = useQuery({ queryKey: ['userRole'], queryFn: fetchUserRole });
    const isAdmin = userRole === 'admin';

    const onSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.invalidateQueries({ queryKey: ['weather'] });
    };

    const addMutation = useMutation({ mutationFn: createTodo, onSuccess });
    const toggleMutation = useMutation({ mutationFn: toggleTodoStatus, onSuccess });
    const deleteMutation = useMutation({ mutationFn: deleteTodoItem, onSuccess });
    const deleteCompletedMutation = useMutation({ mutationFn: deleteCompletedTodos, onSuccess: () => { onSuccess(); setShowDeleteModal(false); } });
    const markAllMutation = useMutation({ mutationFn: markAllAsCompleted, onSuccess });

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newTodo.trim()) return;

        if (aiMode) {
            await handleAiGenerate();
        } else {
            addMutation.mutate({ title: newTodo, date: selectedDate || null, category: selectedCategory });
            setNewTodo("");
            setSelectedDate("");
        }
    };

    // Исправленный AI генератор (JSON Mode)
    const handleAiGenerate = async () => {
        if (!newTodo.trim()) return;
        setAiLoading(true);
        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
            // 1. Включаем JSON режим
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            // 2. Строгий промпт
            const prompt = `
                Ты — планировщик задач.
                Твоя цель: разбить задачу "${newTodo}" на 3-6 конкретных, коротких шагов.
                Формат ответа: Строгий JSON массив строк. 
                Пример: ["Купить билеты", "Собрать чемодан", "Вызвать такси"]
                НЕ пиши никаких рассуждений, только массив.
            `;

            const result = await model.generateContent(prompt);
            const textAnswer = result.response.text();

            if (textAnswer) {
                // Очистка и парсинг
                const cleanJson = textAnswer.replace(/```json|```/g, "").trim();
                const tasks: string[] = JSON.parse(cleanJson);

                setNewTodo("");

                for (const task of tasks) {
                    if (task && typeof task === 'string') {
                        await addMutation.mutateAsync({
                            title: task,
                            date: selectedDate || null,
                            category: selectedCategory
                        });
                        await new Promise(r => setTimeout(r, 300));
                    }
                }
            }
        } catch (e) {
            console.error("AI Error:", e);
        } finally {
            setAiLoading(false);
            setAiMode(false);
        }
    };

    const formatDate = (d: string) => d ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(d)) : null;
    const currentCat = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

    if (showAdminPanel) return <div className="max-w-4xl mx-auto p-4"><button onClick={() => setShowAdminPanel(false)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black font-medium"><ArrowLeft size={20} /> Назад</button><AdminPanel /></div>;
    if (isLoading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={32}/></div>;

    return (
        <div className="max-w-2xl mx-auto px-4 pb-20 overflow-x-hidden"> {/* overflow-hidden чтобы свайпы не шатали экран */}
            {/* ЗАГОЛОВОК */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#202124] tracking-tight mb-1">Задачи</h1>
                    <p className="text-gray-400 font-medium">
                        {todos.filter(t => !t.is_completed).length} активных
                    </p>
                </div>
                {isAdmin && <button onClick={() => setShowAdminPanel(true)} className="text-red-500 bg-red-50 p-2 rounded-xl hover:bg-red-100 transition-colors"><ShieldAlert size={20}/></button>}
            </div>

            {/* SMART INPUT */}
            <div className={`relative mb-10 transition-all duration-300 ${aiMode ? "shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)]" : "shadow-xl shadow-gray-100"}`}>
                <div className={`bg-white rounded-3xl p-2 pl-4 flex items-center gap-3 border transition-colors ${aiMode ? "border-purple-200 ring-2 ring-purple-50" : "border-transparent"}`}>

                    {/* Кнопка категорий */}
                    <div className="relative">
                        <button
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-transform active:scale-95 ${currentCat.color}`}
                        >
                            {currentCat.icon}
                        </button>
                        <AnimatePresence>
                            {isCategoryOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-12 left-0 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 z-20 min-w-[140px]"
                                >
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { setSelectedCategory(cat.id); setIsCategoryOpen(false); }}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${selectedCategory === cat.id ? "bg-gray-50 text-black" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                                        >
                                            <span>{cat.icon}</span> {cat.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                        placeholder={aiMode ? "Например: Поездка на море..." : "Новая задача..."}
                        className={`flex-1 py-4 bg-transparent outline-none text-lg font-medium placeholder:text-gray-300 ${aiMode ? "text-purple-700 placeholder:text-purple-300" : "text-gray-800"}`}
                        disabled={aiLoading}
                    />

                    <div className="flex items-center gap-1 pr-1">
                        <div className="relative">
                            <button
                                onClick={() => dateInputRef.current?.showPicker()}
                                className={`p-3 rounded-xl transition-all hover:bg-gray-50 active:scale-95 ${selectedDate ? "text-blue-600 bg-blue-50" : "text-gray-400"}`}
                            >
                                <CalendarIcon size={20} />
                                {selectedDate && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>}
                            </button>
                            <input type="date" ref={dateInputRef} onChange={(e) => setSelectedDate(e.target.value)} className="absolute opacity-0 w-0 h-0" />
                        </div>

                        <button
                            onClick={() => setAiMode(!aiMode)}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${aiMode ? "text-white bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-200" : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"}`}
                        >
                            <Sparkles size={20} className={aiMode ? "animate-pulse" : ""} />
                        </button>

                        <button
                            onClick={() => handleSubmit()}
                            disabled={!newTodo.trim() || aiLoading}
                            className={`ml-2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:active:scale-100 ${
                                aiMode ? "bg-black text-white" : "bg-black text-white hover:bg-gray-800"
                            }`}
                        >
                            {aiLoading ? <Loader2 className="animate-spin" size={20}/> : <Plus size={24} />}
                        </button>
                    </div>
                </div>
                {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-8 left-4 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <Clock size={12}/> {formatDate(selectedDate)}
                        <button onClick={() => setSelectedDate("")}><X size={12} className="hover:text-blue-800"/></button>
                    </motion.div>
                )}
            </div>

            {/* СПИСОК ЗАДАЧ (ТЕПЕРЬ СО СВАЙПАМИ) */}
            <motion.ul layout className="space-y-0"> {/* space-y-0 потому что margin внутри компонента */}
                <AnimatePresence mode="popLayout">
                    {todos.map((todo) => (
                        <SwipeableTodoItem
                            key={todo.id}
                            todo={todo}
                            toggle={toggleMutation}
                            remove={deleteMutation}
                        />
                    ))}
                </AnimatePresence>
            </motion.ul>

            {/* Пустое состояние */}
            {todos.length === 0 && !isLoading && (
                <div className="text-center py-20 opacity-50">
                    <div className="text-6xl mb-4">🥥</div>
                    <p className="text-gray-500 font-medium">Задач пока нет</p>
                </div>
            )}

            {/* ФУТЕР ДЕЙСТВИЙ */}
            {todos.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-gray-200/50 z-50">
                    {todos.some(t => !t.is_completed) && (
                        <button onClick={() => markAllMutation.mutate()} className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-2">
                            <CheckCheck size={14} /> Все сделано
                        </button>
                    )}
                    {todos.some(t => t.is_completed) && (
                        <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
                            <Trash2 size={14} /> Очистить
                        </button>
                    )}
                </div>
            )}

            {/* МОДАЛКА УДАЛЕНИЯ */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white p-6 rounded-[32px] shadow-2xl max-w-sm w-full">
                            <h3 className="text-xl font-bold text-center mb-2">Уверены?</h3>
                            <p className="text-gray-500 text-center text-sm mb-6">Выполненные задачи исчезнут.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200 transition-colors">Нет</button>
                                <button onClick={() => deleteCompletedMutation.mutate()} className="flex-1 py-3 bg-black font-bold rounded-xl text-white hover:bg-gray-800 transition-colors">Да, удалить</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}