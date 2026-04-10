import { useState } from "react";

export default function CategoriasPage() {
    // 3. AQUÍ CREAMOS LAS VARIABLES (Esto es lo que te faltaba)
    // nombre: es el valor actual. setNombre: es la función para cambiarlo.
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');

    // 4. La función que maneja el envío del formulario
    const guardar = (e: React.FormEvent) => {
        e.preventDefault(); // Evita que la página se recargue sola
        alert(`Guardando: ${nombre}`);
    };

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-4 text-white">Nueva Categoría</h1>

            <form onSubmit={guardar} className="flex flex-col gap-4 max-w-md">
                <input
                    type="text"
                    placeholder="Nombre de la categoría"
                    className="border p-2 rounded text-black"
                    value={nombre} // Enlazamos el input con nuestra variable
                    onChange={(e) => setNombre(e.target.value)} // Cuando escribas, actualiza la variable
                />

                <textarea
                    placeholder="Descripción"
                    className="border p-2 rounded text-black"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />

                <button
                    type="submit"
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                >
                    Guardar Categoría
                </button>
            </form>
        </div>
    );
}