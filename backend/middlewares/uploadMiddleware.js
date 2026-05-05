const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que la carpeta de subidas existe
const uploadDir = 'uploads/inventario';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración del almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prod-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('No es una imagen válida. Por favor sube solo archivos de imagen.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Límite de 2MB
});

module.exports = upload;
