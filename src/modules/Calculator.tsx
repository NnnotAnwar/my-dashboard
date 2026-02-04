import { useState } from "react";
import { Delete } from "lucide-react";

export function Calculator() {
    const [display, setDisplay] = useState("0");
    const [result, setResult] = useState("");
    const [waitingForNewOperand, setWaitingForNewOperand] = useState(false);

    const operators = ["/", "*", "+", "-"];

    const handlePress = (val: string) => {
        // ЛОГИКА ОСТАЛАСЬ ПРЕЖНЕЙ (ОНА БЫЛА ХОРОШЕЙ)

        // 1. Сброс ошибки
        if (display === "Error") {
            if (val === "AC") {
                setDisplay("0");
                setResult("");
                return;
            }
            if (!operators.includes(val) && val !== "=" && val !== "DEL") {
                setDisplay(val);
                setResult("");
                return;
            }
            return;
        }

        // 2. Очистка (AC)
        if (val === "AC") {
            setDisplay("0");
            setResult("");
            setWaitingForNewOperand(false);
            return;
        }

        // 3. Удаление (DEL)
        if (val === "DEL") {
            if (waitingForNewOperand) return;
            if (display.length === 1) {
                setDisplay("0");
            } else {
                setDisplay(display.slice(0, -1));
            }
            return;
        }

        // 4. Равно (=)
        if (val === "=") {
            calculateResult(true);
            setWaitingForNewOperand(true);
            return;
        }

        // 5. Операторы
        if (operators.includes(val)) {
            setWaitingForNewOperand(false);
            const lastChar = display.slice(-1);
            if (operators.includes(lastChar)) {
                setDisplay(display.slice(0, -1) + val);
                return;
            }
            if (display === "0" && val !== "-") return;
            setDisplay(display + val);
            return;
        }

        // 6. Цифры и точка
        if (val === ".") {
            const parts = display.split(/[\+\-\*\/]/);
            const currentNumber = parts[parts.length - 1];
            if (currentNumber.includes(".")) return;
        }

        if (display === "0" || waitingForNewOperand) {
            setDisplay(val);
            setWaitingForNewOperand(false);
        } else {
            setDisplay(display + val);
        }
    };

    const calculateResult = (isFinal: boolean) => {
        try {
            let expression = display;
            if (operators.includes(expression.slice(-1))) {
                expression = expression.slice(0, -1);
            }

            // eslint-disable-next-line no-new-func
            const func = new Function("return " + expression);
            const res = func();

            if (!isFinite(res) || isNaN(res)) {
                setDisplay("Error");
                return;
            }

            const formatted = parseFloat(res.toFixed(8)).toString();

            if (isFinal) {
                setDisplay(formatted);
                setResult("");
            } else {
                setResult(formatted);
            }
        } catch (e) {
            setDisplay("Error");
        }
    };

    // Компонент кнопки (Google Style)
    const Button = ({ val, type = "num", icon, className = "" }: { val: string, type?: string, icon?: React.ReactNode, className?: string }) => {

        // Базовый стиль кнопок Google
        const baseStyle = "h-14 sm:h-16 text-lg sm:text-xl font-medium rounded-lg transition-all active:scale-95 flex items-center justify-center select-none shadow-sm";

        const colors: Record<string, string> = {
            // Цифры: очень светло-серые, почти белые
            num: "bg-[#f1f3f4] text-[#202124] hover:bg-[#e8eaed]",
            // Операторы и действия: чуть темнее серый
            op: "bg-[#dadce0] text-[#202124] hover:bg-[#d2d5d9]",
            action: "bg-[#dadce0] text-[#202124] hover:bg-[#d2d5d9]", // AC, DEL
            // Равно: фирменный синий Google
            equal: "bg-[#4285f4] text-white hover:bg-[#1b66c9]"
        };

        return (
            <button
                onClick={() => handlePress(val)}
                className={`${baseStyle} ${colors[type] || colors.num} ${className}`}
            >
                {icon || val}
            </button>
        );
    };

    return (
        <div className="max-w-xs mx-auto mt-6 bg-white p-4 rounded-3xl border border-gray-100 shadow-xl">

            {/* Экран */}
            <div className="w-full mb-4 px-2 text-right h-24 flex flex-col justify-end">
                {result && (
                    <div className="text-gray-500 text-sm mb-1 font-medium opacity-80">
                        {result}
                    </div>
                )}
                <div className={`text-4xl font-normal tracking-tight break-all ${display === "Error" ? "text-red-500" : "text-[#202124]"}`}>
                    {display}
                </div>
            </div>

            {/* Клавиатура */}
            <div className="grid grid-cols-4 gap-2">
                {/* Верхний ряд: AC занимает 2 слота вместо % */}
                <Button val="AC" type="action" className="col-span-2 text-base font-bold" />
                <Button val="DEL" type="action" icon={<Delete size={20}/>} />
                <Button val="/" type="op" icon="÷" className="text-2xl" />

                <Button val="7" />
                <Button val="8" />
                <Button val="9" />
                <Button val="*" type="op" icon="×" className="text-2xl" />

                <Button val="4" />
                <Button val="5" />
                <Button val="6" />
                <Button val="-" type="op" icon="−" className="text-2xl" />

                <Button val="1" />
                <Button val="2" />
                <Button val="3" />
                <Button val="+" type="op" icon="+" className="text-2xl" />

                {/* Нижний ряд */}
                <Button val="0" className="col-span-2 rounded-l-lg" />
                <Button val="." />
                {/* Кнопка Равно - синяя */}
                <Button val="=" type="equal" icon="=" className="text-2xl font-bold" />
            </div>
        </div>
    );
}