# Documentación API (Español)

Base URL local sugerida: `http://localhost:3000`

Autenticación:
- Tipo: `Bearer Token`
- Header: `Authorization: Bearer <token>`
- Obtener token en `POST /auth/login`

## Módulo Auth
- `POST /auth/register` Registro público (rol fijo `ANALISTA`)
- `POST /auth/login` Login por email/password
- `GET /auth/me` Perfil autenticado

## Módulo Users
- `GET /users/me` Perfil propio
- `PATCH /users/me` Actualizar perfil propio
- `PATCH /users/me/password` Cambiar contraseña
- `PATCH /users/me/avatar` Subir avatar
- `POST /users` Crear usuario (ADMINISTRADOR)
- `GET /users` Listar usuarios (ADMINISTRADOR)
- `GET /users/:id` Detalle usuario (ADMINISTRADOR)
- `PATCH /users/:id` Actualizar usuario (ADMINISTRADOR)
- `PATCH /users/:id/role` Cambiar rol (ADMINISTRADOR)
- `DELETE /users/:id` Eliminar usuario (ADMINISTRADOR)

## Módulo Charging Points
Público:
- `GET /charging-points/public`
- `GET /charging-points/public/pdf`
- `GET /charging-points/public/:id`
- `GET /charging-points/public/:id/pdf`

Privado:
- `GET /charging-points`
- `GET /charging-points/:id`
- `POST /charging-points` (ADMINISTRADOR)
- `PATCH /charging-points/:id` (ADMINISTRADOR)
- `PATCH /charging-points/:id/image` (ADMINISTRADOR)
- `DELETE /charging-points/:id` (ADMINISTRADOR)

## Módulo Shift Logs
- `POST /shift-logs/start`
- `PATCH /shift-logs/finish`
- `GET /shift-logs/me`
- `GET /shift-logs/me/pdf`
- `GET /shift-logs` (ADMINISTRADOR)

## Módulo Activities
- `POST /activities`
- `GET /activities/mine`
- `GET /activities/prioritarias`
- `GET /activities` (ADMINISTRADOR)
- `GET /activities/:id`
- `GET /activities/:id/pdf`
- `PATCH /activities/:id`
- `PATCH /activities/:id/status`
- `DELETE /activities/:id`

## Módulo Activity Comments
- `POST /activity-comments/:activityId`
- `GET /activity-comments/:activityId`

## Módulo Attachments
- `POST /attachments/:activityId/upload`
- `GET /attachments/:activityId`
- `GET /attachments/file/:attachmentId`

## Módulo Notifications
- `GET /notifications/me`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/me/read-many`

## Módulo Audit Logs
- `GET /audit-logs` (ADMINISTRADOR)

## Módulo Reports
- `GET /reports/health`

## Errores comunes
- `400` Validación de DTO o regla de negocio
- `401` Token faltante o inválido
- `403` Usuario sin permisos por rol
- `404` Recurso no encontrado

## Swagger
- URL: `http://localhost:3000/api/docs`
