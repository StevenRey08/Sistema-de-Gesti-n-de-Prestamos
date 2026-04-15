"use client";
import React, { useState } from 'react';
import CategoriaForm from '../../components/catalogos/CategoriaForm.jsx';

export default function CategoriasPage() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Gestión de Categorías</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                    + Nueva Categoría
                </button>
            </div>

            {/* Si el estado showForm es verdadero, mostramos el formulario */}
            {showForm ? (
                <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Registrar Nueva Categoría</h2>
                    <CategoriaForm onSuccess={() => {
                        alert("¡Categoría guardada con éxito!");
                        setShowForm(false);
                    }}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            ) : (
                <div className="bg-gray-800 p-10 rounded-xl border border-dashed border-gray-600 text-center">
                    <p className="text-gray-400">No hay categorías para mostrar. Haz clic en "Nueva Categoría".</p>
                </div>
            )}
        </div>
    );
}