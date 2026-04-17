export default function ActivityFeed() {
    const activities = [
        { id: 1, text: "Nuevo préstamo: Sierra Circular", time: "Hace 5 min", color: "bg-blue-500" },
        { id: 2, text: "Herramienta devuelta: Pinzas", time: "Hace 20 min", color: "bg-green-500" },
    ];

    return (
        <div className="space-y-4">
            {activities.map(act => (
                <div key={act.id} className="flex gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full ${act.color}`} />
                    <div>
                        <p className="text-sm text-gray-700">{act.text}</p>
                        <p className="text-xs text-gray-400">{act.time}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
