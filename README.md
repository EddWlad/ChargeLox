# ChargeLox

Webapp para monitoreo y administración de puntos de carga y electrolineras para vehículos eléctricos KIA y JAC.

## Estado actual

El proyecto ya incluye:

- backend funcional en NestJS (JWT, roles, PostgreSQL, uploads, auditoría, PDFs),
- seed de datos para pruebas,
- documentación API en Swagger/Postman,
- frontend Angular funcional conectado al backend real.

## Stack

- Backend: NestJS 11, TypeScript, TypeORM, PostgreSQL, JWT
- Frontend: Angular 20 (standalone components, rutas protegidas, interceptor JWT)
- Base de datos: PostgreSQL 16 con Docker Compose
- Archivos: almacenamiento local en `uploads/`
- Reportes: PDFKit

## Estructura principal

- `AGENTS.md`
- `design/`
- `apps/backend/`
- `apps/frontend/`
- `.env.example`
- `docker-compose.yml`
- `README.md`

## Requisitos previos

- Node.js 22+
- npm 11+
- Docker Desktop

## Configuración backend (desde cero)

1. Clonar el proyecto y entrar a la raíz.
2. Copiar variables de entorno:
   - copiar `.env.example` a `.env`
3. Levantar PostgreSQL:
   - `docker compose up -d`
4. Instalar dependencias backend:
   - `cd apps/backend`
   - `npm install`
5. Ejecutar migraciones:
   - `npm run migration:run`
6. Ejecutar seed:
   - `npm run seed`
7. Ejecutar API:
   - `npm run start:dev`

Swagger quedará en: `http://localhost:3000/api/docs`

## Configuración frontend Angular

Con el backend ya corriendo en `http://localhost:3000`:

1. Ir a frontend:
   - `cd apps/frontend`
2. Instalar dependencias:
   - `npm install`
3. Ejecutar frontend:
   - `npm start`
4. Abrir:
   - `http://localhost:4200`

Notas:

- El frontend usa `proxy.conf.json` para enrutar `/api` hacia `http://localhost:3000`.
- No necesitas habilitar CORS adicional para desarrollo local si usas `npm start` en frontend.

## Variables de entorno backend

Archivo base: `.env.example` en la raíz.

Variables principales:

- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `ACTIVITIES_UPLOAD_DIR`
- `AVATARS_UPLOAD_DIR`
- `CHARGING_POINTS_UPLOAD_DIR`
- `TECHNICAL_EVIDENCE_UPLOAD_DIR`
- `MAX_FILE_SIZE_BYTES`
- `ALLOWED_FILE_MIME_TYPES`
- `TECHNICAL_EVIDENCE_STORAGE` (`auto` | `local` | `cloudinary`)
- `CLOUDINARY_CLOUD_NAME` (opcional)
- `CLOUDINARY_API_KEY` (opcional)
- `CLOUDINARY_API_SECRET` (opcional)
- `CLOUDINARY_UPLOAD_FOLDER` (opcional)

Notas de despliegue:

- En producción, configure `TECHNICAL_EVIDENCE_STORAGE=cloudinary` junto con `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.
- No suba credenciales reales al repositorio; manténgalas solo en `.env` o variables del servidor.

## Credenciales de prueba (seed)

- Administrador:
  - `admin@chargelox.com`
  - `Password123*`
- Supervisor:
  - `supervisor1@chargelox.com`
  - `Password123*`
- Técnico:
  - `benjamin@chargelox.com`
  - `123456`
- Analista:
  - `edison.morocho@inpsercom.com`
  - `123456`
-Gestor de visitas
  - `katty@chargelox.com`
  - `123456`

## Frontend implementado

Módulos/pantallas disponibles:

- Login + registro público
- Dashboard
- Perfil propio
- Puntos de carga/electrolineras (listado + detalle)`r`n- Carga masiva UI preparada (pendiente endpoint backend de importación Excel para procesamiento real)
- Turnos de monitoreo
- Actividades (novedades y seguimientos)
- Detalle de actividad con comentarios y adjuntos
- Actividades técnicas de operación (listado, detalle, comentarios, evidencias, historial, PDF)
- Notificaciones
- Gestión de usuarios (solo ADMINISTRADOR)
- Auditoría (solo ADMINISTRADOR)
- Vista pública de estaciones

Capacidades clave frontend:

- autenticación JWT,
- interceptor bearer automático,
- guards de autenticación y rol,
- manejo de carga/error en DOM,
- diseño responsive en español,
- tipado fuerte con modelos TypeScript.

## Documentación API

- Swagger: `http://localhost:3000/api/docs`
- Documento resumido: `apps/backend/docs/api-es.md`
- Colección Postman: `apps/backend/docs/postman/ChargeLox.postman_collection.json`
- Guía paso a paso de endpoints: [README-ENDPOINTS.md](README-ENDPOINTS.md)

## Módulos backend

- `auth`
- `users`
- `charging-points`
- `shift-logs`
- `activities`
- `activity-comments`
- `attachments`
- `notifications`
- `audit-logs`
- `reports`
- `technical-activities`

## Calidad y build

Backend (`apps/backend`):

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

Frontend (`apps/frontend`):

- `npm run build`

## Archivos adjuntos y auditoría

- Adjuntos guardados localmente (carpetas de `uploads/`) con metadata en DB.
- Auditoría registra `CREATE/UPDATE/DELETE` en entidades clave con actor y fecha.
