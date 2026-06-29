## Issue 1 — Copia recursiva del contexto de build (Security, High)

### Descripción

Las directivas `COPY` y `ADD` permiten copias recursivas de directorios y patrones
glob. En el `Dockerfile` del proyecto, la línea 8 usa `COPY . .`, que copia **todo**
el contexto de build hacia la imagen. Esto puede incluir archivos inesperados o
sensibles presentes en el directorio del proyecto —credenciales, llaves privadas,
archivos de configuración, la carpeta `.git`, etc.— que no están destinados a vivir
dentro del contenedor.

### Impacto potencial

Si la imagen Docker incluye sin querer archivos sensibles, cualquier persona con
acceso a la imagen o a un contenedor en ejecución podría extraer esos datos. Esto
puede derivar en robo de credenciales, exposición de llaves privadas o filtración de
detalles de configuración que se pueden aprovechar para atacar la aplicación o su
infraestructura.

### Cómo lo recomienda corregir SonarCloud

Reemplazar la copia recursiva por copias explícitas de los archivos/carpetas que el
contenedor realmente necesita:

```dockerfile
# Incumple (actual)
COPY . .

# Cumple (copias explícitas)
COPY package*.json ./
COPY index.js ./
COPY src/ ./src/
COPY public/ ./public/
```

Alternativamente, mantener `COPY . .` pero agregar un archivo `.dockerignore` que
excluya el contenido sensible o innecesario (`.git`, `.env`, `node_modules`, tests,
documentación, etc.), de modo que nunca entre al contexto de build.