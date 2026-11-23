# Preparing the platform for packaging

The current repository is a working portfolio application, not a distributable Core package. Services and Insights can be disabled independently, but their source code is still present and Core code still imports parts of them. A disabled feature is not the same as an uninstalled package. Keep the root package private until a separate distribution and its upgrade path have been verified.

`packages/core-domain` is the first, deliberately narrow extraction: framework-independent theme, case-study overview, hero-code and email-content utilities. The application uses compatibility entry points while the package can be built independently. It is not the complete Core product, and its package interface remains private and provisional.

## Current ownership

- Core owns the application shell, admin authentication, site identity, navigation, themes, uploads, content transfer, case studies, categories and their assignments, contact submissions and analytics.
- Services owns service records, their category migration in `src/modules/services`, and pages linked to Core categories. See [Core categories and Services](core-services-boundary.md).
- Insights owns articles and article-category assignments. See [Core and Insights](core-insights-boundary.md).
- The design-system reference documents the actual application components. Its source-file and icon reads need their explicit build tracing rules when the app is deployed.
- `docs/prototypes` contains examples intended for the live-code editor, not TypeScript application modules. They are excluded from the application type check, not deleted.

## Distribution blockers

The detailed inventory and first implementation slice are in [core-module-dependency-map.md](core-module-dependency-map.md).

1. Establish actual package and build boundaries, then replace static Core-to-add-on imports with explicit extension registration. Package installation must work when add-on source files are absent, not merely disabled.
2. Separate the commercial defaults and onboarding from this portfolio's seeded content, author, logo assets and hard-coded copy. `src/lib/db.ts`, `src/lib/settings.ts`, `src/components/Logo/Logo.tsx` and `src/lib/seo.ts` still contain portfolio-specific defaults. The configured site URL must be supplied for each installation.
3. Decide the public package interfaces, ownership of database migrations and supported Core/add-on version combinations. Test fresh installs, upgrades, rollback and content transfer using real distribution artifacts and backed-up data.
4. Define an explicit distribution allowlist and review the archive. A root `npm pack` currently includes the portfolio content export, examples and application source; it is not a buyer-ready Core artifact. Do not distribute it as Core.
5. Provide documented deployment configuration, persistent database and upload storage, administrator setup, and verification of the live-code sandbox and asset delivery in the chosen distribution.

## Working checks

Run `npm run typecheck`, `npm test` and `npm run build` against the application, plus `npm run build --prefix packages/core-domain` for the extracted utilities. Exercise the four Services/Insights combinations, including fresh and existing databases; changing a flag must not delete an add-on's saved data. Also verify public navigation, editor access and import/export for each supported combination. The automated module tests cover data migrations and flag behaviour; they do not prove that Core can be installed without the add-on files.

The application build uses `.next` output. For a clean release verification, build in a clean checkout or otherwise avoid stale development-generated types. Do not copy the local `data` directory, uploaded customer files, environment files, credentials, logs, generated build output, or prototype assets into a distribution unless explicitly required and reviewed.
