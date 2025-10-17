# Grupo 10

Este es el repositorio del Grupo 10, cuyos integrantes son:

* Alexander Toro Astudillo - 202304647-7
* Bárbara Camilo González - 202304567-5
* Manuel Vega Lopez - 202304644-2
* Benjamín Torres Hormazábal - 202373539-6
* **Tutor**: Felipe Fernández

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

3. Navega hasta la carpeta del proyecto:
```bash
cd mi-proyecto-node-docker
```

4. Construye y levanta los contenedores:
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

## Wiki

Puede acceder a la Wiki mediante el siguiente [enlace](https://github.com/atoro1814/GRUPO10-2025-PROYINF/wiki)

## Videos

* [Video presentación cliente](https://www.youtube.com)
* [Video presentación avance 1](https://www.youtube.com/)
* Etc ...

## Aspectos técnicos relevantes

Hasta el momento de la entrega del Hito 2, se conectó la base del proyecto propuesta por los ayudantes con el Github íntegramente hecho y trabajado por nosotros. Aquel que desee verificar un avance de código deberá clonar NUESTRO repositorio que ya cuenta con dicha conexión y, asumiendo que tiene las tecnologías necesarias y estipuladas dentro del README de mi_proyecto_node_docker, puede interactuar con la terminal de Docker y acceder al primer vistazo de la pagina. Solo se pretendió levantar esta última y verficar que podemos empezar a editar su contenido (se editó index.js para que muestre un mensaje diferente al original notificando que el desarrollo a posteriori será funcional).

