import { useLanguage } from "../context/useLanguage";

export function NotFound() {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
            <h2 className="text-4xl font-bold mb-2">{t.notFound.title}</h2>
            <p>{t.notFound.description}</p>
        </div>
    );
}
