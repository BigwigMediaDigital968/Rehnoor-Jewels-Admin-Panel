"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = "new" | "in-progress" | "resolved" | "spam";

type Lead = {
  _id: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: LeadStatus;
  adminNotes: string | null;
  resolvedAt: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ModalState =
  | { type: "none" }
  | { type: "confirm-delete"; id: string; name: string }
  | { type: "confirm-bulk"; count: number }
  | { type: "success"; message: string }
  | { type: "view"; lead: Lead };

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; color: string; dot: string; border: string }
> = {
  new: {
    label: "New",
    bg: "#EBF5FF",
    color: "#1a6fbf",
    dot: "#3b9eff",
    border: "#3b9eff40",
  },
  "in-progress": {
    label: "In Progress",
    bg: "#FFF8E6",
    color: "#a06800",
    dot: "#f0a500",
    border: "#f0a50040",
  },
  resolved: {
    label: "Resolved",
    bg: "#EDFAF3",
    color: "#1a7a4a",
    dot: "#2ecc71",
    border: "#2ecc7140",
  },
  spam: {
    label: "Spam",
    bg: "#FFF0F0",
    color: "#c0392b",
    dot: "#e74c3c",
    border: "#e74c3c40",
  },
};

// Resolution steps derived from lead data
function getResolutionSteps(lead: Lead) {
  const steps: {
    label: string;
    detail: string;
    done: boolean;
    time?: string;
    active?: boolean;
  }[] = [
    {
      label: "Query submitted",
      detail: `${lead.fullName} submitted via contact form`,
      done: true,
      time: formatDateTime(lead.createdAt),
    },
    {
      label: "Lead received",
      detail: "Logged in admin system and assigned status: New",
      done: true,
      time: formatDateTime(lead.createdAt),
    },
    {
      label: "Under review",
      detail:
        lead.status === "new"
          ? "Awaiting admin review"
          : "Admin picked up the query",
      done: lead.status !== "new",
      active: lead.status === "in-progress",
      time:
        lead.status !== "new" && lead.updatedAt
          ? formatDateTime(lead.updatedAt)
          : undefined,
    },
    {
      label: "Admin note added",
      detail: lead.adminNotes
        ? `"${lead.adminNotes.slice(0, 80)}${
            lead.adminNotes.length > 80 ? "…" : ""
          }"`
        : "No internal note yet",
      done: !!lead.adminNotes,
      time:
        lead.adminNotes && lead.updatedAt
          ? formatDateTime(lead.updatedAt)
          : undefined,
    },
    {
      label: "Resolution",
      detail:
        lead.status === "resolved"
          ? "Query successfully resolved"
          : lead.status === "spam"
          ? "Marked as spam — no further action"
          : "Pending resolution",
      done: lead.status === "resolved" || lead.status === "spam",
      time: lead.resolvedAt ? formatDateTime(lead.resolvedAt) : undefined,
    },
  ];
  return steps;
}

// ─── View Modal ───────────────────────────────────────────────────────────────

function ViewModal({
  lead,
  onClose,
  onStatusChange,
  onSaveNote,
  savingNoteId,
}: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onSaveNote: (lead: Lead, note: string) => void;
  savingNoteId: string | null;
}) {
  const [noteDraft, setNoteDraft] = useState(lead.adminNotes ?? "");
  const [localStatus, setLocalStatus] = useState<LeadStatus>(lead.status);
  const steps = getResolutionSteps({ ...lead, status: localStatus });
  const cfg = STATUS_CONFIG[localStatus];

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div style={vmOverlay} onClick={onClose}>
      <div style={vmBox} onClick={(e) => e.stopPropagation()}>
        {/* ── Top accent bar (color-coded by status) ── */}
        <div
          style={{
            height: 4,
            borderRadius: "16px 16px 0 0",
            background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.color})`,
          }}
        />

        {/* ── Header ── */}
        <div style={vmHeader}>
          <div>
            <p style={vmEyebrow}>Lead Detail</p>
            <h2 style={vmName}>{lead.fullName}</h2>
            <p style={vmMeta}>
              {lead.email}
              {lead.phone ? ` · ${lead.phone}` : ""}
              {" · "}
              {formatDate(lead.createdAt)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Status badge + inline changer */}
            <select
              value={localStatus}
              onChange={(e) => {
                const s = e.target.value as LeadStatus;
                setLocalStatus(s);
                onStatusChange(lead._id, s);
              }}
              style={{
                padding: "6px 28px 6px 12px",
                borderRadius: 20,
                border: `1.5px solid ${cfg.border}`,
                background: cfg.bg,
                color: cfg.color,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                outline: "none",
                letterSpacing: "0.03em",
              }}
            >
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="spam">Spam</option>
            </select>
            <button onClick={onClose} style={vmCloseBtn} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* ── Body: two-column grid ── */}
        <div style={vmBody}>
          {/* LEFT column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Subject + Message card */}
            <div style={vmCard}>
              <p style={vmCardLabel}>Subject</p>
              <p style={vmCardValue}>
                <span style={subjectPill}>{lead.subject}</span>
              </p>
              <p style={{ ...vmCardLabel, marginTop: 16 }}>Message</p>
              <p
                style={{
                  fontSize: 14,
                  color: "#444",
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: "6px 0 0",
                }}
              >
                {lead.message}
              </p>
            </div>

            {/* Meta info grid */}
            <div style={vmCard}>
              <p style={vmCardLabel}>Details</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px 24px",
                  marginTop: 10,
                }}
              >
                {[
                  { label: "Lead ID", value: lead._id.slice(-8).toUpperCase() },
                  { label: "IP Address", value: lead.ipAddress || "—" },
                  { label: "Submitted", value: formatDateTime(lead.createdAt) },
                  {
                    label: "Last updated",
                    value: formatDateTime(lead.updatedAt),
                  },
                  {
                    label: "Resolved at",
                    value: lead.resolvedAt
                      ? formatDateTime(lead.resolvedAt)
                      : "—",
                  },
                  { label: "Phone", value: lead.phone || "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "#8B7355",
                        margin: 0,
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#333",
                        margin: "3px 0 0",
                        wordBreak: "break-all",
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div style={vmCard}>
              <p style={vmCardLabel}>Internal Admin Note</p>
              <textarea
                rows={4}
                placeholder="Add an internal note visible only to admins…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                style={vmTextarea}
                onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <button
                  onClick={() => onSaveNote(lead, noteDraft)}
                  disabled={savingNoteId === lead._id}
                  style={{
                    ...vmSaveBtn,
                    opacity: savingNoteId === lead._id ? 0.6 : 1,
                    cursor: savingNoteId === lead._id ? "wait" : "pointer",
                  }}
                >
                  {savingNoteId === lead._id ? "Saving…" : "Save Note"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT column — Resolution Timeline */}
          <div style={vmCard}>
            <p style={vmCardLabel}>Resolution Journey</p>
            <p
              style={{
                fontSize: 12,
                color: "#aaa",
                margin: "2px 0 20px",
              }}
            >
              Step-by-step progress of this query
            </p>

            <div style={{ position: "relative" }}>
              {/* Vertical track line */}
              <div
                style={{
                  position: "absolute",
                  left: 15,
                  top: 18,
                  bottom: 18,
                  width: 2,
                  background: "#EEE9DD",
                  borderRadius: 2,
                }}
              />

              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: i < steps.length - 1 ? 28 : 0,
                    position: "relative",
                  }}
                >
                  {/* Step dot */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      zIndex: 1,
                      border: step.done
                        ? `2px solid ${step.active ? cfg.dot : "#2ecc71"}`
                        : "2px solid #E5E0D4",
                      background: step.done
                        ? step.active
                          ? cfg.bg
                          : "#EDFAF3"
                        : "#F9F6EE",
                      color: step.done
                        ? step.active
                          ? cfg.color
                          : "#1a7a4a"
                        : "#C5BBA8",
                      boxShadow: step.active
                        ? `0 0 0 4px ${cfg.dot}22`
                        : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {step.done && !step.active ? (
                      "✓"
                    ) : step.active ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: cfg.dot,
                          display: "block",
                          animation: "pulse 1.4s ease-in-out infinite",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#D5CFC2",
                          display: "block",
                        }}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div style={{ paddingTop: 4, flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: step.done ? "#1a1a1a" : "#AAA",
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {step.label}
                      {step.active && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 10,
                            background: cfg.bg,
                            color: cfg.color,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            verticalAlign: "middle",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: step.done ? "#666" : "#C5BBA8",
                        margin: "4px 0 0",
                        lineHeight: 1.5,
                        fontStyle:
                          step.label === "Admin note added" && step.done
                            ? "italic"
                            : "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {step.detail}
                    </p>
                    {step.time && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "#B8AFA0",
                          margin: "4px 0 0",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {step.time}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary badge at bottom */}
            <div
              style={{
                marginTop: 28,
                padding: "12px 16px",
                borderRadius: 10,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: cfg.dot,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <p
                style={{
                  fontSize: 12,
                  color: cfg.color,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Current status:{" "}
                <span style={{ fontWeight: 800 }}>{cfg.label}</span>
                {localStatus === "resolved" && lead.resolvedAt
                  ? ` · Resolved ${formatDate(lead.resolvedAt)}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm / Success Modal ──────────────────────────────────────────────────

function ConfirmModal({
  modal,
  onConfirm,
  onClose,
}: {
  modal: ModalState;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (modal.type === "none" || modal.type === "view") return null;

  const isSuccess = modal.type === "success";

  return (
    <div style={overlay}>
      <div style={modalBox}>
        <div
          style={{
            ...iconCircle,
            background: isSuccess ? "#EDFAF3" : "#FFF0F0",
          }}
        >
          <span style={{ fontSize: 28 }}>{isSuccess ? "✓" : "🗑"}</span>
        </div>
        <h3 style={modalTitle}>
          {isSuccess
            ? "Done!"
            : modal.type === "confirm-bulk"
            ? `Delete ${modal.count} lead${modal.count > 1 ? "s" : ""}?`
            : "Delete lead?"}
        </h3>
        <p style={modalBody}>
          {isSuccess
            ? modal.message
            : modal.type === "confirm-bulk"
            ? `You are about to permanently delete ${
                modal.count
              } selected lead${
                modal.count > 1 ? "s" : ""
              }. This cannot be undone.`
            : `You are about to permanently delete the lead from "${modal.name}". This cannot be undone.`}
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 24,
          }}
        >
          {isSuccess ? (
            <button onClick={onClose} style={btnPrimary}>
              Got it
            </button>
          ) : (
            <>
              <button onClick={onClose} style={btnCancel}>
                Cancel
              </button>
              <button onClick={onConfirm} style={btnDanger}>
                Yes, delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "">("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Admin notes state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (searchName) params.set("search", searchName);
      params.set("page", String(page));
      params.set("limit", "10");

      const res = await fetch(`${API_BASE}/api/leads?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch leads");
      setLeads(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchName, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(
      (lead) =>
        lead.email.toLowerCase().includes(searchEmail.toLowerCase()) &&
        (filterDate ? lead.createdAt.startsWith(filterDate) : true),
    );
  }, [leads, searchEmail, filterDate]);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    setUpdatingId(id);
    setLeads((prev) => prev.map((l) => (l._id === id ? { ...l, status } : l)));
    // Also update lead inside view modal if open
    setModal((prev) =>
      prev.type === "view" && prev.lead._id === id
        ? { ...prev, lead: { ...prev.lead, status } }
        : prev,
    );
    try {
      const res = await fetch(`${API_BASE}/api/leads/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Status update failed");
      fetchLeads();
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Save admin note (called from both inline row panel and view modal) ──
  const saveAdminNote = async (lead: Lead, adminNotes: string) => {
    setSavingNoteId(lead._id);
    try {
      const res = await fetch(`${API_BASE}/api/leads/${lead._id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: lead.status, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLeads((prev) =>
        prev.map((l) => (l._id === lead._id ? { ...l, adminNotes } : l)),
      );
      // Update modal lead too
      setModal((prev) =>
        prev.type === "view" && prev.lead._id === lead._id
          ? { ...prev, lead: { ...prev.lead, adminNotes } }
          : prev,
      );
      setExpandedId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSavingNoteId(null);
    }
  };

  const confirmDelete = (id: string, name: string) =>
    setModal({ type: "confirm-delete", id, name });

  const executeDelete = async () => {
    if (modal.type !== "confirm-delete") return;
    const { id } = modal;
    setModal({ type: "none" });
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/leads/delete/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLeads((prev) => prev.filter((l) => l._id !== id));
      setSelectedIds((prev) => {
        prev.delete(id);
        return new Set(prev);
      });
      setModal({ type: "success", message: "Lead deleted successfully." });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setModal({ type: "confirm-bulk", count: selectedIds.size });
  };

  const executeBulkDelete = async () => {
    if (modal.type !== "confirm-bulk") return;
    setModal({ type: "none" });
    setBulkDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/delete/bulk`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const count = selectedIds.size;
      setLeads((prev) => prev.filter((l) => !selectedIds.has(l._id)));
      setSelectedIds(new Set());
      setModal({
        type: "success",
        message: `${count} lead${count > 1 ? "s" : ""} deleted successfully.`,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleModalConfirm = () => {
    if (modal.type === "confirm-delete") executeDelete();
    else if (modal.type === "confirm-bulk") executeBulkDelete();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === filteredLeads.length
        ? new Set()
        : new Set(filteredLeads.map((l) => l._id)),
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .lead-row:hover { background: #FDFAF3 !important; }
        .del-btn:hover  { background: #FFE0DE !important; }
        .view-btn:hover { background: #EBF5FF !important; }
        .filter-input:focus { border-color: #D4A017 !important; outline: none; }
        .vm-scroll::-webkit-scrollbar { width: 5px; }
        .vm-scroll::-webkit-scrollbar-track { background: #F5F2EA; }
        .vm-scroll::-webkit-scrollbar-thumb { background: #D5CFC2; border-radius: 4px; }
      `}</style>

      {/* ── View Modal ── */}
      {modal.type === "view" && (
        <ViewModal
          lead={modal.lead}
          onClose={() => setModal({ type: "none" })}
          onStatusChange={handleStatusChange}
          onSaveNote={saveAdminNote}
          savingNoteId={savingNoteId}
        />
      )}

      {/* ── Confirm / Success Modal ── */}
      <ConfirmModal
        modal={modal}
        onConfirm={handleModalConfirm}
        onClose={() => setModal({ type: "none" })}
      />

      <div style={{ padding: "24px 28px" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={pageTitle}>Lead Management</h2>
          <p style={pageSubtitle}>
            {pagination
              ? `${pagination.total} total leads`
              : "Manage contact form submissions"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={errorBanner}>
            <span>⚠ {error}</span>
            <button onClick={() => setError("")} style={errorClose}>
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={filterRow}>
          <input
            className="filter-input"
            placeholder="🔍 Search by name"
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setPage(1);
            }}
            style={filterInput}
          />
          <input
            className="filter-input"
            placeholder="Filter by email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            style={filterInput}
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as LeadStatus | "");
              setPage(1);
            }}
            style={{ ...filterInput, minWidth: 150 }}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="spam">Spam</option>
          </select>
          <input
            className="filter-input"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={filterInput}
          />
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button onClick={fetchLeads} style={refreshBtn}>
              ↻ Refresh
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
                style={bulkDelBtn}
              >
                {bulkDeleting ? "Deleting…" : `🗑 Delete (${selectedIds.size})`}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={cardStyle}>
          {loading ? (
            <div style={loadingState}>
              <div style={spinner} />
              <span style={{ color: "#999", fontSize: 14 }}>
                Loading leads…
              </span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 960,
                }}
              >
                <thead>
                  <tr style={thead}>
                    <th style={th}>
                      <input
                        type="checkbox"
                        style={{ cursor: "pointer" }}
                        checked={
                          selectedIds.size === filteredLeads.length &&
                          filteredLeads.length > 0
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    {[
                      "Name",
                      "Email",
                      "Phone",
                      "Subject",
                      "Message",
                      "Status",
                      "Date",
                      "Notes",
                      "Actions",
                    ].map((h) => (
                      <th key={h} style={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, idx) => (
                    <>
                      <tr
                        key={lead._id}
                        className="lead-row"
                        style={{
                          background: selectedIds.has(lead._id)
                            ? "#FFFBF0"
                            : idx % 2 === 0
                            ? "#FFFFFF"
                            : "#FAFAF8",
                          borderBottom:
                            expandedId === lead._id
                              ? "none"
                              : "1px solid #EEEAE0",
                        }}
                      >
                        <td style={td}>
                          <input
                            type="checkbox"
                            style={{ cursor: "pointer" }}
                            checked={selectedIds.has(lead._id)}
                            onChange={() => toggleSelect(lead._id)}
                          />
                        </td>
                        <td
                          style={{ ...td, fontWeight: 600, color: "#1a1a1a" }}
                        >
                          {lead.fullName}
                        </td>
                        <td style={{ ...td, color: "#444" }}>{lead.email}</td>
                        <td style={{ ...td, color: "#666" }}>
                          {lead.phone || "—"}
                        </td>
                        <td style={td}>
                          <span style={subjectPill}>{lead.subject}</span>
                        </td>
                        <td style={{ ...td, maxWidth: 180, color: "#555" }}>
                          <span title={lead.message}>
                            {lead.message.length > 45
                              ? lead.message.slice(0, 45) + "…"
                              : lead.message}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={td}>
                          <div
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <select
                              value={lead.status}
                              disabled={updatingId === lead._id}
                              onChange={(e) =>
                                handleStatusChange(
                                  lead._id,
                                  e.target.value as LeadStatus,
                                )
                              }
                              style={{
                                padding: "5px 26px 5px 10px",
                                borderRadius: 20,
                                border: `1.5px solid ${
                                  STATUS_CONFIG[lead.status].border
                                }`,
                                background: STATUS_CONFIG[lead.status].bg,
                                color: STATUS_CONFIG[lead.status].color,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                appearance: "none",
                                WebkitAppearance: "none",
                                outline: "none",
                                opacity: updatingId === lead._id ? 0.5 : 1,
                              }}
                            >
                              <option value="new">New</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="spam">Spam</option>
                            </select>
                            <span
                              style={{
                                position: "absolute",
                                right: 9,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: STATUS_CONFIG[lead.status].dot,
                                pointerEvents: "none",
                              }}
                            />
                          </div>
                        </td>

                        <td
                          style={{
                            ...td,
                            color: "#666",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(lead.createdAt)}
                        </td>

                        {/* Notes toggle */}
                        <td style={td}>
                          <button
                            onClick={() => {
                              setExpandedId((prev) =>
                                prev === lead._id ? null : lead._id,
                              );
                              setNoteDrafts((prev) => ({
                                ...prev,
                                [lead._id]:
                                  prev[lead._id] ?? lead.adminNotes ?? "",
                              }));
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 7,
                              border: `1.5px solid ${
                                lead.adminNotes ? "#D4A017" : "#E5E0D4"
                              }`,
                              background: lead.adminNotes
                                ? "#FFFBF0"
                                : "#FAFAF8",
                              color: lead.adminNotes ? "#a06800" : "#999",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {lead.adminNotes ? "📝 Edit note" : "+ Add note"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="view-btn"
                              onClick={() => setModal({ type: "view", lead })}
                              style={viewBtn}
                            >
                              View
                            </button>
                            <button
                              className="del-btn"
                              onClick={() =>
                                confirmDelete(lead._id, lead.fullName)
                              }
                              disabled={deletingId === lead._id}
                              style={{
                                ...delBtn,
                                opacity: deletingId === lead._id ? 0.5 : 1,
                              }}
                            >
                              {deletingId === lead._id ? "…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Inline notes panel ── */}
                      {expandedId === lead._id && (
                        <tr
                          key={`${lead._id}-notes`}
                          style={{ background: "#FFFDF5" }}
                        >
                          <td
                            colSpan={10}
                            style={{
                              padding: "14px 20px 16px",
                              borderBottom: "1px solid #EEE",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              <label
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#8B7355",
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Admin Note — {lead.fullName}
                              </label>
                              <textarea
                                rows={3}
                                placeholder="Add an internal note visible only to admins…"
                                value={
                                  noteDrafts[lead._id] ?? lead.adminNotes ?? ""
                                }
                                onChange={(e) =>
                                  setNoteDrafts((prev) => ({
                                    ...prev,
                                    [lead._id]: e.target.value,
                                  }))
                                }
                                style={vmTextarea}
                                onFocus={(e) =>
                                  (e.target.style.borderColor = "#D4A017")
                                }
                                onBlur={(e) =>
                                  (e.target.style.borderColor = "#E5E0D4")
                                }
                              />
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  justifyContent: "flex-end",
                                }}
                              >
                                <button
                                  onClick={() => setExpandedId(null)}
                                  style={btnCancel}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    saveAdminNote(
                                      lead,
                                      noteDrafts[lead._id] ?? "",
                                    )
                                  }
                                  disabled={savingNoteId === lead._id}
                                  style={{
                                    ...vmSaveBtn,
                                    opacity:
                                      savingNoteId === lead._id ? 0.6 : 1,
                                    cursor:
                                      savingNoteId === lead._id
                                        ? "wait"
                                        : "pointer",
                                  }}
                                >
                                  {savingNoteId === lead._id
                                    ? "Saving…"
                                    : "Save Note"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}

                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={10} style={emptyCell}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                        No leads found
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
          <div style={pagRow}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={pagBtn(page === 1)}
            >
              ← Prev
            </button>
            <span style={{ color: "#888", fontSize: 13 }}>
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} leads
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              style={pagBtn(page === pagination.totalPages)}
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

const pageTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: "#1a1a1a",
  margin: 0,
};
const pageSubtitle: React.CSSProperties = {
  fontSize: 13,
  color: "#999",
  marginTop: 4,
};

const filterRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginBottom: 16,
  flexWrap: "wrap",
  alignItems: "center",
};
const filterInput: React.CSSProperties = {
  padding: "9px 13px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#FFFFFF",
  color: "#333",
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.15s",
};
const refreshBtn: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "1.5px solid #D4A017",
  background: "#FFFBF0",
  color: "#a06800",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};
const bulkDelBtn: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 8,
  border: "1.5px solid #e74c3c",
  background: "#FFF0F0",
  color: "#c0392b",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E0D4",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};
const thead: React.CSSProperties = {
  background: "#F9F6EE",
  borderBottom: "2px solid #E5E0D4",
};
const th: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 11,
  fontWeight: 700,
  color: "#8B7355",
  textAlign: "left",
  whiteSpace: "nowrap",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};
const td: React.CSSProperties = {
  padding: "13px 16px",
  fontSize: 13,
  color: "#333",
  verticalAlign: "middle",
};
const subjectPill: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 12,
  background: "#F0EBE0",
  color: "#7a6040",
  fontSize: 11,
  fontWeight: 500,
  whiteSpace: "nowrap",
};
const viewBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 7,
  border: "1.5px solid #BDD9FF",
  background: "#F0F7FF",
  color: "#1a6fbf",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  transition: "background 0.15s",
};
const delBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 7,
  border: "1.5px solid #FFCDD2",
  background: "#FFF5F5",
  color: "#c0392b",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  transition: "background 0.15s",
};

const loadingState: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: 60,
};
const spinner: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  border: "3px solid #E5E0D4",
  borderTop: "3px solid #D4A017",
  animation: "spin 0.8s linear infinite",
};
const emptyCell: React.CSSProperties = {
  textAlign: "center",
  padding: 52,
  color: "#bbb",
  fontSize: 14,
};
const errorBanner: React.CSSProperties = {
  background: "#FFF0F0",
  border: "1px solid #FFCDD2",
  color: "#c0392b",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 13,
  marginBottom: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const errorClose: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#c0392b",
  cursor: "pointer",
  fontSize: 16,
};

const pagRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  marginTop: 18,
};
const pagBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: disabled ? "#F5F5F5" : "#FFFFFF",
  color: disabled ? "#bbb" : "#333",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 13,
});

// Confirm/success modal
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalBox: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: "36px 32px",
  width: "100%",
  maxWidth: 400,
  textAlign: "center",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  animation: "fadeUp 0.22s ease",
};
const iconCircle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px",
};
const modalTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#1a1a1a",
  margin: "0 0 10px",
};
const modalBody: React.CSSProperties = {
  fontSize: 14,
  color: "#666",
  lineHeight: 1.6,
  margin: 0,
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 28px",
  borderRadius: 8,
  border: "none",
  background: "#2ecc71",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
const btnCancel: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#FFF",
  color: "#555",
  fontWeight: 500,
  fontSize: 14,
  cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: 8,
  border: "none",
  background: "#e74c3c",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

// View modal
const vmOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(10,8,5,0.65)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1100,
  padding: "16px",
};
const vmBox: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  width: "100%",
  maxWidth: 940,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.1)",
  animation: "slideIn 0.28s cubic-bezier(0.16,1,0.3,1)",
  scrollbarWidth: "thin",
};
const vmHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  padding: "20px 24px 16px",
  borderBottom: "1px solid #F0EBE0",
};
const vmEyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#B8AFA0",
  margin: "0 0 4px",
};
const vmName: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#1a1a1a",
  margin: 0,
  lineHeight: 1.2,
};
const vmMeta: React.CSSProperties = {
  fontSize: 13,
  color: "#888",
  margin: "5px 0 0",
};
const vmCloseBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "none",
  background: "#F5F1E8",
  color: "#666",
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const vmBody: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  padding: "20px 24px 24px",
};
const vmCard: React.CSSProperties = {
  background: "#FDFAF4",
  border: "1px solid #EEE9DD",
  borderRadius: 12,
  padding: "18px 20px",
};
const vmCardLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#8B7355",
  margin: 0,
};
const vmCardValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  color: "#222",
};
const vmTextarea: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#FFFFFF",
  color: "#333",
  fontSize: 13,
  lineHeight: 1.6,
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};
const vmSaveBtn: React.CSSProperties = {
  padding: "9px 22px",
  borderRadius: 8,
  border: "none",
  background: "#D4A017",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};
