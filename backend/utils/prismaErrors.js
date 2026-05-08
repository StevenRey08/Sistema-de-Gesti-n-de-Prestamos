function getPrismaTarget(error) {
    const target = error?.meta?.target;

    if (Array.isArray(target)) return target;
    if (typeof target === "string" && target.trim() !== "") return [target];
    return [];
}

function buildUniqueConstraintError(error, fieldMessages, fallbackMessage) {
    if (error?.code !== "P2002") return null;

    const targets = getPrismaTarget(error);
    const matchedMessages = targets
        .map((target) => {
            // Intento de coincidencia exacta
            if (fieldMessages[target]) return fieldMessages[target];
            
            // Intento de coincidencia parcial (ej. si el target es "personas_numero_documento_key")
            const foundKey = Object.keys(fieldMessages).find(key => 
                target.toLowerCase().includes(key.toLowerCase())
            );
            return foundKey ? fieldMessages[foundKey] : null;
        })
        .filter(Boolean);

    if (matchedMessages.length > 0) {
        return {
            status: 400,
            body: {
                error: "Registro Duplicado",
                detalles: matchedMessages,
            },
        };
    }

    return {
        status: 400,
        body: {
            error: "Registro Duplicado",
            detalles: [fallbackMessage],
        },
    };
}

module.exports = { buildUniqueConstraintError };
