"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "draft" | "published" | "archived" | "scheduled";

interface BlogSummary {
  _id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  category: string;
  tags: string[];
  author: { name: string };
  publishedAt: string | null;
  readingTimeMinutes: number | null;
  wordCount: number;
  views: number;
  isFeatured: boolean;
  createdAt: string;
}

interface BlogStats {
  total: number;
  draft: number;
  published: number;
  archived: number;
  scheduled: number;
  topViewed: { _id: string; title: string; slug: string; views: number }[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type Modal =
  | { type: "none" }
  | { type: "status"; blog: BlogSummary }
  | { type: "confirm-delete"; id: string; title: string }
  | { type: "confirm-bulk"; count: number }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

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
function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CFG: Record<
  BlogStatus,
  { label: string; bg: string; color: string; dot: string; border: string }
> = {
  draft: {
    label: "Draft",
    bg: "#F5F5F5",
    color: "#666",
    dot: "#bbb",
    border: "#E5E0D4",
  },
  published: {
    label: "Published",
    bg: "#EDFAF3",
    color: "#1a7a4a",
    dot: "#2ecc71",
    border: "#2ecc7130",
  },
  archived: {
    label: "Archived",
    bg: "#FFF8E6",
    color: "#a06800",
    dot: "#f0a500",
    border: "#f0a50030",
  },
  scheduled: {
    label: "Scheduled",
    bg: "#EBF5FF",
    color: "#1a6fbf",
    dot: "#3b9eff",
    border: "#3b9eff30",
  },
};

// ─── Small reusables ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BlogStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
        }}
      />
      {c.label}
    </span>
  );
}

function Spinner({ size = 22 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "3px solid #E5E0D4",
        borderTop: "3px solid #D4A017",
        animation: "bmSpin 0.8s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Feedback / Confirm Modal ─────────────────────────────────────────────────

function FeedbackModal({
  modal,
  onConfirm,
  onClose,
}: {
  modal: Modal;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const relevant = ["confirm-delete", "confirm-bulk", "success", "error"];
  if (!relevant.includes(modal.type)) return null;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const isSuccess = modal.type === "success";
  const isError = modal.type === "error";
  const isConfirm = modal.type.startsWith("confirm");
  const accent = isSuccess ? "#2ecc71" : isError ? "#e74c3c" : "#e74c3c";
  const icon = isSuccess ? "✓" : isError ? "⚠" : "🗑";
  const iconBg = isSuccess ? "#EDFAF3" : "#FFF0F0";
  const iconColor = isSuccess ? "#1a7a4a" : "#c0392b";

  const title = isSuccess
    ? "Done!"
    : isError
    ? "Something went wrong"
    : modal.type === "confirm-delete"
    ? `Delete "${modal.title}"?`
    : modal.type === "confirm-bulk"
    ? `Delete ${modal.count} blog${modal.count > 1 ? "s" : ""}?`
    : "";
  const body = isSuccess
    ? modal.message
    : isError
    ? modal.message
    : modal.type === "confirm-delete"
    ? "This blog and its Cloudinary images will be permanently deleted."
    : modal.type === "confirm-bulk"
    ? `You are about to permanently delete ${modal.count} blog${
        modal.count > 1 ? "s" : ""
      }. This cannot be undone.`
    : "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
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
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
          animation: "bmFadeUp 0.22s ease",
        }}
      >
        <div style={{ height: 3, background: accent }} />
        <div style={{ padding: "32px 28px 28px", textAlign: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 22,
              color: iconColor,
            }}
          >
            {icon}
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: "0 0 8px",
            }}
          >
            {title}
          </h3>
          <p
            style={{ fontSize: 13, color: "#777", lineHeight: 1.6, margin: 0 }}
          >
            {body}
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            {isConfirm ? (
              <>
                <button onClick={onClose} style={btnOutline}>
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  style={{ ...btnDanger, cursor: "pointer" }}
                >
                  Yes, delete
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                style={{ ...btnPrimary, background: accent, cursor: "pointer" }}
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status Change Modal ──────────────────────────────────────────────────────

function StatusModal({
  blog,
  onClose,
  onSuccess,
  onError,
}: {
  blog: BlogSummary;
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [status, setStatus] = useState<BlogStatus>(blog.status);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body: Record<string, string> = { status };
      if (status === "scheduled" && scheduledAt) body.scheduledAt = scheduledAt;
      const res = await fetch(
        `${API_BASE}/api/blogs/admin/${blog._id}/status`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess(`Blog status updated to "${STATUS_CFG[status].label}".`);
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: "rgba(10,8,5,0.55)",
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
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(0,0,0,0.22)",
          animation: "bmFadeUp 0.22s ease",
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
            padding: "20px 24px 16px",
            borderBottom: "1px solid #F0EBE0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#B8AFA0",
                margin: 0,
              }}
            >
              Change Status
            </p>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "3px 0 0",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 320,
              }}
            >
              {blog.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "none",
              background: "#F5F1E8",
              color: "#666",
              cursor: "pointer",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: status === "scheduled" ? 16 : 0,
            }}
          >
            {(
              ["draft", "published", "archived", "scheduled"] as BlogStatus[]
            ).map((s) => {
              const c = STATUS_CFG[s];
              const sel = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${sel ? c.dot : "#E5E0D4"}`,
                    background: sel ? c.bg : "#fff",
                    color: sel ? c.color : "#666",
                    fontSize: 12,
                    fontWeight: sel ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.dot,
                      flexShrink: 0,
                    }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
          {status === "scheduled" && (
            <div style={{ marginTop: 14 }}>
              <label style={lblStyle}>Schedule Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
              />
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #F0EBE0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            background: "#FDFAF5",
          }}
        >
          <button onClick={onClose} style={btnOutline}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...btnPrimary,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Updating…" : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: BlogStats | null }) {
  if (!stats) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {[
        { label: "Total", value: stats.total, icon: "📝", color: "#1a1a1a" },
        {
          label: "Published",
          value: stats.published,
          icon: "✅",
          color: "#1a7a4a",
        },
        { label: "Draft", value: stats.draft, icon: "📄", color: "#666" },
        {
          label: "Scheduled",
          value: stats.scheduled,
          icon: "🕐",
          color: "#1a6fbf",
        },
        {
          label: "Archived",
          value: stats.archived,
          icon: "📦",
          color: "#a06800",
        },
      ].map(({ label, value, icon, color }) => (
        <div
          key={label}
          style={{
            background: "#fff",
            border: "1px solid #E5E0D4",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "#8B7355",
                  margin: 0,
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color,
                  margin: "6px 0 0",
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
            </div>
            <span style={{ fontSize: 20 }}>{icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BlogManagementProps {
  onNewPost: () => void;
  onEditPost: (id: string) => void;
}

export default function BlogManagement({
  onNewPost,
  onEditPost,
}: BlogManagementProps) {
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Modal>({ type: "none" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFeatured, setFilterFeatured] = useState("");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterFeatured !== "") params.set("isFeatured", filterFeatured);
      params.set("page", String(page));
      params.set("limit", "15");
      const res = await fetch(`${API_BASE}/api/blogs/admin/all?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setBlogs(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterFeatured, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blogs/admin/stats`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
    fetchStats();
  }, [fetchBlogs, fetchStats]);

  console.log(blogs);

  // ── Actions ───────────────────────────────────────────────────────────────
  const togglePublish = async (blog: BlogSummary) => {
    setTogglingId(blog._id);
    try {
      const res = await fetch(
        `${API_BASE}/api/blogs/admin/${blog._id}/publish`,
        { method: "PATCH", headers: authHeaders() },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBlogs((prev) =>
        prev.map((b) =>
          b._id === blog._id ? { ...b, status: data.data.status } : b,
        ),
      );
      setModal({ type: "success", message: data.message });
      fetchStats();
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Toggle failed",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/blogs/admin/${id}/feature`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBlogs((prev) =>
        prev.map((b) =>
          b._id === id ? { ...b, isFeatured: data.data.isFeatured } : b,
        ),
      );
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Feature toggle failed",
      });
    }
  };

  const executeDelete = async () => {
    if (modal.type !== "confirm-delete") return;
    const { id } = modal;
    setModal({ type: "none" });
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/blogs/admin/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBlogs((prev) => prev.filter((b) => b._id !== id));
      setModal({ type: "success", message: "Blog deleted successfully." });
      fetchStats();
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const executeBulkDelete = async () => {
    if (modal.type !== "confirm-bulk") return;
    setModal({ type: "none" });
    try {
      const res = await fetch(`${API_BASE}/api/blogs/admin/bulk`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setBlogs((prev) => prev.filter((b) => !selectedIds.has(b._id)));
      setSelectedIds(new Set());
      setModal({ type: "success", message: data.message });
      fetchStats();
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Bulk delete failed",
      });
    }
  };

  const handleConfirm = () => {
    if (modal.type === "confirm-delete") executeDelete();
    else if (modal.type === "confirm-bulk") executeBulkDelete();
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelectedIds(
      selectedIds.size === blogs.length
        ? new Set()
        : new Set(blogs.map((b) => b._id)),
    );

  return (
    <>
      <style>{`
        @keyframes bmFadeUp { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes bmSpin { to{transform:rotate(360deg)} }
        .bm-row:hover { background:#FDFAF3 !important; }
        .bm-filter:focus { border-color:#D4A017 !important; outline:none; }
      `}</style>

      <FeedbackModal
        modal={modal}
        onConfirm={handleConfirm}
        onClose={() => setModal({ type: "none" })}
      />

      {modal.type === "status" && (
        <StatusModal
          blog={modal.blog}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => {
            setModal({ type: "success", message: m });
            fetchBlogs();
            fetchStats();
          }}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}

      <div style={{ padding: "24px 28px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              Blog Management
            </h2>
            <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
              {pagination
                ? `${pagination.total} total posts`
                : "Manage all blog posts"}
            </p>
          </div>
          <button
            onClick={onNewPost}
            style={{
              ...btnPrimary,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> New Blog Post
          </button>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#FFF0F0",
              border: "1px solid #FFCDD2",
              color: "#c0392b",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>⚠ {error}</span>
            <button
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                color: "#c0392b",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            className="bm-filter"
            placeholder="🔍 Search title, slug, category…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ ...filterStyle, minWidth: 240 }}
          />
          <select
            className="bm-filter"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            style={{ ...filterStyle, cursor: "pointer", minWidth: 140 }}
          >
            <option value="">All statuses</option>
            {(
              ["draft", "published", "archived", "scheduled"] as BlogStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {STATUS_CFG[s].label}
              </option>
            ))}
          </select>
          <select
            className="bm-filter"
            value={filterFeatured}
            onChange={(e) => {
              setFilterFeatured(e.target.value);
              setPage(1);
            }}
            style={{ ...filterStyle, cursor: "pointer", minWidth: 120 }}
          >
            <option value="">All posts</option>
            <option value="true">⭐ Featured</option>
            <option value="false">Not featured</option>
          </select>
          <button
            onClick={fetchBlogs}
            style={{ ...btnOutline, cursor: "pointer", fontSize: 12 }}
          >
            ↻ Refresh
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() =>
                setModal({ type: "confirm-bulk", count: selectedIds.size })
              }
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #FFCDD2",
                background: "#FFF0F0",
                color: "#c0392b",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              🗑 Delete ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E0D4",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                padding: 64,
                flexDirection: "column",
              }}
            >
              <Spinner />
              <span style={{ color: "#999", fontSize: 14 }}>
                Loading blogs…
              </span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 920,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#F9F6EE",
                      borderBottom: "2px solid #E5E0D4",
                    }}
                  >
                    <th style={th}>
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === blogs.length && blogs.length > 0
                        }
                        onChange={toggleAll}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    {[
                      "Title",
                      "Category",
                      "Author",
                      "Status",
                      "Words",
                      "Views",
                      "Published",
                      "Actions",
                    ].map((h) => (
                      <th key={h} style={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog, idx) => (
                    <tr
                      key={blog._id}
                      className="bm-row"
                      style={{
                        background: selectedIds.has(blog._id)
                          ? "#FFFBF0"
                          : idx % 2 === 0
                          ? "#fff"
                          : "#FAFAF8",
                        borderBottom: "1px solid #EEEAE0",
                        transition: "background 0.12s",
                      }}
                    >
                      <td style={td}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(blog._id)}
                          onChange={() => toggleSelect(blog._id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ ...td, maxWidth: 280 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {blog.isFeatured && (
                            <span
                              title="Featured"
                              style={{ fontSize: 14, flexShrink: 0 }}
                            >
                              ⭐
                            </span>
                          )}
                          <div>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#1a1a1a",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 240,
                              }}
                            >
                              {blog.title}
                            </p>
                            <p
                              style={{
                                fontSize: 10,
                                color: "#aaa",
                                margin: "2px 0 0",
                                fontFamily: "monospace",
                              }}
                            >
                              {blog.slug}
                            </p>
                          </div>
                        </div>
                        {blog.readingTimeMinutes && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "#C5BBA8",
                              margin: "3px 0 0",
                            }}
                          >
                            ⏱ {blog.readingTimeMinutes} min read
                          </p>
                        )}
                      </td>
                      <td style={{ ...td, fontSize: 12, color: "#666" }}>
                        {blog.category || (
                          <span style={{ color: "#ccc" }}>—</span>
                        )}
                        {blog.tags?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            style={{
                              display: "inline-block",
                              marginLeft: 4,
                              fontSize: 9,
                              background: "#F0EBE0",
                              color: "#7a6040",
                              padding: "1px 6px",
                              borderRadius: 6,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </td>
                      <td style={{ ...td, fontSize: 12, color: "#666" }}>
                        {blog.author?.name || "—"}
                      </td>
                      <td style={td}>
                        <StatusBadge status={blog.status} />
                      </td>
                      <td
                        style={{
                          ...td,
                          fontSize: 12,
                          color: "#888",
                          textAlign: "center",
                        }}
                      >
                        {blog.wordCount?.toLocaleString() || "—"}
                      </td>
                      <td
                        style={{
                          ...td,
                          fontSize: 12,
                          color: "#888",
                          textAlign: "center",
                        }}
                      >
                        {blog.views?.toLocaleString() || "0"}
                      </td>
                      <td
                        style={{
                          ...td,
                          fontSize: 11,
                          color: "#999",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt(blog.publishedAt)}
                      </td>
                      <td style={td}>
                        <div
                          style={{ display: "flex", gap: 5, flexWrap: "wrap" }}
                        >
                          <button
                            onClick={() => onEditPost(blog._id)}
                            style={{
                              ...actionBtn,
                              background: "#F0F7FF",
                              color: "#1a6fbf",
                              border: "1px solid #BDD9FF",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setModal({ type: "status", blog })}
                            style={{
                              ...actionBtn,
                              background: "#FFF8E6",
                              color: "#a06800",
                              border: "1px solid #f0a50030",
                              cursor: "pointer",
                            }}
                          >
                            Status
                          </button>
                          <button
                            onClick={() => togglePublish(blog)}
                            disabled={togglingId === blog._id}
                            style={{
                              ...actionBtn,
                              background:
                                blog.status === "published"
                                  ? "#FFF0F0"
                                  : "#EDFAF3",
                              color:
                                blog.status === "published"
                                  ? "#c0392b"
                                  : "#1a7a4a",
                              border: `1px solid ${
                                blog.status === "published"
                                  ? "#e74c3c30"
                                  : "#2ecc7130"
                              }`,
                              cursor:
                                togglingId === blog._id ? "wait" : "pointer",
                              opacity: togglingId === blog._id ? 0.5 : 1,
                            }}
                          >
                            {blog.status === "published"
                              ? "Unpublish"
                              : "Publish"}
                          </button>
                          <button
                            onClick={() => toggleFeatured(blog._id)}
                            style={{
                              ...actionBtn,
                              background: blog.isFeatured
                                ? "#FFF8E6"
                                : "#F9F6EE",
                              color: blog.isFeatured ? "#a06800" : "#888",
                              border: "1px solid #E5E0D4",
                              cursor: "pointer",
                            }}
                          >
                            {blog.isFeatured ? "★ Unfeature" : "☆ Feature"}
                          </button>
                          <button
                            onClick={() =>
                              setModal({
                                type: "confirm-delete",
                                id: blog._id,
                                title: blog.title,
                              })
                            }
                            disabled={deletingId === blog._id}
                            style={{
                              ...actionBtn,
                              background: "#FFF5F5",
                              color: "#c0392b",
                              border: "1px solid #FFCDD2",
                              cursor:
                                deletingId === blog._id ? "wait" : "pointer",
                              opacity: deletingId === blog._id ? 0.5 : 1,
                            }}
                          >
                            {deletingId === blog._id ? "…" : "Del"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {blogs.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: "center",
                          padding: 56,
                          color: "#bbb",
                          fontSize: 14,
                        }}
                      >
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                        No blog posts found
                        <div style={{ marginTop: 12 }}>
                          <button
                            onClick={onNewPost}
                            style={{
                              ...btnPrimary,
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            Create your first post
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 18,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                ...btnOutline,
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
                fontSize: 12,
              }}
            >
              ← Prev
            </button>
            <span style={{ color: "#888", fontSize: 13 }}>
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} posts
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              style={{
                ...btnOutline,
                cursor:
                  page === pagination.totalPages ? "not-allowed" : "pointer",
                opacity: page === pagination.totalPages ? 0.5 : 1,
                fontSize: 12,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  padding: "9px 20px",
  borderRadius: 9,
  border: "none",
  background: "#D4A017",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
};
const btnOutline: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 9,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  color: "#555",
  fontWeight: 500,
  fontSize: 13,
  cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  padding: "9px 20px",
  borderRadius: 9,
  border: "none",
  background: "#e74c3c",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
};
const filterStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  color: "#333",
  fontSize: 12,
  outline: "none",
  transition: "border-color 0.15s",
};
const actionBtn: React.CSSProperties = {
  padding: "5px 9px",
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 500,
  border: "none",
  transition: "opacity 0.15s",
  whiteSpace: "nowrap",
};
const th: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: 11,
  fontWeight: 700,
  color: "#8B7355",
  textAlign: "left",
  whiteSpace: "nowrap",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};
const td: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#333",
  verticalAlign: "middle",
};
const lblStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#8B7355",
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  fontSize: 13,
  color: "#333",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};
