import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
    Trash2, Loader2, ShieldAlert, Users, CheckCircle,
    List, ShieldPlus, Search, X
} from "lucide-react";

interface AdminTodo {
    id: string;
    title: string;
    is_completed: boolean;
    user_id: string;
    created_at: string;
    category: string;
}

interface UserProfile {
    id: string;
    role: string;
}

export function AdminPanel() {
    const [todos, setTodos] = useState<AdminTodo[]>([]);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tasks' | 'users'>('tasks');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'tasks') {
                const { data } = await supabase.from("todos").select("*").order("created_at", { ascending: false });
                setTodos(data || []);
            } else {
                const { data } = await supabase.from("profiles").select("*");
                setProfiles(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`Изменить роль пользователя на ${newRole}?`)) return;

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) fetchData();
    };

    const deleteGlobalTodo = async (id: string) => {
        if (!window.confirm("Удалить задачу пользователя безвозвратно?")) return;
        await supabase.from("todos").delete().eq("id", id);
        setTodos(prev => prev.filter(t => t.id !== id));
    };

    // Фильтрация данных по поиску
    const filteredTodos = todos.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredProfiles = profiles.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-500 font-medium">Синхронизация данных...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-8 pb-20">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#202124] tracking-tight flex items-center gap-3">
            <span className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <ShieldAlert size={28} />
            </span>
                        ADMIN PANEL
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Управление ролями и мониторинг активности</p>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto border border-gray-200 shadow-inner">
                    <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Задачи" count={todos.length} />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Люди" count={profiles.length} />
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Всего задач" value={todos.length} icon={<List />} color="blue" />
                <StatCard label="Выполнено" value={todos.filter(t => t.is_completed).length} icon={<CheckCircle />} color="green" />
                <StatCard label="Админы" value={profiles.filter(p => p.role === 'admin').length} icon={<ShieldPlus />} color="purple" />
            </div>

            {/* SEARCH BAR */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder={activeTab === 'tasks' ? "Поиск по названию задачи..." : "Поиск по ID пользователя..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* MAIN CONTENT TABLE */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {activeTab === 'tasks' ? (
                                <>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Задача</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Статус</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Действие</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Роль</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Управление</th>
                                </>
                            )}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {activeTab === 'tasks' ? (
                            filteredTodos.map(todo => (
                                <tr key={todo.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800">{todo.title}</p>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {todo.user_id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {todo.is_completed ?
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">DONE</span> :
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold">WAITING</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => deleteGlobalTodo(todo.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            filteredProfiles.map(profile => (
                                <tr key={profile.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{profile.id}</td>
                                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {profile.role.toUpperCase()}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleRole(profile.id, profile.role)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-all shadow-md active:scale-95"
                                        >
                                            {profile.role === 'admin' ? <Users size={14}/> : <ShieldPlus size={14}/>}
                                            {profile.role === 'admin' ? 'Demote' : 'Promote'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                    {(activeTab === 'tasks' ? filteredTodos : filteredProfiles).length === 0 && (
                        <div className="p-20 text-center text-gray-400 font-medium">Ничего не найдено...</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Вспомогательные компоненты для чистоты кода
function TabButton({ active, onClick, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
        >
            {label} <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-blue-100' : 'bg-gray-200'}`}>{count}</span>
        </button>
    );
}

function StatCard({ label, value, icon, color }: any) {
    const colors: any = {
        blue: "text-blue-600 bg-blue-50",
        green: "text-green-600 bg-green-50",
        purple: "text-purple-600 bg-purple-50"
    };
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-gray-800">{value}</p>
            </div>
        </div>
    );
}