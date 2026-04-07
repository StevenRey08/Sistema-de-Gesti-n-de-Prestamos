import React from "react";
funtion caja({ titulo, descripcion }){
    return (
        <div style={estilos.tarjeta}>
            <h2 style={estilos.titulo}>{titulo}</h2>
            <p style={estilos.descripcion}>{descripcion}</p>
            <button style={estilos.boton}>Ver más</button>
        </div>

    );
}

const estilos = {
    tarjeta: {
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px",
        width: "200px",
        textAlign: "center"
    },
    titulo: {
        fontSize: "18px",
        marginBottom: "8px"
    },
    descripcion: {
        fontSize: "14px",
        marginBottom: "8px"
    },
    boton: {
        padding: "8px 16px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    }
}