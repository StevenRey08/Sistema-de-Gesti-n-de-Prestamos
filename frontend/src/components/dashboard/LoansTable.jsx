function LoansTable() {
    const prestamos = [
        { herramienta: 'Taladro Bosch', persona: 'Juan Pérez', fecha: '08/04/2026', estado: 'Pendiente' },
        { herramienta: 'Multímetro digital', persona: 'María López', fecha: '07/04/2026', estado: 'Devuelto' },
        { herramienta: 'Juego de llaves', persona: 'Carlos Ruiz', fecha: '05/04/2026', estado: 'Vencido' },
        { herramienta: 'Oscilloscopio', persona: 'Ana Torres', fecha: '09/04/2026', estado: 'Pendiente' },
        { herramienta: 'Soldador eléctrico', persona: 'Luis Gómez', fecha: '03/04/2026', estado: 'Vencido' },
    ]

    const estadoColor = {
        Pendiente: 'bg-amber-50 text-amber-700',
        Devuelto: 'bg-green-50 text-green-700',
        Vencido: 'bg-red-50 text-red-700',
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">Préstamos recientes</p>
            </div>
            <table className="w-full">
                <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-medium">Herramienta</th>
                        <th className="text-left px-5 py-3 font-medium">Persona</th>
                        <th className="text-left px-5 py-3 font-medium">Fecha</th>
                        <th className="text-left px-5 py-3 font-medium">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {prestamos.map((p, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-sm text-gray-700">{p.herramienta}</td>
                            <td className="px-5 py-3 text-sm text-gray-500">{p.persona}</td>
                            <td className="px-5 py-3 text-sm text-gray-400">{p.fecha}</td>
                            <td className="px-5 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${estadoColor[p.estado]}`}>
                                    {p.estado}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default LoansTable