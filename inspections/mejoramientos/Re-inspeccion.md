# Re-inspección SonarCloud — Post Mejoramiento de Código

## Contexto

Tras la inspección inicial documentada en `../code-review/`, se aplicó la corrección correspondiente al Issue 1 y se re-ejecutó el análisis en SonarCloud sobre el mismo repositorio (fork público bajo cuenta personal). El Issue 2 no fue corregido en este hito, conforme a la decisión documentada en `../code-review/Decisiones.md`.

---

## Resultado por Issue

### Issue 1 — Copia recursiva del contexto de build (Security, High)

**Estado anterior:** Open — High  
**Estado actual:** Accepted

La regla `docker:S6470` fue marcada como **Accepted** en SonarCloud con el siguiente comentario adjunto:

> *"Se mitiga mediante .dockerignore que excluye archivos sensibles del contexto de build"*

Esta acción refleja una decisión consciente del equipo: se reconoce el riesgo identificado por SonarCloud y se mitiga mediante un `.dockerignore` que impide que archivos sensibles (`.git`, `.env`, `node_modules`, `tests/`, documentación) ingresen al contexto de build, sin necesidad de reemplazar `COPY . .` por copias explícitas. El issue ya no aparece en la lista de issues abiertos de severidad High.

---

### Issue 2 — Complejidad cognitiva en `submitApplication()` (Maintainability, High)

**Estado anterior:** Open — High  
**Estado actual:** Open — High (sin cambios, decisión intencional)

Conforme a lo documentado en `../code-review/Decisiones.md`, este issue no fue abordado en este hito por las siguientes razones: ausencia de cobertura de pruebas sobre la función afectada, costo de refactor superior al tiempo disponible del equipo, y naturaleza del problema (mantenibilidad, no seguridad ni funcionalidad). Se podría evaluar la aplicación de un *early return* parcial como mejora incremental de bajo riesgo.

---

## Comparativa

| Issue | Primera inspección | Re-inspección |
|---|---|---|
| Issue 1 — Security/High (docker:S6470) | Open | Accepted — mitigado con `.dockerignore` |
| Issue 2 — Maintainability/High (javascript:S3776) | Open | Open — postergado intencionalmente |
