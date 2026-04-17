import React from 'react';

export default function LoansTable() {
    const loans = [
        { id: 1, persona: "Juan Pérez", item: "Multímetro", fecha: "15/04/2026", estado: "Pendiente" },
        { id: 2, persona: "Ana Marte", item: "Taladro", fecha: "14/04/2026", estado: "Entregado" },
    ];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-gray-400 text-xs uppercase border-b border-gray-100">
                        <th className="pb-3 font-medium">Persona</th>
                        <th className="pb-3 font-medium">Herramienta</th>
                        <th className="pb-3 font-medium">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 text-sm font-medium text-gray-800">{loan.persona}</td>
                            <td className="py-4 text-sm text-gray-600">{loan.item}</td>
                            <td className="py-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${loan.estado === 'Pendiente'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                    {loan.estado}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
