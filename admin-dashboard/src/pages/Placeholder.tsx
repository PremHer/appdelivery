import { Construction } from 'lucide-react';

interface PlaceholderProps {
    title: string;
    description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
            <Construction size={48} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
            <p className="text-gray-500 mt-2">
                {description || 'Esta sección estará disponible próximamente.'}
            </p>
        </div>
    );
}
