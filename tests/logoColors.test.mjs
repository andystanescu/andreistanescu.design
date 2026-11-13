import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractLogoColors, normalizeLogoColor, parseLogoColorMapping, recolorLogoSvg } from "../src/lib/logoColors.ts";
import { generateThemePalette } from "../src/lib/themePalette.ts";

const palettes = Object.fromEntries(Object.entries({primary:"#11161F",secondary:"#3E4650",accent:"#E8441C",neutral:"#6B7280"}).map(([role, color]) => [role, generateThemePalette(color)]));
const svg = `<svg viewBox="0 0 20 20"><style>.mark{fill:#fff;stroke:rgb(232, 68, 28)}</style><path fill="#11161f" stroke="none" d="M0 0"/><path style="fill:#FFF;stroke:#E8441C"/></svg>`;

test("finds distinct solid SVG colours without treating other values as colours", () => {
  assert.deepEqual(new Set(extractLogoColors(svg)), new Set(["#FFFFFF", "#E8441C", "#11161F"]));
  assert.equal(normalizeLogoColor("rgb(256,0,0)"), null);
});

test("detects and recolours the existing logo's accent and white fills", () => {
  const logo = readFileSync(new URL("../public/assets/logo-footer.svg", import.meta.url), "utf8");
  assert.ok(extractLogoColors(logo).includes("#E8441C"));
  assert.ok(extractLogoColors(logo).includes("#FFFFFF"));
  const light = recolorLogoSvg(logo, {"#FFFFFF":"neutral:950"}, palettes);
  assert.ok(light.includes(`fill="${palettes.neutral[950]}"`));
  assert.ok(light.includes('fill="#E8441C"'));
});

test("maps light and dark colours independently while preserving unmapped content", () => {
  const mapping = parseLogoColorMapping(JSON.stringify({light:{"#FFF":"neutral:950", "#E8441C":"accent:500"}, dark:{"#FFFFFF":"neutral:50"}}));
  const light = recolorLogoSvg(svg, mapping.light, palettes);
  const dark = recolorLogoSvg(svg, mapping.dark, palettes);
  assert.ok(light.includes(`fill:${palettes.neutral[950]}`));
  assert.ok(dark.includes(`fill:${palettes.neutral[50]}`));
  assert.ok(dark.includes('stroke="none"'));
  assert.ok(dark.includes('fill="#11161f"'));
  assert.ok(dark.includes('viewBox="0 0 20 20"'));
});

test("ignores malformed mappings and never treats arbitrary text as a colour", () => {
  assert.deepEqual(parseLogoColorMapping('{"light":{"#fff":"url(javascript:evil)","#000":"neutral:bad"}}'), {light:{},dark:{}});
  assert.deepEqual(parseLogoColorMapping("bad json"), {light:{},dark:{}});
  assert.equal(parseLogoColorMapping('{"light":{"#fff":"original"}}').light["#FFFFFF"], "original");
});
