# Grupo 1

Este es el repositorio del Grupo 1, cuyos integrantes son:

* Alexander Toro Astudillo - 202304647-7
* Bárbara Camilo González - 202304567-5
* Manuel Vega Lopez - 202304644-2
* Benjamín Torres Hormazábal - 202373539-6
* Sebastián Santander Martínez - 202373608-2
* **Ayudante**: Benjamín Daza
* **Profesor**: Ricardo Salas

## Requisitos Previos

Para ejecutar este proyecto necesitarás:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- Docker Desktop (para usuarios de Windows)
- WSL2 habilitado en Docker Desktop (para usuarios de Windows)

## Instrucciones de Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/atoro1814/GRUPO10-2025-PROYINF.git
cd GRUPO10-2025-PROYINF
```

2. Asegúrate de tener Docker Desktop abierto y WSL2 habilitado

3. Una vez en `mvc-project/`, construya y levante los contenedores por medio del siguiente comando:
```bash
docker compose up --build
```

Para detener los contenedores:
```bash
docker compose down -v
```

### Comandos Útiles

- Levantar el proyecto sin reconstruir:
```bash
docker compose up
```
- Levantar el proyecto en segundo plano:
```bash
docker compose up -d
```
- Ver estado de los servicios:
```bash
docker compose ps
```
- Ver logs en tiempo real:
```bash
docker compose logs -f
```

## Estructura del Proyecto

El proyecto sigue una arquitectura **Modelo-Vista-Controlador (MVC)** que permite a los integrantes del equipo trabajar en paralelo sobre áreas bien delimitadas.

```
/
├── index.js                          ← Entry point del servidor
├── package.json
├── Dockerfile
├── docker-compose.yml
├── public/                           ← Vista (Frontend)
│   ├── index.html
│   ├── css/
│   └── js/
└── src/
    ├── config/
    │   └── db.js                     ← Conexión a PostgreSQL
    ├── models/                       ← Acceso a datos (BD)
    │   ├── db.model.js               ← Inicialización de tablas
    │   ├── applicant.model.js
    │   ├── document.model.js
    │   ├── installment.model.js
    │   └── notification.model.js
    ├── controllers/                  ← Lógica de negocio
    │   ├── auth.controller.js
    │   ├── applicant.controller.js
    │   ├── admin.controller.js
    │   └── ocr.controller.js
    ├── routes/                       ← Definición de endpoints
    │   ├── auth.routes.js
    │   ├── applicant.routes.js
    │   ├── admin.routes.js
    │   └── ocr.routes.js
    └── middlewares/
        └── upload.middleware.js      ← Manejo de archivos (Multer)
```

### División del trabajo

| Área | Carpeta | Descripción |
|---|---|---|
| Frontend / Vista | `public/` | HTML, CSS y JavaScript del cliente |
| Modelos / BD | `src/models/` | Queries SQL y acceso a datos |
| Controladores | `src/controllers/` | Lógica de negocio por dominio |
| Rutas | `src/routes/` | Definición y mapeo de endpoints |
| Infraestructura | `Dockerfile`, `docker-compose.yml` | Configuración de contenedores |

## Wiki

Puede acceder a la Wiki mediante el siguiente [enlace](https://github.com/atoro1814/GRUPO10-2025-PROYINF/wiki)

## Videos

* [Video presentación cliente](https://www.youtube.com)
* [Video presentación avance 1](https://youtu.be/J6jgxYB2WD4)
* [Video presentación avance 2](https://youtu.be/FNwrfbmLTPs)

## Aspectos técnicos relevantes

El proyecto utiliza **Node.js con Express** en el backend y **PostgreSQL** como base de datos, ambos orquestados mediante Docker Compose. La arquitectura MVC separa la capa de datos (`models`), la lógica de negocio (`controllers`) y la interfaz de usuario (`public`), facilitando el desarrollo colaborativo sin conflictos entre ramas.
