import { Mark, mergeAttributes } from "@tiptap/core";

// Recognizes the <span class="accent"> produced by applyHeadingAccents
// (src/lib/headingAccents.ts) so it round-trips through the editor
// correctly — without this, reopening a saved heading and saving again
// would silently drop the accent color (TipTap strips any inline element
// its schema doesn't recognize).
export const AccentMark = Mark.create({
  name: "accent",
  parseHTML() {
    return [{ tag: "span.accent" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "accent" }), 0];
  },
});
