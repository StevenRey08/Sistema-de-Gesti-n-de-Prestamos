function ActivityFeed() {
    const actividades = [
        { texto: 'Juan Pérez devolvió Taladro Bosch', tiempo: 'Hace 10 min', tipo: 'devolucion' },
        { texto: 'Nuevo préstamo: Multímetro → Ana Torres', tiempo: 'Hace 25 min', tipo: 'prestamo' },
        { texto: 'Herramienta dañada registrada: Soldador', tiempo: 'Hace 1 hora', tipo: 'dano' },
        { texto: 'Carlos Ruiz agregado al sistema', tiempo: 'Hace 2 horas', tipo: 'persona' },
        { texto: 'Inventario actualizado: +5 llaves Allen', tiempo: 'Hace 3 horas', tipo: 'inventario' },
    ]

    const tipoColor = {
        devolucion: 'bg-green-400',
        prestamo: 'bg-blue-400',
        dano: 'bg-red-400',
        persona: 'bg-purple-400',
        inventario: 'bg-gray-400',
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">Actividad reciente</p>
            </div>
            <div className="px-5 py-3 flex flex-col gap-4">
                {actividades.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${tipoColor[a.tipo]}`} />
                        <div>
                            <p className="text-sm text-gray-700">{a.texto}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{a.tiempo}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ActivityFeed