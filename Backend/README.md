# Backend - Sistema de Gestión de Préstamos
Este es el backend del Sistema de Gestión de Préstamos construido con Node.js, Express y Prisma ORM.

# Requisitos Previos
Antes de ejecutar el proyecto, asegúrate de tener instalado:

Node.js (v18 o superior recomendado).

PostgreSQL (Asegúrate de tener activa la extensión pgcrypto).

# Instalación y Configuración Inicial
Si acabas de clonar el repositorio, sigue estos pasos en orden dentro de la carpeta Backend:

# 1. Instalación de dependencias

npm install

# 2. Configuración del Entorno (.env)

Crea un archivo .env en la raíz de la carpeta Backend. Debes configurar la URL de conexión que Prisma utilizará:

Configuración de conexión para Prisma
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/almacen_web?schema=public"

Configuración adicional para el servidor
PORT=4000

# 3. Sincronización de la Base de Datos (Prisma)
Para crear las tablas automáticamente en tu PostgreSQL basadas en el esquema del proyecto, ejecuta:

Bash
npx prisma migrate dev --name init
Esto creará la base de datos, las tablas, las relaciones y la carpeta de migraciones.

# 4. Generar el Cliente de Prisma

--Para que tu editor de código (VS Code) reconozca los modelos y te dé autocompletado:

npx prisma generate

--Comandos Útiles de Prisma

-npx prisma studio: Abre una interfaz visual en el navegador para gestionar los datos de las tablas sin necesidad de SQL.

-npx prisma migrate reset: Borra todos los datos y vuelve a crear las tablas desde cero (útil si el esquema se corrompe).

-npx prisma db push: Sincroniza el esquema rápidamente sin crear archivos de migración (solo para desarrollo).

# Dependencias Principales

@prisma/client: Motor de consultas para interactuar con la base de datos de forma tipada.

express: Framework para el manejo de rutas y lógica de servidor.

cors: Permite la comunicación segura con el frontend.

dotenv: Manejo de variables de entorno sensibles.

# Ejecución del Proyecto
Para iniciar el servidor en modo desarrollo:

node index.js

El servidor estará disponible en http://localhost:4000.

# Notas de Seguridad (Git)
NO subir la carpeta node_modules/.

NO subir el archivo .env.

NO subir la carpeta generated/ (se crea localmente con prisma generate).