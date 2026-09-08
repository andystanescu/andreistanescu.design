# Running the ConScept application

The application lives at the repository root. The original personal-site README is unchanged.

## Local development

Use Node.js 22.13 or newer (Node 24 recommended). The database uses `node:sqlite`, so a Node server is required; a static upload or Edge-only runtime is insufficient.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and fill in `SESSION_SECRET` with a long random value. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. Run `npm run dev`.
4. Open `/admin/login` and create the first administrator credentials before making the site publicly accessible. Alternatively set both `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH`.
5. To load the copied content, sign in and open `/admin/content-transfer`, then import `content/conscept-content.json`. This is an explicit import, never an automatic startup recovery. A fresh database otherwise starts with the application's original demo content. The importer upserts content; review any remaining demo records in the admin panel.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Recommended for administrator sessions and protected case-study access. Keep stable across restarts. If omitted, the app generates and stores one in SQLite. |
| `PUBLIC_SITE_URL` | Set to the public HTTPS origin for metadata, sitemap and recovery links. The code defaults to `https://andreistanescu.design`; the example uses localhost. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` | Optional together if first-use setup is used. Stored credentials take precedence. Use a bcrypt hash; escape dollar signs with backslashes when putting it in a Next.js env file. |
| `RESEND_API_KEY`, `CONTACT_EMAIL_FROM` | Optional email delivery, using a verified sender. Without them, contact submissions still save to SQLite. Set the recipient in admin settings. |
| `ADMIN_RECOVERY_EMAIL` | Optional recovery recipient; email delivery must also be configured. |
| `DATA_DIR` | Optional database directory; default `./data`. |
| `UPLOADS_DIR` | Optional upload directory; default `./public/uploads`. |
| `PORT` | Optional runtime listener port; default 3000. Set in the server environment, not a Next.js env file. |

## Production

Install dependencies, run `npm run build`, then `npm start` from the repository root. The standard Next.js server replaces the custom hosting wrapper. The build downloads Google Fonts, so it needs access to Google's font servers as well as the npm registry during installation.

Configure your host's process supervision, HTTPS, domain/DNS and reverse proxy. Use one application instance with durable writable storage for SQLite and uploads, or redesign storage before scaling across machines/serverless functions. Back up both storage directories. An ephemeral filesystem will lose administrator changes; the app no longer restores an export after a rebuild.

If `UPLOADS_DIR` points outside `public/uploads`, copy the bundled `public/uploads` files into that directory too. The upload-serving route reads the configured directory. Use separate temporary storage for builds to avoid touching a production database, and do not ship build-created databases as application source.

The imported `researcher-assistant` case study remains password-protected, but its old password hash was removed. Set a new password in the admin editor. The snapshot also excludes administrator credentials. Content exports now omit these credentials and case-study hashes; content imports cannot replace administrator credentials.

## Render

The repository includes `render.yaml` for the existing `conscept` Node web service. It builds with `npm ci && npm run build`, starts with `npm start`, generates a stable `SESSION_SECRET`, and mounts a 1 GB persistent disk at `/opt/render/project/src/storage`. The SQLite database and uploaded files use directories beneath that mount so administrator credentials and content edits survive deploys and restarts.

Sync the Blueprint to the existing `conscept` service in the Render dashboard. Committing `render.yaml` alone does not attach a disk to a manually configured service. Before attaching a new disk, export the current content from **Admin > Content Transfer**. A newly attached disk starts empty, so after the first successful disk-backed deploy, sign in at `https://conscept.onrender.com/admin/login` and import that export. Subsequent administrator credentials, content edits, contact submissions, and uploaded files persist across deploys and restarts.

Do not detach or replace the disk during routine deploys. Keep the service at one instance because the SQLite database cannot be shared safely between multiple Render instances. Back up content regularly from **Admin > Content Transfer**.

If this repository is connected to an existing Render service instead of a Blueprint, apply these settings in its dashboard:

- Service type: Web Service
- Runtime: Node
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Instance count: one
- Persistent disk mount: `/opt/render/project/src/storage`
- `DATA_DIR`: `/opt/render/project/src/storage/data`
- `UPLOADS_DIR`: `/opt/render/project/src/storage/uploads`
- `SESSION_SECRET`: a stable random 32-byte or longer secret
- `PUBLIC_SITE_URL`: the public HTTPS origin

For contact email delivery, add `RESEND_API_KEY` and `CONTACT_EMAIL_FROM` to the service environment. The Blueprint declares both with `sync: false`, so Render prompts for their values without storing them in Git. `CONTACT_EMAIL_FROM` must use a domain verified in Resend, for example `Website <contact@andreistanescu.design>`. In **Admin > Settings**, also set **Contact form: send submissions to** to the inbox that should receive messages. Redeploy after changing environment variables.

Render persistent disks require a paid web-service instance. Without a disk, environment-based credentials can make sign-in work, but SQLite content and uploaded files are erased when the service restarts or redeploys.

If `SESSION_SECRET` is absent on an existing service, the application generates one and stores it beside the administrator credentials in SQLite. This prevents a successful credential check from ending in an HTTP 500. An explicit Render environment value remains preferable because it stays valid independently of the database.

## Missing uploaded content

All tracked assets are included. The source snapshot contains no embedded assets and references 48 upload files absent from the source checkout and checked local backups. See `MIGRATION-MANIFEST.json` for their exact filenames. Obtain a content export including assets from the live application, or restore the corresponding files into `UPLOADS_DIR`. Review that export for credentials before using it. Existing text, layouts and asset references have been preserved rather than replaced with invented content.
