"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
  sortOrder: number;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string;
  status: "draft" | "published" | "archived" | "scheduled";
  scheduledAt: string;
  isFeatured: boolean;
  noIndex: boolean;
  noFollow: boolean;
  // Author
  authorName: string;
  authorBio: string;
  authorEmail: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  // Shipping
  returnWindowDays: string;
}

interface BlogEditorProps {
  blogId?: string; // undefined = create, string = edit
  onBack: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("admin_token") || ""
    : "";
}
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}
function authOnly() {
  return { Authorization: `Bearer ${getToken()}` };
}

const EMPTY_FORM: BlogFormData = {
  title: "",
  slug: "",
  excerpt: "",
  category: "",
  tags: "",
  status: "draft",
  scheduledAt: "",
  isFeatured: false,
  noIndex: false,
  noFollow: false,
  authorName: "Rehnoor Team",
  authorBio: "",
  authorEmail: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogTitle: "",
  ogDescription: "",
  canonicalUrl: "",
  returnWindowDays: "30",
};

// ─── Image with alt/link dialog ───────────────────────────────────────────────

function ImageDialog({
  onInsert,
  onClose,
}: {
  onInsert: (src: string, alt: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/api/blogs/upload-image`, {
        method: "POST",
        headers: authOnly(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      onInsert(data.url, alt || file.name.replace(/\.[^/.]+$/, ""));
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInsert = () => {
    if (!url.trim()) return;
    onInsert(url.trim(), alt.trim());
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(10,8,5,0.6)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
          animation: "beSlideUp 0.2s ease",
        }}
      >
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#D4A017,#f0c040)",
          }}
        />
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #F0EBE0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: 0,
            }}
          >
            Insert Image
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "#F5F1E8",
              color: "#666",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #F0EBE0" }}>
          {[
            ["upload", "📤 Upload"],
            ["url", "🔗 URL"],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setTab(val as "upload" | "url")}
              style={{
                flex: 1,
                padding: "10px",
                fontSize: 12,
                fontWeight: tab === val ? 700 : 500,
                color: tab === val ? "#D4A017" : "#888",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: `2px solid ${
                  tab === val ? "#D4A017" : "transparent"
                }`,
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ padding: "18px 20px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={dlgLabel}>Alt Text</label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for accessibility…"
              style={dlgInput}
              onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
            />
          </div>
          {tab === "upload" ? (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "2px dashed #E5E0D4",
                  borderRadius: 10,
                  padding: 20,
                  textAlign: "center",
                  cursor: uploading ? "wait" : "pointer",
                  background: "#FDFAF5",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#D4A017")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#E5E0D4")
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) handleUpload(f);
                }}
              >
                {uploading ? (
                  <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                    Uploading to Cloudinary…
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: 22, margin: "0 0 6px" }}>🖼</p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#888",
                        margin: 0,
                        fontWeight: 500,
                      }}
                    >
                      Drop image or click to upload
                    </p>
                    <p
                      style={{ fontSize: 11, color: "#bbb", margin: "4px 0 0" }}
                    >
                      JPG, PNG, WebP, GIF · max 8MB
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </>
          ) : (
            <div>
              <label style={dlgLabel}>Image URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{ ...dlgInput, fontFamily: "monospace", fontSize: 11 }}
                onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                onKeyDown={(e) => e.key === "Enter" && handleUrlInsert()}
              />
              <button
                onClick={handleUrlInsert}
                disabled={!url.trim()}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "10px",
                  background: "#D4A017",
                  color: "#fff",
                  border: "none",
                  borderRadius: 9,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: url.trim() ? "pointer" : "not-allowed",
                  opacity: url.trim() ? 1 : 0.5,
                }}
              >
                Insert Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Link Dialog ──────────────────────────────────────────────────────────────

function LinkDialog({
  initial,
  onInsert,
  onClose,
}: {
  initial: string;
  onInsert: (href: string, newTab: boolean) => void;
  onClose: () => void;
}) {
  const [href, setHref] = useState(initial || "");
  const [newTab, setNewTab] = useState(true);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(10,8,5,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          animation: "beSlideUp 0.2s ease",
        }}
      >
        <div style={{ height: 3, background: "#1a6fbf" }} />
        <div style={{ padding: "18px 20px" }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: "0 0 14px",
            }}
          >
            Insert Link
          </h3>
          <label style={dlgLabel}>URL</label>
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://…"
            autoFocus
            style={{ ...dlgInput, fontFamily: "monospace", fontSize: 11 }}
            onFocus={(e) => (e.target.style.borderColor = "#1a6fbf")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
            onKeyDown={(e) =>
              e.key === "Enter" && href && onInsert(href, newTab)
            }
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={newTab}
              onChange={(e) => setNewTab(e.target.checked)}
              style={{
                width: 14,
                height: 14,
                accentColor: "#1a6fbf",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 12, color: "#555" }}>Open in new tab</span>
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 8,
                border: "1.5px solid #E5E0D4",
                background: "#fff",
                color: "#555",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => href && onInsert(href, newTab)}
              disabled={!href.trim()}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 8,
                border: "none",
                background: "#1a6fbf",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: href.trim() ? "pointer" : "not-allowed",
                opacity: href.trim() ? 1 : 0.5,
              }}
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Editor Toolbar ───────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 6,
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "#003720" : "transparent",
        color: active ? "#FCC131" : "#444",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.background = "#F5F2EA";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: "#E5E0D4",
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Rich Text Editor (Tiptap) ────────────────────────────────────────────────

function RichEditor({
  content,
  onChange,
  onImageUpload,
  setInsertImageFn,
}: {
  content: string;
  onChange: (html: string) => void;
  onImageUpload: () => void;
  setInsertImageFn?: (fn: (src: string, alt: string) => void) => void;
}) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [currentLinkHref, setCurrentLinkHref] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Image.configure({ allowBase64: false, inline: false }),
      Placeholder.configure({
        placeholder: "Start writing your blog post here… Tell your story.",
      }),
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      //   Underline,
      CharacterCount,
      Highlight.configure({ multicolor: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "be-editor-content",
        style:
          "min-height:500px; padding: 24px 32px; outline:none; font-size:15px; line-height:1.85; color:#2a2a2a;",
      },
      handleDrop(view, event, slice, moved) {
        // Handled by ImageDialog drop zone instead
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]); // eslint-disable-line

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const href = editor.getAttributes("link").href || "";
    setCurrentLinkHref(href);
    setShowLinkDialog(true);
  }, [editor]);

  const insertLink = (href: string, newTab: boolean) => {
    if (!editor) return;
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href, target: newTab ? "_blank" : undefined })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({ href, target: newTab ? "_blank" : undefined })
        .run();
    }
    setShowLinkDialog(false);
  };

  useEffect(() => {
    if (!editor || !setInsertImageFn) return;

    setInsertImageFn((src: string, alt: string) => {
      editor.chain().focus().setImage({ src, alt }).run();
    });
  }, [editor, setInsertImageFn]);

  if (!mounted || !editor) {
    return (
      <div
        style={{
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#aaa",
        }}
      >
        Loading editor...
      </div>
    );
  }

  const words = editor.storage.characterCount?.words() ?? 0;
  const chars = editor.storage.characterCount?.characters() ?? 0;

  return (
    <>
      {showLinkDialog && (
        <LinkDialog
          initial={currentLinkHref}
          onInsert={insertLink}
          onClose={() => setShowLinkDialog(false)}
        />
      )}

      {/* Bubble menu — appears on text selection */}
      {/* <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        style={{
          display: "flex",
          gap: 2,
          background: "#1a1a1a",
          borderRadius: 8,
          padding: "4px 6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {[
          {
            title: "Bold",
            icon: "B",
            fn: () => editor.chain().focus().toggleBold().run(),
            active: editor.isActive("bold"),
            style: { fontWeight: 800 },
          },
          {
            title: "Italic",
            icon: "I",
            fn: () => editor.chain().focus().toggleItalic().run(),
            active: editor.isActive("italic"),
            style: { fontStyle: "italic" },
          },
          {
            title: "Underline",
            icon: "U",
            fn: () => editor.chain().focus().toggleUnderline().run(),
            active: editor.isActive("underline"),
            style: { textDecoration: "underline" },
          },
          {
            title: "Highlight",
            icon: "H",
            fn: () => editor.chain().focus().toggleHighlight().run(),
            active: editor.isActive("highlight"),
            style: {},
          },
          {
            title: "Link",
            icon: "🔗",
            fn: openLinkDialog,
            active: editor.isActive("link"),
            style: {},
          },
        ].map(({ title, icon, fn, active, style }) => (
          <button
            key={title}
            title={title}
            onClick={fn}
            style={{
              background: active ? "#D4A017" : "transparent",
              color: active ? "#003720" : "#fff",
              border: "none",
              borderRadius: 5,
              width: 26,
              height: 26,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...style,
            }}
          >
            {icon}
          </button>
        ))}
      </BubbleMenu> */}

      {/* Main toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          padding: "8px 12px",
          background: "#F9F6EE",
          borderBottom: "1px solid #E5E0D4",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title="Paragraph"
        >
          ¶
        </ToolbarButton>
        {[1, 2, 3, 4].map((l) => (
          <ToolbarButton
            key={l}
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: l as 1 | 2 | 3 | 4 })
                .run()
            }
            active={editor.isActive("heading", { level: l })}
            title={`Heading ${l}`}
          >
            H{l}
          </ToolbarButton>
        ))}
        <Divider />

        {/* Text format */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          title="Highlight"
        >
          ✏
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline code"
        >
          {"<>"}
        </ToolbarButton>
        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          • —
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          "
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code block"
        >
          {"{ }"}
        </ToolbarButton>
        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          ⬅
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          ↔
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          ➡
        </ToolbarButton>
        <Divider />

        {/* Link & Image */}
        <ToolbarButton
          onClick={openLinkDialog}
          active={editor.isActive("link")}
          title="Insert link"
        >
          🔗
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            active={false}
            title="Remove link"
          >
            🔗✕
          </ToolbarButton>
        )}
        <ToolbarButton
          onClick={onImageUpload}
          active={false}
          title="Insert image"
        >
          🖼
        </ToolbarButton>
        <Divider />

        {/* Table */}
        <ToolbarButton
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          active={false}
          title="Insert table"
        >
          ⊞
        </ToolbarButton>
        {editor.isActive("table") && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              active={false}
              title="Add column before"
            >
              +◀
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              active={false}
              title="Add column after"
            >
              ▶+
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              active={false}
              title="Add row before"
            >
              +▲
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              active={false}
              title="Add row after"
            >
              ▼+
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              active={false}
              title="Delete table"
            >
              ✕⊞
            </ToolbarButton>
          </>
        )}
        <Divider />

        {/* Horizontal rule */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          title="Horizontal rule"
        >
          —
        </ToolbarButton>

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Undo"
          disabled={!editor.can().undo()}
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Redo"
          disabled={!editor.can().redo()}
        >
          ↪
        </ToolbarButton>

        {/* Stats */}
        <div
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "#B8AFA0",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span>{words} words</span>
          <span>{chars} chars</span>
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Editor CSS */}
      <style>{`
        .be-editor-content h1 { font-size:2em; font-weight:800; color:#003720; margin:1.2em 0 0.5em; line-height:1.2; }
        .be-editor-content h2 { font-size:1.5em; font-weight:700; color:#003720; margin:1.1em 0 0.4em; }
        .be-editor-content h3 { font-size:1.25em; font-weight:700; color:#1a1a1a; margin:1em 0 0.3em; }
        .be-editor-content h4 { font-size:1.1em; font-weight:700; color:#1a1a1a; margin:0.9em 0 0.3em; }
        .be-editor-content p { margin:0 0 1em; }
        .be-editor-content ul, .be-editor-content ol { margin:0 0 1em 1.5em; }
        .be-editor-content li { margin-bottom:0.3em; }
        .be-editor-content blockquote { border-left:4px solid #D4A017; padding:10px 16px; margin:1em 0; background:#FFF8E6; border-radius:0 8px 8px 0; font-style:italic; color:#555; }
        .be-editor-content code { background:#F5F2EA; padding:2px 6px; border-radius:4px; font-size:0.88em; color:#7a3a00; font-family:monospace; }
        .be-editor-content pre { background:#1a1a1a; color:#f8f8f2; padding:16px 20px; border-radius:10px; overflow-x:auto; margin:1em 0; }
        .be-editor-content pre code { background:none; color:inherit; font-size:0.9em; }
        .be-editor-content a { color:#D4A017; text-decoration:underline; text-decoration-color:#D4A01750; }
        .be-editor-content a:hover { text-decoration-color:#D4A017; }
        .be-editor-content img { max-width:100%; border-radius:10px; margin:8px 0; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
        .be-editor-content mark { background:#FFF8C5; padding:1px 3px; border-radius:3px; }
        .be-editor-content hr { border:none; border-top:2px solid #E5E0D4; margin:2em 0; }
        .be-editor-content table { border-collapse:collapse; width:100%; margin:1em 0; border-radius:8px; overflow:hidden; border:1px solid #E5E0D4; }
        .be-editor-content th { background:#F9F6EE; padding:10px 14px; text-align:left; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#8B7355; border:1px solid #E5E0D4; }
        .be-editor-content td { padding:10px 14px; border:1px solid #E5E0D4; font-size:14px; }
        .be-editor-content .ProseMirror-focused { outline:none; }
        .be-editor-content p.is-editor-empty:first-child::before { content:attr(data-placeholder); color:#C5BBA8; float:left; pointer-events:none; height:0; font-style:italic; }
      `}</style>
    </>
  );
}

// ─── FAQ Manager ──────────────────────────────────────────────────────────────

function FaqManager({
  faqs,
  onChange,
}: {
  faqs: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
}) {
  const add = () =>
    onChange([...faqs, { question: "", answer: "", sortOrder: faqs.length }]);
  const update = (i: number, key: keyof FaqItem, val: string | number) => {
    const next = [...faqs];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };
  const remove = (i: number) => onChange(faqs.filter((_, j) => j !== i));

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label style={sectionLabel}>FAQs ({faqs.length})</label>
        <button
          type="button"
          onClick={add}
          style={{
            fontSize: 11,
            color: "#D4A017",
            background: "none",
            border: "1px solid #f0a50030",
            padding: "4px 12px",
            borderRadius: 7,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + Add FAQ
        </button>
      </div>
      {faqs.map((faq, i) => (
        <div
          key={i}
          style={{
            background: "#FDFAF4",
            border: "1px solid #EEE9DD",
            borderRadius: 10,
            padding: "14px",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#8B7355",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              FAQ {i + 1}
            </span>
            <button
              onClick={() => remove(i)}
              style={{
                fontSize: 12,
                color: "#c0392b",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <input
            value={faq.question}
            onChange={(e) => update(i, "question", e.target.value)}
            placeholder="Question…"
            style={{ ...sideInput, marginBottom: 8 }}
            onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
          />
          <textarea
            value={faq.answer}
            onChange={(e) => update(i, "answer", e.target.value)}
            placeholder="Answer…"
            rows={3}
            style={{ ...sideInput, resize: "vertical" as const }}
            onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
          />
        </div>
      ))}
      {faqs.length === 0 && (
        <p
          style={{
            fontSize: 12,
            color: "#bbb",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          No FAQs yet. FAQs appear as a structured section at the end of your
          blog.
        </p>
      )}
    </div>
  );
}

// ─── Main BlogEditor ──────────────────────────────────────────────────────────

export default function BlogEditor({
  blogId,
  onBack,
  onSaved,
  onError,
}: BlogEditorProps) {
  const isEdit = !!blogId;
  const [form, setForm] = useState<BlogFormData>(EMPTY_FORM);
  const [htmlContent, setHtmlContent] = useState("");
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [clearCover, setClearCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "content" | "seo" | "settings" | "faqs"
  >("content");
  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const router = useRouter();

  // Image insertion reference (set by RichEditor after insert)
  const insertImageRef = useRef<((src: string, alt: string) => void) | null>(
    null,
  );

  const setF = (k: keyof BlogFormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setF("title", title);
    if (!isEdit || !form.slug) {
      setF(
        "slug",
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
    }
  };

  // Fetch existing blog in edit mode
  useEffect(() => {
    if (!isEdit || !blogId) return;
    setFetching(true);
    fetch(`${API_BASE}/api/blogs/admin/${blogId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!d.data) return;
        const b = d.data;
        setForm({
          title: b.title || "",
          slug: b.slug || "",
          excerpt: b.excerpt || "",
          category: b.category || "",
          tags: b.tags?.join(", ") || "",
          status: b.status || "draft",
          scheduledAt: b.scheduledAt
            ? new Date(b.scheduledAt).toISOString().slice(0, 16)
            : "",
          isFeatured: b.isFeatured || false,
          noIndex: b.noIndex || false,
          noFollow: b.noFollow || false,
          authorName: b.author?.name || "Rehnoor Team",
          authorBio: b.author?.bio || "",
          authorEmail: b.author?.email || "",
          metaTitle: b.metaTitle || "",
          metaDescription: b.metaDescription || "",
          metaKeywords: b.metaKeywords?.join(", ") || "",
          ogTitle: b.ogTitle || "",
          ogDescription: b.ogDescription || "",
          canonicalUrl: b.canonicalUrl || "",
          returnWindowDays: "30",
        });
        setHtmlContent(b.blogContent || "");
        setFaqs(b.faqs || []);
        if (b.coverImage) setCoverPreview(b.coverImage);
      })
      .catch(() => onError("Failed to load blog"))
      .finally(() => setFetching(false));
  }, [blogId, isEdit]); // eslint-disable-line

  // Cover image handling
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setClearCover(false);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview("");
    setClearCover(true);
  };

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  // Save (both create and update)
  const handleSave = async (overrideStatus?: BlogFormData["status"]) => {
    if (!form.title.trim() || !htmlContent.trim()) {
      onError("Title and blog content are required.");
      return;
    }

    setLoading(true);
    setSavedState("saving");

    try {
      const fd = new FormData();

      // Scalar fields
      const status = overrideStatus || form.status;
      const textFields: (keyof BlogFormData)[] = [
        "title",
        "slug",
        "excerpt",
        "category",
        "status",
        "scheduledAt",
        "authorName",
        "authorBio",
        "authorEmail",
        "metaTitle",
        "metaDescription",
        "canonicalUrl",
        "ogTitle",
        "ogDescription",
      ];
      textFields.forEach((k) => {
        if (form[k] !== undefined)
          fd.append(
            k === "authorName" ? "author" : k,
            k === "authorName"
              ? JSON.stringify({
                  name: form.authorName,
                  bio: form.authorBio,
                  email: form.authorEmail,
                })
              : String(form[k]),
          );
      });

      // Override author properly
      fd.delete("authorBio");
      fd.delete("authorEmail");
      fd.delete("authorName");
      fd.set(
        "author",
        JSON.stringify({
          name: form.authorName,
          bio: form.authorBio,
          email: form.authorEmail,
        }),
      );

      fd.set("status", status);
      fd.append("blogContent", htmlContent);
      fd.append("isFeatured", String(form.isFeatured));
      fd.append("noIndex", String(form.noIndex));
      fd.append("noFollow", String(form.noFollow));
      fd.append(
        "tags",
        JSON.stringify(
          form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      );
      fd.append(
        "metaKeywords",
        JSON.stringify(
          form.metaKeywords
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      );
      fd.append("faqs", JSON.stringify(faqs));

      if (coverFile) fd.append("coverImage", coverFile);
      if (clearCover) fd.append("clearCoverImage", "true");

      const url = isEdit
        ? `${API_BASE}/api/blogs/admin/${blogId}`
        : `${API_BASE}/api/blogs/admin`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      setSavedState("saved");
      setTimeout(() => setSavedState("idle"), 3000);
      onSaved(
        isEdit ? "Blog updated successfully." : "Blog created successfully.",
      );
      router.push("/admin/blog-management");
      router.refresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Something went wrong");
      setSavedState("idle");
    } finally {
      setLoading(false);
    }
  };

  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  const handleImageInsert = (src: string, alt: string) => {
    if (insertImageRef.current) {
      insertImageRef.current?.(src, alt);
    }
  };

  if (fetching) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid #E5E0D4",
            borderTop: "3px solid #D4A017",
            animation: "beSlideUp 0.8s linear infinite",
          }}
        />
        <span style={{ color: "#999", fontSize: 14 }}>Loading blog…</span>
      </div>
    );
  }

  const TABS = [
    { id: "content", label: "✏️ Content" },
    { id: "seo", label: "🔍 SEO" },
    { id: "faqs", label: `❓ FAQs${faqs.length ? ` (${faqs.length})` : ""}` },
    { id: "settings", label: "⚙️ Settings" },
  ];

  return (
    <>
      <style>{`
        @keyframes beSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bePulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {showImageDialog && (
        <ImageDialog
          onInsert={(src, alt) => {
            insertImageRef.current?.(src, alt); // 🔥 THIS WAS MISSING
          }}
          onClose={() => setShowImageDialog(false)}
        />
      )}

      {/* Two-column layout: Editor left, Sidebar right */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 60px)",
          overflow: "hidden",
        }}
      >
        {/* ── Left: Editor column ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              borderBottom: "1px solid #E5E0D4",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <button
              onClick={onBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#666",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#F5F2EA")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              ← Back
            </button>
            <div style={{ height: 20, width: 1, background: "#E5E0D4" }} />
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: 0,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isEdit ? form.title || "Edit Blog" : "New Blog Post"}
            </h2>

            {/* Save state indicator */}
            {savedState === "saving" && (
              <span
                style={{
                  fontSize: 11,
                  color: "#D4A017",
                  animation: "bePulse 1s infinite",
                }}
              >
                Saving…
              </span>
            )}
            {savedState === "saved" && (
              <span style={{ fontSize: 11, color: "#1a7a4a" }}>✓ Saved</span>
            )}

            {/* Action buttons */}
            <button
              onClick={() => handleSave("draft")}
              disabled={loading}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1.5px solid #E5E0D4",
                background: "#fff",
                color: "#555",
                fontSize: 12,
                fontWeight: 500,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              💾 Save Draft
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={loading}
              style={{
                padding: "7px 18px",
                borderRadius: 8,
                border: "none",
                background: "#003720",
                color: "#FCC131",
                fontSize: 12,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.6 : 1,
                letterSpacing: "0.03em",
              }}
            >
              {loading ? "Saving…" : "✦ Publish"}
            </button>
          </div>

          {/* Title input */}
          <div
            style={{
              padding: "24px 32px 0",
              flexShrink: 0,
              background: "#fff",
            }}
          >
            <input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Your blog title…"
              style={{
                width: "100%",
                fontSize: 28,
                fontWeight: 800,
                color: "#003720",
                border: "none",
                outline: "none",
                background: "transparent",
                lineHeight: 1.2,
                boxSizing: "border-box",
                fontFamily: "Georgia, serif",
              }}
            />
            <input
              value={form.slug}
              onChange={(e) => setF("slug", e.target.value)}
              placeholder="url-slug"
              style={{
                width: "100%",
                fontSize: 12,
                color: "#B8AFA0",
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "monospace",
                marginTop: 6,
                boxSizing: "border-box",
              }}
            />
            <div style={{ height: 1, background: "#EEE9DD", marginTop: 16 }} />
          </div>

          {/* Editor mode toggle */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 32px",
              borderBottom: "1px solid #EEE9DD",
              background: "#fff",
            }}
          >
            <button
              onClick={() => setEditorMode("visual")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #E5E0D4",
                background: editorMode === "visual" ? "#003720" : "#fff",
                color: editorMode === "visual" ? "#FCC131" : "#555",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Visual
            </button>

            <button
              onClick={() => setEditorMode("html")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #E5E0D4",
                background: editorMode === "html" ? "#003720" : "#fff",
                color: editorMode === "html" ? "#FCC131" : "#555",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              HTML
            </button>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
            {editorMode === "visual" ? (
              <RichEditor
                content={htmlContent}
                onChange={setHtmlContent}
                onImageUpload={() => setShowImageDialog(true)}
                setInsertImageFn={(fn) => (insertImageRef.current = fn)}
              />
            ) : (
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                  padding: 20,
                  fontFamily: "monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  background: "#fff",
                }}
              />
            )}
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div
          style={{
            width: 340,
            flexShrink: 0,
            borderLeft: "1px solid #E5E0D4",
            background: "#FDFAF5",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Sidebar tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #E5E0D4",
              flexShrink: 0,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  fontSize: 10,
                  fontWeight: activeTab === t.id ? 700 : 500,
                  color: activeTab === t.id ? "#D4A017" : "#888",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: `2px solid ${
                    activeTab === t.id ? "#D4A017" : "transparent"
                  }`,
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sidebar scroll body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px" }}>
            {/* ── CONTENT settings ── */}
            {activeTab === "content" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Cover image */}
                <div>
                  <label style={sectionLabel}>Cover Image</label>
                  {coverPreview ? (
                    <div style={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPreview}
                        alt="Cover"
                        style={{
                          width: "100%",
                          height: 140,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid #E5E0D4",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button
                          onClick={() => coverRef.current?.click()}
                          style={sideSmallBtn}
                        >
                          Replace
                        </button>
                        <button
                          onClick={removeCover}
                          style={{
                            ...sideSmallBtn,
                            color: "#c0392b",
                            borderColor: "#FFCDD2",
                            background: "#FFF5F5",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => coverRef.current?.click()}
                      style={{
                        border: "2px dashed #E5E0D4",
                        borderRadius: 10,
                        padding: "20px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = "#D4A017")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "#E5E0D4")
                      }
                    >
                      <p style={{ fontSize: 20, margin: "0 0 6px" }}>🖼</p>
                      <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                        Upload cover image
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: "#bbb",
                          margin: "3px 0 0",
                        }}
                      >
                        JPG, PNG, WebP · max 8MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={coverRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleCoverChange}
                    onClick={(e) => ((e.target as HTMLInputElement).value = "")}
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label style={sectionLabel}>
                    Excerpt{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#B8AFA0",
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      (max 500)
                    </span>
                  </label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => setF("excerpt", e.target.value)}
                    placeholder="Brief summary shown on blog listing page…"
                    rows={3}
                    maxLength={500}
                    style={{ ...sideInput, resize: "vertical" as const }}
                    onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                  />
                  <p
                    style={{
                      fontSize: 10,
                      color: "#B8AFA0",
                      margin: "4px 0 0",
                      textAlign: "right",
                    }}
                  >
                    {form.excerpt.length}/500
                  </p>
                </div>

                {/* Category + Tags */}
                <div>
                  <label style={sectionLabel}>Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setF("category", e.target.value)}
                    placeholder="e.g. Jewellery Care"
                    style={sideInput}
                    onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                  />
                </div>
                <div>
                  <label style={sectionLabel}>
                    Tags{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#B8AFA0",
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    value={form.tags}
                    onChange={(e) => setF("tags", e.target.value)}
                    placeholder="gold care, 22kt, bridal"
                    style={sideInput}
                    onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                  />
                </div>

                {/* Author */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #EEE9DD",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <label style={{ ...sectionLabel, marginBottom: 10 }}>
                    Author
                  </label>
                  <input
                    value={form.authorName}
                    onChange={(e) => setF("authorName", e.target.value)}
                    placeholder="Author name"
                    style={{ ...sideInput, marginBottom: 8 }}
                    onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                  />
                  <input
                    value={form.authorEmail}
                    onChange={(e) => setF("authorEmail", e.target.value)}
                    placeholder="author@email.com"
                    style={{
                      ...sideInput,
                      marginBottom: 8,
                      fontFamily: "monospace",
                      fontSize: 11,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                  />
                  <textarea
                    value={form.authorBio}
                    onChange={(e) => setF("authorBio", e.target.value)}
                    placeholder="Short bio…"
                    rows={2}
                    style={{ ...sideInput, resize: "vertical" as const }}
                    onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                  />
                </div>
              </div>
            )}

            {/* ── SEO settings ── */}
            {activeTab === "seo" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* SEO preview card */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #EEE9DD",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#8B7355",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      margin: "0 0 8px",
                    }}
                  >
                    Google Preview
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#1a0dab",
                      margin: "0 0 2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {form.metaTitle || form.title || "Page Title"}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#006621",
                      margin: "0 0 4px",
                    }}
                  >
                    rehnoorjewels.com/{form.slug || "blog-slug"}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#555",
                      margin: 0,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {form.metaDescription ||
                      form.excerpt ||
                      "Meta description appears here…"}
                  </p>
                </div>

                {[
                  {
                    key: "metaTitle",
                    label: "Meta Title",
                    placeholder: "Blog title for Google (70 chars)",
                    max: 70,
                  },
                  {
                    key: "metaDescription",
                    label: "Meta Description",
                    placeholder: "Search snippet (160 chars)",
                    max: 160,
                    textarea: true,
                  },
                  {
                    key: "metaKeywords",
                    label: "Keywords (comma-sep)",
                    placeholder: "gold jewellery, 22kt, bridal",
                  },
                  {
                    key: "ogTitle",
                    label: "OG Title",
                    placeholder: "Social share title",
                  },
                  {
                    key: "ogDescription",
                    label: "OG Description",
                    placeholder: "Social share description",
                    textarea: true,
                  },
                  {
                    key: "canonicalUrl",
                    label: "Canonical URL",
                    placeholder: "https://rehnoorjewels.com/blog/…",
                    mono: true,
                  },
                ].map(({ key, label, placeholder, max, textarea, mono }) => (
                  <div key={key}>
                    <label style={sectionLabel}>{label}</label>
                    {textarea ? (
                      <textarea
                        value={(form as unknown as Record<string, string>)[key]}
                        onChange={(e) =>
                          setF(key as keyof BlogFormData, e.target.value)
                        }
                        placeholder={placeholder}
                        rows={2}
                        maxLength={max}
                        style={{ ...sideInput, resize: "vertical" as const }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#D4A017")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                      />
                    ) : (
                      <input
                        value={(form as unknown as Record<string, string>)[key]}
                        onChange={(e) =>
                          setF(key as keyof BlogFormData, e.target.value)
                        }
                        placeholder={placeholder}
                        maxLength={max}
                        style={{
                          ...sideInput,
                          fontFamily: mono ? "monospace" : "inherit",
                          fontSize: mono ? 11 : 13,
                        }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#D4A017")
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                      />
                    )}
                    {max && (
                      <p
                        style={{
                          fontSize: 10,
                          color: "#B8AFA0",
                          margin: "3px 0 0",
                          textAlign: "right",
                        }}
                      >
                        {
                          (
                            (form as unknown as Record<string, string>)[key] ||
                            ""
                          ).length
                        }
                        /{max}
                      </p>
                    )}
                  </div>
                ))}

                {/* Robots */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <label style={sectionLabel}>Robots</label>
                  {[
                    {
                      key: "noIndex",
                      label: "noindex (hide from search engines)",
                    },
                    { key: "noFollow", label: "nofollow (don't follow links)" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          (form as unknown as Record<string, boolean>)[key]
                        }
                        onChange={(e) =>
                          setF(key as keyof BlogFormData, e.target.checked)
                        }
                        style={{
                          width: 14,
                          height: 14,
                          accentColor: "#D4A017",
                          cursor: "pointer",
                        }}
                      />
                      <span style={{ fontSize: 12, color: "#555" }}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {activeTab === "settings" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <label style={sectionLabel}>Publish Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setF("status", e.target.value)}
                    style={{ ...sideInput, cursor: "pointer" }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                {form.status === "scheduled" && (
                  <div>
                    <label style={sectionLabel}>Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => setF("scheduledAt", e.target.value)}
                      style={sideInput}
                      onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                    />
                  </div>
                )}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {[
                    {
                      key: "isFeatured",
                      label: "⭐ Featured post",
                      sub: "Shown on homepage hero section",
                    },
                  ].map(({ key, label, sub }) => (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        cursor: "pointer",
                        padding: "10px 12px",
                        background: "#fff",
                        border: "1px solid #EEE9DD",
                        borderRadius: 10,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          (form as unknown as Record<string, boolean>)[key]
                        }
                        onChange={(e) =>
                          setF(key as keyof BlogFormData, e.target.checked)
                        }
                        style={{
                          width: 15,
                          height: 15,
                          accentColor: "#D4A017",
                          cursor: "pointer",
                          marginTop: 1,
                        }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#888",
                            margin: "2px 0 0",
                          }}
                        >
                          {sub}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Save actions */}
                <div style={{ paddingTop: 8, borderTop: "1px solid #EEE9DD" }}>
                  <label style={sectionLabel}>Save</label>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <button
                      onClick={() => handleSave("draft")}
                      disabled={loading}
                      style={{
                        padding: "10px",
                        borderRadius: 9,
                        border: "1.5px solid #E5E0D4",
                        background: "#fff",
                        color: "#555",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: loading ? "wait" : "pointer",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      💾 Save as Draft
                    </button>
                    <button
                      onClick={() => handleSave("published")}
                      disabled={loading}
                      style={{
                        padding: "10px",
                        borderRadius: 9,
                        border: "none",
                        background: "#003720",
                        color: "#FCC131",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: loading ? "wait" : "pointer",
                        opacity: loading ? 0.6 : 1,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {loading ? "Saving…" : "✦ Publish Now"}
                    </button>
                    {isEdit && (
                      <button
                        onClick={onBack}
                        style={{
                          padding: "10px",
                          borderRadius: 9,
                          border: "1.5px solid #E5E0D4",
                          background: "transparent",
                          color: "#888",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        ← Back to list
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── FAQs ── */}
            {activeTab === "faqs" && (
              <FaqManager faqs={faqs} onChange={setFaqs} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Style tokens ─────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#8B7355",
  marginBottom: 6,
};
const sideInput: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  fontSize: 12,
  color: "#333",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};
const sideSmallBtn: React.CSSProperties = {
  flex: 1,
  padding: "6px",
  borderRadius: 7,
  border: "1px solid #E5E0D4",
  background: "#F9F6EE",
  color: "#666",
  fontSize: 11,
  cursor: "pointer",
  fontWeight: 500,
};
const dlgLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#555",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const dlgInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  fontSize: 13,
  color: "#333",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};
