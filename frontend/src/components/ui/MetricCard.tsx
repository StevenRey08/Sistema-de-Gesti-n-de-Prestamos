interface MetricCardProps {
    title: string;
    value: string;
    trend: string;
    type: 'primary' | 'success' | 'info' | 'warning';
}

export default function MetricCard({ title, value, trend, type }: MetricCardProps) {
    const colors = {
        primary: "bg-blue-500",
        success: "bg-green-500",
        info: "bg-cyan-500",
        warning: "bg-orange-500"
    };

    const colorClass = colors[type] || colors.primary;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`${colorClass} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
                <span className="text-xl font-bold">#</span>
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-green-600 font-medium">{trend}</p>
            </div>
        </div>
    );
}
