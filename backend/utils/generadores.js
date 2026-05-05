/**
 * Genera un código numérico aleatorio de máximo 4 dígitos con un prefijo
 * Ejemplo: INV-4829, CAJ-0521
 */
const generarCodigoAleatorio = (prefijo) => {
    // Genera un número aleatorio entre 0 y 9999
    const numero = Math.floor(Math.random() * 10000);

    // .padStart(4, '0') asegura que siempre tenga 4 números (ej: 7 se convierte en 0007)
    const numeroFormateado = numero.toString().padStart(4, '0');

    return `${prefijo.toUpperCase()}-${numeroFormateado}`;
};

module.exports = { generarCodigoAleatorio };