# AGENTS.md

## Proyecto

**Webapp de monitoreo de puntos de carga y electrolineras para vehículos eléctricos KIA y JAC**

## Rol del agente

Actúa como un **desarrollador full stack senior experto en NestJS y Angular**, con más de 12 años de experiencia, especializado en construir aplicaciones web **escalables, mantenibles, claras, bien documentadas y fáciles de extender**.

Debes trabajar con criterio profesional, priorizando:

- claridad,
- mantenibilidad,
- simplicidad,
- escalabilidad,
- documentación,
- estructura limpia,
- facilidad de pruebas en Postman,
- y compatibilidad futura con frontend Angular.

---

# 1. Objetivo general

Construir una aplicación web que permita **monitorear, administrar y consultar** el estado de puntos de carga y electrolineras para autos eléctricos de las marcas **KIA** y **JAC**.

La aplicación debe permitir:

- consultar puntos de carga o electrolineras,
- visualizar su estado y estado de conexión,
- registrar y consultar turnos de monitoreo,
- crear novedades y seguimientos,
- comentar novedades o seguimientos,
- adjuntar archivos o imágenes a novedades y seguimientos,
- generar reportes PDF,
- gestionar usuarios,
- manejar notificaciones simples,
- y mantener trazabilidad mediante auditoría básica.

---

# 2. Prioridad actual de desarrollo

## Fase actual obligatoria

En esta etapa, el enfoque principal debe estar en el **backend en NestJS**, dejándolo completamente funcional, probado y documentado para ser consumido desde **Postman**.

## Resultado esperado en esta fase

El backend debe quedar listo para:

- ejecutarse localmente,
- conectarse a PostgreSQL mediante Docker,
- poblar datos de prueba con seed,
- autenticarse con JWT,
- manejar roles,
- exponer endpoints REST claros,
- documentarse en español,
- incluir README fácil de seguir,
- y ser consumido después por un frontend Angular.

## Importante

No sobreenfocar esfuerzos en frontend en esta etapa.  
El frontend se hará después, pero la arquitectura del backend debe quedar preparada para integrarse de forma limpia con Angular.

---

# 3. Stack tecnológico

## Backend

- NestJS
- TypeScript
- PostgreSQL
- JWT para autenticación
- Docker para la base de datos

## Frontend

- Angular
- HTML5
- CSS3 nativo
- TypeScript

## Restricciones

- No agregar dependencias externas innecesarias
- Priorizar herramientas estándar y entendibles
- La solución debe ser simple de correr y mantener

---

# 4. Roles del sistema

La aplicación debe manejar estos roles:

## ADMINISTRADOR

Puede realizar todas las acciones del sistema, incluyendo:

- gestionar usuarios,
- crear, editar y eliminar puntos de carga o electrolineras,
- ver toda la información del sistema,
- consultar perfiles de otros usuarios,
- ver y gestionar novedades, seguimientos, comentarios y archivos adjuntos,
- acceder a reportes,
- revisar auditoría,
- gestionar información prioritaria.

## ANALISTA

Puede:

- registrarse y autenticarse,
- iniciar y finalizar turnos,
- consultar puntos de carga o electrolineras,
- crear, editar y eliminar sus novedades o seguimientos,
- comentar novedades o seguimientos,
- adjuntar imágenes o archivos a sus novedades o seguimientos,
- generar sus propios reportes,
- ver su perfil y su historial,
- consultar perfiles de otros usuarios según permisos del sistema.

## Implementación

La autorización debe implementarse con **JWT + roles**, utilizando una solución simple, clara y escalable.

---

# 5. Autenticación y autorización

La autenticación debe implementarse de forma sencilla, comprensible y mantenible, pensando en que más adelante se pueda extender.

## Requisitos mínimos

- Registro de usuarios
- Login con email y contraseña
- Contraseñas cifradas de forma segura
- JWT para proteger endpoints privados
- Guards para validar autenticación
- Guards o decoradores para validar roles
- Endpoints listos para Postman

## No es obligatorio en esta etapa

- refresh token complejo,
- verificación por correo,
- recuperación de contraseña,
- login social.

## Recomendación

Usar una implementación estándar de NestJS con JWT, enfocada en que el código sea fácil de leer y extender.

---

# 6. Parte pública de la aplicación

La parte pública debe permitir:

- ver listado paginado de puntos de carga o electrolineras,
- buscar puntos de carga o electrolineras,
- filtrar por estado de conexión,
- ver detalle público del punto de carga o electrolinera,
- generar PDF del listado público,
- generar PDF del detalle público,
- ver novedades prioritarias o relevantes,
- acceder a login y registro.

## Campos visibles públicamente

La parte pública puede mostrar:

- nombre,
- código asignado,
- prioridad,
- estado,
- estado de conexión,
- puerto,
- imagen si existe.

## Campos sensibles

Los siguientes campos deben ser considerados sensibles y **no deben mostrarse públicamente**:

- serial,
- PUK.

Esos campos solo deben mostrarse a usuarios autenticados con permisos adecuados.

---

# 7. Parte privada autenticada

Cuando un usuario inicia sesión, se habilitan funcionalidades privadas según su rol.

---

# 8. Módulo de puntos de carga o electrolineras

Para esta primera versión, tratar **punto de carga** y **electrolinera** como una sola entidad funcional para simplificar el modelo.

Si se desea, internamente puede existir un campo `tipo` para diferenciarlos.

## Funcionalidades

- Crear punto de carga o electrolinera
- Editar punto de carga o electrolinera
- Eliminar punto de carga o electrolinera
- Subir imagen del punto o electrolinera
- Marcar punto como de alta prioridad
- Ver puntos de alta prioridad en una sección aparte
- Listar y filtrar por estado de conexión
- Consultar detalle completo según permisos

## Campos sugeridos de la entidad

- id
- nombre
- codigoAsignado
- serial
- puk
- prioridad (`ALTA`, `MEDIA`, `BAJA`)
- estado (`LIBRE`, `OCPP`)
- estadoConexion (`OK`, `DESCONECTADO`, `CONECTANDO`)
- puerto
- tipo (`PUNTO_CARGA`, `ELECTROLINERA`) opcional
- imagenUrl o rutaImagen
- createdAt
- updatedAt

## Reglas

- Usar enums donde aplique
- Validar datos de entrada con DTOs
- Mantener consistencia de nombres en español o técnico claro
- Preparar endpoints listos para usarse desde Angular después

---

# 9. Módulo de turnos de monitoreo

Los usuarios deben poder registrar su jornada de trabajo o monitoreo.

## Funcionalidades

- Iniciar turno
- Finalizar turno
- Consultar historial de turnos
- Consultar turnos del usuario autenticado
- Generar PDF del historial de turnos

## El reporte PDF debe incluir

- fecha del turno,
- hora de inicio,
- hora de fin,
- rango trabajado,
- total de horas trabajadas.

## Reglas de negocio mínimas

- no permitir iniciar un turno si ya existe uno abierto,
- no permitir finalizar turno si no existe uno iniciado,
- asociar cada turno a un usuario,
- dejar registro claro y legible.

## Campos sugeridos de la entidad

- id
- usuarioId
- fechaTurno
- horaInicio
- horaFin
- totalHoras
- estadoTurno (`ABIERTO`, `CERRADO`)
- createdAt
- updatedAt

---

# 10. Módulo de novedades y seguimientos

Debe existir un módulo de actividades del turno.

Para simplificar el diseño, manejar una sola entidad principal llamada por ejemplo `actividad`, que pueda ser de tipo:

- `NOVEDAD`
- `SEGUIMIENTO`

## Funcionalidades

- Crear novedad o seguimiento
- Editar novedad o seguimiento
- Eliminar novedad o seguimiento
- Listar novedades y seguimientos del usuario
- Consultar novedades prioritarias o relevantes
- Agregar comentarios
- Cambiar estado
- Adjuntar imágenes o archivos
- Generar PDF con actividad + comentarios + adjuntos si aplica

## Atributos mínimos de la actividad

- id
- fechaNovedad
- fechaModificacion
- creadoPorId
- creadoPorNombre
- tipoActividad (`NOVEDAD`, `SEGUIMIENTO`)
- prioridad (`ALTA`, `MEDIA`, `BAJA`)
- descripcion
- estado (`EN_REVISION`, `EN_PROCESO`, `COMPLETADA`)
- usuarioId relacionado si aplica
- turnoId relacionado si aplica
- chargingPointId relacionado si aplica
- createdAt
- updatedAt

## Reglas

- una actividad pertenece al menos a un usuario,
- opcionalmente puede asociarse a un turno,
- opcionalmente puede asociarse a un punto de carga o electrolinera,
- debe quedar rastro de modificaciones,
- debe poder evolucionar fácilmente.

---

# 11. Comentarios en novedades o seguimientos

Los comentarios deben manejarse en una entidad separada.

## Funcionalidades

- Agregar comentario a una actividad
- Listar comentarios por actividad
- Permitir cambio de estado desde el comentario si aplica
- Registrar quién comentó y cuándo
- Mantener historial legible

## Campos sugeridos

- id
- actividadId
- usuarioId
- nombreUsuario
- comentario
- estadoNuevo opcional
- fechaComentario
- createdAt
- updatedAt

---

# 12. Archivos adjuntos en novedades o seguimientos

Las novedades o seguimientos deben permitir adjuntar:

- imágenes,
- documentos,
- archivos relacionados.

## Requisitos funcionales

- poder adjuntar uno o varios archivos a una actividad,
- permitir consultar los adjuntos de una actividad,
- guardar metadatos del archivo,
- mantener una solución simple y mantenible.

## Tipos admitidos sugeridos

- imágenes: jpg, jpeg, png, webp
- documentos: pdf, doc, docx, xlsx, txt
- otros archivos comunes si el agente lo considera razonable

## Implementación sugerida para esta primera versión

Usar una solución sencilla, por ejemplo:

- almacenamiento local en carpeta `uploads/`
- guardar en base de datos los metadatos y la ruta

## Campos sugeridos para adjuntos

- id
- actividadId
- nombreOriginal
- nombreGuardado
- mimeType
- extension
- tamano
- rutaArchivo
- subidoPorId
- createdAt

## Reglas

- validar tamaño máximo,
- validar tipo de archivo,
- documentar claramente en README cómo se almacenan y prueban,
- dejar la implementación lista para ser reemplazada más adelante por almacenamiento en la nube si se desea.

---

# 13. Perfil de usuario

La aplicación debe permitir a los usuarios gestionar su perfil.

## Funcionalidades

- ver perfil propio,
- ver novedades y seguimientos propios,
- subir avatar,
- cambiar nombre,
- cambiar email,
- cambiar contraseña,
- consultar perfil de otro usuario,
- ver historial relacionado del usuario según permisos.

## Campos sugeridos del usuario

- id
- nombres
- apellidos opcional
- email
- passwordHash
- rol (`ADMINISTRADOR`, `ANALISTA`)
- avatarUrl o rutaAvatar
- activo
- createdAt
- updatedAt

---

# 14. Notificaciones

Debe existir una solución sencilla de notificaciones dentro del sistema.

## Objetivo

Que los usuarios puedan enterarse cuando otros usuarios:

- crean novedades,
- crean seguimientos,
- agregan comentarios,
- actualizan estados importantes.

## Para esta primera versión

Implementar una solución simple basada en base de datos.

## Funcionalidades mínimas

- registrar notificaciones,
- consultar notificaciones del usuario autenticado,
- marcar notificación como leída si se considera útil.

## Campos sugeridos

- id
- usuarioDestinoId
- titulo
- mensaje
- tipo
- referenciaId opcional
- leida
- createdAt

## No es obligatorio

- WebSockets,
- push notifications,
- correos electrónicos.

---

# 15. Reportes PDF

La aplicación debe poder generar PDFs funcionales y legibles.

## PDFs públicos

- listado de puntos de carga o electrolineras,
- detalle de punto de carga o electrolinera.

## PDFs privados

- historial de turnos,
- horas trabajadas,
- novedades y seguimientos,
- comentarios de actividades,
- información asociada del turno,
- datos del usuario cuando sea relevante.

## Requisitos generales

- formato claro,
- encabezados legibles,
- fecha de generación,
- datos correctamente organizados,
- listo para descargar o visualizar.

## Importante

La implementación puede ser sencilla siempre que quede funcional y fácil de probar.

---

# 16. Base de datos PostgreSQL

La aplicación debe usar **PostgreSQL**.

La base de datos debe quedar lista para levantarse fácilmente con Docker y conectarse sin dificultad desde herramientas como pgAdmin, DBeaver o cualquier administrador de base de datos.

## Requisitos

- configuración por variables de entorno,
- conexión clara desde NestJS,
- comandos simples para levantar el servicio,
- documentación entendible en README,
- datos de ejemplo cargables mediante seed.

## Nombre de la base de datos

Puede definirse libremente según convenga al proyecto.

---

# 17. Auditoría

Debe existir una auditoría básica y útil, sin sobrecomplicar el proyecto.

## Debe registrar al menos

- entidad afectada,
- id de la entidad,
- acción realizada (`CREATE`, `UPDATE`, `DELETE`),
- usuario que ejecutó la acción,
- fecha,
- resumen del cambio.

## Objetivo

Mantener trazabilidad clara y simple.

## Entidades sugeridas a auditar

- usuarios,
- puntos de carga/electrolineras,
- actividades,
- comentarios.

---

# 18. Seed de datos

Una vez creada la base de datos y las tablas, se debe incluir un proceso de seed.

## Datos mínimos requeridos

- 10 usuarios
- 30 cargadores o electrolineras
- 30 actividades mezcladas entre `NOVEDAD` y `SEGUIMIENTO`
- 25 comentarios o contestaciones a las actividades
- estados aleatorios entre:
  - `EN_REVISION`
  - `EN_PROCESO`
  - `COMPLETADA`

## Consideraciones

- distribuir los datos entre usuarios,
- crear relaciones coherentes,
- incluir al menos un administrador y varios analistas,
- incluir datos suficientes para probar fácilmente desde Postman.

## Deseable

- incluir credenciales de prueba claras en el README,
- incluir ejemplos de actividades con adjuntos simulados o estructura preparada para ello.

---

# 19. Backend en NestJS

El backend debe desarrollarse con una estructura profesional, clara y mantenible.

## Requisitos técnicos

- arquitectura modular,
- controladores por módulo,
- servicios por módulo,
- DTOs con validación,
- manejo de errores,
- uso correcto de enums,
- configuración por variables de entorno,
- código legible,
- rutas REST consistentes,
- preparado para crecimiento.

## Módulos mínimos esperados

- auth
- users
- charging-points o stations
- shift-logs
- activities
- activity-comments
- attachments
- notifications
- audit-logs

## Si lo consideras adecuado

Puedes usar una estructura por módulos de dominio clara y simple, sin sobreingeniería innecesaria.

---

# 20. Frontend en Angular

El frontend se desarrollará después, pero la base del proyecto debe quedar preparada para integrarlo.

## Reglas para el futuro frontend

- todos los textos visibles deben estar en español,
- diseño basado en la carpeta `design`,
- responsive,
- CSS nativo,
- HTML semántico,
- Angular con buenas prácticas,
- estructura clara y mantenible.

## Importante

Por ahora, no invertir esfuerzo principal en el diseño final del frontend.  
El objetivo inmediato es un backend sólido y bien documentado.

---

# 21. Preferencias de diseño

Basarse en las imágenes del diseño que se encuentran en la carpeta `design` del proyecto.

## Debe respetarse

- colores,
- estilo general,
- jerarquía visual,
- intención visual del diseño base.

---

# 22. Preferencias de estilos para Angular

Cuando se implemente Angular:

- usar CSS nativo,
- no usar Tailwind ni frameworks CSS,
- usar unidades `rem`,
- usar font-size base de `10px`,
- aplicar flexbox y CSS grid cuando sea necesario,
- hacer la aplicación responsive.

## Nota importante

Aunque la preferencia inicial menciona un solo archivo CSS, se debe priorizar una estructura mantenible y escalable.

Por ello, es aceptable:

- tener estilos globales,
- y estilos por componente cuando sea necesario.

No generar una arquitectura CSS caótica o difícil de mantener solo por forzar un único archivo enorme.

---

# 23. Preferencias de código para Angular

Cuando se implemente el frontend:

- no usar dependencias innecesarias,
- usar HTML semántico,
- no usar `alert`, `confirm` ni `prompt`,
- mostrar el feedback dentro del DOM,
- priorizar bindings y patrones propios de Angular,
- evitar manipulación manual del DOM salvo necesidad real,
- priorizar legibilidad y mantenibilidad.

## Importante

No usar patrones de JavaScript DOM manual como `appendChild`, `document.createElement` o `innerHTML` como enfoque principal dentro de Angular.

---

# 24. Estructura de archivos esperada

El proyecto debe incluir una estructura clara y profesional.

## Debe contener como mínimo

- `AGENTS.md`
- carpeta `design`
- backend organizado por módulos
- frontend o estructura preparada para frontend Angular
- `.env.example`
- configuración Docker para PostgreSQL
- `README.md`
- seed de datos

---

# 25. README.md

El proyecto debe incluir un `README.md` en español, claro, entendible y bien organizado.

## Debe explicar como mínimo

- objetivo del proyecto,
- stack tecnológico,
- requisitos previos,
- variables de entorno necesarias,
- cómo levantar PostgreSQL con Docker,
- cómo instalar dependencias,
- cómo correr el backend,
- cómo ejecutar seed,
- cómo probar en Postman,
- credenciales de prueba,
- cómo funciona la autenticación JWT,
- estructura general del proyecto,
- manejo de archivos adjuntos,
- documentación de endpoints.

## El README debe servir para que cualquier desarrollador pueda

1. clonar el proyecto,
2. configurar variables,
3. levantar PostgreSQL con Docker,
4. correr NestJS,
5. ejecutar seed,
6. autenticarse,
7. probar endpoints desde Postman sin adivinar nada.

---

# 26. Documentación de APIs

Todas las APIs deben estar documentadas en español.

## Debe incluir

- descripción de cada módulo,
- endpoints agrupados,
- payloads de ejemplo,
- respuestas esperadas,
- códigos de error comunes,
- endpoints públicos y privados,
- explicación de autenticación con bearer token,
- ejemplos pensados para Postman.

## Objetivo

Que el backend pueda probarse cómodamente sin necesidad de revisar internamente todo el código.

---

# 27. Orden sugerido de implementación

Construir el proyecto en este orden, sin saltarse la base:

## Paso 1

Inicializar proyecto backend en NestJS y configurar estructura base.

## Paso 2

Configurar variables de entorno, conexión a PostgreSQL y Docker para la base de datos.

## Paso 3

Crear entidades, enums, DTOs y relaciones principales.

## Paso 4

Implementar autenticación JWT y roles (`ADMINISTRADOR`, `ANALISTA`).

## Paso 5

Implementar módulo de usuarios y perfil.

## Paso 6

Implementar módulo de puntos de carga o electrolineras.

## Paso 7

Implementar módulo de turnos.

## Paso 8

Implementar módulo de actividades (novedades y seguimientos).

## Paso 9

Implementar comentarios de actividades.

## Paso 10

Implementar adjuntos para actividades.

## Paso 11

Implementar notificaciones simples.

## Paso 12

Implementar auditoría básica.

## Paso 13

Implementar generación de PDFs.

## Paso 14

Implementar seed de datos.

## Paso 15

Documentar APIs en español.

## Paso 16

Redactar README.md completo, claro y fácil de usar.

---

# 28. Criterios de implementación

## Reglas generales

- no sobreingenierizar,
- no agregar complejidad innecesaria,
- priorizar una solución funcional y ordenada,
- escribir código mantenible y entendible,
- evitar ambigüedades,
- usar nombres consistentes,
- dejar el backend listo para crecer.

## Si surge una decisión técnica no especificada

Elegir siempre la alternativa:

- más simple,
- más clara,
- más mantenible,
- y más preparada para crecer después.

---

# 29. Resultado final esperado

Entregar una base sólida del sistema con:

- backend NestJS funcional,
- PostgreSQL funcionando con Docker,
- autenticación JWT,
- roles `ADMINISTRADOR` y `ANALISTA`,
- CRUD de usuarios,
- CRUD de puntos de carga o electrolineras,
- gestión de turnos,
- gestión de novedades y seguimientos,
- comentarios,
- adjuntos de archivos e imágenes,
- notificaciones simples,
- auditoría básica,
- generación de PDFs,
- seed de datos,
- documentación en español,
- README claro,
- proyecto listo para pruebas en Postman,
- y preparado para conectarse luego con Angular.

---

# 30. Instrucción final al agente

Desarrolla la solución con enfoque profesional, priorizando en todo momento:

- backend primero,
- facilidad de ejecución local,
- claridad arquitectónica,
- documentación,
- pruebas desde Postman,
- estructura limpia,
- y preparación futura para Angular.

No olvides:

- proteger correctamente los endpoints,
- documentar variables de entorno,
- dejar datos de prueba útiles,
- y explicar claramente cómo levantar el proyecto desde cero.

Si necesitas tomar decisiones no especificadas, elige la opción más simple, robusta y mantenible.
