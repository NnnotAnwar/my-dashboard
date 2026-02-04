import { useState } from "react";
import { Delete } from "lucide-react"; // Иконка стирания
import { clsx } from "clsx";

export function Calculator() {
    const [display, setDisplay] = useState("0");
    const [result, setResult] = useState<string | null>(null);

    // Список кнопок для построения сетки
    const buttons = [
        "C", "(", ")", "÷",
        "7", "8", "9", "×",
        "4", "5", "6", "-",
        "1", "2", "3", "+",
        "0", ".", "⌫", "="
    ];

    const handleClick = (btn: string) => {
        // 1. Очистка (C)
        if (btn === "C") {
            setDisplay("0");
            setResult(null);
            return;
        }

        // 2. Удаление последнего символа (⌫)
        if (btn === "⌫") {
            if (display === "Error") {
                setDisplay("0");
            } else {
                setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
            }
            return;
        }

        // 3. Вычисление результата (=)
        if (btn === "=") {
            try {
                // Заменяем красивые значки на понятные компьютеру (* и /)
                const expression = display.replace(/×/g, "*").replace(/÷/g, "/");

                // Опасная функция eval, но для калькулятора допустима, если фильтровать ввод
                // (в реальных крупных проектах используют math.js)
                // eslint-disable-next-line no-new-func
                const calc = new Function(`return ${expression}`)();

                setResult(display + " ="); // Показываем старое выражение сверху
                setDisplay(String(calc)); // Показываем результат
            } catch (error) {
                setDisplay("Error");
            }
            return;
        }

        // 4. Ввод цифр и знаков
        if (display === "0" || display === "Error") {
            // Если на экране 0 или Ошибка, заменяем текст нажатой кнопкой (если это не знак действия)
            if (["+", "-", "×", "÷"].includes(btn)) {
                setDisplay(display + btn);
            } else {
                setDisplay(btn);
            }
        } else {
            // Иначе просто дописываем символ
            setDisplay(display + btn);
        }
    };

    // Функция, определяющая цвет кнопки
    const getButtonClass = (btn: string) => {
        if (btn === "=") return "bg-blue-500 text-white hover:bg-blue-600"; // Кнопка Равно - синяя
        if (["C", "⌫"].includes(btn)) return "text-red-500 bg-red-50 hover:bg-red-100"; // Очистка - красная
        if (["÷", "×", "-", "+"].includes(btn)) return "bg-gray-100 text-orange-600 font-medium"; // Знаки - оранжевые
        return "hover:bg-[#F7F7F5] text-[#37352F]"; // Цифры - обычные
    };

    return (
        <div className="max-w-md">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#37352F] mb-2">Калькулятор</h1>
                <p className="text-gray-500">Для быстрых подсчетов.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E9E9E7] shadow-sm w-[320px]">
                {/* Экран */}
                <div className="mb-4 text-right p-4 bg-[#F7F7F5] rounded-lg h-24 flex flex-col justify-end">
                    {/* Предыдущее вычисление (сереньким сверху) */}
                    {result && <div className="text-sm text-gray-400 mb-1 h-5">{result}</div>}
                    {/* Текущий ввод (крупно) */}
                    <div className="text-3xl font-mono text-[#37352F] overflow-hidden text-ellipsis whitespace-nowrap">
                        {display}
                    </div>
                </div>

                {/* Клавиатура */}
                <div className="grid grid-cols-4 gap-2">
                    {buttons.map((btn) => (
                        <button
                            key={btn}
                            onClick={() => handleClick(btn)}
                            className={clsx(
                                "h-14 text-lg rounded-lg transition-colors flex items-center justify-center active:scale-95",
                                getButtonClass(btn)
                            )}
                        >
                            {btn === "⌫" ? <Delete size={20} /> : btn}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}