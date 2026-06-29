# Decisiones sobre Recomendaciones de SonarCloud

## Issue 1 — Copia recursiva del contexto de build (Security, High)

**Decisión: Se adopta.**

Se implementará la recomendación de SonarCloud agregando un archivo `.dockerignore` que excluya del contexto de build los archivos sensibles o innecesarios (`.git`, `.env`, `node_modules`, `tests/`, documentación). Se prefiere esta alternativa sobre la de reemplazar `COPY . .` por copias explícitas, porque:

- No requiere mantener una lista de archivos/carpetas sincronizada manualmente a medida que el proyecto crezca.
- Es la solución de menor esfuerzo (el propio reporte de SonarCloud estima 20 minutos), consistente con el alcance que el equipo puede dedicar a esta actividad dada la carga del semestre.
- Resuelve el riesgo de seguridad de fondo (filtración de archivos sensibles) sin necesidad de tocar la lógica del `Dockerfile`.

---

## Issue 2 — Complejidad cognitiva demasiado alta en `submitApplication()` (Maintainability, High)

**Decisión: Se considera, pero no se implementa de lleno en este Hito.**

El equipo reconoce el valor de la recomendación: la función `submitApplication()` efectivamente concentra demasiadas responsabilidades (validación según modo, inyección de archivos, manejo de respuesta OCR) y un refactor reduciría su complejidad cognitiva de 18 a un valor por debajo del umbral de 15. Sin embargo, se decide no aplicar el refactor completo por las siguientes razones:

- La propia advertencia de SonarCloud señala que, al ser código complejo, conviene contar con pruebas unitarias que lo cubran antes de refactorizar. El proyecto no cuenta actualmente con cobertura de pruebas sobre esta función específica del frontend, lo que eleva el riesgo de introducir regresiones silenciosas en una función ya verificada en producción funcional.
- El esfuerzo de extraer cada función auxiliar (`normalizarIngreso`, `adjuntarDocumentos`) y validar que el comportamiento se mantiene idéntico en todos los casos (modo manual, modo automático, con y sin liquidaciones) excede el tiempo disponible del equipo para esta actividad puntual del Hito.
- Es una mejora de mantenibilidad, no de seguridad ni de funcionalidad: no representa un riesgo inmediato para el usuario final ni para la integridad de los datos, a diferencia del Issue 1.

