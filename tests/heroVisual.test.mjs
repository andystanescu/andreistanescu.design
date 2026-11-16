import test from "node:test";
import assert from "node:assert/strict";
import { saveHeroVisualCode, displayedHeroVisualCode } from "../src/lib/heroVisual.ts";

test("hero code stays private until published, including removal", () => {
  const draft = saveHeroVisualCode("published visual", "new visual", false);
  assert.equal(displayedHeroVisualCode(draft.live, draft.draft, false), "published visual");
  assert.equal(displayedHeroVisualCode(draft.live, draft.draft, true), "new visual");
  const removed = saveHeroVisualCode(draft.live, "", false);
  assert.equal(displayedHeroVisualCode(removed.live, removed.draft, true), "");
  assert.deepEqual(saveHeroVisualCode(removed.live, removed.draft, true), { live: "", draft: null });
});
