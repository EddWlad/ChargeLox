# Design

Objetivo:
Construir el frontend funcional de la webapp de monitoreo y administración de puntos de carga y electrolineras para vehículos eléctricos KIA y JAC, conectándolo al backend ya existente.

Contexto importante:

- El backend ya está funcional y documentado.
- La documentación y endpoints están descritos en README.md, README-ENDPOINTS.md y api-es.md.
- Ya existe un scaffold mínimo en apps/frontend.
- La carpeta design contiene capturas y diseño visual base que debes usar como referencia para colores, estilo general, jerarquía visual e intención de diseño.
- Todos los textos visibles de la aplicación deben estar en español.

Reglas obligatorias del frontend:

- Usar Angular con buenas prácticas.
- Código claro, legible, mantenible y escalable.
- Usar TypeScript, HTML semántico y CSS nativo.
- No usar Tailwind ni frameworks CSS.
- No agregar dependencias externas innecesarias.
- Usar unidades rem y configurar font-size base de 10px.
- Hacer el frontend responsive.
- Priorizar bindings y patrones propios de Angular.
- No usar manipulación manual del DOM como enfoque principal.
- No usar alert, confirm ni prompt; el feedback debe mostrarse dentro del DOM.
- Organizar una estructura clara por módulos, páginas, componentes, layouts, servicios, interfaces y guards/interceptors si aplica.

Lo que debes hacer:

1. Analiza primero AGENTS.md, README.md, README-ENDPOINTS.md y api-es.md para entender el dominio, módulos, roles y endpoints disponibles.
2. Revisa la carpeta design y usa sus capturas como guía visual real para el frontend.
3. Construye una arquitectura frontend profesional y mantenible.
4. Conecta el frontend al backend real ya implementado.
5. Implementa manejo de autenticación JWT contra el backend.
6. Implementa control de acceso por roles: ADMINISTRADOR y ANALISTA.
7. Crea una base visual sólida y consistente antes de entrar en detalles finos.
8. Deja el frontend listo para crecer sin reestructuraciones caóticas.

Módulos/pantallas mínimas que debes implementar:

- Login
- Dashboard inicial
- Perfil propio del usuario autenticado
- Gestión/listado de puntos de carga y electrolineras
- Detalle de punto de carga/electrolinera
- Gestión de turnos de monitoreo
- Gestión de actividades (novedades y seguimientos)
- Comentarios de actividades
- Adjuntos de actividades
- Notificaciones del usuario autenticado
- Gestión de usuarios (solo ADMINISTRADOR)
- Auditoría básica (solo ADMINISTRADOR)

Requisitos funcionales importantes:

- Consumir correctamente los endpoints ya disponibles del backend.
- Manejar token JWT con interceptor o mecanismo equivalente.
- Manejar estados de carga, errores y feedback visual dentro de la interfaz.
- Mostrar mensajes de validación y error de forma limpia.
- Implementar navegación clara.
- Respetar las diferencias entre vistas públicas y privadas cuando aplique.
- Donde existan listados, implementar paginación o dejar la estructura preparada para ello.
- Donde existan filtros obvios, dejar una base limpia para buscarlos o filtrarlos.
- Mantener tipado fuerte con interfaces/models para request y response.

Importante sobre el diseño:

- No inventes un diseño alejado de la carpeta design.
- Usa el material visual existente como base real.
- Respeta colores, jerarquía visual y estilo general.
- Si algún detalle del diseño no se puede inferir claramente, aplica una solución simple, limpia y consistente con lo existente.

Importante sobre la implementación:

- No me des solo una propuesta.
- Empieza a construir el frontend directamente.
- Ve creando los archivos necesarios.
- Si detectas que falta alguna variable de entorno o configuración frontend para conectarse al backend, créala de forma ordenada.
- Si hace falta documentar cómo correr el frontend, actualiza el README de forma clara en español.
- Si una decisión técnica no está especificada, elige la opción más simple, clara, mantenible y preparada para crecer.

Orden sugerido:

1. Configuración base del frontend
2. Layout general y sistema de estilos base
3. Rutas
4. Auth + guards + interceptor
5. Servicios API tipados
6. Login y sesión
7. Dashboard
8. Charging points
9. Activities
10. Shift logs
11. Notifications
12. Users admin
13. Audit logs admin
14. Ajustes de UX, responsive y limpieza final

Antes de escribir código, analiza el proyecto actual y explícame brevemente:

- qué estructura frontend vas a crear,
- qué módulos/páginas/componentes vas a implementar primero,
- y cómo te vas a conectar con el backend existente.

Después de esa breve explicación, comienza inmediatamente con la implementación.
Si encuentras una duda real que impida continuar, pregúntamela de forma concreta.
