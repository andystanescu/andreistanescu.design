import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createContentExportStream } from "../src/lib/contentExportStream.ts";

test("streamed content and assets remain compatible with the JSON import format", async () => {
  const dir = await mkdtemp(join(tmpdir(), "content-export-"));
  try {
    const bytes = Buffer.alloc(100003);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
    await writeFile(join(dir, "image.png"), bytes);
    const payload = { format: "conscept-content", version: 1, caseStudies: [{ title: "A quote: \" and emoji ☀️" }], configuration: { settings: [{ key: "x", value: "y" }], categories: [] } };
    const stream = createContentExportStream(payload, ["missing.png", "image.png"], dir);
    const result = JSON.parse(await new Response(stream).text());
    assert.deepEqual(result.caseStudies, payload.caseStudies);
    assert.deepEqual(result.configuration, payload.configuration);
    assert.equal(result.assets.length, 1);
    assert.equal(result.assets[0].filename, "image.png");
    assert.deepEqual(Buffer.from(result.assets[0].content, "base64"), bytes);
    const withoutAssets = JSON.parse(await new Response(createContentExportStream(payload, undefined, dir)).text());
    assert.equal("assets" in withoutAssets, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
