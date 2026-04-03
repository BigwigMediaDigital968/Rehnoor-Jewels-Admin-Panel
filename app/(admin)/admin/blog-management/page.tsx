"use client";

import BlogEditor from "@/app/Component/blog/BlogEditor";
import BlogManagement from "@/app/Component/blog/BlogManagement";
import { useState } from "react";

// ─── Feedback Toast ───────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}) {
  const isSuccess = type === "success";
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: 380,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 18px",
        borderRadius: 12,
        background: isSuccess ? "#EDFAF3" : "#FFF0F0",
        border: `1px solid ${isSuccess ? "#2ecc7130" : "#e74c3c30"}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        animation: "toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>
        {isSuccess ? "✅" : "⚠️"}
      </span>
      <p
        style={{
          fontSize: 13,
          color: isSuccess ? "#1a7a4a" : "#c0392b",
          margin: 0,
          flex: 1,
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        {message}
      </p>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: isSuccess ? "#1a7a4a" : "#c0392b",
          cursor: "pointer",
          fontSize: 16,
          opacity: 0.6,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── View state machine ───────────────────────────────────────────────────────

type View = { mode: "list" } | { mode: "new" } | { mode: "edit"; id: string };

// ─── Main Blog Page ───────────────────────────────────────────────────────────

export default function BlogPage() {
  const [view, setView] = useState<View>({ mode: "list" });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSaved = (msg: string) => {
    showToast(msg, "success");
    // Stay on editor so user can keep editing; they can navigate back manually
  };

  const handleError = (msg: string) => {
    showToast(msg, "error");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Views */}
      {view.mode === "list" && (
        <BlogManagement
          onNewPost={() => setView({ mode: "new" })}
          onEditPost={(id) => setView({ mode: "edit", id })}
        />
      )}

      {view.mode === "new" && (
        <BlogEditor
          onBack={() => setView({ mode: "list" })}
          onSaved={handleSaved}
          onError={handleError}
        />
      )}

      {view.mode === "edit" && (
        <BlogEditor
          blogId={view.id}
          onBack={() => setView({ mode: "list" })}
          onSaved={handleSaved}
          onError={handleError}
        />
      )}
    </div>
  );
}
