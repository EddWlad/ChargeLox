# CHANGES - CHARGELOX

La funcionalidad actual del módulo de actividades en ChargeLox ya está funcionando correctamente.
En esta tarea NO quiero refactorizaciones grandes ni cambios de lógica.
Solo necesito un ajuste visual puntual para mejorar la legibilidad.

## Objetivo

Aumentar un poco el tamaño de fuente de:

1. la descripción de la actividad
2. los comentarios dentro del detalle de actividad

## Problema actual

- El texto de la descripción y de los comentarios se ve demasiado pequeño.
- La experiencia de usuario se vuelve dificultosa al leer.
- Quiero que el tamaño de fuente quede más cómodo y legible, similar a la referencia visual donde el texto se ve más claro y fácil de leer.
- No quiero un cambio exagerado, solo un aumento moderado y correcto.

## Qué debes hacer

- Ubicar los componentes, templates y estilos relacionados con:
  - detalle de actividad
  - descripción de actividad
  - listado o bloque de comentarios de actividad
- Ajustar únicamente los estilos visuales necesarios para que:
  - la descripción se vea más legible
  - los comentarios se vean más legibles
- Mantener la estructura actual del diseño.
- Mantener alineación, espaciado y jerarquía visual.
- No tocar lógica de backend.
- No tocar endpoints.
- No cambiar comportamientos funcionales.
- No modificar otros módulos del sistema.
- No aumentar el tamaño de otros textos que ya están bien.
- No romper responsive.

## Lineamientos de diseño

- Haz un ajuste moderado, elegante y consistente con el estilo actual de la app.
- Prioriza legibilidad y comodidad de lectura.
- Si existe una clase compartida para textos de detalle/comentario, reutilízala o ajústala con cuidado.
- Si no existe, crea una clase específica y mantenible.
- Mantén buena separación visual entre autor, fecha, estado y cuerpo del comentario.
- El cuerpo del texto debe ser claramente más fácil de leer que ahora.

## Importante

- No rehagas el módulo.
- No cambies nada más aparte de la fuente/tamaño/legibilidad del texto de descripción y comentarios.
- Si hay estilos inline o sobreescrituras innecesarias, ordénalos de forma mínima y segura.
- El cambio debe ser pequeño, seguro y sin romper nada.

## Antes de implementar

- Explícame brevemente qué archivos de frontend vas a tocar.
- Luego aplica el cambio puntual.
