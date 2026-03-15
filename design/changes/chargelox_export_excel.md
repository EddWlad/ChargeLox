# CHANGES - CHARGELOX

## Objetivo del cambio

Implementar una nueva funcionalidad en **ChargeLox** siguiendo la arquitectura actual del proyecto, sin romper backend, frontend ni otras funcionalidades existentes.

## Contexto del proyecto

- La aplicación **ya está funcionando** en local y en producción.
- Existe una rama **`development`** creada para implementar cambios y validarlos localmente antes de subirlos a producción.
- El sistema tiene:
  - backend
  - frontend
  - despliegue productivo ya operativo
- No quiero refactorizaciones innecesarias.
- No quiero cambios agresivos de infraestructura si no son obligatorios.
- Cualquier cambio debe respetar el diseño, arquitectura y normativa ya existentes en ChargeLox.

---

## Instrucciones

1. Trabaja **siempre sobre la rama `development`** para implementar y probar la funcionalidad.
2. Analiza primero la estructura actual del backend y frontend antes de tocar código.
3. Mantén compatibilidad con el sistema actual.
4. No rompas funcionalidades existentes.
5. No cambies contratos del backend salvo que sea estrictamente necesario.
6. Si detectas un riesgo alto de romper el sistema, elige la solución más conservadora.
7. Si agregas archivos nuevos, ubícalos siguiendo la estructura actual del proyecto.
8. Si la funcionalidad requiere exportación de archivos, hazlo de forma mantenible, clara y profesional.
9. Si debes agregar dependencias, hazlo solo si son realmente necesarias y justificadas.
10. Antes de terminar, explica qué cambiaste y qué archivos tocaste.

---

## Objetivo funcional actual

[OBJETIVO_FUNCIONAL]

Implementar en el módulo de **puntos de carga** una exportación a **Excel** con todos los puntos de carga, mostrando exactamente estas columnas:

- nombre
- código asignado
- serial
- puk
- estado de conexión

---

## Alcance del backend

[CAMBIOS_BACKEND]

En el backend, concentrarse primero en crear el servicio para exportación a Excel de los puntos de carga.

### Requisitos backend

- Crear el endpoint necesario para exportar el archivo Excel.
- El archivo debe incluir todos los puntos de carga requeridos por el módulo administrativo.
- El contenido del Excel debe incluir exclusivamente estas columnas:
  - `nombre`
  - `codigoAsignado`
  - `serial`
  - `puk`
  - `estadoConexion`
- El nombre del archivo debe ser claro y profesional.
- La respuesta del endpoint debe permitir descarga directa del Excel.
- Seguir el estilo, estructura y patrones actuales del backend.
- No romper endpoints existentes.
- No alterar flujos que ya funcionan.
- Si existe una capa de servicios/controladores/DTOs/helpers para exportaciones, reutilizarla.

---

## Alcance del frontend

[CAMBIOS_FRONTEND]

En el frontend, agregar un botón en el módulo de **puntos de carga** para ejecutar la exportación Excel desde el servicio del backend.

### Requisitos frontend

- Agregar un botón visible, bien ubicado y coherente con la experiencia de usuario actual.
- El botón debe seguir el diseño, estilo visual y normativa que ya están implementados.
- El botón no debe sentirse improvisado ni fuera de contexto.
- Al hacer clic, debe llamar al endpoint del backend y descargar el archivo Excel correctamente.
- Mantener consistencia con otros botones y acciones del módulo.
- No romper filtros, tablas, paginación ni acciones actuales del módulo.
- Si existe una capa de servicios HTTP ya implementada, reutilizarla.
- Si hace falta mostrar estado de carga o error, hacerlo de forma limpia y acorde al sistema.

---

## Reglas de seguridad del cambio

- No romper backend.
- No romper frontend.
- No romper otras funcionalidades del sistema.
- No modificar comportamiento existente fuera del alcance de este cambio.
- No eliminar código útil actual.
- No reescribir módulos completos si no es necesario.
- Si hay una solución simple y otra invasiva, elegir la simple.

---

## Flujo de trabajo esperado

1. Revisar la estructura actual del proyecto.
2. Identificar dónde debe vivir el endpoint de exportación Excel en backend.
3. Implementar backend.
4. Probar backend localmente.
5. Implementar integración en frontend.
6. Probar flujo completo localmente desde la rama `development`.
7. Confirmar que no se rompen funcionalidades existentes.
8. Dejar el cambio listo para posterior despliegue a producción.

---

## Validaciones mínimas

[VALIDACIONES]

### Backend

- El endpoint responde correctamente.
- El archivo Excel se descarga sin errores.
- Las columnas y datos son correctos.
- El archivo abre correctamente en Excel.

### Frontend

- El botón aparece en una ubicación correcta.
- El botón descarga el archivo Excel correctamente.
- No rompe el módulo de puntos de carga.
- La UI sigue alineada con el diseño existente.

### No regresión

- El listado de puntos de carga sigue funcionando.
- Los filtros siguen funcionando.
- Las demás acciones del módulo siguen funcionando.
- El login y navegación general no se ven afectados.

---

## Criterios de aceptación

[CRITERIOS_DE_ACEPTACION]

Se considerará terminado cuando:

1. Exista un endpoint funcional en backend para exportar Excel de puntos de carga.
2. El Excel descargado contenga:
   - nombre
   - código asignado
   - serial
   - puk
   - estado de conexión
3. El frontend tenga un botón visible y correcto en el módulo de puntos de carga para descargar ese Excel.
4. El flujo completo funcione localmente en la rama `development`.
5. No se rompa ninguna funcionalidad existente.
6. El código nuevo siga el estilo y estructura de ChargeLox.

---

## Entregable

Antes de codificar:

- explicar brevemente el plan
- indicar qué archivos tocará
- indicar si agregará dependencias

Después:

- implementar el cambio completo
- resumir qué hizo
- indicar cómo probarlo localmente
- advertir si detectó algún riesgo o punto pendiente
