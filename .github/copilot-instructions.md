# Copilot instructions for `carsties`

## Big picture
- This repo is a .NET microservices solution (`Carsties.sln`) with multiple HTTP APIs under `src/` and multiple frontends under `frontend/`.
- Authentication is centralized in `src/IdentityService` (Duende IdentityServer + ASP.NET Core Identity + PostgreSQL). Services validate access tokens via JWT Bearer with `Authority` pointing to Identity (see `src/ListingService/Program.cs`).
- Shared cross-service contracts live in `src/Contracts` (used for event/message DTOs).

## Service conventions (match existing patterns)
- Most services use:
  - Minimal hosting in `Program.cs` (`builder.Services.AddControllers(); builder.Services.AddOpenApi();`)
  - EF Core with Npgsql and a `DbInitializer.InitDb(app)` wrapped in Polly retry (see `src/CatalogService/Program.cs`).
  - Dev-friendly CORS policy named `CorsPolicy` (AllowAnyOrigin/AnyHeader/AnyMethod).
- Postgres connection string key is typically `ConnectionStrings:DefaultConnection`.

## Identity patterns
- Identity config is in `src/IdentityService/Config.cs`:
  - Scopes include `auctionApp` and user claims include `name`, `role`, and `account_type`.
  - Clients include `nextApp` (Next.js app) and `web-client` (Angular) with redirect/cors configured via `ClientApp`.
- Identity uses Razor Pages for UI flows (e.g. registration at `src/IdentityService/Pages/Account/Register/*`).

## Frontends
- `frontend/web-app` is a Next.js app (standard `npm run dev`). It integrates with IdentityServer via a callback route configured in IdentityClient `RedirectUris`.
- `frontend/web-client` is an Angular SPA (no top-level README in this repo, entry points in `frontend/web-client/src`). Auth glue lives in `frontend/web-client/src/app/core`.

## Developer workflows (what to run)
- .NET solution build: open `Carsties.sln` and build from Visual Studio, or use `dotnet build` at repo root.
- Service-by-service run: each service has its own `Properties/launchSettings.json` and `Dockerfile` under `src/<ServiceName>/`.
- Local dev is typically via `docker-compose.yml` (starts shared dependencies like `postgres`; services can be added/started as needed).
- Database: Postgres is used by multiple services; compose currently defines a `postgres` service (see `docker-compose.yml`).

## Secrets & config expectations
- Dev secrets can live in `appsettings.Development.json`/user-secrets; production should use environment variables.
- External login providers (Google/Facebook) are expected to be configured via config (client id/secret) rather than hardcoded.

## Gotchas / repo-specific details
- Identity uses Duende IdentityServer (license summary is printed on shutdown in dev; see `src/IdentityService/Program.cs`).
- ListingService uses Azure Blob for images via `AzureBlobImageStorageService` (`src/ListingService/Services/ImageStorageService.cs`), so keep config in sync when changing ListingService.

## When making changes
- Prefer matching the existing minimal-host + EF Core + Polly initializer style rather than introducing new frameworks.
- When adding new cross-service data shapes, consider placing shared DTOs/events in `src/Contracts`.
