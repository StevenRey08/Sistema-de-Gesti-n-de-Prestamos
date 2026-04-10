# Backend - Sistema de Gestión de Préstamos

Este es el backend del Sistema de Gestión de Préstamos construido con Node.js y Express.

## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado en tu sistema:
- **Node.js** (v14 o superior recomendado)
- **PostgreSQL** para la base de datos.

## Instalación de Dependencias

Cada vez que clones el repositorio desde cero en un nuevo equipo, debes instalar las dependencias necesarias. Abre tu terminal, navega hacia la carpeta `Backend` y ejecuta el siguiente comando:

```bash
npm install
```

Este comando leerá el archivo `package.json` y descargará las siguientes dependencias en la carpeta `node_modules`:

- `express` (^5.2.1): Framework para crear el servidor web y manejar rutas.
- `pg` (^8.20.0): Cliente de PostgreSQL para conectar Node.js con la base de datos.
- `cors` (^2.8.6): Middleware para permitir peticiones desde el frontend (CORS).
- `dotenv` (^17.4.1): Herramienta para cargar la configuración desde un archivo `.env`.

## Configuración del Entorno (.env)

El proyecto requiere variables de entorno para conectarse a la base de datos. Crea un archivo llamado `.env` en la raíz de la carpeta `Backend` con el siguiente contenido (reemplaza con tus propios datos):

```env
DB_USER=postgres
DB_PASSWORD=tu_contrasena
DB_HOST=localhost
DB_PORT=5432
DB_NAME=almacen_web
```

*Nota: Tienes un archivo `BSD.sql` que puedes utilizar para crear la estructura de tu base de datos en PostgreSQL.*

## Ejecución del Proyecto

- Para **iniciar el servidor** principal:
  ```bash
  node index.js
  ```

- Para **comprobar la conexión** con la base de datos (script de pruebas):
  ```bash
  node test-db.js
  ```
