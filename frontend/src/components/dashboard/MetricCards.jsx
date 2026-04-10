function MetricCards() {
    const metricas = [
        { titulo: 'Total Herramientas', valor: '248', sub: 'En inventario', color: 'bg-blue-50 text-blue-700' },
        { titulo: 'Préstamos activos', valor: '12', sub: 'Pendientes de devolución', color: 'bg-amber-50 text-amber-700' },
        { titulo: 'Herramientas dañadas', valor: '5', sub: 'Requieren revisión', color: 'bg-red-50 text-red-700' },
        { titulo: 'Personas registradas', valor: '87', sub: 'Estudiantes y profesores', color: 'bg-green-50 text-green-700' },
    ]

    return (
        <div className="grid grid-cols-4 gap-4">
            {metricas.map((m) => (
                <div key={m.titulo} className="bg-white rounded-xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.titulo}</p>
                    <p className={`text-3xl font-semibold mt-2 ${m.color.split(' ')[1]}`}>{m.valor}</p>
                    <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
                </div>
            ))}
        </div>
    )
}

export default MetricCards