import type { DatabaseSync } from "node:sqlite";
import type { PaletteAnchors } from "./themePalette";

function upsert(db: DatabaseSync, key: string, value: string) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

function withImmediateTransaction(db: DatabaseSync, write: () => void) {
  db.exec("BEGIN IMMEDIATE;");
  try {
    write();
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

export function persistPublishedTheme(db: DatabaseSync, config: string, anchors: PaletteAnchors) {
  withImmediateTransaction(db, () => {
    upsert(db, "theme_config", config);
    upsert(db, "theme_primary_500", anchors.primary);
    upsert(db, "theme_secondary_500", anchors.secondary);
    upsert(db, "theme_accent_500", anchors.accent);
    upsert(db, "theme_neutral_500", anchors.neutral);
    upsert(db, "theme_customized", "1");
  });
}

export function persistDefaultTheme(db: DatabaseSync, defaults: PaletteAnchors) {
  withImmediateTransaction(db, () => {
    upsert(db, "theme_config", "");
    upsert(db, "theme_primary_500", defaults.primary);
    upsert(db, "theme_secondary_500", defaults.secondary);
    upsert(db, "theme_accent_500", defaults.accent);
    upsert(db, "theme_neutral_500", defaults.neutral);
    upsert(db, "theme_customized", "0");
  });
}
