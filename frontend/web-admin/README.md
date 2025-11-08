# WebAdmin

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

# Carsties Admin (web-admin)

Modern Angular 17 admin panel for managing Catalog data (Makes, Models, Generations, Variants, Features, VariantFeatures).

## Stack & Conventions

- Angular 17 standalone APIs, strict TypeScript
- Angular Material for UI (responsive layout, theming)
- Feature-first folder structure under `src/app/catalog/*`
- Centralized Http services with typed DTOs matching backend (`CatalogService`)
- RxJS best practices: use `signal`/`computed` or `BehaviorSubject` for component state
- Immutable update patterns; avoid manual subscription leaks by using `async` pipe

## Planned Structure

```
src/app/
	core/               # Core singletons (interceptors, error handling, layout shell)
	shared/             # Reusable components, pipes, directives
	catalog/
		makes/
		models/
		generations/
		variants/
		features/
		variant-features/
		catalog-api.service.ts
```

Each entity folder will contain:

- `<entity>.page.ts` (smart component / route target)
- `<entity>-list.component.ts` (table + filter)
- `<entity>-form.component.ts` (create/update form)
- `index.ts` barrel
- Route definition in `catalog.routes.ts`

## Environment

Create `src/environments/environment.ts` and `environment.development.ts` with `apiBaseUrl` pointing to CatalogService (e.g. `http://localhost:7005/api`).

## Running

```powershell
npm install
npm start
```
Visit `http://localhost:4200`.

## Coding Standards

- Prefer Standalone Components (no NgModules) unless required
- Strong typing for all DTOs (mirror backend shapes)
- Use Angular Material form field + table components
- Keep components presentational; move data logic to services
- Interceptors for JSON error formatting & base URL prefix

## Future Enhancements

- Auth integration (reuse IdentityService) for protected admin operations
- Optimistic updates and caching layer (RxJS shareReplay)
- E2E tests (Cypress) and unit tests for services/components

## License

Internal project. See root repository license terms.
