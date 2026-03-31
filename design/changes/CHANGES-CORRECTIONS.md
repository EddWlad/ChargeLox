# CHANGES-CORRECTIONS

## Rol que debes asumir

Actúa como un **ingeniero de software senior full stack** con experiencia DE 12 años en:

- **NestJS**
- **Angular**
- **PostgreSQL**
- **arquitectura modular**
- **seguridad y autorización por roles**
- **Excel/PDF reports**
- **responsive design**
- **optimización para servidores pequeños en producción**
- **mantenimiento de aplicaciones ya desplegadas**

Tu misión es realizar **cambios puntuales, seguros y mínimos** sobre una aplicación que **ya está funcionando en producción**.  
No debes rehacer módulos, no debes tocar partes ajenas al alcance, no debes romper backend, frontend, base de datos ni despliegue actual.

Debes trabajar con mentalidad de **cirugía fina**, no con mentalidad de “aprovecho y refactorizo medio sistema”.

---

## Contexto real del proyecto

La aplicación se llama **ChargeLox** y ya está desplegada en producción.

### Stack actual

- **Frontend:** Angular
- **Backend:** NestJS
- **Base de datos:** PostgreSQL
- **Infraestructura:** AWS EC2 **t3.micro**
- **Backend corriendo con:** PM2
- **Frontend servido por:** Nginx
- **Base de datos corriendo en:** Docker

### Consideraciones críticas

- La aplicación **ya está desplegada y funcional**.
- El nuevo módulo de **Operación técnica / actividades técnicas** ya fue implementado y desplegado.
- Existen usuarios reales con roles y permisos.
- La instancia es una **EC2 t3.micro**, así que cualquier cambio debe ser:
  - liviano,
  - eficiente,
  - de bajo impacto,
  - sin consumo innecesario de RAM/CPU,
  - y sin dependencias pesadas nuevas.

### Regla principal

**No hacer cambios innecesarios.**  
Solo trabajar sobre lo estrictamente requerido en esta solicitud.

---

## Objetivo de esta intervención

Implementar **ajustes correctivos y mejoras puntuales** sobre el sistema ya desplegado, específicamente en:

1. **Responsividad del módulo de notificaciones en frontend**
2. **Permitir que los técnicos cambien el estado de sus propias actividades técnicas**
3. **Agregar en el rol SUPERVISOR la descarga de reporte Excel de todas las actividades técnicas**
4. **Permitir filtrar por fecha ese reporte Excel**
5. **Mantener responsividad general del módulo involucrado**
6. **No romper la aplicación**
7. **Dejar todo listo para despliegue**

---

## Alcance exacto de los cambios solicitados

### 1) Corregir responsividad del módulo de notificaciones

Hay evidencia visual de que el módulo de notificaciones **no está respondiendo bien en móvil**.

#### Problema observado

En las capturas adjuntas:

- el menú lateral / navegación en móvil muestra inconsistencias visuales,
- la experiencia del módulo de notificaciones no se ve correctamente adaptada,
- hay que revisar el comportamiento responsivo del layout para ese contexto móvil,
- se debe validar que la navegación y la vista no queden rotas en pantallas pequeñas.

#### Qué debes hacer

- Revisar la implementación actual del módulo/página de notificaciones y su interacción con:
  - layout privado,
  - sidebar/drawer,
  - breakpoints móviles,
  - estilos globales,
  - componentes compartidos si aplica.
- Corregir la responsividad **sin rediseñar toda la aplicación**.
- Mantener consistencia visual con el resto del sistema.
- Verificar que:
  - el menú en móvil no rompa la experiencia,
  - los elementos no queden montados o desalineados,
  - la navegación siga usable en pantallas pequeñas,
  - la página de notificaciones se vea correctamente en móvil.

#### Restricción

No cambiar masivamente estilos globales si no es estrictamente necesario.

---

### 2) Permitir a los técnicos cambiar el estado de sus actividades técnicas

Actualmente los técnicos **no pueden cambiar de estado** sus actividades técnicas.

#### Requerimiento exacto

- Habilitar que **todos los técnicos** puedan cambiar el estado de **sus propias actividades**.
- Ojo: **solo cambiar de estado**.
- No dar permisos adicionales innecesarios.
- No permitir que un técnico cambie actividades de otros técnicos.
- No permitir que un técnico obtenga privilegios de supervisor o administrador.
- Mantener el resto de permisos igual.

#### Regla funcional

El técnico debe poder cambiar el estado de una actividad técnica **solo si esa actividad le pertenece**.

#### Estados

Debes respetar la lógica de estados existente del módulo técnico.  
No inventes otra máquina de estados salvo que sea imprescindible y compatible con lo actual.

#### Seguridad obligatoria

- Validar en backend que el técnico solo pueda actualizar estado de **su propia actividad**.
- No confiar solo en el frontend.
- Mantener controles por rol + pertenencia del recurso.
- Prevenir acceso horizontal indebido.

---

### 3) Agregar reporte Excel para supervisores en el módulo de Operación técnica

En el módulo de operación técnica, el **rol SUPERVISOR** necesita un botón para descargar un informe Excel de **todas** las actividades de los técnicos.

#### Requerimiento exacto

- Agregar una acción visible para supervisor que permita **descargar un Excel**.
- El Excel debe incluir **absolutamente todas las actividades técnicas de los técnicos**, no solo una parte.
- Debe estar orientado al seguimiento operativo.
- Debe poder usarse desde el módulo de Operación técnica.

#### Consideraciones

- Reutiliza si ya existe una lógica de exportación Excel en el proyecto.
- No reimplementar desde cero si ya hay patrón, servicio, librería o enfoque usado para otros módulos.
- Mantener consistencia con la forma en que ChargeLox ya exporta Excel en otros apartados.

---

### 4) Agregar filtro por fecha para el Excel del supervisor

Además del botón de exportación, el supervisor debe poder **filtrar por fecha** antes de descargar el Excel.

#### Requerimiento exacto

- Permitir seleccionar rango de fechas o filtro equivalente claro.
- El Excel debe descargarse:
  - con todas las actividades si no se aplica filtro,
  - o solo con las actividades del rango si se filtra por fecha.
- Definir claramente el criterio de fecha utilizado:
  - fecha programada,
  - fecha de creación,
  - fecha de actualización,
  - o la que sea más coherente con el diseño actual del módulo.
- Si el proyecto ya usa un criterio de fecha dominante para el módulo técnico, respetarlo.
- Si no está claro, usa el criterio más funcional para supervisión operativa y documenta cuál aplicaste.

#### Backend

- El endpoint de exportación debe aceptar filtros seguros.
- si es estrictamente necesaria hacer un endpoint nuevo en el backend para el reporte en excel hcerlo, caso contrario no o a su vez utilizar el endpoitn de excel si existe ya en el backend es decir retuilizarlo.
- Validar correctamente fechas.
- Evitar consultas costosas o sin índice cuando sea posible.
- Hacer consultas eficientes para una t3.micro.

---

### 5) Mantener el módulo responsivo

El módulo de operación técnica y los cambios nuevos deben seguir siendo responsivos.

#### Debes verificar

- tabla/listado,
- filtros,
- botones de acción,
- detalle,
- exportación,
- estados,
- notificaciones asociadas si impactan la UI,
- comportamiento en móvil.

No rediseñar de más.  
Ajustar solo lo necesario para que siga usable y correcto.

---

## Restricciones estrictas

### No tocar módulos ajenos

No modificar módulos que no tengan relación con:

- notificaciones responsivas,
- permisos de cambio de estado para técnicos en actividades técnicas,
- exportación Excel del módulo de operación técnica para supervisor,
- filtro por fecha del Excel,
- o ajustes mínimos necesarios de layout/responsive asociados a estos cambios.

### No romper funcionalidades ya existentes

La app ya está funcionando.  
No romper:

- autenticación
- autorización actual
- dashboard
- puntos de carga
- actividades existentes
- PDFs
- notificaciones fuera de lo necesario
- módulos administrativos
- despliegue
- Cloudinary
- carga de evidencias
- reportes existentes

### No hacer refactors innecesarios

No:

- reestructurar carpetas sin motivo,
- cambiar naming global,
- migrar librerías porque sí,
- rehacer arquitectura,
- aplicar “mejoras” no pedidas.

---

## Requisitos técnicos por capa

# Backend (NestJS)

Debes revisar primero la implementación actual del módulo técnico ya existente y luego hacer cambios mínimos y consistentes.

### Cambios esperados en backend

#### A. Permisos para cambio de estado por técnico

Revisar el endpoint/servicio actual de cambio de estado de actividades técnicas y ajustar la lógica para que:

- **ADMINISTRADOR** siga pudiendo hacerlo
- **SUPERVISOR** siga pudiendo hacerlo si ya estaba permitido
- **TECNICO** pueda hacerlo **solo sobre actividades propias**

No permitir:

- que un técnico cambie estados de actividades ajenas,
- que un técnico acceda a datos que no le corresponden.

#### B. Exportación Excel para supervisor

Crear o extender endpoint para exportar Excel de actividades técnicas:

- accesible al rol **SUPERVISOR** (y si es coherente también ADMINISTRADOR),
- con filtro opcional por fecha,
- devolviendo archivo Excel listo para descargar.

### Buenas prácticas obligatorias

- Validar DTOs
- Validar fechas
- Validar permisos por rol y por pertenencia
- No interpolar SQL manualmente
- Usar ORM/repositorios de forma segura
- Prevenir SQL injection
- Prevenir acceso horizontal indebido
- Mantener consultas eficientes
- No traer datos gigantescos si no hace falta
- Si el Excel puede crecer, generar con estructura eficiente
- No meter procesos innecesarios en memoria
- Mantener compatibilidad con t3.micro

### Posible enfoque esperado

- Reutilizar patrón de reportes/exportación existente
- Si ya existe servicio Excel en backend, reutilizarlo
- Si ya existe convención para endpoints `/export` o `/reports`, seguirla
- Mantener consistencia con el proyecto

---

# Frontend (Angular)

### Cambios esperados

#### A. Responsividad del módulo de notificaciones

Corregir lo necesario en:

- página de notificaciones,
- layout privado,
- sidebar/drawer móvil,
- estilos asociados,
- breakpoints,
- navegación móvil,
sin romper el resto del sistema.

#### B. Técnicos: cambio de estado

En la UI de detalle/listado de actividades técnicas:

- permitir que el técnico vea y use la acción de cambio de estado si la actividad es suya,
- no mostrar acciones indebidas sobre actividades ajenas,
- no exponer privilegios extra.

#### C. Supervisor: botón de exportación Excel

Agregar en la vista del módulo de operación técnica:

- botón claro de descarga Excel,
- filtro por fecha,
- UX consistente,
- comportamiento responsivo en móvil y desktop.

### Lineamientos

- Mantener línea visual actual
- No romper navegación
- No recargar la vista
- No introducir componentes gigantes innecesarios
- Reutilizar componentes/patrones existentes
- Manejar loading, errores y descarga correctamente
- Mantener responsividad

---

## Requisitos funcionales detallados

### Cambio de estado por técnico

- Debe funcionar de extremo a extremo
- Debe persistir correctamente
- Debe reflejarse en la interfaz
- Debe respetar ownership de la actividad
- Debe auditarse/historizarse si el módulo ya hace eso

### Excel del supervisor

El archivo debe incluir información útil de las actividades técnicas, por ejemplo según lo que ya maneje el sistema:

- título
- tipo
- estado
- prioridad
- técnico asignado
- supervisor si aplica
- fecha programada
- fecha de creación o actualización según diseño
- punto de carga relacionado si aplica
- comentarios/observaciones relevantes si forman parte del reporte existente o si su inclusión es razonable

No inventes columnas inútiles.  
Usa columnas operativamente valiosas.

### Filtro por fecha

- Debe ser claro en UI
- Debe aplicarse correctamente en backend
- Debe permitir descarga sin filtro y con filtro
- Debe contemplar validación si fecha inicio > fecha fin

---

## Seguridad obligatoria

La aplicación ya está abierta a más usuarios por rol. Los cambios deben reforzar seguridad, no debilitarla.

### Obligatorio

- Autorización backend real
- Verificación de ownership para técnico
- DTOs validados
- Filtros de entrada validados
- Sin SQL injection
- Sin exposición indebida de datos
- Sin elevar permisos accidentalmente
- No confiar solo en ocultar botones en frontend

---

## Rendimiento y optimización para AWS EC2 t3.micro

La app está alojada en una **AWS EC2 t3.micro**.  
Debes implementar estos cambios con enfoque de bajo impacto.

### Reglas

- No agregar librerías pesadas sin necesidad
- Reutilizar dependencias existentes si ya sirven
- Evitar queries ineficientes
- Evitar recalcular o traer datos innecesarios
- No generar archivos enormes en memoria de forma torpe
- Mantener frontend liviano
- No empeorar tiempos de carga

### Especial atención al Excel

La exportación Excel debe ser eficiente.  
No implementar una solución desproporcionada para una instancia pequeña.

---

## Qué debes revisar antes de cambiar código

Antes de implementar, analiza cómo están hechos actualmente:

- módulo de notificaciones
- layout privado / sidebar / navegación responsive
- módulo de technical-activities
- cambio de estado de actividades técnicas
- permisos por rol
- servicios actuales de exportación Excel
- endpoints y patrones ya existentes para reportes
- estilos responsivos actuales

Y luego aplica cambios **mínimos y coherentes**.

---

## Entregable esperado

Debes dejar la solución lista para despliegue, incluyendo:

1. Cambios de backend
2. Cambios de frontend
3. Exportación Excel funcional
4. Técnicos pudiendo cambiar estado de sus propias actividades
5. Notificaciones responsivas corregidas
6. Responsividad validada en el módulo afectado
7. Sin romper la aplicación existente

---

## Validaciones mínimas que debes realizar

### Backend

- técnico cambia estado de su propia actividad => OK
- técnico intenta cambiar actividad ajena => bloqueado
- supervisor descarga Excel de todas las actividades => OK
- filtro por fecha funciona => OK

### Frontend

- notificaciones visibles y usables en móvil => OK
- operación técnica sigue responsiva => OK
- botón Excel visible para supervisor => OK
- técnico ve y usa cambio de estado cuando corresponde => OK

### Integración

- login sigue funcionando
- módulo técnico sigue funcionando
- evidencias siguen funcionando
- Cloudinary no se rompe
- despliegue no requiere cambios innecesarios

---

## Restricción final de implementación

Haz únicamente los cambios necesarios para cumplir estos requerimientos.

No hagas mejoras cosméticas no solicitadas.  
No rehagas módulos completos.  
No toques lógica ajena al alcance.  
No rompas producción.  
No asumas que puedes simplificar seguridad.  
No cambies de arquitectura.  
No metas deuda técnica nueva.

---

## Instrucción final

Analiza primero la arquitectura actual del proyecto y luego implementa **solo** los cambios solicitados de forma:

- segura,
- mantenible,
- mínima,
- consistente con ChargeLox,
- responsiva,
- optimizada para AWS EC2 t3.micro,
- lista para despliegue,
- y sin romper funcionalidades existentes.

Al finalizar, entrega también un resumen claro con:

1. archivos modificados,
2. permisos ajustados,
3. endpoint(s) nuevos o modificados,
4. componentes/páginas ajustadas,
5. cómo funciona la exportación Excel,
6. cómo se resolvió la responsividad,
7. y qué pruebas realizaste para asegurar que todo queda listo para despliegue.
