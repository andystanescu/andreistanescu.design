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
| `SESSION_SECRET` | Required for administrator sessions and protected case-study access. Keep stable across restarts. |
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

The repository includes `render.yaml` for a Node web service. It builds with `npm ci && npm run build`, starts with `npm start`, generates a stable `SESSION_SECRET`, and mounts a 1 GB persistent disk at `/opt/render/project/src/storage`. The SQLite database and uploaded files use directories beneath that mount so administrator credentials and content edits survive deploys and restarts.

Create or sync the service from the Blueprint in the Render dashboard. After its first successful deploy, open `https://<your-service>.onrender.com/admin/login`. If no administrator exists yet, the page shows the one-time setup form. Create the account there, then sign in normally. Credentials are stored on the attached disk.

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

Render persistent disks require a paid web-service instance. Without a disk, environment-based credentials can make sign-in work, but SQLite content and uploaded files are erased when the service restarts or redeploys.

## Missing uploaded content

All tracked assets are included. The source snapshot contains no embedded assets and references 48 upload files absent from the source checkout and checked local backups. See `MIGRATION-MANIFEST.json` for their exact filenames. Obtain a content export including assets from the live application, or restore the corresponding files into `UPLOADS_DIR`. Review that export for credentials before using it. Existing text, layouts and asset references have been preserved rather than replaced with invented content.
