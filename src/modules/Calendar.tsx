import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from "date-fns";
import { ru } from "date-fns/locale"; // Для русского языка
import { ChevronLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { clsx } from "clsx";

export function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());

    // 1. Вычисляем границы календаря для текущего месяца
    // Например: если сейчас Февраль, нам нужно начать показ с 26 Января (понедельник)
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Неделя с понедельника
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    // 2. Создаем массив всех дней, которые нужно отрисовать
    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    // Дни недели для шапки
    const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    // Переключение месяцев
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // 3. Функция "Магия Google": открываем создание события на выбранную дату
    const openGoogleCalendar = (date: Date) => {
        // Форматируем дату в строку YYYYMMDD (формат, который понимает Google)
        const dateStr = format(date, "yyyyMMdd");
        // Ссылка-шаблон для создания события
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${dateStr}/${dateStr}`;
        window.open(url, "_blank");
    };

    return (
        <div className="h-full flex flex-col max-h-[80vh]">
            {/* Шапка календаря */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#37352F] capitalize">
                        {format(currentDate, "LLLL yyyy", { locale: ru })}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Кликни на дату, чтобы создать событие в Google
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={goToToday} className="text-sm font-medium px-3 py-1 hover:bg-[#EFEFEF] rounded transition-colors">
                        Сегодня
                    </button>
                    <div className="flex items-center bg-[#F7F7F5] rounded p-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all">
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all">
                            <ChevronRight size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Сама сетка календаря */}
            <div className="flex-1 border border-[#E9E9E7] rounded-lg overflow-hidden flex flex-col bg-white">
                {/* Дни недели */}
                <div className="grid grid-cols-7 border-b border-[#E9E9E7] bg-[#F7F7F5]">
                    {weekDays.map((day) => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Ячейки дней */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {calendarDays.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, monthStart);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => openGoogleCalendar(day)}
                                className={clsx(
                                    "border-r border-b border-[#E9E9E7] p-2 min-h-[100px] relative group cursor-pointer transition-colors hover:bg-blue-50",
                                    !isCurrentMonth && "bg-[#FBFBFA] text-gray-300" // Серый фон для дней соседнего месяца
                                )}
                            >
                                {/* Номер дня */}
                                <div className="flex justify-between items-start">
                  <span
                      className={clsx(
                          "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                          isToday
                              ? "bg-red-500 text-white"
                              : isCurrentMonth ? "text-[#37352F]" : "text-gray-300"
                      )}
                  >
                    {format(day, "d")}
                  </span>

                                    {/* Иконка плюса при наведении */}
                                    <Plus size={16} className="opacity-0 group-hover:opacity-100 text-blue-400" />
                                </div>

                                {/* Место под события (пока визуальное) */}
                                {isToday && (
                                    <div className="mt-2 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded truncate">
                                        Сегодня
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}