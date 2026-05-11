/**
 * Genera un código numérico aleatorio de máximo 4 dígitos con un prefijo
 * Ejemplo: INV-4829, CAJ-0521
 */
const generarCodigoAleatorio = (prefijo) => {
    // Genera un número aleatorio entre 0 y 999999
    const numero = Math.floor(Math.random() * 1000000);

    // .padStart(6, '0') asegura que siempre tenga 6 números (ej: 7 se convierte en 000007)
    const numeroFormateado = numero.toString().padStart(6, '0');

    return `${prefijo.toUpperCase()}-${numeroFormateado}`;
};

module.exports = { generarCodigoAleatorio };