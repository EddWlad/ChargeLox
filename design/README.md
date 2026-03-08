# Design - Complement

Objetivo principal:
Rediseñar correctamente todos los PDFs que genera el sistema para que se basen en los diseños visuales que ya existen dentro de la carpeta `design`, y dejar de generar reportes “secos” o sin estilo.

Reglas obligatorias:

- No romper la aplicación.
- No cambiar la lógica funcional principal salvo lo estrictamente necesario para mejorar la generación de PDFs.
- Mantener el código legible, escalable y mantenible.
- Si conviene generar los reportes con HTML + CSS + render a PDF, puedes hacerlo.
- Si conviene usar una librería de reportes o una estrategia distinta más limpia, puedes tomar esa decisión.
- Lo importante es que el resultado final respete el diseño de referencia que ya está en `design`.
- No improvises un diseño nuevo si ya hay una referencia visual.
- Debes basarte estrictamente en las carpetas de diseño indicadas.
- Si una parte del diseño necesita adaptación técnica para PDF, haz una adaptación fiel, limpia y estable.
- Todos los textos visibles deben mantenerse en español.
- Los reportes deben verse profesionales, modernos y consistentes con la identidad visual ChargeLox.

Tareas principales:

1) Rediseñar el PDF del historial de turnos
Referencia visual:

- Carpeta: `design/reporte_turnos`

Qué debes hacer:

- Ubicar el generador actual del PDF de historial de turnos.
- Rediseñarlo para que visualmente se parezca al diseño de referencia en esa carpeta.
- Respetar la estructura visual del ejemplo:
  - encabezado
  - branding/logo
  - fecha/hora de generación
  - tabla clara y elegante
  - total acumulado destacado
  - footer con texto pequeño estilo corporativo
- Debe verse como un documento profesional y no como una tabla simple exportada.

1) Rediseñar el PDF del listado público de puntos de carga / electrolineras
Referencia visual:

- Carpeta: `design/reporte_listado_puntos_carga`

Qué debes hacer:

- Ubicar el generador actual del PDF del listado público.
- Rediseñarlo según esa referencia.
- Debe respetar el estilo visual mostrado:
  - encabezado limpio
  - fecha de generación
  - tabla bien diseñada
  - badges/estados visuales para prioridad y conexión cuando aplique
  - buen uso del espacio
  - footer corporativo
- El objetivo es que el reporte luzca como un documento formal del sistema ChargeLox.

1) Rediseñar el PDF del detalle de un punto de carga / electrolinera
Referencia visual:

- Carpeta: `design/reporte_detalle_punto_carga`

Qué debes hacer:

- Ubicar el generador actual del PDF de detalle de punto.
- Rediseñarlo en base al diseño de referencia.
- Mantener una presentación elegante y ordenada de la información.
- No mostrar campos técnicos innecesarios si la referencia no los contempla.
- Mantener una composición visual similar a la maqueta:
  - título del reporte
  - bloque informativo principal
  - métricas/atributos organizados
  - badges para prioridad y estado de conexión
  - branding ChargeLox
  - footer profesional

Importante:

- Si actualmente se muestran campos innecesarios y el diseño de referencia no los usa, ajústalos según la referencia.
- Prioriza claridad, jerarquía visual y coherencia con la app.

1) Rediseñar el PDF del reporte de actividad / seguimiento
Referencia visual:

- Carpeta: `design/reporte_actividad_seguimiento`

Qué debes hacer:

- Ubicar el generador actual del PDF del detalle de actividad o seguimiento.
- Rediseñarlo usando la maqueta de esa carpeta.
- Debe incluir una composición visual moderna y clara para:
  - datos de la actividad
  - prioridad
  - estado
  - creador
  - punto relacionado si aplica
  - descripción
  - comentarios/seguimiento
  - archivos adjuntos si aplica
- Mantener estilo consistente con los otros PDFs.
- Evitar que el reporte se vea como salida cruda de backend.

1) Ajuste visual en la pantalla pública de datos públicos
Problema:

- En la pantalla principal pública aparece una imagen de un auto HYUNDAI.
- La app monitorea puntos KIA o JAC, por lo tanto esa imagen no corresponde.

Qué debes hacer:

- Reemplazar esa imagen por una similar pero asociada a KIA o JAC.
- Mantener el layout actual.
- No romper la pantalla pública.
- Si la imagen actual viene desde assets, reemplázala correctamente.
- Si se referencia por ruta, actualiza la ruta de forma segura.
- Usa una imagen visualmente coherente con la identidad de la aplicación y el contexto de KIA o JAC.

Criterios técnicos para los PDFs:

- Todos los reportes deben compartir una línea visual coherente.
- Mantener branding uniforme de ChargeLox.
- Usar colores azules consistentes con la aplicación.
- Buena tipografía, jerarquía y espaciado.
- Deben verse bien al exportarse/imprimirse.
- Evitar elementos que se corten o desalineen al generar el PDF.
- Si usas HTML/CSS para generar los PDFs, asegúrate de que el render sea estable.
- Si necesitas una librería adicional para mejorar la calidad del PDF y el impacto es bajo, puedes agregarla.
- No metas dependencias innecesarias si con la solución actual puedes hacerlo bien.

Forma de trabajo:

1. Primero analiza dónde se generan actualmente los 4 reportes PDF.
2. Explícame brevemente qué estrategia técnica vas a usar para rediseñarlos:
   - mantener librería actual
   - migrar a HTML/CSS renderizado a PDF
   - o solución equivalente
3. Indica qué archivos vas a tocar.
4. Implementa los cambios de forma incremental y segura.
5. Asegúrate de que los endpoints o acciones de descarga sigan funcionando igual.
6. Al final, resume qué reportes fueron rediseñados y qué imagen pública fue reemplazada.

Importante:

- No quiero solo una propuesta teórica.
- Quiero implementación real.
- No rompas la generación actual, solo mejórala y alinéala con los diseños de `design`.
- Si detectas algo riesgoso, aplica la solución más estable y mantenible.
