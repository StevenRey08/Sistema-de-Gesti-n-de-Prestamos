const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Firmas de archivos de imagen (magic bytes)
const IMAGE_SIGNATURES = {
    'ffd8ff': 'image/jpeg',
    '89504e47': 'image/png',
    '47494638': 'image/gif',
    '52494646': 'image/webp',  // WEBP (los bytes 8-11 deben ser 'WEBP')
};

const uploadDir = 'uploads/inventario';

// Configuración del almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro de archivos (solo imágenes con verificación de magic bytes)
const fileFilter = (req, file, cb) => {
    // Primera verificación por mimetype
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('No es una imagen válida. Por favor sube solo archivos de imagen.'), false);
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Límite de 2MB
});

// Middleware para validar magic bytes del archivo ya subido
const validarImagenSubida = (req, res, next) => {
    if (!req.file) return next();

    const buffer = Buffer.alloc(12);
    try {
        const fd = fs.openSync(req.file.path, 'r');
        fs.readSync(fd, buffer, 0, 12, 0);
        fs.closeSync(fd);
    } catch {
        return res.status(400).json({ status: "error", mensaje: "Error al validar la imagen" });
    }

    const header = buffer.toString('hex', 0, 4);
    const esValida = Object.keys(IMAGE_SIGNATURES).some(sig => header.startsWith(sig));

    if (!esValida) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ status: "error", mensaje: "El archivo no es una imagen válida" });
    }

    next();
};

module.exports = { upload, validarImagenSubida };
