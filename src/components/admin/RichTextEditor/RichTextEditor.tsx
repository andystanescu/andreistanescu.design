"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Blockquote from "@tiptap/extension-blockquote";
import Paragraph from "@tiptap/extension-paragraph";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { AllSelection, TextSelection } from "@tiptap/pm/state";
import { Node as TiptapNode } from "@tiptap/core";
import { createLowlight, common } from "lowlight";
import { AccentMark } from "./AccentMark";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";
import type { RelatedReadingOption } from "@/lib/relatedReadings";
import styles from "./RichTextEditor.module.css";

const lowlight = createLowlight(common);

// A code block can be flagged "interactive" — on the public page it renders
// as a live, running React component (via react-live) instead of
// syntax-highlighted text. The flag round-trips as data-interactive="true"
// on the <pre> (see RichContent's splitInteractiveBlocks, which looks for
// exactly that attribute).
const InteractiveCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      interactive: {
        default: true,
        parseHTML: () => true,
        renderHTML: () => ({ "data-interactive": "true" }),
      },
      chrome: {
        default: "framed",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-chrome") || "framed",
        renderHTML: (attributes: { chrome?: string }) =>
          attributes.chrome === "minimal" ? { "data-chrome": "minimal" } : {},
      },
      runtime: {
        default: "auto",
        parseHTML: (element: HTMLElement) => {
          const runtime = element.getAttribute("data-runtime");
          return runtime === "react" || runtime === "html" || runtime === "static" ? runtime : "auto";
        },
        renderHTML: (attributes: { runtime?: string }) => ({ "data-runtime": attributes.runtime || "auto" }),
      },
      mediaVariant: {
        default: "wide",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-media-variant") || "wide",
        renderHTML: (attributes: { mediaVariant?: string }) => ({ "data-media-variant": attributes.mediaVariant || "wide" }),
      },
      embedLabel: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-embed-label") || "",
        renderHTML: (attributes: { embedLabel?: string }) => attributes.embedLabel ? { "data-embed-label": attributes.embedLabel } : {},
      },
      embedHelp: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-embed-help") || "",
        renderHTML: (attributes: { embedHelp?: string }) => attributes.embedHelp ? { "data-embed-help": attributes.embedHelp } : {},
      },
    };
  },
});

const AttributedBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      attribution: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-attribution") || "",
        renderHTML: (attributes: { attribution?: string }) =>
          attributes.attribution ? { "data-attribution": attributes.attribution } : {},
      },
    };
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      let currentNode = node;
      const dom = document.createElement("blockquote");
      const contentDOM = document.createElement("div");
      const input = document.createElement("input");
      input.type = "text";
      input.className = `${styles.imageCaptionInput} ${styles.quoteAttributionInput}`;
      input.placeholder = "Quote attribution";
      input.setAttribute("aria-label", "Quote attribution");
      input.contentEditable = "false";
      input.value = node.attrs.attribution || "";
      const syncVisibility = () => {
        let position: number | undefined;
        try {
          position = typeof getPos === "function" ? getPos() : undefined;
        } catch {
          return;
        }
        if (typeof position !== "number") return;
        const { from, to } = editor.state.selection;
        const selectionIsInsideQuote = from > position && to < position + currentNode.nodeSize;
        const shouldHide = !selectionIsInsideQuote && document.activeElement !== input;
        // Avoid repeatedly writing the same DOM attribute. ProseMirror observes
        // node-view mutations, so redundant writes can create a render loop
        // while an existing case study is being opened.
        if (input.hidden !== shouldHide) input.hidden = shouldHide;
      };
      input.addEventListener("input", () => {
        const position = typeof getPos === "function" ? getPos() : undefined;
        if (typeof position !== "number") return;
        editor.view.dispatch(editor.state.tr.setNodeMarkup(position, undefined, { ...currentNode.attrs, attribution: input.value }));
      });
      input.addEventListener("mousedown", (event) => event.stopPropagation());
      input.addEventListener("blur", syncVisibility);
      editor.on("selectionUpdate", syncVisibility);
      dom.append(contentDOM, input);
      queueMicrotask(syncVisibility);
      return {
        dom,
        contentDOM,
        stopEvent: (event) => event.target === input,
        ignoreMutation: (mutation) => mutation.target === input,
        update: (updatedNode) => {
          if (updatedNode.type !== currentNode.type) return false;
          currentNode = updatedNode;
          if (document.activeElement !== input) input.value = updatedNode.attrs.attribution || "";
          syncVisibility();
          return true;
        },
        destroy: () => {
          editor.off("selectionUpdate", syncVisibility);
          input.removeEventListener("blur", syncVisibility);
        },
      };
    };
  },
});

const StyledParagraph = Paragraph.extend({
  addAttributes() {
    return {
      className: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("class") || "",
        renderHTML: (attributes: { className?: string }) =>
          attributes.className ? { class: attributes.className } : {},
      },
    };
  },
});

const CalloutBlock = TiptapNode.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: { default: "note", parseHTML: (element: HTMLElement) => element.getAttribute("data-callout") || "note", renderHTML: (attributes: { variant?: string }) => ({ "data-callout": attributes.variant || "note" }) },
      title: { default: "Note", parseHTML: (element: HTMLElement) => element.getAttribute("data-callout-title") || "Note", renderHTML: (attributes: { title?: string }) => ({ "data-callout-title": attributes.title || "Note", "aria-label": attributes.title || "Note" }) },
    };
  },
  parseHTML() { return [{ tag: "aside[data-callout]" }]; },
  renderHTML({ HTMLAttributes }) { return ["aside", HTMLAttributes, 0]; },
});

const RelatedInsightBlock = TiptapNode.create({
  name: "relatedInsight",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      slug: { default: "", parseHTML: (element: HTMLElement) => element.getAttribute("data-related-insight") || "", renderHTML: (attributes: { slug?: string }) => ({ "data-related-insight": attributes.slug || "" }) },
      title: { default: "", parseHTML: (element: HTMLElement) => element.getAttribute("data-title") || "", renderHTML: (attributes: { title?: string }) => attributes.title ? { "data-title": attributes.title } : {} },
      contentType: { default: "article", parseHTML: (element: HTMLElement) => element.getAttribute("data-content-type") === "case_study" ? "case_study" : "article", renderHTML: (attributes: { contentType?: string }) => ({ "data-content-type": attributes.contentType === "case_study" ? "case_study" : "article" }) },
    };
  },
  parseHTML() { return [{ tag: "aside[data-related-insight]" }]; },
  renderHTML({ HTMLAttributes }) { return ["aside", HTMLAttributes]; },
  addNodeView() {
    return ({ node }) => {
      const element = document.createElement("aside");
      element.className = styles.relatedInsightBlock;
      element.contentEditable = "false";
      element.textContent = `Related ${node.attrs.contentType === "case_study" ? "case study" : "article"} · ${node.attrs.title || node.attrs.slug}`;
      return { dom: element };
    };
  },
});

const GalleryBlock = TiptapNode.create({
  name: "imageGallery",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      images: { default: "", parseHTML: (element: HTMLElement) => element.getAttribute("data-image-gallery") || "", renderHTML: (attributes: { images?: string }) => ({ "data-image-gallery": attributes.images || "" }) },
      mediaVariant: { default: "wide", parseHTML: (element: HTMLElement) => element.getAttribute("data-media-variant") || "wide", renderHTML: (attributes: { mediaVariant?: string }) => ({ "data-media-variant": attributes.mediaVariant || "wide" }) },
    };
  },
  parseHTML() { return [{ tag: "aside[data-image-gallery]" }]; },
  renderHTML({ HTMLAttributes }) { return ["aside", HTMLAttributes]; },
  addNodeView() {
    return ({ node }) => {
      const element = document.createElement("aside");
      element.className = styles.galleryBlock;
      element.contentEditable = "false";
      let count = 0;
      try { count = JSON.parse(decodeURIComponent(node.attrs.images || "")).length; } catch { /* Show malformed data as an empty gallery. */ }
      element.textContent = `Image gallery · ${count} image${count === 1 ? "" : "s"}`;
      return { dom: element };
    };
  },
});

const BeforeAfterBlock = TiptapNode.create({
  name: "beforeAfter",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      comparison: { default: "", parseHTML: (element: HTMLElement) => element.getAttribute("data-before-after") || "", renderHTML: (attributes: { comparison?: string }) => ({ "data-before-after": attributes.comparison || "" }) },
      mediaVariant: { default: "wide", parseHTML: (element: HTMLElement) => element.getAttribute("data-media-variant") || "wide", renderHTML: (attributes: { mediaVariant?: string }) => ({ "data-media-variant": attributes.mediaVariant || "wide" }) },
    };
  },
  parseHTML() { return [{ tag: "aside[data-before-after]" }]; },
  renderHTML({ HTMLAttributes }) { return ["aside", HTMLAttributes]; },
  addNodeView() {
    return () => {
      const element = document.createElement("aside");
      element.className = styles.galleryBlock;
      element.contentEditable = "false";
      element.textContent = "Before / after comparison";
      return { dom: element };
    };
  },
});

// Images remain ordinary HTML images when the editor is saved, but in the
// editor they get a small native corner handle for manual resizing.
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("width") || null,
        renderHTML: (attributes: { width?: string | null }) =>
          attributes.width ? { width: attributes.width } : {},
      },
      caption: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-caption") || "",
        renderHTML: (attributes: { caption?: string }) =>
          attributes.caption ? { "data-caption": attributes.caption } : {},
      },
      source: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-source") || element.closest("figure")?.querySelector("[data-figure-context]")?.textContent || "",
        renderHTML: (attributes: { source?: string }) => attributes.source ? { "data-source": attributes.source } : {},
      },
      mediaVariant: {
        default: "contained",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-media-variant") || element.closest("figure")?.getAttribute("data-media-variant") || "contained",
        renderHTML: (attributes: { mediaVariant?: string }) => ({ "data-media-variant": attributes.mediaVariant || "contained" }),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element: HTMLElement) => {
          const image = element.querySelector("img[src]");
          if (!image) return false;
          const figcaption = element.querySelector("figcaption");
          const context = figcaption?.querySelector("[data-figure-context]")?.textContent || "";
          return {
            src: image.getAttribute("src"), alt: image.getAttribute("alt") || "",
            title: image.getAttribute("title") || "", width: image.getAttribute("width") || null,
            caption: figcaption?.querySelector("[data-figure-caption]")?.textContent || (context ? Array.from(figcaption?.childNodes || []).filter((child) => child.nodeType === Node.TEXT_NODE).map((child) => child.textContent).join("").trim() : figcaption?.textContent || ""),
            source: context,
            mediaVariant: element.getAttribute("data-media-variant") || image.getAttribute("data-media-variant") || "contained",
          };
        },
      },
      ...(this.parent?.() || []),
    ];
  },
  renderHTML({ HTMLAttributes, node }: { HTMLAttributes: Record<string, unknown>; node: { attrs: { caption?: string; source?: string; mediaVariant?: string } } }) {
    const caption = typeof node.attrs.caption === "string" ? node.attrs.caption.trim() : "";
    const source = typeof node.attrs.source === "string" ? node.attrs.source.trim() : "";
    if (!caption && !source) return ["img", HTMLAttributes];
    const imageAttributes = { ...HTMLAttributes };
    delete imageAttributes["data-media-variant"];
    delete imageAttributes["data-source"];
    const captionContent: Array<string | Record<string, string> | unknown[]> = ["figcaption", {}];
    if (caption) captionContent.push(["span", { "data-figure-caption": "" }, caption]);
    if (source) captionContent.push(["small", { "data-figure-context": "" }, source]);
    return ["figure", { "data-media-variant": node.attrs.mediaVariant || "contained" }, ["img", imageAttributes], captionContent];
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("span");
      const image = document.createElement("img");
      const handle = document.createElement("button");
      const captionInput = document.createElement("input");
      const sourceInput = document.createElement("input");
      const attrs = node.attrs as { src: string; alt?: string; title?: string; width?: string | null; caption?: string; source?: string; mediaVariant?: string };

      wrapper.className = styles.resizableImage;
      wrapper.setAttribute("data-resizable-image", "true");
      wrapper.setAttribute("data-media-variant", attrs.mediaVariant || "contained");
      wrapper.setAttribute("contenteditable", "false");
      image.src = attrs.src;
      image.alt = attrs.alt || "";
      image.draggable = true;
      if (attrs.title) image.title = attrs.title;
      if (attrs.width) image.width = Number(attrs.width);
      captionInput.type = "text";
      captionInput.className = styles.imageCaptionInput;
      captionInput.placeholder = "Add image caption…";
      captionInput.setAttribute("aria-label", "Image caption");
      captionInput.value = attrs.caption || "";
      sourceInput.type = "text";
      sourceInput.className = `${styles.imageCaptionInput} ${styles.figureContextInput}`;
      sourceInput.placeholder = "Optional source or context…";
      sourceInput.setAttribute("aria-label", "Image source or context");
      sourceInput.value = attrs.source || "";
      handle.type = "button";
      handle.className = styles.imageResizeHandle;
      handle.setAttribute("aria-label", "Resize image");
      handle.title = "Drag to resize image";
      wrapper.append(image, captionInput, sourceInput, handle);

      const updateWidth = (width: number) => {
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            width: String(Math.round(width)),
          })
        );
      };

      const selectImage = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos != null) editor.commands.setNodeSelection(pos);
      };

      const updateCaption = () => {
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        const currentNode = editor.state.doc.nodeAt(pos);
        if (!currentNode) return;
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...currentNode.attrs, caption: captionInput.value }));
      };

      const updateSource = () => {
        const pos = typeof getPos === "function" ? getPos() : null;
        if (pos == null) return;
        const currentNode = editor.state.doc.nodeAt(pos);
        if (!currentNode) return;
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...currentNode.attrs, source: sourceInput.value }));
      };

      const startResize = (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = image.getBoundingClientRect().width;
        const maxWidth = editor.view.dom.clientWidth || startWidth;
        handle.setPointerCapture?.(event.pointerId);

        const move = (moveEvent: PointerEvent) => {
          const nextWidth = Math.max(120, Math.min(maxWidth, startWidth + moveEvent.clientX - startX));
          wrapper.style.width = `${nextWidth}px`;
        };
        const finish = () => {
          const width = image.getBoundingClientRect().width;
          updateWidth(width);
          wrapper.style.width = "";
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", finish);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", finish, { once: true });
        window.addEventListener("pointercancel", finish, { once: true });
      };

      handle.addEventListener("pointerdown", startResize);
      image.addEventListener("click", selectImage);
      captionInput.addEventListener("input", updateCaption);
      sourceInput.addEventListener("input", updateSource);
      return {
        dom: wrapper,
        stopEvent: (event: Event) => event.target === handle || handle.contains(event.target as Node) || event.target === captionInput || event.target === sourceInput,
        update: (updatedNode: typeof node) => {
          if (updatedNode.type !== node.type) return false;
          image.src = updatedNode.attrs.src;
          image.alt = updatedNode.attrs.alt || "";
          if (updatedNode.attrs.width) image.width = Number(updatedNode.attrs.width);
          else image.removeAttribute("width");
          captionInput.value = updatedNode.attrs.caption || "";
          sourceInput.value = updatedNode.attrs.source || "";
          wrapper.setAttribute("data-media-variant", updatedNode.attrs.mediaVariant || "contained");
          return true;
        },
        destroy: () => {
          handle.removeEventListener("pointerdown", startResize);
          image.removeEventListener("click", selectImage);
          captionInput.removeEventListener("input", updateCaption);
          sourceInput.removeEventListener("input", updateSource);
        },
      };
    };
  },
});

type RichTextEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  onContentChange?: (html: string) => void;
  relatedReadings?: RelatedReadingOption[];
  toolbarAddon?: ReactNode;
};

type BlockType = "paragraph" | "eyebrow" | "h1" | "h2" | "h3" | "quote" | "code";

type ToolbarIconName =
  | "bold"
  | "italic"
  | "link"
  | "bulleted-list"
  | "ordered-list"
  | "image"
  | "code"
  | "more"
  | "chevron-down";

function ToolbarIcon({ name }: { name: ToolbarIconName }) {
  return (
    <svg className={styles.toolbarIcon} aria-hidden="true" viewBox="0 0 24 24">
      <use href={`/assets/editor-toolbar-icons.svg#${name}`} />
    </svg>
  );
}

function readToolbarState(editor: Editor | null) {
  const selectedNode = editor?.state.selection.$from.parent;
  let hasLiveCode = false;
  editor?.state.doc.descendants((node) => {
    if (node.type.name === "codeBlock" && node.attrs.interactive) hasLiveCode = true;
  });
  return {
    bold: editor?.isActive("bold") ?? false,
    italic: editor?.isActive("italic") ?? false,
    bulletList: editor?.isActive("bulletList") ?? false,
    liveCode: selectedNode?.type.name === "codeBlock" ? selectedNode.textContent : "",
    hasLiveCode,
    orderedList: editor?.isActive("orderedList") ?? false,
    codeBlock: editor?.isActive("codeBlock") ?? false,
    interactive: editor?.isActive("codeBlock") ?? false,
    inlineCode: editor?.isActive("code") ?? false,
    chrome: (editor?.getAttributes("codeBlock").chrome as "framed" | "minimal" | undefined) ?? "framed",
    runtime: (editor?.getAttributes("codeBlock").runtime as "auto" | "react" | "html" | "static" | undefined) ?? "auto",
    language: (editor?.getAttributes("codeBlock").language as string | undefined) ?? "",
    embedLabel: (editor?.getAttributes("codeBlock").embedLabel as string | undefined) ?? "",
    embedHelp: (editor?.getAttributes("codeBlock").embedHelp as string | undefined) ?? "",
    callout: editor?.isActive("callout") ?? false,
    calloutVariant: (editor?.getAttributes("callout").variant as "note" | "decision" | "outcome" | "constraint" | undefined) ?? "note",
    mediaType: editor?.isActive("image") ? "image" : editor?.isActive("imageGallery") ? "imageGallery" : editor?.isActive("beforeAfter") ? "beforeAfter" : editor?.isActive("codeBlock") ? "codeBlock" : "",
    mediaVariant: ((editor?.isActive("image") ? editor.getAttributes("image").mediaVariant : editor?.isActive("imageGallery") ? editor.getAttributes("imageGallery").mediaVariant : editor?.isActive("beforeAfter") ? editor.getAttributes("beforeAfter").mediaVariant : editor?.isActive("codeBlock") ? editor.getAttributes("codeBlock").mediaVariant : "contained") as "contained" | "wide" | "bleed") || "contained",
    blockType: (editor?.isActive("codeBlock") || editor?.isActive("code")
      ? "code"
      : editor?.isActive("paragraph", { className: "label-eyebrow" })
      ? "eyebrow"
      : editor?.isActive("heading", { level: 1 })
      ? "h1"
      : editor?.isActive("heading", { level: 2 })
        ? "h2"
        : editor?.isActive("heading", { level: 3 })
          ? "h3"
          : editor?.isActive("blockquote")
            ? "quote"
            : "paragraph") as BlockType,
  };
}

// Body-copy editor for case studies and articles. Outputs HTML into a
// hidden input so the surrounding native <form method="POST"> still works
// unchanged — this component only needs to keep that input in sync.
export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Write the full story…",
  onContentChange,
  relatedReadings = [],
  toolbarAddon,
}: RichTextEditorProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonBeforeInputRef = useRef<HTMLInputElement>(null);
  const comparisonAfterInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const comparisonInsertPosRef = useRef<number | null>(null);
  const galleryInsertPosRef = useRef<number | null>(null);
  const relatedInsightInsertPosRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const typeStyleRef = useRef<HTMLDivElement>(null);
  const [typeStyleOpen, setTypeStyleOpen] = useState(false);
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [toolbarOverflowed, setToolbarOverflowed] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonAnchor, setComparisonAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const [comparisonBefore, setComparisonBefore] = useState<{ file: File; preview: string } | null>(null);
  const [comparisonAfter, setComparisonAfter] = useState<{ file: File; preview: string } | null>(null);
  const [relatedInsightOpen, setRelatedInsightOpen] = useState(false);
  const [relatedInsightAnchor, setRelatedInsightAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const [relatedInsightSlug, setRelatedInsightSlug] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryAnchor, setGalleryAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; file: File; preview: string; alt: string; caption: string }>>([]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        codeBlock: false,
        blockquote: false,
        paragraph: false,
      }),
      StyledParagraph,
      CalloutBlock,
      RelatedInsightBlock,
      GalleryBlock,
      BeforeAfterBlock,
      Link.configure({ openOnClick: false }),
      AttributedBlockquote,
      InteractiveCodeBlock.configure({ lowlight }),
      ResizableImage,
      Placeholder.configure({ placeholder }),
      AccentMark,
    ],
    content: defaultValue,
    editorProps: {
      attributes: { class: styles.content },
      handleKeyDown: (view, event) => {
        if (!(event.key.toLowerCase() === "a" && (event.metaKey || event.ctrlKey))) {
          return false;
        }

        const { state } = view;
        const { $from } = state.selection;
        if ($from.parent.type.name === "codeBlock") {
          event.preventDefault();
          view.dispatch(
            state.tr.setSelection(
              TextSelection.create(state.doc, $from.start($from.depth), $from.end($from.depth))
            )
          );
          return true;
        }

        // Make the outside-editor shortcut explicitly include every block,
        // including live code blocks and images.
        event.preventDefault();
        view.dispatch(state.tr.setSelection(new AllSelection(state.doc)));
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = editor.getHTML();
      }
      onContentChange?.(editor.getHTML());
    },
  });

  // useEditor's host component doesn't re-render on every transaction by
  // default (a deliberate perf change in modern @tiptap/react) — reading
  // editor.isActive(...) straight in the render body would only ever
  // reflect whatever it was on the last content-changing update, not the
  // current cursor position. useEditorState subscribes properly so the
  // toolbar (active marks, the block-type dropdown) tracks selection too.
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => readToolbarState(editor),
  });

  useEffect(() => {
    if (editor && hiddenInputRef.current) {
      hiddenInputRef.current.value = editor.getHTML();
    }
  }, [editor]);

  useEffect(() => {
    if (!typeStyleOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!typeStyleRef.current?.contains(event.target as Node)) {
        setTypeStyleOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [typeStyleOpen]);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const updateOverflow = () => {
      // Keep every control visible while it fits. The optional insert actions
      // are moved into the menu only after the toolbar itself overflows.
      const wasOverflowed = toolbar.classList.contains(styles.toolbarOverflowed);
      if (wasOverflowed) toolbar.classList.remove(styles.toolbarOverflowed);
      const isOverflowed = toolbar.scrollWidth > toolbar.clientWidth + 1;
      if (wasOverflowed) toolbar.classList.add(styles.toolbarOverflowed);
      setToolbarOverflowed(isOverflowed);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, [editor, toolbarOverflowed]);

  if (!editor) {
    return (
      <textarea
        name={name}
        defaultValue={defaultValue}
        className={styles.content}
      />
    );
  }

  // useEditorState types as nullable (matching the case where editor
  // itself is null) — editor is confirmed non-null above, so this is
  // just narrowing the type, not a real fallback path.
  const state = toolbarState ?? readToolbarState(editor);

  // clearNodes() first so switching types REPLACES the current block
  // instead of wrapping it (e.g. Quote -> Code -> Quote would otherwise
  // nest a second blockquote around the first instead of just being one).
  const setBlockType = (value: BlockType) => {
    const chain = editor.chain().focus().clearNodes();
    switch (value) {
      case "eyebrow":
        chain.setNode("paragraph", { className: "label-eyebrow" }).run();
        break;
      case "h1":
        chain.setHeading({ level: 1 }).run();
        break;
      case "h2":
        chain.setHeading({ level: 2 }).run();
        break;
      case "h3":
        chain.setHeading({ level: 3 }).run();
        break;
      case "quote":
        chain.setBlockquote().run();
        break;
      case "code":
        chain.setCodeBlock().updateAttributes("codeBlock", { interactive: true }).run();
        break;
      default:
        chain.setParagraph().run();
    }
  };

  const handleImageFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error ?? "Image upload failed.");
      return;
    }
    editor.chain().focus().setImage({ src: data.url }).run();
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      window.alert(data.error ?? "Image upload failed.");
      return null;
    }
    return typeof data.url === "string" ? data.url : null;
  };

  const chooseComparisonImage = (kind: "before" | "after", file: File | undefined) => {
    if (!file) return;
    const image = { file, preview: URL.createObjectURL(file) };
    if (kind === "before") setComparisonBefore((current) => { if (current) URL.revokeObjectURL(current.preview); return image; });
    else setComparisonAfter((current) => { if (current) URL.revokeObjectURL(current.preview); return image; });
  };

  const editorAnchorAt = (position: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    const wrapperBounds = wrapper.getBoundingClientRect();
    const editorBounds = editor.view.dom.getBoundingClientRect();
    const caret = editor.view.coordsAtPos(position);
    return { top: caret.bottom - wrapperBounds.top + 8, left: editorBounds.left - wrapperBounds.left, width: editorBounds.width };
  };

  const openComparisonAtSelection = () => {
    const position = editor.state.selection.from;
    comparisonInsertPosRef.current = position;
    setComparisonAnchor(editorAnchorAt(position));
    setComparisonOpen(true);
    setInsertMenuOpen(false);
  };

  const closeComparison = () => {
    if (comparisonBefore) URL.revokeObjectURL(comparisonBefore.preview);
    if (comparisonAfter) URL.revokeObjectURL(comparisonAfter.preview);
    setComparisonBefore(null);
    setComparisonAfter(null);
    setComparisonOpen(false);
    setComparisonAnchor(null);
    comparisonInsertPosRef.current = null;
  };

  const handleComparisonInsert = async () => {
    if (!comparisonBefore || !comparisonAfter) return;
    const beforeUrl = await uploadImage(comparisonBefore.file);
    const afterUrl = await uploadImage(comparisonAfter.file);
    if (!beforeUrl || !afterUrl) return;

    const position = comparisonInsertPosRef.current ?? editor.state.selection.from;
    editor.chain().insertContentAt(position, {
      type: "beforeAfter",
      attrs: { comparison: encodeURIComponent(JSON.stringify({ before: { src: beforeUrl, alt: "Before" }, after: { src: afterUrl, alt: "After" } })), mediaVariant: "wide" },
    }).focus().run();
    closeComparison();
  };

  const openRelatedReadingAtSelection = () => {
    const position = editor.state.selection.from;
    relatedInsightInsertPosRef.current = position;
    setRelatedInsightAnchor(editorAnchorAt(position));
    setRelatedInsightSlug(relatedReadings[0] ? `${relatedReadings[0].contentType}:${relatedReadings[0].slug}` : "");
    setRelatedInsightOpen(true);
    setInsertMenuOpen(false);
  };

  const closeRelatedReading = () => {
    setRelatedInsightOpen(false);
    setRelatedInsightAnchor(null);
    setRelatedInsightSlug("");
    relatedInsightInsertPosRef.current = null;
  };

  const handleRelatedInsightInsert = () => {
    const reading = relatedReadings.find((item) => `${item.contentType}:${item.slug}` === relatedInsightSlug);
    if (!reading) return;
    const position = relatedInsightInsertPosRef.current ?? editor.state.selection.from;
    editor.chain().insertContentAt(position, { type: "relatedInsight", attrs: { slug: reading.slug, title: reading.title, contentType: reading.contentType } }).focus().run();
    closeRelatedReading();
  };

  const addGalleryImage = (file: File | undefined) => {
    if (!file) return;
    setGalleryImages((images) => [...images, { id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), alt: "", caption: "" }]);
  };

  const openGalleryAtSelection = () => {
    const position = editor.state.selection.from;
    galleryInsertPosRef.current = position;
    setGalleryAnchor(editorAnchorAt(position));
    setGalleryOpen(true);
    setInsertMenuOpen(false);
  };

  const closeGallery = () => {
    galleryImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setGalleryImages([]);
    setGalleryOpen(false);
    setGalleryAnchor(null);
    galleryInsertPosRef.current = null;
  };

  const handleGalleryInsert = async () => {
    if (!galleryImages.length) return;
    const uploaded: Array<{ src: string; alt?: string; caption?: string }> = [];
    for (const image of galleryImages) {
      const src = await uploadImage(image.file);
      if (!src) return;
      uploaded.push({ src, alt: image.alt.trim() || undefined, caption: image.caption.trim() || undefined });
    }
    const position = galleryInsertPosRef.current ?? editor.state.selection.from;
    editor.chain().insertContentAt(position, { type: "imageGallery", attrs: { images: encodeURIComponent(JSON.stringify(uploaded)) } }).focus().run();
    closeGallery();
  };

  const handleLink = () => {
    const href = window.prompt("Enter a URL", editor.getAttributes("link").href || "https://");
    if (href) editor.chain().focus().setLink({ href }).run();
  };

  const insertCallout = () => {
    editor.chain().focus().insertContent({ type: "callout", attrs: { variant: "note", title: "Note" }, content: [{ type: "paragraph" }] }).run();
    setInsertMenuOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div
        ref={toolbarRef}
        className={`${styles.toolbar} ${toolbarOverflowed ? styles.toolbarOverflowed : ""}`}
      >
        <div className={styles.toolbarSelectWrap} ref={typeStyleRef}>
          <button
            type="button"
            className={styles.toolbarSelect}
            onClick={() => setTypeStyleOpen((open) => !open)}
            aria-label="Text style"
            aria-expanded={typeStyleOpen}
            aria-haspopup="listbox"
            title="Text style"
          >
            <span>{state.blockType === "paragraph"
              ? "Paragraph"
              : state.blockType === "quote"
                ? "Quote"
              : state.blockType === "code"
                  ? "Code"
              : state.blockType === "eyebrow"
                    ? "Eyebrow"
                  : state.blockType.toUpperCase()}</span>
            <ToolbarIcon name="chevron-down" />
          </button>
        {typeStyleOpen && (
            <div className={styles.toolbarMenu} role="listbox" aria-label="Text style options">
              {([
                ["h1", "Heading 1"],
                ["h2", "Heading 2"],
                ["h3", "Heading 3"],
                ["paragraph", "Paragraph"],
                ["quote", "Quote"],
                ["code", "Code"],
              ] as [BlockType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={state.blockType === value}
                  className={`${styles.toolbarMenuButton} ${
                    state.blockType === value ? styles.toolbarButtonActive : ""
                  }`}
                  onClick={() => {
                    if (value === "code") {
                      editor.chain().focus().toggleCode().run();
                    } else {
                      setBlockType(value);
                    }
                    setTypeStyleOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className={styles.toolbarDivider} />
        <button
          type="button"
          className={`${styles.toolbarButton} ${
            state.bold ? styles.toolbarButtonActive : ""
          }`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <ToolbarIcon name="bold" />
        </button>
        <button
          type="button"
          className={`${styles.toolbarButton} ${
            state.italic ? styles.toolbarButtonActive : ""
          }`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <ToolbarIcon name="italic" />
        </button>
        <button type="button" className={styles.toolbarButton} onClick={handleLink} aria-label="Add link" title="Add link"><ToolbarIcon name="link" /></button>
        <span className={styles.toolbarDivider} />
        <button
          type="button"
          className={`${styles.toolbarButton} ${
            state.bulletList ? styles.toolbarButtonActive : ""
          }`}
          onClick={() => {
            const chain = editor.chain().focus();
            // Turning a list off is a plain toggle; turning one on from
            // inside a quote/heading/code block clears that wrapper first
            // so the list replaces it instead of wrapping around it.
            if (!state.bulletList) chain.clearNodes();
            chain.toggleBulletList().run();
          }}
          aria-label="Bullet list"
        >
          <ToolbarIcon name="bulleted-list" />
        </button>
        <button
          type="button"
          className={`${styles.toolbarButton} ${
            state.orderedList ? styles.toolbarButtonActive : ""
          }`}
          onClick={() => {
            const chain = editor.chain().focus();
            if (!state.orderedList) chain.clearNodes();
            chain.toggleOrderedList().run();
          }}
          aria-label="Numbered list"
        >
          <ToolbarIcon name="ordered-list" />
        </button>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => editor.chain().focus().setCodeBlock().run()}
          aria-label="Insert code block"
          title="Insert code block"
        >
          <ToolbarIcon name="code" />
        </button>
        {state.codeBlock && <label className={styles.runtimeControl}>
          <span>Preview as</span>
          <select
            value={state.runtime}
            aria-label="Live code preview type"
            onChange={(event) => {
              const runtime = event.target.value as "auto" | "react" | "html" | "static";
              const language = runtime === "react" ? "tsx" : runtime === "html" ? "html" : state.language || null;
              editor.chain().focus().updateAttributes("codeBlock", { runtime, language }).run();
            }}
          >
            <option value="auto">Automatic</option>
            <option value="react">React / TSX</option>
            <option value="html">HTML / CSS / JS</option>
            <option value="static">Static code</option>
          </select>
        </label>}
        {state.codeBlock && <label className={styles.runtimeControl}>
          <span>Label</span>
          <input value={state.embedLabel} aria-label="Embed label" placeholder="Optional" onChange={(event) => editor.chain().focus().updateAttributes("codeBlock", { embedLabel: event.target.value }).run()} />
        </label>}
        {state.codeBlock && <label className={styles.runtimeControl}>
          <span>Help</span>
          <input value={state.embedHelp} aria-label="Embed caption or help" placeholder="Optional" onChange={(event) => editor.chain().focus().updateAttributes("codeBlock", { embedHelp: event.target.value }).run()} />
        </label>}
        {state.mediaType && <label className={styles.runtimeControl}>
          <span>Media width</span>
          <select
            value={state.mediaVariant}
            aria-label="Media width"
            onChange={(event) => editor.chain().focus().updateAttributes(state.mediaType, { mediaVariant: event.target.value }).run()}
          >
            <option value="contained">Contained</option>
            <option value="wide">Wide</option>
            <option value="bleed">Full bleed</option>
          </select>
        </label>}
        {state.callout && <label className={styles.runtimeControl}>
          <span>Callout type</span>
          <select
            value={state.calloutVariant}
            aria-label="Callout type"
            onChange={(event) => {
              const variant = event.target.value as "note" | "decision" | "outcome" | "constraint";
              const title = variant.charAt(0).toUpperCase() + variant.slice(1);
              editor.chain().focus().updateAttributes("callout", { variant, title }).run();
            }}
          >
            <option value="note">Note</option>
            <option value="decision">Decision</option>
            <option value="outcome">Outcome</option>
            <option value="constraint">Constraint</option>
          </select>
        </label>}
        <span className={styles.toolbarDivider} />
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Insert image"
        >
          <ToolbarIcon name="image" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = "";
          }}
          />
        <button
          type="button"
          className={`${styles.toolbarButton} ${styles.overflowable}`}
          onClick={openComparisonAtSelection}
          aria-label="Insert before and after comparison"
          title="Insert comparison"
        >
          Compare
        </button>
        <button type="button" className={`${styles.toolbarButton} ${styles.overflowable}`} onClick={openGalleryAtSelection} aria-label="Insert image gallery" title="Insert gallery">Gallery</button>
        <button type="button" className={`${styles.toolbarButton} ${styles.overflowable}`} onClick={insertCallout} aria-label="Insert callout" title="Insert callout">Callout</button>
        {relatedReadings.length > 0 && <button type="button" className={`${styles.toolbarButton} ${styles.overflowable}`} onClick={openRelatedReadingAtSelection} aria-label="Insert related reading" title="Insert related reading">Related reading</button>}
        <button
          type="button"
          className={`${styles.toolbarButton} ${styles.overflowable}`}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          aria-label="Insert separator"
          title="Insert separator"
        >
          Separator
        </button>
        {toolbarOverflowed && (
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={() => setInsertMenuOpen((open) => !open)}
            aria-label="More insert options"
            aria-expanded={insertMenuOpen}
            aria-haspopup="menu"
          >
            <ToolbarIcon name="more" />
          </button>
        )}
        {toolbarOverflowed && insertMenuOpen && <div className={styles.insertMenu} role="menu">
          <button type="button" role="menuitem" onClick={openComparisonAtSelection}>Comparison</button>
          <button type="button" role="menuitem" onClick={openGalleryAtSelection}>Gallery</button>
          <button type="button" role="menuitem" onClick={insertCallout}>Callout</button>
          {relatedReadings.length > 0 && <button type="button" role="menuitem" onClick={openRelatedReadingAtSelection}>Related reading</button>}
          <button type="button" role="menuitem" onClick={() => { setInsertMenuOpen(false); editor.chain().focus().setHorizontalRule().run(); }}>Separator</button>
        </div>}
        {toolbarAddon && <div className={styles.toolbarAddon}>{toolbarAddon}</div>}
      </div>
      {comparisonOpen && (
        <div className={`${styles.comparisonWidget} ${styles.inlineWidget}`} style={comparisonAnchor ?? undefined} role="dialog" aria-label="Create before and after comparison">
          <div className={styles.comparisonWidgetHeader}>
            <div>
              <p className={styles.comparisonWidgetEyebrow}>COMPARISON</p>
              <p className={styles.comparisonWidgetTitle}>Add a before and after frame</p>
            </div>
            <button type="button" className={styles.comparisonClose} onClick={closeComparison} aria-label="Close comparison setup">×</button>
          </div>
          <p className={styles.comparisonWidgetHint}>Upload each image into its named position so the slider uses the correct order.</p>
          <div className={styles.comparisonSlots}>
            {(["before", "after"] as const).map((kind) => {
              const selected = kind === "before" ? comparisonBefore : comparisonAfter;
              return (
                <div className={styles.comparisonSlot} key={kind}>
                  <p className={styles.comparisonSlotLabel}>{kind === "before" ? "Before image" : "After image"}</p>
                  <button type="button" className={styles.comparisonUpload} onClick={() => (kind === "before" ? comparisonBeforeInputRef : comparisonAfterInputRef).current?.click()}>
                    {/* Local previews use temporary blob URLs, which the Next.js image optimizer cannot process. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {selected ? <img src={selected.preview} alt={`${kind} preview`} /> : <span>Choose image</span>}
                  </button>
                  <input
                    ref={kind === "before" ? comparisonBeforeInputRef : comparisonAfterInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                      chooseComparisonImage(kind, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <span className={styles.comparisonSlotAction}>{selected ? "Replace image" : "Upload image"}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.comparisonWidgetActions}>
            <button type="button" className={styles.comparisonCancel} onClick={closeComparison}>Cancel</button>
            <button type="button" className={styles.comparisonInsert} disabled={!comparisonBefore || !comparisonAfter} onClick={() => void handleComparisonInsert()}>Insert comparison</button>
          </div>
        </div>
      )}
      {galleryOpen && (
        <div
          className={`${styles.comparisonWidget} ${styles.inlineWidget}`}
          style={galleryAnchor ?? undefined}
          role="dialog"
          aria-label="Create image gallery"
        >
          <div className={styles.comparisonWidgetHeader}>
            <div><p className={styles.comparisonWidgetEyebrow}>GALLERY</p><p className={styles.comparisonWidgetTitle}>Add images one at a time</p></div>
            <button type="button" className={styles.comparisonClose} onClick={closeGallery} aria-label="Close gallery setup">×</button>
          </div>
          <p className={styles.comparisonWidgetHint}>Add as many images as needed. Their original aspect ratios will be preserved.</p>
          <div className={styles.galleryComposerList}>
            {galleryImages.map((image, index) => <div className={styles.galleryComposerItem} key={image.id}>
              {/* Local previews use temporary blob URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.preview} alt="" />
              <div>
                <input type="text" value={image.alt} placeholder="Alternative text" aria-label={`Alternative text for image ${index + 1}`} onChange={(event) => setGalleryImages((items) => items.map((item) => item.id === image.id ? { ...item, alt: event.target.value } : item))} />
                <input type="text" value={image.caption} placeholder="Optional lightbox caption" aria-label={`Caption for image ${index + 1}`} onChange={(event) => setGalleryImages((items) => items.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item))} />
              </div>
              <button type="button" onClick={() => { URL.revokeObjectURL(image.preview); setGalleryImages((items) => items.filter((item) => item.id !== image.id)); }} aria-label={`Remove image ${index + 1}`}>×</button>
            </div>)}
          </div>
          <button type="button" className={styles.galleryAddButton} onClick={() => galleryInputRef.current?.click()}>+ Add image</button>
          <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={(event) => { addGalleryImage(event.target.files?.[0]); event.target.value = ""; }} />
          <div className={styles.comparisonWidgetActions}><button type="button" className={styles.comparisonCancel} onClick={closeGallery}>Cancel</button><button type="button" className={styles.comparisonInsert} disabled={!galleryImages.length} onClick={() => void handleGalleryInsert()}>Insert gallery</button></div>
        </div>
      )}
      {relatedInsightOpen && (
        <div
          className={`${styles.comparisonWidget} ${styles.inlineWidget}`}
          style={relatedInsightAnchor ?? undefined}
          role="dialog"
          aria-label="Insert related reading"
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={styles.comparisonWidgetHeader}><div><p className={styles.comparisonWidgetEyebrow}>RELATED READING</p><p className={styles.comparisonWidgetTitle}>Link an article or case study to this section</p></div><button type="button" className={styles.comparisonClose} onClick={closeRelatedReading} aria-label="Close related reading picker">×</button></div>
          <p className={styles.comparisonWidgetHint}>The card will stay synchronized with the selected content&apos;s title, thumbnail, and reading time.</p>
          <select
            className={styles.relatedInsightSelect}
            value={relatedInsightSlug}
            onInput={(event) => setRelatedInsightSlug(event.currentTarget.value)}
            onChange={(event) => setRelatedInsightSlug(event.currentTarget.value)}
            aria-label="Related reading"
          >
            <option value="">Select related reading</option>
            <optgroup label="Articles">{relatedReadings.filter((item) => item.contentType === "article").map((item) => <option key={`article-${item.slug}`} value={`article:${item.slug}`}>{item.title}</option>)}</optgroup>
            <optgroup label="Case studies">{relatedReadings.filter((item) => item.contentType === "case_study").map((item) => <option key={`case-study-${item.slug}`} value={`case_study:${item.slug}`}>{item.title}</option>)}</optgroup>
          </select>
          <div className={styles.comparisonWidgetActions}><button type="button" className={styles.comparisonCancel} onClick={closeRelatedReading}>Cancel</button><button type="button" className={styles.comparisonInsert} disabled={!relatedInsightSlug} onClick={handleRelatedInsightInsert}>Insert related reading</button></div>
        </div>
      )}
      <div
        className={state.hasLiveCode && !codeExpanded ? styles.collapsedLiveCode : undefined}
        onMouseDownCapture={() => setTypeStyleOpen(false)}
      >
        <EditorContent editor={editor} />
      </div>
      {state.hasLiveCode && (
        <button
          type="button"
          className={styles.codeExpandButton}
          onClick={() => setCodeExpanded((expanded) => !expanded)}
          aria-expanded={codeExpanded}
        >
          {codeExpanded ? "Collapse code" : "Expand code"}
        </button>
      )}
      {state.interactive && state.liveCode.trim() && (
        <div className={styles.editorPreview}>
          <p className={styles.editorPreviewLabel}>⚡ Live preview</p>
          <LiveComponentBlock code={state.liveCode} runtime={state.runtime} language={state.language} />
        </div>
      )}
      <input
        ref={(element) => {
          hiddenInputRef.current = element;
          if (element && editor) {
            element.value = editor.getHTML();
          }
        }}
        type="hidden"
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  );
}
