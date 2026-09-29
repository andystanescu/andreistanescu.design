# Human engagement analytics: audit and data model

## Existing system audit

- `analytics_events` stores `view`, `share`, and `download` rows with content type/id, a coarse acquisition source, country, an event key, and an HMAC of the existing persistent visitor cookie for unique article and case-study views.
- `/api/analytics` accepts article/case-study views and shares. It excludes authenticated admin sessions, but does not classify bots or record general page sessions.
- `/api/cv-download` records downloads. Other public routes and meaningful interactions are not tracked.
- The admin home shows published-content counts, raw unique content views, CV downloads, contact submissions, source/country summaries, and a most-read list. Its analytics window is fixed at 30 days; there is no human-engagement view.
- No active attention, reading depth, chapter exposure, session journey, service-evidence transition, or actor-classification history exists. Historical `view` events cannot be reliably reclassified as humans or converted into attention/depth data.
- The checked local SQLite database has 21 historical view rows (6 articles and 15 case studies) from 8 Sep through 27 Sep 2026; it has no historical share/download rows. This is local development data, not a claim about production totals.
- Existing bot protection is limited to excluding authenticated admin sessions. No crawler classification or session mechanism exists beyond the persistent visitor cookie used for deduplicating content views.
- SQLite schema and migrations live in `src/lib/db.ts`; the configured runtime database is `DATA_DIR/conscept.db` (local fallback `data/conscept.db`). The checked-in local database contained legacy analytics rows but no engagement schema.

## Additive proposal

Keep `analytics_events` unchanged. Add three append-oriented/derived tables:

- `engagement_sessions`: one random, tab-scoped session ID, coarse actor class (`uncertain`, `likely_human`, `likely_bot`, `verified_bot`), coarse source, start/last-seen times, page and interaction counts, active seconds, duration, and the highest progressive engagement level.
- `engagement_pages`: one row per session and canonical path, with content type/id, first/last seen, active seconds, maximum primary-content depth, distinct chapter count, and derived page engagement level.
- `engagement_events`: deduplicated threshold/action events only (`page_view`, `interaction`, `attention`, `depth`, `chapter_view`, and meaningful actions). It stores no raw pointer movement, scroll coordinates, full referrer URL, IP address, or user-agent string.

The client keeps its random ID only in `sessionStorage`; it is not a cookie and is cleared when the tab session ends. A server-side allowlist classifies known crawler user-agent families as verified bots without retaining the header. Positive browser interaction, sustained active attention and meaningful progress are combined before promoting a session to likely human; JavaScript execution alone remains uncertain. High-speed page automation can be marked likely bot. Everything else remains uncertain.

Active attention accrues only while the document is visible/focused and recent meaningful interaction occurred, with a 45-second idle cutoff and batched checkpoints. Content progress is measured inside primary content, only the highest 25/50/75/90/100% thresholds are stored, and case-study headings count after sustained visibility. Engagement rules are deterministic, content-type-aware, and centralized in `src/lib/analytics.ts`; session levels are cumulative maxima of page levels and portfolio breadth.

These fields are additive. No existing table is dropped or rewritten, and no legacy view is presented as a human-engagement metric. New attention/depth/journey data begins when the updated application is deployed; before that, the dashboard reports unavailable rather than zero.

## Privacy and measurement limits

The new collection is first-party, anonymous, and tab-scoped. It does not use fingerprinting, persistent IDs, identifying profile data, IP storage, or raw user-agent/referrer storage. Existing persistent visitor-cookie behavior remains limited to the existing unique-view mechanism. The public privacy page currently says its policy is coming soon; before deployment, it should be updated to describe anonymous session-level engagement analytics and its retention. Browser-side collection cannot count crawlers that never execute the client, so bot diagnostics describe observed analytics sessions rather than all HTTP requests.
