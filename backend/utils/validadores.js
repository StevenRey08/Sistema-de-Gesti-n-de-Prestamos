const esUUID = (id) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
};

const esEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const esTelefono = (tel) => {
    const regex = /^\d{3}-\d{3}-\d{4}$/;
    return regex.test(tel);
};

// Validador para formato Cédula Dominicana: 000-0000000-0
const esCedula = (cedula) => {
    const regex = /^\d{3}-\d{7}-\d{1}$/;
    return regex.test(cedula);
};

// Validador para formato Matrícula: 0000-0000
const esMatricula = (matricula) => {
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(matricula);
};

// Asegúrate de agregar esMatricula aquí abajo
module.exports = { esUUID, esEmail, esTelefono, esCedula, esMatricula };