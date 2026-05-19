const { prisma } = require('../db');

let policyCache = null;
let cacheExpiry = null;
const CACHE_TTL = 30 * 1000; // 30 segundos

async function getPoliticas() {
    if (policyCache && cacheExpiry && Date.now() < cacheExpiry) {
        return policyCache;
    }

    try {
        const politicas = await prisma.politicaSeguridad.findMany();
        const map = {};
        for (const p of politicas) {
            map[p.clave] = p.valor;
        }
        policyCache = map;
        cacheExpiry = Date.now() + CACHE_TTL;
        return map;
    } catch (error) {
        return policyCache || {};
    }
}

async function getPolitica(clave) {
    const politicas = await getPoliticas();
    return politicas[clave];
}

function validarPassword(password, politicas) {
    const errores = [];

    const minLength = parseInt(politicas.PASSWORD_MIN_LENGTH || '6');
    if (password.length < minLength) {
        errores.push(`La contraseña debe tener al menos ${minLength} caracteres`);
    }

    if (politicas.PASSWORD_REQUIRE_UPPERCASE === 'true') {
        if (!/[A-Z]/.test(password)) {
            errores.push('La contraseña debe contener al menos una letra mayúscula');
        }
    }

    if (politicas.PASSWORD_REQUIRE_LOWERCASE === 'true') {
        if (!/[a-z]/.test(password)) {
            errores.push('La contraseña debe contener al menos una letra minúscula');
        }
    }

    if (politicas.PASSWORD_REQUIRE_NUMBER === 'true') {
        if (!/\d/.test(password)) {
            errores.push('La contraseña debe contener al menos un número');
        }
    }

    if (politicas.PASSWORD_REQUIRE_SPECIAL === 'true') {
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errores.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)');
        }
    }

    return errores;
}

async function validarPasswordConPoliticas(password) {
    const politicas = await getPoliticas();
    return validarPassword(password, politicas);
}

async function getMaxIntentosFallidos() {
    const valor = await getPolitica('MAX_FAILED_LOGIN_ATTEMPTS');
    return parseInt(valor || '5');
}

async function getDuracionBloqueo() {
    const valor = await getPolitica('LOCKOUT_DURATION_MINUTES');
    return parseInt(valor || '15');
}

async function getTimeoutSesionHoras() {
    const valor = await getPolitica('SESSION_TIMEOUT_HOURS');
    return parseInt(valor || '8');
}

async function getDiasExpiracionPassword() {
    const valor = await getPolitica('PASSWORD_EXPIRY_DAYS');
    return parseInt(valor || '0');
}

function invalidateCache() {
    policyCache = null;
    cacheExpiry = null;
}

module.exports = {
    getPoliticas,
    getPolitica,
    validarPassword,
    validarPasswordConPoliticas,
    getMaxIntentosFallidos,
    getDuracionBloqueo,
    getTimeoutSesionHoras,
    getDiasExpiracionPassword,
    invalidateCache
};
