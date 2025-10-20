# Grupo 10

Este es el repositorio del Grupo 10, cuyos integrantes son:

* Alexander Toro Astudillo - 202304647-7
* Bárbara Camilo González - 202304567-5
* Manuel Vega Lopez - 202304644-2
* Benjamín Torres Hormazábal - 202373539-6
* **Ayudante**: Felipe Fernández
* **Profesora**: Luz Chourio

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
* [Video presentación avance 1](https://youtu.be/J6jgxYB2WD4)
* Etc ...

## Aspectos técnicos relevantes

