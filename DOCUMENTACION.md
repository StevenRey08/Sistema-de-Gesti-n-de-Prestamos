# Sistema de Gestión de Préstamos

Aplicación web para la gestión de préstamos de herramientas, control de inventario y seguimiento de movimientos en talleres y almacenes.

---

## Requisitos del Sistema

| Requisito | Versión Mínima |
|---|---|
| Node.js | 18.x |
| PostgreSQL | 14.x |
| npm | 9.x (viene con Node.js) |
| Sistema Operativo | Windows 10+, Linux o macOS |

---

## Stack Tecnológico

### Backend (API REST)
| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 18+ | Entorno de ejecución |
| Express | 5.2.1 | Framework web |
| Prisma | 7.7.0 | ORM y modelado de datos |
| PostgreSQL | 14+ | Base de datos relacional |
| JWT (jsonwebtoken) | 9.0.3 | Autenticación por tokens |
| bcrypt | 6.0.0 | Hash de contraseñas |
| PDFKit | 0.18.0 | Generación de PDF |
| xlsx | 0.18.5 | Exportación a Excel |
| Helmet | 8.1.0 | Seguridad (cabeceras HTTP) |
| Multer | 2.1.1 | Subida de archivos |

### Frontend (Web App)
| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 15.3.1 | Framework React con App Router |
| React | 19.0.0 | Biblioteca de interfaz de usuario |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos utilitarios |

---

## Instalación Paso a Paso

### 1. Clonar o copiar el proyecto

```bash
git clone <url-del-repositorio>
cd Sistema-de-Gesti-n-de-Prestamos
```

### 2. Crear la base de datos en PostgreSQL

Accede a PostgreSQL y crea la base de datos:

```sql
CREATE DATABASE almacen_web;
```

(Opcional) Verifica que la base de datos se creó correctamente:

```sql
\l
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus datos:

```bash
cd backend
copy .env_example .env
```

Edita el archivo `backend/.env`:

```env
DB_USER=postgres
DB_HOST=localhost
DB_PASSWORD=tu_contraseña
DB_NAME=almacen_web
DB_PORT=5432
PORT=4000
FRONTEND_URL=http://localhost:3000

JWT_SECRET=genera_un_hash_seguro_aqui

DATABASE_URL="postgresql://postgres:tu_contraseña@localhost:5432/almacen_web?schema=public"
```

> **Importante:** `JWT_SECRET` debe ser una cadena larga y aleatoria. Ejemplo: `openssl rand -hex 32`

### 4. Instalar dependencias del backend

```bash
cd backend
npm install
```

Esto ejecutará automáticamente `npx prisma generate` (definido en `postinstall`).

### 5. Ejecutar migraciones y sembrar datos

```bash
npm run migrate
```

Este comando hace tres cosas:
1. `npx prisma generate` — genera el cliente Prisma
2. `npx prisma migrate deploy` — aplica las migraciones pendientes
3. `node prisma/seed.js` — inserta datos de demostración

> Si estás en desarrollo y quieres crear una nueva migración, usa:
> ```bash
> npm run migrate:dev
> ```

### 6. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### 7. Iniciar la aplicación

#### Opción A — Script automático (Windows)

Ejecuta `iniciar.vbs` haciendo doble clic. Esto:
- Inicia el backend en el puerto 4000
- Inicia el frontend en el puerto 3000
- Abre `http://localhost:3000` en el navegador

#### Opción B — Terminales separadas

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Servidor en `http://localhost:4000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Aplicación en `http://localhost:3000`

#### Opción C — Producción
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm start
```

---

## Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin` | Administrador (acceso total) |
| `operador` | `operador123` | Operador de taller |
| `auditor` | `auditor123` | Solo lectura |
| `cmejia` | `carlos123` | Operador |
| `rsantana` | `rosa123` | Operador |

---

## Estructura del Proyecto

```
Sistema-de-Gesti-n-de-Prestamos/
│
├── iniciar.vbs                        # Script de inicio rápido (Windows)
├── DOCUMENTACION.md                    # Este archivo
│
├── backend/
│   ├── index.js                        # Punto de entrada del servidor
│   ├── package.json
│   ├── .env                            # Variables de entorno (NO COMMITEAR)
│   ├── .env_example                    # Plantilla para .env
│   ├── db.js                           # Conexión a Prisma + PostgreSQL
│   │
│   ├── controllers/                    # Lógica de negocio (18 controladores)
│   ├── routes/                         # Definición de rutas Express (18 archivos)
│   ├── middlewares/                    # Middleware de auth y permisos
│   ├── utils/                          # Utilidades (logger, validadores, etc.)
│   ├── uploads/                        # Archivos subidos (imágenes, etc.)
│   │
│   └── prisma/
│       ├── schema.prisma               # Modelo de datos
│       ├── seed.js                     # Datos de demostración
│       └── migrations/                 # Migraciones de base de datos
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts                  # Configuración de Next.js
│   │
│   └── src/
│       ├── app/                        # Páginas (App Router)
│       │   ├── reportes/
│       │   ├── seguridad/
│       │   ├── prestamos/
│       │   ├── inventario/
│       │   └── ...
│       │
│       ├── components/                 # Componentes React
│       │   ├── auth/                   # Proveedor de autenticación
│       │   ├── catalogos/              # Formularios
│       │   ├── layout/                 # Sidebar, Topbar, AppShell
│       │   ├── seguridad/              # Componentes de seguridad
│       │   └── ui/                     # Componentes compartidos
│       │
│       └── lib/                        # Utilidades y tipos
│           ├── api.ts                  # Cliente HTTP
│           ├── auth.ts                 # Lógica de autenticación
│           ├── types.ts                # Interfaces TypeScript
│           └── errors.ts               # Manejo de errores
│
└── scratch/                            # Archivos temporales/experimentales
```

---

## Principales Funcionalidades

### Módulos del Sistema
| Módulo | Descripción |
|---|---|
| Dashboard | Panel de control con estadísticas |
| Inventario | Gestión de herramientas y materiales |
| Préstamos | Registrar y gestionar préstamos |
| Personas | Beneficiarios (estudiantes, profesores, externos) |
| Categorías | Clasificación de herramientas |
| Ubicaciones | Estantes, cajas, talleres y almacenes |
| Movimientos | Historial de entradas, salidas y traslados |
| Pedidos | Órdenes de abastecimiento |
| Reportes | Estadísticas (bajo stock, más/menos prestados, vencidos) |
| Seguridad | Usuarios, roles, permisos, sesiones, auditoría |

### Tipos de Reporte
- **Bajo Stock** — herramientas con disponibilidad 0 o negativa
- **Más Prestados** — herramientas con mayor cantidad de préstamos
- **Menos Prestados** — herramientas con menor cantidad de préstamos
- **Préstamos Vencidos** — préstamos que no han sido devueltos a tiempo

---

## Comandos Útiles

### Backend
| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar en modo desarrollo con recarga automática |
| `npm start` | Iniciar en modo producción |
| `npm run migrate` | Aplicar migraciones y sembrar datos |
| `npm run migrate:dev` | Crear nueva migración y sembrar datos |
| `npx prisma studio` | Abrir interfaz gráfica de la base de datos |
| `npx prisma generate` | Regenerar el cliente Prisma |

### Frontend
| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo (puerto 3000) |
| `npm run build` | Compilar para producción |
| `npm start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar linter |

---

## Mantenimiento de Base de Datos

### Crear una nueva migración (después de cambiar schema.prisma)
```bash
cd backend
npx prisma migrate dev --name descripcion_del_cambio
```

### Restablecer la base de datos (borra todo y vuelve a crear)
```bash
cd backend
npx prisma migrate reset
```

### Sembrar datos nuevamente (sin borrar)
```bash
cd backend
node prisma/seed.js
```

---

## Solución de Problemas

### Error: `No se pudo conectar al servidor`
- Verifica que PostgreSQL esté corriendo
- Verifica que `DATABASE_URL` en `.env` sea correcta
- Ejecuta `npm run migrate` para asegurar que la base de datos esté actualizada

### Error: `Token inválido o expirado`
- Cierra sesión y vuelve a iniciar
- Si persiste, limpia el localStorage del navegador

### Error: `No tienes permisos...`
- Inicia sesión con `admin`/`admin` que tiene acceso total
- Verifica que los permisos estén asignados correctamente en Seguridad → Permisos

### El sidebar no muestra "Reportes"
- Ejecuta `node prisma/seed.js` para crear el módulo `REPORTES` faltante
- O créalo manualmente en la base de datos: `INSERT INTO modulos (id, nombre, descripcion) VALUES (gen_random_uuid(), 'REPORTES', 'Visualización de reportes y estadísticas');`
