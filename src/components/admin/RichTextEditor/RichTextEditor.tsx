"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Blockquote from "@tiptap/extension-blockquote";
import Paragraph from "@tiptap/extension-paragraph";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { AllSelection, TextSelection } from "@tiptap/pm/state";
import { createLowlight, common } from "lowlight";
import { AccentMark } from "./AccentMark";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";
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
    };
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrapper = document.createElement("span");
      const image = document.createElement("img");
      const handle = document.createElement("button");
      const attrs = node.attrs as { src: string; alt?: string; title?: string; width?: string | null };

      wrapper.className = styles.resizableImage;
      wrapper.setAttribute("data-resizable-image", "true");
      wrapper.setAttribute("contenteditable", "false");
      image.src = attrs.src;
      image.alt = attrs.alt || "";
      image.draggable = true;
      if (attrs.title) image.title = attrs.title;
      if (attrs.width) image.width = Number(attrs.width);
      handle.type = "button";
      handle.className = styles.imageResizeHandle;
      handle.setAttribute("aria-label", "Resize image");
      handle.title = "Drag to resize image";
      wrapper.append(image, handle);

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
      return {
        dom: wrapper,
        stopEvent: (event: Event) => event.target === handle || handle.contains(event.target as Node),
        update: (updatedNode: typeof node) => {
          if (updatedNode.type !== node.type) return false;
          image.src = updatedNode.attrs.src;
          image.alt = updatedNode.attrs.alt || "";
          if (updatedNode.attrs.width) image.width = Number(updatedNode.attrs.width);
          else image.removeAttribute("width");
          return true;
        },
        destroy: () => {
          handle.removeEventListener("pointerdown", startResize);
          image.removeEventListener("click", selectImage);
        },
      };
    };
  },
});

type RichTextEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  onContentChange?: () => void;
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
    attribution: (editor?.getAttributes("blockquote").attribution as string) ?? "",
    liveCode: selectedNode?.type.name === "codeBlock" ? selectedNode.textContent : "",
    hasLiveCode,
    orderedList: editor?.isActive("orderedList") ?? false,
    codeBlock: editor?.isActive("codeBlock") ?? false,
    interactive: editor?.isActive("codeBlock") ?? false,
    inlineCode: editor?.isActive("code") ?? false,
    chrome: (editor?.getAttributes("codeBlock").chrome as "framed" | "minimal" | undefined) ?? "framed",
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
}: RichTextEditorProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const comparisonBeforeInputRef = useRef<HTMLInputElement>(null);
  const comparisonAfterInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const typeStyleRef = useRef<HTMLDivElement>(null);
  const [typeStyleOpen, setTypeStyleOpen] = useState(false);
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [toolbarOverflowed, setToolbarOverflowed] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonBefore, setComparisonBefore] = useState<{ file: File; preview: string } | null>(null);
  const [comparisonAfter, setComparisonAfter] = useState<{ file: File; preview: string } | null>(null);

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
      onContentChange?.();
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
    if (kind === "before") setComparisonBefore(image);
    else setComparisonAfter(image);
  };

  const handleComparisonInsert = async () => {
    if (!comparisonBefore || !comparisonAfter) return;
    const beforeUrl = await uploadImage(comparisonBefore.file);
    const afterUrl = await uploadImage(comparisonAfter.file);
    if (!beforeUrl || !afterUrl) return;

    const comparisonCode = `function BeforeAfterComparison() {
  const [position, setPosition] = useState(50);
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: "#11161F" }}>
      <img src={${JSON.stringify(afterUrl)}} alt="After" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <img src={${JSON.stringify(beforeUrl)}} alt="Before" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", clipPath: "inset(0 " + (100 - position) + "% 0 0)" }} />
      <span style={{ position: "absolute", top: "12px", left: "12px", padding: "6px 8px", background: "#11161F", color: "#FFF", fontSize: "11px", fontWeight: 700 }}>BEFORE</span>
      <span style={{ position: "absolute", top: "12px", right: "12px", padding: "6px 8px", background: "#FF8A66", color: "#11161F", fontSize: "11px", fontWeight: 700 }}>AFTER</span>
      <input aria-label="Compare before and after images" type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize" }} />
      <span aria-hidden="true" style={{ position: "absolute", top: "50%", left: "calc(" + position + "% - 18px)", width: "36px", height: "36px", borderRadius: "50%", background: "#FF8A66", color: "#11161F", display: "grid", placeItems: "center", fontWeight: 700, pointerEvents: "none" }}>↔</span>
    </div>
  );
}
render(<BeforeAfterComparison />);`;

    editor.chain().focus().setCodeBlock().updateAttributes("codeBlock", { interactive: true }).insertContent(comparisonCode).run();
    setComparisonOpen(false);
    setComparisonBefore(null);
    setComparisonAfter(null);
  };

  const handleLink = () => {
    const href = window.prompt("Enter a URL", editor.getAttributes("link").href || "https://");
    if (href) editor.chain().focus().setLink({ href }).run();
  };

  return (
    <div className={styles.wrapper}>
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
        {state.blockType === "quote" && (
          <input
            className={styles.attributionInput}
            value={state.attribution}
            onChange={(event) => editor.chain().focus().updateAttributes("blockquote", { attribution: event.target.value }).run()}
            placeholder="Attribution"
            aria-label="Quote attribution"
          />
        )}
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
          onClick={() => { setComparisonOpen(true); setInsertMenuOpen(false); }}
          aria-label="Insert before and after comparison"
          title="Insert comparison"
        >
          Compare
        </button>
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
          <button type="button" role="menuitem" onClick={() => { setInsertMenuOpen(false); setComparisonOpen(true); }}>Comparison</button>
          <button type="button" role="menuitem" onClick={() => { setInsertMenuOpen(false); editor.chain().focus().setHorizontalRule().run(); }}>Separator</button>
        </div>}
      </div>
      {comparisonOpen && (
        <div className={styles.comparisonWidget} role="dialog" aria-label="Create before and after comparison">
          <div className={styles.comparisonWidgetHeader}>
            <div>
              <p className={styles.comparisonWidgetEyebrow}>COMPARISON</p>
              <p className={styles.comparisonWidgetTitle}>Add a before and after frame</p>
            </div>
            <button type="button" className={styles.comparisonClose} onClick={() => setComparisonOpen(false)} aria-label="Close comparison setup">×</button>
          </div>
          <p className={styles.comparisonWidgetHint}>Upload each image into its named position so the slider uses the correct order.</p>
          <div className={styles.comparisonSlots}>
            {(["before", "after"] as const).map((kind) => {
              const selected = kind === "before" ? comparisonBefore : comparisonAfter;
              return (
                <div className={styles.comparisonSlot} key={kind}>
                  <p className={styles.comparisonSlotLabel}>{kind === "before" ? "Before image" : "After image"}</p>
                  <button type="button" className={styles.comparisonUpload} onClick={() => (kind === "before" ? comparisonBeforeInputRef : comparisonAfterInputRef).current?.click()}>
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
            <button type="button" className={styles.comparisonCancel} onClick={() => setComparisonOpen(false)}>Cancel</button>
            <button type="button" className={styles.comparisonInsert} disabled={!comparisonBefore || !comparisonAfter} onClick={() => void handleComparisonInsert()}>Insert comparison</button>
          </div>
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
          <LiveComponentBlock code={state.liveCode} />
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
