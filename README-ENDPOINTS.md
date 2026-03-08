# ChargeLox - Guía Paso a Paso para Probar TODOS los Endpoints

Esta guía está pensada para probar endpoint por endpoint en Postman, en un orden que evita bloqueos por dependencias (IDs, auth, roles).

## 1) Pre-requisitos

1. Levantar PostgreSQL (Docker):
   - En la raíz del proyecto: `docker compose up -d`
2. Backend:
   - `cd apps/backend`
   - `npm install`
   - `npm run migration:run`
   - `npm run seed`
   - `npm run start:dev`

## 2) Variables sugeridas en Postman (Environment)

Crear un environment `ChargeLox Local` con:

- `baseUrl` = `http://localhost:3000`
- `tokenAdmin` = *(vacío al inicio)*
- `tokenAnalista` = *(vacío al inicio)*
- `userId` = *(vacío)*
- `chargingPointId` = *(vacío)*
- `activityId` = *(vacío)*
- `attachmentId` = *(vacío)*
- `notificationId` = *(vacío)*

## 3) Endpoints de Sistema

### 3.1 Health

- Método: `GET`
- URL: `{{baseUrl}}/health`
- Auth: No
- Esperado: `200` con `status: "ok"`

### 3.2 Swagger

- Método: `GET`
- URL: `{{baseUrl}}/`
- Auth: No
- Esperado: redirección a `{{baseUrl}}/api/docs`

---

## 4) Módulo Auth

### 4.1 Registro público (ANALISTA)

- Método: `POST`
- URL: `{{baseUrl}}/auth/register`
- Auth: No
- Body JSON:

```json
{
  "nombres": "Analista Demo",
  "apellidos": "QA",
  "email": "analista.demo@chargelox.com",
  "password": "Password123*"
}
```

- Esperado: `201` / `200` con usuario creado
- Nota: el rol siempre será `ANALISTA`.

### 4.2 Login ADMIN

- Método: `POST`
- URL: `{{baseUrl}}/auth/login`
- Auth: No
- Body JSON:

```json
{
  "email": "admin@chargelox.com",
  "password": "Password123*"
}
```

- Esperado: `200` con `accessToken`
- Guardar token en `tokenAdmin`.

### 4.3 Login ANALISTA

- Método: `POST`
- URL: `{{baseUrl}}/auth/login`
- Body JSON:

```json
{
  "email": "analista1@chargelox.com",
  "password": "Password123*"
}
```

- Esperado: `200` con `accessToken`
- Guardar token en `tokenAnalista`.

### 4.4 Perfil autenticado

- Método: `GET`
- URL: `{{baseUrl}}/auth/me`
- Auth: Bearer `{{tokenAdmin}}` o `{{tokenAnalista}}`
- Esperado: `200` con datos del usuario actual

---

## 5) Módulo Users

## 5.1 Perfil propio

### 5.1.1 Ver perfil

- `GET {{baseUrl}}/users/me`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`

### 5.1.2 Actualizar perfil

- `PATCH {{baseUrl}}/users/me`
- Auth: Bearer `{{tokenAnalista}}`
- Body:

```json
{
  "nombres": "Analista Actualizado",
  "apellidos": "Monitoreo"
}
```

- Esperado: `200`

### 5.1.3 Cambiar contraseña

- `PATCH {{baseUrl}}/users/me/password`
- Auth: Bearer `{{tokenAnalista}}`
- Body:

```json
{
  "passwordActual": "Password123*",
  "nuevaPassword": "Password123*"
}
```

- Esperado: `200`

### 5.1.4 Subir avatar

- `PATCH {{baseUrl}}/users/me/avatar`
- Auth: Bearer `{{tokenAnalista}}`
- Body: `form-data`
  - `avatar` (file)
- Esperado: `200` con `avatarUrl`

## 5.2 Gestión admin de usuarios

### 5.2.1 Crear usuario

- `POST {{baseUrl}}/users`
- Auth: Bearer `{{tokenAdmin}}`
- Body:

```json
{
  "nombres": "Usuario Admin Crea",
  "apellidos": "Demo",
  "email": "usuario.creado@chargelox.com",
  "password": "Password123*",
  "rol": "ANALISTA",
  "activo": true
}
```

- Esperado: `201` / `200`
- Guardar `id` en `userId`.

### 5.2.2 Listar usuarios

- `GET {{baseUrl}}/users?page=1&limit=10&search=analista`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

### 5.2.3 Ver usuario por id

- `GET {{baseUrl}}/users/{{userId}}`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

### 5.2.4 Actualizar usuario

- `PATCH {{baseUrl}}/users/{{userId}}`
- Auth: Bearer `{{tokenAdmin}}`
- Body:

```json
{
  "nombres": "Usuario Editado",
  "activo": true
}
```

- Esperado: `200`

### 5.2.5 Cambiar rol

- `PATCH {{baseUrl}}/users/{{userId}}/role`
- Auth: Bearer `{{tokenAdmin}}`
- Body:

```json
{
  "rol": "ANALISTA"
}
```

- Esperado: `200`

### 5.2.6 Eliminar usuario

- `DELETE {{baseUrl}}/users/{{userId}}`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

---

## 6) Módulo Charging Points

## 6.1 Públicos

### 6.1.1 Listado público

- `GET {{baseUrl}}/charging-points/public?page=1&limit=10`
- Auth: No
- Esperado: `200` (sin `serial` ni `puk`)

### 6.1.2 Listado público PDF

- `GET {{baseUrl}}/charging-points/public/pdf`
- Auth: No
- Esperado: descarga PDF

### 6.1.3 Detalle público

- `GET {{baseUrl}}/charging-points/public/{{chargingPointId}}`
- Auth: No
- Esperado: `200` (sin `serial` ni `puk`)

### 6.1.4 Detalle público PDF

- `GET {{baseUrl}}/charging-points/public/{{chargingPointId}}/pdf`
- Auth: No
- Esperado: descarga PDF

## 6.2 Privados

### 6.2.1 Crear punto/electrolinera (admin)

- `POST {{baseUrl}}/charging-points`
- Auth: Bearer `{{tokenAdmin}}`
- Body:

```json
{
  "nombre": "Punto Demo",
  "codigoAsignado": "CP-DEMO-001",
  "serial": "SERIAL-DEMO-001",
  "puk": "PUK-DEMO-001",
  "prioridad": "ALTA",
  "estado": "LIBRE",
  "estadoConexion": "OK",
  "puerto": "1",
  "tipo": "PUNTO_CARGA"
}
```

- Esperado: `201` / `200`
- Guardar `id` en `chargingPointId`.

### 6.2.2 Listado privado

- `GET {{baseUrl}}/charging-points?page=1&limit=10`
- Auth: Bearer `{{tokenAnalista}}` o `{{tokenAdmin}}`
- Esperado: `200` (incluye sensibles)

### 6.2.3 Detalle privado

- `GET {{baseUrl}}/charging-points/{{chargingPointId}}`
- Auth: Bearer `{{tokenAnalista}}` o `{{tokenAdmin}}`
- Esperado: `200`

### 6.2.4 Actualizar (admin)

- `PATCH {{baseUrl}}/charging-points/{{chargingPointId}}`
- Auth: Bearer `{{tokenAdmin}}`
- Body:

```json
{
  "estadoConexion": "CONECTANDO",
  "prioridad": "MEDIA"
}
```

- Esperado: `200`

### 6.2.5 Subir imagen (admin)

- `PATCH {{baseUrl}}/charging-points/{{chargingPointId}}/image`
- Auth: Bearer `{{tokenAdmin}}`
- Body: form-data
  - `image` (file)
- Esperado: `200`

### 6.2.6 Eliminar (admin)

- `DELETE {{baseUrl}}/charging-points/{{chargingPointId}}`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

---

## 7) Módulo Shift Logs

### 7.1 Iniciar turno

- `POST {{baseUrl}}/shift-logs/start`
- Auth: Bearer `{{tokenAnalista}}`
- Body:

```json
{}
```

- Esperado: `201` / `200` con turno `ABIERTO`

### 7.2 Finalizar turno

- `PATCH {{baseUrl}}/shift-logs/finish`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200` con turno `CERRADO`

### 7.3 Historial propio

- `GET {{baseUrl}}/shift-logs/me?page=1&limit=10`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`

### 7.4 Historial propio PDF

- `GET {{baseUrl}}/shift-logs/me/pdf`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: descarga PDF

### 7.5 Historial global (admin)

- `GET {{baseUrl}}/shift-logs?page=1&limit=10`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

---

## 8) Módulo Activities

### 8.1 Crear actividad

- `POST {{baseUrl}}/activities`
- Auth: Bearer `{{tokenAnalista}}`
- Body:

```json
{
  "tipoActividad": "NOVEDAD",
  "prioridad": "ALTA",
  "descripcion": "Actividad de prueba desde Postman",
  "estado": "EN_REVISION"
}
```

- Esperado: `201` / `200`
- Guardar `id` en `activityId`.

### 8.2 Listar actividades propias

- `GET {{baseUrl}}/activities/mine?page=1&limit=10`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`

### 8.3 Listar prioritarias

- `GET {{baseUrl}}/activities/prioritarias`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`

### 8.4 Listado global (admin)

- `GET {{baseUrl}}/activities?page=1&limit=10`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

### 8.5 Detalle actividad

- `GET {{baseUrl}}/activities/{{activityId}}`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`

### 8.6 PDF actividad

- `GET {{baseUrl}}/activities/{{activityId}}/pdf`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: descarga PDF

### 8.7 Actualizar actividad

- `PATCH {{baseUrl}}/activities/{{activityId}}`
- Auth: Bearer `{{tokenAnalista}}`
- Body:

```json
{
  "descripcion": "Descripción actualizada",
  "prioridad": "MEDIA"
}
```

- Esperado: `200`

### 8.8 Cambiar estado

- `PATCH {{baseUrl}}/activities/{{activityId}}/status`
- Auth: Bearer `{{tokenAnalista}}`
- Body:

```json
{
  "estado": "EN_PROCESO"
}
```

- Esperado: `200`

### 8.9 Eliminar actividad

- `DELETE {{baseUrl}}/activities/{{activityId}}`
- Auth: Bearer `{{tokenAnalista}}` o `{{tokenAdmin}}`
- Esperado: `200`

---

## 9) Módulo Activity Comments

### 9.1 Agregar comentario

- `POST {{baseUrl}}/activity-comments/{{activityId}}`
- Auth: Bearer `{{tokenAnalista}}`
- Body:

```json
{
  "comentario": "Comentario de prueba",
  "estadoNuevo": "EN_PROCESO"
}
```

- Esperado: `201` / `200`

### 9.2 Listar comentarios de actividad

- `GET {{baseUrl}}/activity-comments/{{activityId}}`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`

---

## 10) Módulo Attachments

### 10.1 Subir adjunto

- `POST {{baseUrl}}/attachments/{{activityId}}/upload`
- Auth: Bearer `{{tokenAnalista}}`
- Body: form-data
  - `file` (archivo)
- Esperado: `201` / `200`
- Guardar `id` en `attachmentId`.

### 10.2 Listar adjuntos

- `GET {{baseUrl}}/attachments/{{activityId}}`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`

### 10.3 Descargar adjunto

- `GET {{baseUrl}}/attachments/file/{{attachmentId}}`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: descarga del archivo

---

## 11) Módulo Notifications

### 11.1 Listar notificaciones propias

- `GET {{baseUrl}}/notifications/me`
- Auth: Bearer `{{tokenAnalista}}`
- Esperado: `200`
- Paso clave: toma 1 o más `id` del resultado y guárdalos.

### 11.2 Marcar una como leída

- `PATCH {{baseUrl}}/notifications/{{notificationId}}/read`
- Auth: Bearer `{{tokenAnalista}}`
- Importante: `notificationId` debe pertenecer al mismo usuario del token.
- Esperado: `200` con la notificación actualizada y `leida: true`.

### 11.3 Marcar varias como leídas

- `PATCH {{baseUrl}}/notifications/me/read-many`
- Auth: Bearer `{{tokenAnalista}}`
- Header: `Content-Type: application/json`
- Body:

```json
{
  "ids": [
    "{{notificationId}}",
    "11111111-1111-1111-1111-111111111111"
  ]
}
```

- Esperado: `200` con conteo de actualizaciones, por ejemplo:

```json
{
  "requested": 2,
  "updated": 1
}
```

## 12) Módulo Audit Logs (Solo ADMIN)

### 12.1 Listar auditoría

- `GET {{baseUrl}}/audit-logs?page=1&limit=10`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

### 12.2 Filtrar por entidad/acción

- `GET {{baseUrl}}/audit-logs?page=1&limit=10&entidad=User&accion=CREATE`
- Auth: Bearer `{{tokenAdmin}}`
- Esperado: `200`

---

## 13) Módulo Reports

### 13.1 Health del módulo reportes

- `GET {{baseUrl}}/reports/health`
- Auth: Bearer `{{tokenAnalista}}` o `{{tokenAdmin}}`
- Esperado: `200` con `{ "status": "ok" }`

---

## 14) Checklist rápido de validación funcional

1. `GET /health` responde OK.
2. `POST /auth/login` (admin y analista) devuelve token.
3. Endpoint admin con token analista devuelve `403`.
4. Endpoint privado sin token devuelve `401`.
5. Público de charging points no muestra `serial`/`puk`.
6. Flujo actividad -> comentario -> adjunto -> PDF funciona.
7. Notificaciones se generan y se pueden marcar como leídas.
8. Auditoría muestra eventos `CREATE/UPDATE/DELETE`.

---

## 15) Errores comunes

- `401 Unauthorized`: faltó token o token vencido.
- `403 Forbidden`: rol insuficiente.
- `400 Bad Request`: DTO inválido o regla de negocio (ej. turno ya abierto).
- `404 Not Found`: id inexistente.
- `409 Conflict`: correo o código asignado duplicado.

---

## 16) Referencias rápidas

- Swagger: `{{baseUrl}}/api/docs`
- Colección Postman base: `apps/backend/docs/postman/ChargeLox.postman_collection.json`
- Documentación API resumida: `apps/backend/docs/api-es.md`
