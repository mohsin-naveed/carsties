# Carsties

## Clean-slate dev database reset (Postgres)

Some services support a **Development-only** “drop + recreate + migrate” flow controlled by `RESET_DB=true`.

- **Warning:** destructive. It drops the database configured in the service connection string.
- Intended for local dev only.

### Steps (Windows PowerShell)

1) Start Postgres (compose):

```powershell
Set-Location C:\Dev\Cars\carsties
docker-compose up -d postgres
```

2) Run the services once with `RESET_DB=true`:

```powershell
$env:RESET_DB = 'true'

dotnet run --project .\src\IdentityService\IdentityService.csproj
# in another terminal
$env:RESET_DB = 'true'
dotnet run --project .\src\ListingService\ListingService.csproj
# in another terminal
$env:RESET_DB = 'true'
dotnet run --project .\src\UserService\UserService.csproj
```

3) After the DBs are recreated and migrations applied, restart normally (without `RESET_DB`).

## Fixing “address already in use” (Windows)

Find what’s listening:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5001,5220,7020 |
  Select-Object LocalAddress,LocalPort,OwningProcess |
  Sort-Object LocalPort

# Inspect a PID
Get-Process -Id <PID> | Select-Object Id,ProcessName,Path
```

Stop it:

```powershell
Stop-Process -Id <PID> -Force
```

## Frontends

- Next.js app: [frontend/web-app/README.md](frontend/web-app/README.md)
- Angular admin: [frontend/web-admin/README.md](frontend/web-admin/README.md)
- Angular portal: [frontend/web-portal/README.md](frontend/web-portal/README.md)
