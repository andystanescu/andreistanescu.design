import type { DatabaseSync } from "node:sqlite";

/** A registered extension is installed; enablement is a separate runtime decision. */
export type PlatformExtension = {
  readonly id: string;
  readonly contractVersion: 1;
  readonly isEnabled: () => boolean;
  /** Category callbacks run inside the caller's transaction. */
  readonly categories?: {
    readonly updated?: (db: DatabaseSync, category: { id: number; name: string; description: string }) => void;
    readonly reordered?: (db: DatabaseSync, categoryIds: readonly number[]) => void;
    /** Disabled extensions may protect stored data from deletion. */
    readonly beforeDelete?: (db: DatabaseSync, categoryId: number, enabled: boolean) => string | undefined;
  };
  readonly migrations?: {
    /** Runs before other extension schema migrations. */
    readonly preSchema?: (db: DatabaseSync) => void;
    /** Runs after the initial Core tables exist, before legacy data backfills. */
    readonly schema?: (db: DatabaseSync) => void;
    /** Runs at the legacy Core schema upgrade boundary. */
    readonly afterCoreSchema?: (db: DatabaseSync) => void;
    /** Seeds extension data before Core category migration. */
    readonly beforeCategories?: (db: DatabaseSync) => void;
    /** Runs after the Core category foundation and before initialization commits. */
    readonly afterCategories?: (db: DatabaseSync) => void;
  };
};

export type ExtensionMigrationStage = "preSchema" | "schema" | "afterCoreSchema" | "beforeCategories" | "afterCategories";

/** Preserve registration order; fail early rather than running a module twice. */
export function createExtensionRegistry(extensions: readonly PlatformExtension[]): readonly PlatformExtension[] {
  const ids = new Set<string>();
  for (const extension of extensions) {
    if (typeof extension.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(extension.id)) throw new Error(`Invalid extension ID: ${extension.id}`);
    if (extension.contractVersion !== 1) throw new Error(`Unsupported extension contract for ${extension.id}`);
    if (typeof extension.isEnabled !== "function") throw new Error(`Missing enablement check for ${extension.id}`);
    for (const stage of ["preSchema", "schema", "afterCoreSchema", "beforeCategories", "afterCategories"] as const) {
      const hook = extension.migrations?.[stage];
      if (hook !== undefined && typeof hook !== "function") throw new Error(`Invalid ${stage} migration for ${extension.id}`);
    }
    for (const hook of ["updated", "reordered", "beforeDelete"] as const) {
      const callback = extension.categories?.[hook];
      if (callback !== undefined && typeof callback !== "function") throw new Error(`Invalid category ${hook} callback for ${extension.id}`);
    }
    if (ids.has(extension.id)) throw new Error(`Duplicate extension ID: ${extension.id}`);
    ids.add(extension.id);
  }
  return Object.freeze([...extensions]);
}

/** Capture enablement once per initialization so all stages see the same modules. */
export function enabledExtensions(extensions: readonly PlatformExtension[]): readonly PlatformExtension[] {
  return extensions.filter((extension) => extension.isEnabled());
}

/** The caller owns the transaction, including commit and rollback. */
export function runExtensionMigrations(extensions: readonly PlatformExtension[], stage: ExtensionMigrationStage, db: DatabaseSync): void {
  for (const extension of extensions) extension.migrations?.[stage]?.(db);
}


export function notifyCategoryUpdated(extensions: readonly PlatformExtension[], db: DatabaseSync, category: { id: number; name: string; description: string }): void {
  for (const extension of extensions) if (extension.isEnabled()) extension.categories?.updated?.(db, category);
}

export function notifyCategoriesReordered(extensions: readonly PlatformExtension[], db: DatabaseSync, categoryIds: readonly number[]): void {
  for (const extension of extensions) if (extension.isEnabled()) extension.categories?.reordered?.(db, categoryIds);
}

/** Return an actionable reason to stop; the caller rolls back the transaction. */
export function prepareCategoryDeletion(extensions: readonly PlatformExtension[], db: DatabaseSync, categoryId: number): string | undefined {
  for (const extension of extensions) {
    const reason = extension.categories?.beforeDelete?.(db, categoryId, extension.isEnabled());
    if (reason) return reason;
  }
}
