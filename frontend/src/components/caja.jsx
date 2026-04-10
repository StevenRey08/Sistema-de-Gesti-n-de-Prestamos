import React from 'react';

function Caja({ titulo, descripcion }) {
    return (
        <div style={styles.card}>
            <div style={styles.iconDoc}>📄</div>
            <h2 style={styles.title}>{titulo}</h2>
            <p style={styles.description}>{descripcion}</p>
            <button style={styles.button}>
                Gestionar {titulo}
            </button>
        </div>
    );
}

const styles = {
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        width: '280px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default'
    },
    iconDoc: {
        fontSize: '2rem',
        marginBottom: '12px',
        backgroundColor: '#eff6ff',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#1f2937',
        margin: '0 0 8px 0',
        fontFamily: 'sans-serif'
    },
    description: {
        fontSize: '0.9rem',
        color: '#6b7280',
        lineHeight: '1.5',
        marginBottom: '20px',
        flexGrow: 1,
        fontFamily: 'sans-serif'
    },
    button: {
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'background-color 0.2s'
    }
};

export default Caja;