import { useState, useEffect } from "react";
import { Plus, Trash2, Check, Circle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { supabase } from "../supabaseClient"; // Импортируем наш клиент

interface Task {
    id: number;
    text: string;
    completed: boolean;
}

export function Todo() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(true); // Состояние загрузки

    // 1. ЗАГРУЗКА: Получаем задачи из базы при запуске
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        // Запрос к Supabase: "Дай мне все из таблицы todos, отсортируй по дате создания"
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) console.error('Ошибка загрузки:', error);
        else setTasks(data || []);

        setIsLoading(false);
    };

    // 2. ДОБАВЛЕНИЕ
    const addTask = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && inputValue.trim()) {
            const newTaskText = inputValue;
            setInputValue(""); // Сразу очищаем поле для ощущения скорости

            // Отправляем в базу
            const { data, error } = await supabase
                .from('todos')
                .insert([{ text: newTaskText, completed: false }])
                .select() // Важно: просим вернуть созданную запись (чтобы узнать её ID)
                .single();

            if (error) {
                console.error('Ошибка добавления:', error);
            } else if (data) {
                // Добавляем в локальный стейт только после подтверждения от базы
                setTasks([...tasks, data]);
            }
        }
    };

    // 3. ОБНОВЛЕНИЕ (галочка)
    const toggleTask = async (id: number, currentStatus: boolean) => {
        // Сначала обновляем интерфейс (оптимистичный апдейт), чтобы было мгновенно
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));

        // Потом шлем запрос в базу
        const { error } = await supabase
            .from('todos')
            .update({ completed: !currentStatus })
            .eq('id', id);

        if (error) {
            console.error('Ошибка обновления:', error);
            // Если ошибка — откатываем изменения (можно добавить логику отката)
            fetchTasks();
        }
    };

    // 4. УДАЛЕНИЕ
    const deleteTask = async (id: number) => {
        // Оптимистичное удаление из интерфейса
        setTasks(tasks.filter(t => t.id !== id));

        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Ошибка удаления:', error);
            fetchTasks();
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#37352F] mb-2">Список задач</h1>
                <div className="flex items-center gap-2 text-gray-500">
                    <span>Синхронизировано с облаком</span>
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                </div>
            </div>

            <div className="flex items-center gap-3 mb-6 p-2 rounded hover:bg-[#F7F7F5] transition-colors group">
                <Plus className="text-gray-400" size={20} />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={addTask}
                    placeholder="Нажмите Enter, чтобы добавить задачу..."
                    className="flex-1 bg-transparent border-none outline-none text-[#37352F] placeholder:text-gray-400 h-8"
                />
            </div>

            <div className="space-y-1">
                {!isLoading && tasks.length === 0 && (
                    <div className="text-gray-400 text-sm italic pl-10 mt-4">
                        Список пуст.
                    </div>
                )}

                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="group flex items-center gap-3 p-2 rounded hover:bg-[#F7F7F5] transition-colors"
                    >
                        <button
                            onClick={() => toggleTask(task.id, task.completed)}
                            className={clsx(
                                "flex items-center justify-center w-5 h-5 rounded transition-colors",
                                task.completed ? "text-blue-500" : "text-gray-300 hover:text-gray-400"
                            )}
                        >
                            {task.completed ? <Check size={18} /> : <Circle size={18} />}
                        </button>

                        <span
                            className={clsx(
                                "flex-1 text-sm transition-all cursor-pointer",
                                task.completed ? "text-gray-400 line-through" : "text-[#37352F]"
                            )}
                            onClick={() => toggleTask(task.id, task.completed)}
                        >
              {task.text}
            </span>

                        <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 rounded"
                            title="Удалить"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}