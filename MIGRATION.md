# ConScept copy

Source: `andystanescu/conscept` at `4f8871a3fa22c19d008e2918f7311da09dd33ace`.

The destination previously contained only `README.md`. That file remains byte-for-byte unchanged. The application is integrated at the root, with no route prefix or import-path changes.

## Preserved

- 316 files copied unchanged: public pages, admin screens and APIs, React components, styles, content definitions, email integration, content editing, and supporting files. All 50 tracked public files are included (including the upload placeholder); two SVGs only have excess trailing whitespace removed. SQLite schema and original demo initialization are preserved.
- Dependency versions and lockfile resolutions preserved. The standard `next start` command replaces the custom server, and the Node runtime requirement is explicit.
- Current content preserved in `content/conscept-content.json`: 5 case studies, 5 insights, 8 pages, 3 experiences, and homepage/services/approach/About/settings configuration. Load it explicitly through the admin content-transfer screen.
- Portable `DATA_DIR` and `UPLOADS_DIR` options, SQLite lock waiting, upload serving, same-site redirects, and ordinary account setup/recovery retained. These support the application across hosts and do not encode a GoDaddy path or protocol.

## Removed or adapted

- Omitted `server.js`, including forwarded-host rewriting for the GoDaddy proxy; `GODADDY-DEPLOY.md`; `.claude/launch.json`; and the source's generic README.
- Removed GoDaddy configuration comments and local development-origin assumptions from `next.config.ts`.
- Removed automatic exported-content fallback restoration and persistent-versus-packaged seed lookup from `src/lib/db.ts`. The source seed is now a manual import file outside the runtime data directory.
- Removed stale package script approvals, including the unused native SQLite package approval. No deployment ZIPs, local caches, extracted packages, host configuration, generated builds, installed dependencies or live databases were copied.
- Removed administrator credentials and the protected case-study password hash from the snapshot. Protection remains enabled. Content export now omits those credentials/hashes, and content import cannot overwrite administrator credentials.
- Replaced a Windows-only upload-export path with a platform-independent path join; export now also finds upload references in page and site configuration.
- Added a secret-free `.env.example`, portable ignore rules, and deployment documentation.

## Verification and remaining work

Dependency installation and the production build passed, including TypeScript. All 22 runtime checks passed: public routes, authentication, manual import, credential preservation, sanitized export, protected-case-study metadata, and configured upload storage. Lint passes for all adapted code files. Full application lint reports 6 existing errors and 53 warnings; all six error-bearing files match the source byte-for-byte.

The credential-pattern, host-path and local-import checks passed. The exact copied, adapted and omitted filenames, and the six existing lint-error files, are listed in `MIGRATION-MANIFEST.json`.

48 upload files referenced by the snapshot are absent from the source checkout, the other local application copy, and the checked backup/deployment archives. The source snapshot contains no embedded assets. Their filenames are listed in the manifest; restore them from the live site's uploads/content export. No real credentials, database records, submissions or recovery tokens were imported into the copied repository.

Follow `DEPLOYMENT.md` to configure a Node host, durable database/upload storage, HTTPS/domain, environment variables, first administrator, manual content import and a new password for the protected case study. This copy does not deploy the site or change the source repository. The original repository still contains the credential-bearing snapshot; review and rotate those original credentials separately.
