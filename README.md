# Pokhara Mahanagarpalika Citizen Portal

Pokhara Metropolitan City's multi-role grievance management platform for citizens, officers, wards, and central administrators.

## Structure

- `frontend/`: Next.js frontend
- `backend/`: raw `node:http` backend with MongoDB Atlas support and local JSON fallback

## Backend Notes

- The backend expects Node `20` or `22` LTS.
- `.nvmrc` in `backend/` is set to `22`.
- Atlas connectivity can be checked without starting the whole server:

```bash
cd backend
npm run check:mongo
```

## MongoDB Setup

Use `backend/.env` for secrets.

Standard SRV setup:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/pnpp_portal?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=pnpp_portal
```

If your runtime environment blocks SRV DNS lookups, add a direct Atlas URI instead:

```env
MONGODB_DIRECT_URI=mongodb://<username>:<password>@host1:27017,host2:27017,host3:27017/pnpp_portal?ssl=true&authSource=admin&replicaSet=<replica-set-name>&retryWrites=true&w=majority&appName=Cluster0
```

Optional network hint for environments that need IPv4-first behavior:

```env
MONGODB_FORCE_IPV4=true
```

## Current External Blocker

In the current environment, Atlas SRV DNS resolution is failing before the app can complete the Atlas handshake. The repo now supports a direct non-SRV Mongo URI and prints a precise startup error, but you still need one of these external fixes:

1. Run the backend on Node 20 or 22 LTS.
2. Provide `MONGODB_DIRECT_URI` from your Atlas cluster's "standard connection string" view.

## Docker

The repo now includes container support for both services:

- `backend/Dockerfile` for the raw `node:http` API
- `frontend/Dockerfile` for the Next.js frontend
- `docker-compose.yml` to run them together

### Quick start

If you just want to run the app in Docker with the built-in local JSON fallback store:

```bash
docker compose up --build
```

That starts:

- frontend at `http://localhost:3000`
- backend at `http://localhost:4000`

The backend keeps `backend/data/local-store.json` mounted into the container, so local fallback data persists across restarts.

### Run with MongoDB Atlas

If you want the containers to use Atlas instead of the local fallback:

```bash
cp backend/.env.example backend/.env
docker compose --env-file backend/.env up --build
```

The compose file reads these variables when present:

- `MONGODB_URI`
- `MONGODB_DIRECT_URI`
- `MONGODB_DB_NAME`
- `MONGODB_FORCE_IPV4`
- `MONGODB_USE_PUBLIC_DNS_ON_SRV_FAILURE`
- `MONGODB_DNS_SERVERS`
- `JWT_SECRET`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`

You can also override frontend and port settings from the shell:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 FRONTEND_PORT=3001 BACKEND_PORT=4001 docker compose up --build
```

### Common Docker commands

```bash
docker compose up --build -d
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
```

## GitHub Push

If you want to push the current local state after reviewing it:

```bash
git status
git add .
git commit -m "Add Docker support for PNPP"
git push origin main
```

If GitHub prompts for authentication, make sure your local Git or GitHub CLI credentials are already configured before pushing.
