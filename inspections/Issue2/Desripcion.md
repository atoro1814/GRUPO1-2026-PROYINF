## Issue 2 — Complejidad cognitiva demasiado alta (Maintainability, High)

### Descripción

La complejidad cognitiva mide qué tan difícil es entender el flujo de control de una
unidad de código; mientras más alta, más cuesta leerlo, entenderlo, probarlo y
modificarlo. Se incrementa cada vez que el código rompe el flujo de lectura lineal
(condicionales, bucles, `catch`, `switch`) y, especialmente, con cada **nivel de
anidamiento**. En la función `submitApplication()` —que implementa la HU-02
(Completar Solicitud)— la complejidad llega a **18**, superando el máximo permitido
de **15**. El exceso proviene del anidamiento de condicionales: la distinción entre
modo `manual` y `automático`, la validación de documentos (`if (!docsInput || ...)`),
la inyección de archivos según el modo, y un bloque `try/catch` con más `if` anidados
(`if (data.success)`, `if (...liquidacionFiles...)` y un `try/catch` interno).

### Impacto potencial

Los desarrolladores pasan más tiempo leyendo y entendiendo código que escribiéndolo.
La alta complejidad cognitiva ralentiza los cambios, aumenta el costo de
mantenimiento de la HU-02 y la hace más propensa a errores, ya que requiere mantener
muchos caminos de ejecución en mente al modificarla.

### Cómo lo recomienda corregir SonarCloud

Reducir el anidamiento y descomponer la función en piezas más pequeñas. SonarCloud
sugiere: extraer las condiciones complejas en funciones con nombre descriptivo,
descomponer la función grande en funciones de responsabilidad única, evitar el
anidamiento profundo usando *early returns* (procesar los casos excepcionales primero
y retornar), y usar optional chaining (`?.`) donde aplique. Aplicado a
`submitApplication()`:

```javascript
function normalizarIngreso(formData) {
  const rawIncome = formData.get('income');
  if (rawIncome) formData.set('income', rawIncome.replace(/\./g, ''));
}

function adjuntarDocumentos(formData) {
  // lógica de modo manual / automático extraída aquí
}

async function submitApplication(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  normalizarIngreso(formData);

  if (currentFormMode === 'manual') {
    const docsInput = document.getElementById("form-documents");
    if (!docsInput || docsInput.files.length === 0) {
      return alert("Para enviar la solicitud manual, debes adjuntar tus documentos de respaldo.");
    }
  } else {
    adjuntarDocumentos(formData);
  }
  // ... envío
}
```

Advertencia de la herramienta: al ser código complejo, conviene tener pruebas
unitarias que lo cubran antes de refactorizar.