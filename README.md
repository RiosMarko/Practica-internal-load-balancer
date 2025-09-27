Proyecto de ejemplo que despliega:

- **App Node/Express** (5 réplicas) que expone:
  - `GET /` → JSON con `hostname` + usuarios (desde MySQL)
  - `GET /health` → estado simple
  - `GET /usuarios` → vista HTML con tabla de usuarios
- **MySQL** (5 contenedores: 1 primario + 4 de respaldo detrás de HAProxy)
- **Load balancer externo**: **Traefik v2.10** para la app (puerto **8080**)
- **Load balancer interno**: **HAProxy** para MySQL (puerto **6446**)

## Requisitos

- Docker (Docker Desktop o Engine 20+)
- **Swarm inicializado**:
  ```bash
  docker swarm init
  ```
- Puertos libres: **8080** (Traefik) y **6446** (HAProxy)

## Variables y puertos por defecto

- App escucha en **3000** (interno), expuesta por Traefik en **8080**.
- HAProxy expone **6446** para balancear hacia MySQL.
- Conexión de la app a la BD (variables en el servicio `app`):
  - `DB_HOST=mysql-lb`
  - `DB_PORT=6446`
  - `DB_USER=appuser`
  - `DB_PASSWORD=apppass`
  - `DB_DATABASE=appdb`

---

## Build & Deploy

### 1) Construir imagen de la app
```bash
cd app
docker build -t local/hostname-usuarios-app:1.0 .
cd ..
```

### 2) Desplegar el stack
```bash
docker stack deploy -c docker-stack.yml demo
```

### 3) Ver estado
```bash
docker stack services demo
```
Esperado:
- `demo_app` **5/5**
- `demo_traefik` **1/1** (8080→80)
- `demo_mysql-lb` **1/1** (6446→6446)
- `demo_mysql{1..5}` **1/1**
- `demo_mysql-app-user` **0/1** (normal: job efímero)

---

## Probar

### Navegador / curl
- HTML: `http://localhost:8080/usuarios`
- JSON: `http://localhost:8080/`
- Health: `http://localhost:8080/health`

> Refresca varias veces `/usuarios` o `/` → el `hostname` cambia entre réplicas (balanceo), la lista de usuarios permanece igual (consistencia).

### Probar LB interno de MySQL (opcional)
La red `internal` está como `attachable: true` para pruebas.

```bash
docker run --rm -it --network demo_internal mysql:8.0   mysql -hmysql-lb -P6446 -uappuser -papppass -e "SELECT * FROM appdb.usuarios;"
```

---

## Actualizar la app (cuando edites `server.js`)

Opción rápida (mismo tag):
```bash
cd app
docker build -t local/hostname-usuarios-app:1.0 .
cd ..
docker service update --force demo_app
```
