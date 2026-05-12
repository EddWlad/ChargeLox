# Prompt profesional para Codex - Corrección definitiva de favicon, avatar y storage Cloudinary/uploads en ChargeLox

Actúa como un **programador Full Stack Senior con más de 12 años de experiencia** desarrollando, corrigiendo y desplegando aplicaciones empresariales en producción con:

- Angular
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Cloudinary
- Manejo de archivos e imágenes
- Nginx
- PM2
- Docker
- AWS EC2
- JWT
- Guards y roles
- Arquitectura modular
- SOLID
- Clean Code
- UI/UX empresarial
- Vibe Coding con IA
- Diagnóstico de bugs productivos sin romper sistemas existentes

Tu tarea es analizar minuciosamente el proyecto real y corregir dos problemas productivos:

1. El favicon personalizado no aparece en la pestaña; sigue apareciendo el favicon por defecto de Angular.
2. El avatar del perfil se rompe en producción, posiblemente porque se está guardando en `uploads/` local en vez de Cloudinary, o porque se genera/consume una URL incorrecta.

No hagas cambios grandes. No refactorices todo. No cambies arquitectura global. Corrige de forma quirúrgica y validada.

---

## 1. Contexto del proyecto

Estás trabajando sobre **ChargeLox**, una aplicación full stack ya desplegada y utilizada en producción.

Stack conocido:

- **Frontend:** Angular
- **Backend:** NestJS
- **Base de datos:** PostgreSQL
- **ORM:** TypeORM
- **Autenticación:** JWT
- **Autorización:** roles y guards
- **Storage esperado para archivos:** Cloudinary
- **Despliegue:** AWS EC2, PM2, Nginx y PostgreSQL en Docker

La aplicación ya está funcionando en producción, así que cualquier corrección debe ser segura y con bajo impacto.

---

## 2. Regla principal de producción

La aplicación está en producción.

Por lo tanto:

1. No romper backend.
2. No romper frontend.
3. No romper base de datos.
4. No alterar lógica de negocio no relacionada.
5. No cambiar autenticación ni autorización.
6. No tocar módulos no relacionados.
7. No rediseñar la UI.
8. No agregar dependencias pesadas.
9. No crear migraciones salvo que sea estrictamente indispensable.
10. No borrar archivos de producción sin evidencia.
11. No usar comandos destructivos.
12. No usar `DROP`, `TRUNCATE`, `DELETE` masivo ni `migration:revert`.
13. No eliminar `uploads/` en producción sin plan y sin confirmar que no contiene archivos aún referenciados.
14. No inventar resultados.
15. Todo cambio debe ser mínimo, trazable y validado.

---

# 3. Problemas actuales

## Problema A: favicon sigue siendo el de Angular

Aunque Codex creó o reemplazó un favicon, en producción la pestaña del navegador sigue mostrando el favicon por defecto de Angular.

Se debe revisar minuciosamente por qué no aparece el favicon correcto.

Posibles causas:

- El favicon fue creado pero no ubicado en la ruta correcta.
- `index.html` sigue apuntando a `favicon.ico` viejo.
- `angular.json` no incluye el favicon correcto en assets.
- El build no está copiando el nuevo favicon.
- El favicon existe en `src/assets`, pero el navegador busca `/favicon.ico` en raíz.
- Nginx está sirviendo un favicon viejo desde `/usr/share/nginx/html/favicon.ico`.
- El navegador tiene caché agresiva del favicon.
- El deploy no copió el nuevo favicon a la raíz pública.
- El archivo generado no es un `.ico` válido.
- Existe otro favicon en `apps/frontend/public`, `src`, `assets` o `dist` que está ganando prioridad.
- El service worker o caché del navegador está mostrando el viejo.
- El favicon tiene nombre distinto pero `index.html` no lo referencia.

---

## Problema B: avatar de perfil se rompe en producción

Cuando el usuario sube avatar desde **Mi Perfil**, la imagen se rompe visualmente.

Se sospecha que el backend podría estar subiendo archivos a la carpeta local:

```txt
uploads/
```

en vez de Cloudinary, o que la URL guardada/devuelta no es válida en producción.

El requerimiento funcional actual es:

> Todos los archivos, imágenes, PDFs y adjuntos deben subirse a Cloudinary, no depender de almacenamiento local en producción.

Se debe revisar si:

- Avatares están usando storage local.
- Evidencias técnicas están usando Cloudinary correctamente.
- Archivos PDF/adjuntos se están guardando localmente.
- `uploads/` tiene archivos que siguen siendo usados.
- El frontend construye mal la URL del avatar.
- El backend devuelve una ruta relativa como `/uploads/avatar.jpg` que Nginx no sirve.
- La base de datos guarda `avatar_url` local en vez de URL Cloudinary.
- Hay diferencias entre local y producción.
- Variables Cloudinary están incompletas o solo aplican a evidencias técnicas, no a avatares.
- Existe más de un servicio de upload y solo uno usa Cloudinary.

---

# 4. Objetivo principal

Realizar un diagnóstico completo y aplicar correcciones quirúrgicas para que:

1. El favicon de ChargeLox aparezca correctamente en la pestaña del navegador en producción.
2. El avatar del usuario se suba, guarde y renderice correctamente.
3. El sistema use Cloudinary para archivos/imágenes/adjuntos según el requerimiento actual.
4. La carpeta `uploads/` sea revisada y se determine si aún se usa, si debe quedar ignorada, o si debe mantenerse solo para desarrollo/local.
5. No se rompa ningún módulo existente.

---

# 5. Análisis obligatorio del favicon

Antes de modificar, revisar:

```txt
apps/frontend/
apps/frontend/src/
apps/frontend/src/index.html
apps/frontend/angular.json
apps/frontend/src/assets/
apps/frontend/public/
apps/frontend/src/favicon.ico
apps/frontend/favicon.ico
dist/
```

Buscar todos los favicons:

```bash
find . -iname "*favicon*" -o -iname "*.ico"
```

Buscar referencias:

```bash
grep -R "favicon" -n apps/frontend
grep -R "rel=\"icon\"" -n apps/frontend
grep -R "apple-touch-icon" -n apps/frontend
grep -R "manifest" -n apps/frontend
```

Revisar:

- Qué archivo usa `index.html`.
- Qué favicon se copia al build final.
- Qué aparece dentro de `dist` después de `npm run build`.
- Si el favicon personalizado está en la raíz final del build.
- Si existe un favicon viejo de Angular en otra ruta.
- Si se debe reemplazar `apps/frontend/src/favicon.ico`, `apps/frontend/public/favicon.ico` o la ruta real usada por el proyecto.

---

# 6. Corrección esperada del favicon

## 6.1 Usar favicon correcto

Si ya existe un favicon ChargeLox válido, usarlo.

Si el favicon anterior creado no funciona:

- verificar formato,
- verificar tamaño,
- verificar extensión,
- verificar ubicación,
- reemplazarlo correctamente.

El favicon debe ser simple, liviano y representativo de ChargeLox, por ejemplo:

- fondo azul,
- rayo o conector eléctrico,
- estilo limpio,
- visible en 16x16 y 32x32.

## 6.2 Asegurar referencia en `index.html`

Ejemplo:

```html
<link rel="icon" type="image/x-icon" href="favicon.ico">
```

Si se usa `.png`:

```html
<link rel="icon" type="image/png" href="assets/icons/favicon-32x32.png">
```

Elegir el patrón correcto según Angular y el build real.

## 6.3 Asegurar copia al build

Revisar `angular.json` para confirmar que el favicon queda dentro de assets o raíz final.

Después del build, verificar:

```bash
cd apps/frontend
npm run build
find dist -iname "*favicon*" -o -iname "*.ico"
```

Confirmar que el favicon final existe donde Nginx lo servirá.

## 6.4 Considerar caché

Documentar que para validar en navegador puede ser necesario:

- hard refresh,
- limpiar caché,
- abrir incógnito,
- revisar directamente `https://dominio/favicon.ico`,
- agregar query temporal si se usa ruta en assets:
  - `favicon.ico?v=2`

No cambiar innecesariamente si el problema es caché, pero asegurar que el build final contiene el favicon correcto.

---

# 7. Análisis obligatorio de `uploads/`

Revisar minuciosamente la carpeta:

```txt
uploads/
apps/backend/uploads/
apps/backend/private_uploads/
```

y cualquier ruta de archivos local.

Buscar referencias:

```bash
grep -R "uploads" -n apps/backend apps/frontend
grep -R "private_uploads" -n apps/backend apps/frontend
grep -R "AVATARS_UPLOAD_DIR" -n apps/backend apps/frontend
grep -R "ACTIVITIES_UPLOAD_DIR" -n apps/backend apps/frontend
grep -R "CHARGING_POINTS_UPLOAD_DIR" -n apps/backend apps/frontend
grep -R "TECHNICAL_EVIDENCE_UPLOAD_DIR" -n apps/backend apps/frontend
grep -R "Cloudinary" -n apps/backend
grep -R "cloudinary" -n apps/backend
```

Revisar variables:

```txt
TECHNICAL_EVIDENCE_STORAGE
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_UPLOAD_FOLDER
AVATARS_UPLOAD_DIR
ACTIVITIES_UPLOAD_DIR
CHARGING_POINTS_UPLOAD_DIR
TECHNICAL_EVIDENCE_UPLOAD_DIR
```

Analizar:

- Qué tipos de archivo suben a Cloudinary.
- Qué tipos de archivo siguen guardándose localmente.
- Si avatar usa local o Cloudinary.
- Si evidencias usan Cloudinary.
- Si adjuntos generales usan local.
- Si imágenes de puntos de carga usan local.
- Si hay diferencia entre `TECHNICAL_EVIDENCE_STORAGE` y otros módulos.
- Si el requerimiento actual exige Cloudinary para todos los archivos o solo para producción.

---

# 8. Corrección esperada para avatar

## 8.1 Diagnóstico

Antes de modificar, identificar el flujo completo:

1. Frontend envía archivo avatar.
2. Endpoint backend recibe multipart.
3. Backend guarda archivo o sube a Cloudinary.
4. Backend actualiza usuario con URL/path.
5. Backend devuelve usuario/perfil.
6. Frontend renderiza avatar.
7. Header renderiza avatar.

Revisar archivos probables:

```txt
apps/backend/src/users/
apps/backend/src/users/users.controller.ts
apps/backend/src/users/users.service.ts
apps/backend/src/users/entities/user.entity.ts
apps/backend/src/common/
apps/backend/src/config/
apps/backend/src/uploads/
apps/frontend/src/app/features/profile/
apps/frontend/src/app/core/
apps/frontend/src/app/layout/
```

## 8.2 Solución preferida

Si el requerimiento actual es que todo archivo vaya a Cloudinary:

- Hacer que el avatar también se suba a Cloudinary.
- Guardar en base de datos la URL segura de Cloudinary (`secure_url`).
- Devolver esa URL al frontend.
- El frontend debe renderizar esa URL directamente si es absoluta.
- No construir rutas locales para URLs Cloudinary.
- Mantener compatibilidad con avatares antiguos guardados como ruta local si ya existen.

## 8.3 Compatibilidad con datos existentes

Si hay usuarios existentes con avatar local tipo:

```txt
/uploads/avatars/avatar-123.jpg
```

no romperlos.

Opciones:

- Mantener helper que detecte si la URL es absoluta.
- Si es absoluta, usarla tal cual.
- Si es relativa, construir URL backend correctamente.
- Si no existe, mostrar iniciales o placeholder.

Ejemplo conceptual frontend:

```ts
resolveFileUrl(value?: string): string | null {
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${environment.apiBaseUrl}${value.startsWith('/') ? value : '/' + value}`;
}
```

Adaptar al proyecto real.

## 8.4 Evitar imagen rota

En HTML, usar fallback:

```html
<img
  [src]="avatarUrl"
  (error)="onAvatarError()"
  alt="Avatar"
/>
```

Si falla, mostrar iniciales o placeholder existente.

No dejar imagen rota.

## 8.5 Backend seguro

Si se implementa Cloudinary para avatar:

- Reutilizar servicio Cloudinary existente si ya existe.
- No duplicar lógica.
- No agregar otra dependencia si `cloudinary` ya está instalada.
- Validar MIME y tamaño.
- No aceptar archivos peligrosos.
- Guardar `secure_url`.
- Manejar error de Cloudinary con excepción clara.
- No exponer secretos.
- No guardar archivos temporales permanentes si no hace falta.
- Si se usa `memoryStorage`, evitar escribir en `uploads`.
- Si se usa `diskStorage`, eliminar temporal luego de subir si aplica y es seguro.

---

# 9. Revisión de todos los uploads del sistema

El requerimiento indica:

> Todas las imágenes, archivos PDF y adjuntos deben subirse a Cloudinary.

Por lo tanto, revisar módulos que suben archivos:

- Avatar de usuario.
- Evidencias técnicas.
- Adjuntos de actividades.
- Imágenes de puntos de carga.
- Permisos de acceso.
- Cualquier otro upload.

Para cada módulo, documentar:

| Módulo | Storage actual | Debe ir a Cloudinary | Acción |
|---|---|---|---|

No cambiar todos los módulos de golpe si implica alto riesgo. Pero sí identificar claramente si hay inconsistencias.

Si el cambio de todos los uploads a Cloudinary es pequeño y reutiliza servicio existente, implementarlo cuidadosamente.

Si es grande, priorizar avatar y documentar los demás como pendiente con propuesta segura.

---

# 10. Carpeta `uploads/`

## No borrar a ciegas

No eliminar `uploads/` directamente.

Primero determinar:

- si está versionada,
- si contiene archivos de runtime,
- si esos archivos están referenciados en base de datos,
- si producción aún los usa,
- si deben migrarse a Cloudinary,
- si debe quedar en `.gitignore`.

## `.gitignore`

Si `uploads/` es runtime/local, debe estar en `.gitignore`:

```gitignore
uploads/
apps/backend/uploads/
apps/backend/private_uploads/
```

Pero cuidado: si existe un `.gitkeep` para mantener carpetas locales de desarrollo, conservarlo si el proyecto lo usa.

## Producción

Si producción contiene archivos en `uploads/`, no borrarlos desde código.

Entregar recomendación:

- migrar archivos antiguos a Cloudinary,
- actualizar URLs en base de datos,
- verificar referencias,
- luego limpiar archivos locales con respaldo.

No hacer esa migración masiva sin solicitud explícita.

---

# 11. Variables de entorno

Revisar si Cloudinary está configurado globalmente o solo para módulo técnico.

Variables esperadas:

```txt
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_UPLOAD_FOLDER
TECHNICAL_EVIDENCE_STORAGE
```

Si se necesita una variable más genérica para storage, evaluar si ya existe.

No introducir cambios complejos si no es necesario.

Puede ser aceptable usar Cloudinary siempre que `CLOUDINARY_*` estén configuradas y mantener fallback local solo para desarrollo, pero en producción debe quedar claro.

---

# 12. Frontend - renderizado de imágenes

Revisar cómo el frontend renderiza:

- avatar en header,
- avatar en perfil,
- imágenes de puntos de carga,
- evidencias si aplica.

Buscar:

```bash
grep -R "avatar" -n apps/frontend/src/app
grep -R "imageUrl" -n apps/frontend/src/app
grep -R "uploads" -n apps/frontend/src/app
grep -R "Cloudinary" -n apps/frontend/src/app
```

Reglas:

- Si la URL es Cloudinary, usarla tal cual.
- Si la URL es relativa, construir URL backend correctamente.
- Si falla la imagen, mostrar fallback.
- No hardcodear localhost.
- No hardcodear dominio productivo.
- Usar `environment` o helper existente.

---

# 13. Backend - servir archivos locales si se mantiene compatibilidad

Si hay archivos antiguos locales, revisar si NestJS sirve estáticos:

- `ServeStaticModule`
- `app.useStaticAssets`
- rutas `/uploads`
- configuración Nginx para `/uploads`

Si no hay forma de servirlos, por eso se rompen.

Solución posible:

- Mejor: migrar avatar nuevo a Cloudinary.
- Compatibilidad: construir URL correcta si se siguen sirviendo locales.
- No depender de `uploads` local para nuevos archivos en producción.

---

# 14. Validaciones obligatorias

## Backend

Ejecutar:

```bash
cd apps/backend
npm run build
```

Si existen tests viables:

```bash
npm test
```

## Frontend

Ejecutar:

```bash
cd apps/frontend
npm run build
```

Si existe lint:

```bash
npm run lint
```

No inventar resultados. Si falla algo, reportar el error real y corregir solo lo relacionado.

---

# 15. Pruebas manuales obligatorias

## Favicon

1. Ejecutar build frontend.
2. Confirmar que el favicon nuevo está en el build final.
3. Servir build o revisar carpeta final.
4. Abrir app en navegador/incógnito.
5. Confirmar que ya no aparece favicon Angular.
6. Abrir directamente:
   - `/favicon.ico`
   - o la ruta configurada.
7. Confirmar que se ve el favicon ChargeLox.
8. Probar hard refresh por caché.

## Avatar

1. Ingresar a Mi Perfil.
2. Subir imagen de avatar.
3. Confirmar respuesta backend.
4. Confirmar que la URL guardada es Cloudinary si corresponde.
5. Confirmar que el avatar se ve en perfil.
6. Confirmar que el avatar se ve en header.
7. Recargar página.
8. Confirmar que el avatar no se rompe.
9. Confirmar que no hay error 404 en Network.
10. Confirmar que si la imagen falla se muestra fallback, no imagen rota.

## Uploads

1. Subir evidencia técnica.
2. Subir permiso de acceso.
3. Subir PDF/archivo permitido si aplica.
4. Confirmar storage Cloudinary donde corresponda.
5. Confirmar que no se crean archivos locales innecesarios en `uploads/`.
6. Confirmar que archivos existentes locales no se borraron accidentalmente.

---

# 16. Criterios de aceptación

La tarea se considera completa si:

- El favicon de Angular fue reemplazado realmente.
- El build final contiene el favicon ChargeLox.
- `index.html` apunta a la ruta correcta.
- En producción ya no debería verse el favicon Angular después de limpiar caché.
- El avatar se sube correctamente.
- El avatar se renderiza correctamente en perfil y header.
- El avatar no queda como imagen rota.
- Las URLs Cloudinary se usan correctamente si el archivo se sube a Cloudinary.
- `uploads/` queda analizada y documentada.
- Si `uploads/` no debe versionarse, queda en `.gitignore`.
- No se borraron archivos productivos.
- No se rompieron evidencias, permisos, adjuntos ni imágenes.
- Backend compila.
- Frontend compila.
- No se tocó base de datos salvo necesidad justificada.
- No se modificaron módulos no relacionados.
- No se agregaron dependencias innecesarias.

---

# 17. Entrega final requerida

Al finalizar, entregar un resumen técnico con:

1. Archivos modificados.
2. Diagnóstico real del favicon.
3. Ruta final del favicon.
4. Cambios en `index.html`/`angular.json` si existieron.
5. Confirmación de favicon en build final.
6. Diagnóstico real del avatar roto.
7. Storage actual del avatar antes del cambio.
8. Storage final del avatar después del cambio.
9. Qué se encontró en `uploads/`.
10. Qué módulos siguen usando `uploads/`, si existen.
11. Qué módulos usan Cloudinary.
12. Cambios en `.gitignore`, si existieron.
13. Confirmación de que no se borraron archivos productivos.
14. Resultado de build backend.
15. Resultado de build frontend.
16. Pruebas manuales recomendadas.
17. Riesgos residuales.
18. Recomendaciones para migrar archivos antiguos locales a Cloudinary, si aplica.

---

# 18. Instrucción final

No hagas suposiciones.

Primero diagnostica.

Luego corrige lo mínimo.

No borres `uploads/` a ciegas.

No hardcodees dominios.

No rompas compatibilidad con URLs antiguas.

No cambies el diseño.

No refactorices todo el sistema de archivos.

Corrige favicon y avatar como producción manda: claro, seguro y verificable.

Bisturí para el bug; lupa para `uploads`; cero drama para producción.
