# Core, Services and Insights dependency map

This map describes the current application before physical extraction. The feature switches hide unavailable features and protect their stored data, but they do not remove source files from the Next.js build. A Core-only build is not yet an installation without add-on files.

## Ownership and existing boundaries

| Area | Core responsibility | Services contribution | Insights contribution |
| --- | --- | --- | --- |
| Categories | Category records, ordering, aliases and case-study assignments | At most one service associated with a category; disabling it retains both records | Article-category assignments use Core category IDs and legacy aliases |
| Database | Connection, transaction and Core schema in `src/lib/db.ts` | `service_items`, its schema additions and `src/modules/services/migration.ts` | Article schema and category migration in `src/modules/insights/migration.ts` |
| Public content | Home, About, Work, shared navigation, footer and sitemap | Services listing/detail routes and homepage section | Article listing/detail routes, Home and About sections, related reading and evidence |
| Administration | Authentication, dashboard, navigation, content transfer and category management | Category service toggle/editor, service pages and service counts | Article editor, draft/published lists, dashboard and content picker entries |
| Transfer | Import/export transaction, media and Core categories | Service records keyed by category name | Articles and category assignments; articles can appear as evidence references |

The installed extension registry supplies Insights and Services migration hooks. The database owns the initialization transaction and invokes the hooks in order; Services owns its schema and default seed. Category callbacks now let Services update ordering and protect its data during deletion while it remains registered.

## Coupling that blocks a Core-only artifact

### Routing and access

- `src/app/services/**` and `src/app/api/admin/services/**` are Services routes; `src/app/insights/**`, `src/app/admin/(dashboard)/insights/**` and `src/app/api/admin/insights/**` are Insights routes. The admin also retains legacy Services routes. Their files are compiled as part of this Next.js application even when their switches are off.
- `src/proxy.ts` guards the add-on admin/API routes. Public pages and data access have additional checks. Removing a route must preserve both authorization and the unavailable response; hiding a link alone is insufficient.
- `src/lib/pages.ts`, `src/lib/features.ts`, `src/app/sitemap.ts`, `src/components/Footer/Footer.tsx` and `src/app/admin/(dashboard)/layout.tsx` decide which destinations appear. These need contributions from installed extensions, rather than hard-coded knowledge of both add-ons.

### Core composition and shared UI

- `src/app/page.tsx` directly imports the Services and Latest Insights sections; `src/app/about/page.tsx` directly imports About Latest Insights. Their visibility checks do not remove the imports. `src/components/home/Hero/HeroCollage.tsx` also directly reads Insights.
- `src/components/RelatedInsightCard/RelatedInsightCard.tsx`, `src/lib/relatedReadings.ts`, `src/lib/homepageValueContent.ts` and `src/lib/existingTags.ts` mix case studies with Insights data. Related content must degrade safely when an article provider is absent, without dropping saved references.
- The case-study editor, Work listing, admin navigation preview and service template picker use `src/components/insights/InsightsListing/InsightsListing.module.css` for shared filter controls. Those styles must move into a Core-owned primitive before Insights can be removed.
- `src/components/admin/DesignSystem/DesignSystem.tsx` and `DesignSystemPage.tsx`, together with `src/lib/designSystemManifest.ts` and the tracing rules in `next.config.ts`, directly reference add-on components and source files. The library needs optional contributions while continuing to show the actual installed components.
- Home/About layout editing, `src/lib/layoutConfiguration.ts`, `src/lib/homepage.ts` and `src/lib/about.ts` encode add-on section keys and visibility. The editor and public composition must agree on installed sections and preserve existing saved order and visibility.

### Data, categories and administration

- `src/lib/db.ts` delegates Services schema, seed and category migration to its registered extension; Insights migrations use the same registry. The current site composition still statically imports both extensions.
- Core category routes under `src/app/api/admin/categories/**` update Services, call Insights category helpers, and protect stored add-on records while a feature is disabled. `src/lib/serviceCategoryEditor.ts` and `src/lib/serviceCategoryOperations.ts` also couple the shared category editor to Services and, in places, Insights. Preserve rename, reorder, delete, alias and disabled-module safeguards.
- `src/app/admin/(dashboard)/categories/**`, `src/components/admin/CategoryServiceEditor/**` and the category-service API currently provide one combined category/service editor. Core must retain category editing when Services is absent; the extension should contribute the service-specific fields and toggle.
- `src/app/admin/(dashboard)/page.tsx` queries both add-on tables for dashboard labels, links and publication counts. `src/components/admin/AdminNav/**` and `AdminSidebar` receive feature booleans. Installed contributions need to supply their own dashboard and navigation data without making Core query absent tables.

### Transfer and cross-feature references

- `src/app/api/admin/content-import/route.ts` and `content-export/route.ts` contain Services and Insights SQL, media handling, add-on availability checks and article evidence resolution. `src/lib/contentTransfer.ts` contains the corresponding selectable groups.
- Imports currently reject files containing an unavailable add-on rather than silently dropping data. Preserve that behavior, transactional rollback, legacy transfer compatibility, pending category assignments and media reporting when moving transfer handlers behind extension interfaces.
- Services evidence can combine case studies and articles. The Services contribution must work without Insights, and the Insights contribution must not assume Services is installed. Existing category IDs and aliases remain Core-owned.

## Recommended first implementation slice

1. **Done:** Services schema, seed and category callbacks run through the registered extension in the existing transactions.
2. **Checked with limits:** An isolated production build succeeded with `src/modules/services` removed, its registration removed and `SERVICES_ADDON_ENABLED=false`. This is not a Core-only distribution: Services routes, UI and other service code were still present, Insights was installed, and runtime HTTP checks were blocked by the local environment.
3. Define a real distribution composition and move the remaining Services routes, UI and integrations into the add-on. Core now protects retained Services records during category deletion even when the extension is physically absent, including legacy tables without category links.
4. Extract shared filter UI, then migrate Services page/admin/navigation/transfer contributions in small slices. Repeat the physical-absence check after each slice.
5. Apply the same process to Insights, including the cross-module evidence and category cases, and verify both modules independently and together.

Do not publish the extracted domain utilities as the complete Core product. A full distribution also needs neutral first-run content, an allowlisted artifact and verified install/upgrade/transfer paths, as described in [core-packaging.md](core-packaging.md).
