import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  contrastRatio,
  createPublishedTheme,
  DEFAULT_PALETTE_ANCHORS,
  generateThemePalette,
  isHexColor,
  parsePublishedTheme,
  perceptualDistance,
  resolveClosestContrastShade,
  resolveTheme,
  THEME_TONES,
} from "../src/lib/themePalette.ts";
import { persistPublishedTheme } from "../src/lib/themePersistence.ts";

test("keeps the exact 500 anchor and generates a deterministic ordered OKLCH ramp", () => {
  const seed = "#4567A9";
  const first = generateThemePalette(seed);
  const second = generateThemePalette(seed);
  assert.deepEqual(first, second);
  assert.equal(first[500], seed);
  for (const tone of THEME_TONES) assert.match(first[tone], /^#[\da-f]{6}$/i);
  for (let index = 0; index < THEME_TONES.length - 1; index += 1) {
    const lighter = first[THEME_TONES[index]];
    const darker = first[THEME_TONES[index + 1]];
    const lightness = (color) => {
      const [r, g, b] = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255);
      const linear = (channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      const l = Math.cbrt(0.4122214708 * linear(r) + 0.5363325363 * linear(g) + 0.0514459929 * linear(b));
      const m = Math.cbrt(0.2119034982 * linear(r) + 0.6806995451 * linear(g) + 0.1073969566 * linear(b));
      const s = Math.cbrt(0.0883024619 * linear(r) + 0.2817188376 * linear(g) + 0.6299787005 * linear(b));
      return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    };
    assert.ok(lightness(lighter) >= lightness(darker), `${lighter} should be lighter than ${darker}`);
  }
});

test("keeps extreme, saturated and low-saturation anchors in sRGB", () => {
  for (const seed of ["#FFFFFF", "#000000", "#FF00D4", "#777777"]) {
    const palette = generateThemePalette(seed);
    assert.equal(palette[500], seed);
    for (const tone of THEME_TONES) assert.ok(isHexColor(palette[tone]));
  }
});

test("uses shade 500 when it passes, otherwise selects the closest passing shade", () => {
  const palette = generateThemePalette("#777777");
  const againstBlack = resolveClosestContrastShade(palette, 500, ["#000000"], 4.5);
  assert.equal(againstBlack.tone, 500);

  const againstWhite = resolveClosestContrastShade(palette, 500, ["#FFFFFF"], 4.5);
  assert.ok(againstWhite);
  const passing = THEME_TONES.filter((tone) => contrastRatio(palette[tone], "#FFFFFF") >= 4.5);
  const closestDistance = Math.min(...passing.map((tone) => perceptualDistance(palette[500], palette[tone])));
  assert.equal(perceptualDistance(palette[500], againstWhite.hex), closestDistance);
});

test("reports a role as unresolved when no shade can satisfy every required context", () => {
  const palette = generateThemePalette("#777777");
  assert.equal(resolveClosestContrastShade(palette, 500, ["#000000", "#FFFFFF"], 4.5), null);
});

test("resolves all published text, action and focus pairs and preserves independent anchors", () => {
  const anchors = { ...DEFAULT_PALETTE_ANCHORS };
  const resolution = resolveTheme(anchors);
  assert.deepEqual(resolution.issues, []);
  assert.ok(resolution.checks.length > 0);
  assert.ok(resolution.checks.every((check) => check.ratio >= check.required));

  const changedPrimary = resolveTheme({ ...anchors, primary: "#4567A9" });
  assert.equal(changedPrimary.palettes.primary[500], "#4567A9");
  assert.notEqual(changedPrimary.semantic.light["--action-primary-bg"], resolution.semantic.light["--action-primary-bg"]);
  assert.deepEqual(changedPrimary.palettes.secondary, resolution.palettes.secondary);
  assert.deepEqual(changedPrimary.palettes.accent, resolution.palettes.accent);
  assert.deepEqual(changedPrimary.palettes.neutral, resolution.palettes.neutral);
  assert.notEqual(resolution.semantic.light["--action-primary-bg"], resolution.semantic.dark["--action-primary-bg"]);
});

test("resolves extreme and saturated anchors where valid and blocks an unresolvable neutral palette", () => {
  for (const role of ["primary", "secondary", "accent"]) {
    const resolution = resolveTheme({ ...DEFAULT_PALETTE_ANCHORS, [role]: "#FFFFFF" });
    assert.deepEqual(resolution.issues, [], `${role} should resolve with a neutral text palette`);
  }
  for (const color of ["#000000", "#FF00D4", "#777777", "#FF0000", "#00FF00", "#0000FF"]) {
    const resolution = resolveTheme({ primary: color, secondary: color, accent: color, neutral: color });
    assert.deepEqual(resolution.issues, [], `${color} should resolve its semantic roles`);
  }
  const unresolvable = { ...DEFAULT_PALETTE_ANCHORS, neutral: "#FFFFFF" };
  assert.ok(resolveTheme(unresolvable).issues.length > 0);
  assert.throws(() => createPublishedTheme(unresolvable));
});

test("draft preview resolution does not mutate the last published theme", () => {
  const published = createPublishedTheme(DEFAULT_PALETTE_ANCHORS, "2026-11-06T12:00:00.000Z");
  const storedBeforePreview = JSON.stringify(published);
  const draftAnchors = { ...DEFAULT_PALETTE_ANCHORS, accent: "#4567A9" };
  const draftPreview = resolveTheme(draftAnchors);
  assert.notEqual(draftPreview.palettes.accent[500], published.anchors.accent);
  assert.equal(JSON.stringify(published), storedBeforePreview);
  assert.equal(parsePublishedTheme(storedBeforePreview).anchors.accent, DEFAULT_PALETTE_ANCHORS.accent);
});

test("persists a complete versioned theme atomically and can read it back", () => {
  const database = new DatabaseSync(":memory:");
  database.exec("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  const theme = createPublishedTheme(DEFAULT_PALETTE_ANCHORS, "2026-11-06T12:00:00.000Z");
  persistPublishedTheme(database, JSON.stringify(theme), theme.anchors);
  const rows = database.prepare("SELECT key, value FROM settings ORDER BY key").all();
  const stored = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
  assert.equal(stored.theme_primary_500, theme.anchors.primary);
  assert.equal(stored.theme_customized, "1");
  assert.deepEqual(parsePublishedTheme(stored.theme_config), theme);
  database.close();
});

test("rolls back a failed theme write without replacing the last published config", () => {
  const database = new DatabaseSync(":memory:");
  database.exec("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  database.prepare("INSERT INTO settings (key, value) VALUES ('theme_config', 'previous')").run();
  database.exec("CREATE TRIGGER fail_accent BEFORE INSERT ON settings WHEN NEW.key = 'theme_accent_500' BEGIN SELECT RAISE(ABORT, 'forced failure'); END");
  const theme = createPublishedTheme(DEFAULT_PALETTE_ANCHORS);
  assert.throws(() => persistPublishedTheme(database, JSON.stringify(theme), theme.anchors));
  assert.equal(database.prepare("SELECT value FROM settings WHERE key = 'theme_config'").get().value, "previous");
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM settings WHERE key = 'theme_primary_500'").get().count, 0);
  database.close();
});

test("rejects invalid 500 anchors before a theme can be published", () => {
  assert.throws(() => createPublishedTheme({ ...DEFAULT_PALETTE_ANCHORS, primary: "not-a-color" }));
});

test("persists independent overrides and keeps them fixed when the palette changes", () => {
  const overrides = { light: { "--bg-canvas": "#FFFFFF" }, dark: {} };
  const theme = createPublishedTheme(DEFAULT_PALETTE_ANCHORS, "2026-11-10T12:00:00.000Z", overrides);
  assert.deepEqual(parsePublishedTheme(JSON.stringify(theme)).overrides, overrides);
  assert.equal(theme.semantic.light["--bg-canvas"], "#FFFFFF");
  assert.equal(resolveTheme({ ...DEFAULT_PALETTE_ANCHORS, neutral: "#4567A9" }, overrides).semantic.light["--bg-canvas"], "#FFFFFF");
  assert.equal(theme.semantic.dark["--bg-canvas"], resolveTheme(DEFAULT_PALETTE_ANCHORS).semantic.dark["--bg-canvas"]);
});

test("blocks unsafe or invalid overrides before publishing", () => {
  const unsafe = { light: { "--text-primary": "#FFFFFF" }, dark: {} };
  assert.ok(resolveTheme(DEFAULT_PALETTE_ANCHORS, unsafe).issues.length);
  assert.throws(() => createPublishedTheme(DEFAULT_PALETTE_ANCHORS, undefined, unsafe));
  assert.throws(() => resolveTheme(DEFAULT_PALETTE_ANCHORS, { light: { "--not-a-role": "#FFFFFF" }, dark: {} }));
});
