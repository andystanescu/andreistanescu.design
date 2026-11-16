# Core and Insights

Insights is enabled by default so existing installations retain their article experience. Set `INSIGHTS_ADDON_ENABLED=false` before starting or building to exercise the application without Insights. This is independent of `SERVICES_ADDON_ENABLED`; each can be enabled without the other.

With Insights disabled, article routes and administration are unavailable, article navigation and dependent sections are omitted, and a new database does not create article tables. Existing article data is retained. A category with article assignments cannot be deleted while Insights is disabled; enable Insights to review and perform the deletion. Core categories and case studies remain available. Services evidence continues to use eligible case studies when Insights is absent.

## Data and transfer

Core owns categories. Insights owns the article schema and its `insight_categories` association to Core category IDs. The versioned Insights migration preserves existing article records, maps legacy category names and aliases to Core categories, and synchronizes the legacy category field when the add-on returns after a category rename. The migration does not create a Service. Back up the database before upgrading or importing content.

Core content can be transferred without Insights. Article exports retain article data and category names; import resolves those names through the receiving site's Core categories and their historical aliases. If a category cannot be resolved, import reports the missing category instead of silently inventing one. Import categories first when moving articles to a new site. Imports containing articles are rejected when Insights is disabled, rather than dropping them. Missing local article media is reported after import; include images in the export or replace the missing media. Existing transfer formats remain supported where their category names can be resolved.

## Distribution and installation limitations

This is a runtime and database boundary within the existing application, **not yet a physically separate Core package**. The repository still contains Insights routes and components, and Core-facing source files retain static imports of Insights code. Disabling the add-on does not remove those files from the build. A commercial Core-only distribution still needs explicit package/build boundaries and extension registration, removal of those static dependencies, independently versioned add-on artifacts and compatibility checks, and tests of actual package installation and upgrade paths. No upload installer, licence system or automatic updater is included.
