# Docker Deployment

The default Compose command starts only PostgreSQL for local development:

```bash
docker compose up -d --wait postgres
npm run prisma:deploy
npm run start:dev
```

To build and run both the application and PostgreSQL in Docker:

```bash
docker compose --profile full up -d --build --wait
```

Open `http://localhost:3000/builder/`. Published pages are served from `/sites/{slug}` and stored in the `published_sites` volume.

For a remote server, replace the local database credentials with server-owned secrets supplied through the deployment environment. Do not commit or send credential values in a pull request. Terminate TLS at the hosting platform or reverse proxy.

Stop the stack without deleting data:

```bash
docker compose --profile full down
```

Delete local workshop data only when it is disposable:

```bash
docker compose --profile full down -v
```
