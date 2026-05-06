"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Theme colours (matches rj-* CSS vars in your project) ───────────────────
const T = {
  emerald: "#003720",
  gold: "#FCC151",
  bone: "#E8DFD0",
  ivory: "#F8F5F0",
  ash: "#9B8E7E",
  charcoal: "#1C1C1C",
  red: "#ef4444",
  green: "#22c55e",
};

const API = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type DiscountType = "flat" | "percent" | "free_shipping" | "buy_x_get_y";

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  usageLimitTotal: number | null;
  usageLimitPerUser: number;
  usageCount: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  isPaused: boolean;
  isExpired: boolean;
  isValid: boolean;
  isStackable: boolean;
  tags: string[];
  internalNote?: string;
  createdAt: string;
}

interface Analytics {
  totalRedemptions: number;
  totalDiscountGiven: number;
  totalOrderValue: number;
  avgDiscountPerOrder: number;
  remainingRedemptions: number | null;
  usageByDay: Record<string, number>;
}

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusBadge = (c: Coupon) => {
  const now = new Date();
  const starts = c.startsAt ? new Date(c.startsAt) : null;
  const expires = c.expiresAt ? new Date(c.expiresAt) : null;

  const isExpired = expires && expires < now;
  const isNotStarted = starts && starts > now;

  if (!c.isActive) return { label: "Inactive", bg: "#fef2f2", color: T.red };

  if (c.isPaused) return { label: "Paused", bg: "#fefce8", color: "#ca8a04" };

  if (isExpired) return { label: "Expired", bg: "#f3f4f6", color: T.ash };

  if (isNotStarted)
    return { label: "Scheduled", bg: "#eff6ff", color: "#3b82f6" };

  return { label: "Active", bg: "#f0fdf4", color: T.green };
};

const discountLabel = (c: Coupon) => {
  if (c.discountType === "flat") return `₹${c.discountValue} off`;
  if (c.discountType === "percent") return `${c.discountValue}% off`;
  if (c.discountType === "free_shipping") return "Free Shipping";
  if (c.discountType === "buy_x_get_y") return "Buy X Get Y";
  return "—";
};

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────
async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}/api/admin/coupons${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function ToastContainer({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: number) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background:
              t.type === "success"
                ? T.emerald
                : t.type === "error"
                ? "#7f1d1d"
                : T.charcoal,
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            fontFamily: "Cinzel, serif",
            fontSize: 12,
            letterSpacing: "0.05em",
            cursor: "pointer",
            minWidth: 260,
            maxWidth: 380,
            animation: "slideIn 0.25s ease",
          }}
        >
          <span style={{ fontSize: 16 }}>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div
        style={{ ...panelStyle, maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 16,
            fontWeight: 700,
            color: T.charcoal,
            marginBottom: 10,
          }}
        >
          {title}
        </div>
        <p
          style={{
            fontFamily: "sans-serif",
            fontSize: 14,
            color: T.ash,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnSecondary}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...btnPrimary,
              background: danger ? T.red : T.emerald,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsModal({
  coupon,
  onClose,
}: {
  coupon: Coupon;
  onClose: () => void;
}) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/${coupon._id}/analytics`)
      .then((r) => setData(r.analytics))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [coupon._id]);

  const dayEntries = data
    ? Object.entries(data.usageByDay)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-14)
    : [];
  const maxVal = dayEntries.length
    ? Math.max(...dayEntries.map(([, v]) => v), 1)
    : 1;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...panelStyle, maxWidth: 580, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={labelStyle}>Analytics</div>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 18,
                fontWeight: 700,
                color: T.charcoal,
              }}
            >
              {coupon.code}
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: T.ash,
              fontFamily: "Cinzel, serif",
              fontSize: 12,
            }}
          >
            Loading…
          </div>
        ) : data ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                { label: "Total Redemptions", value: data.totalRedemptions },
                {
                  label: "Discount Given",
                  value: fmt(data.totalDiscountGiven),
                },
                {
                  label: "Total Order Value",
                  value: fmt(data.totalOrderValue),
                },
                {
                  label: "Avg Discount / Order",
                  value: fmt(data.avgDiscountPerOrder),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: T.ivory,
                    borderRadius: 10,
                    padding: "14px 16px",
                    border: `1px solid ${T.bone}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      color: T.ash,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: T.emerald,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {dayEntries.length > 0 && (
              <div
                style={{
                  background: T.ivory,
                  borderRadius: 10,
                  padding: "14px 16px",
                  border: `1px solid ${T.bone}`,
                }}
              >
                <div
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    color: T.ash,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Usage — Last 14 Days
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 5,
                    height: 60,
                  }}
                >
                  {dayEntries.map(([day, val]) => (
                    <div
                      key={day}
                      title={`${day}: ${val}`}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          background: T.gold,
                          borderRadius: 3,
                          height: `${(val / maxVal) * 52}px`,
                          minHeight: 3,
                          cursor: "default",
                        }}
                      />
                      <div
                        style={{
                          fontSize: 7,
                          color: T.ash,
                          fontFamily: "sans-serif",
                        }}
                      >
                        {day.slice(5)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: T.ash }}>
            No analytics available.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUPON FORM MODAL (create + edit)
// ─────────────────────────────────────────────────────────────────────────────
const emptyForm = {
  code: "",
  name: "",
  description: "",
  discountType: "flat" as DiscountType,
  discountValue: 0,
  maxDiscountAmount: "",
  minOrderAmount: 0,
  minItemCount: 0,
  usageLimitTotal: "",
  usageLimitPerUser: 1,
  startsAt: new Date().toISOString().slice(0, 16),
  expiresAt: "",
  isActive: true,
  isPaused: false,
  isStackable: false,
  tags: "",
  internalNote: "",
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: 9,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: T.ash,
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

function CouponFormModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  initial: typeof emptyForm | null;
  onSave: (data: typeof emptyForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<typeof emptyForm>(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.code.trim()) return setErr("Coupon code is required.");
    if (!form.name.trim()) return setErr("Coupon name is required.");
    if (!form.discountType) return setErr("Discount type is required.");
    if (
      ["flat", "percent"].includes(form.discountType) &&
      Number(form.discountValue) <= 0
    )
      return setErr("Discount value must be greater than 0.");
    if (form.discountType === "percent" && Number(form.discountValue) > 100)
      return setErr("Percent discount cannot exceed 100%.");
    setErr("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1.5px solid ${T.bone}`,
    background: T.ivory,
    fontFamily: "sans-serif",
    fontSize: 13,
    color: T.charcoal,
    outline: "none",
    cursor: "text",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          ...panelStyle,
          maxWidth: 640,
          width: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <div style={labelStyle}>
              {mode === "create" ? "New Coupon" : "Edit Coupon"}
            </div>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 18,
                fontWeight: 700,
                color: T.charcoal,
              }}
            >
              {mode === "create" ? "Create Discount Code" : form.code}
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {err && (
          <div
            style={{
              background: "#fef2f2",
              border: `1px solid #fecaca`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              color: T.red,
              fontFamily: "sans-serif",
              fontSize: 13,
            }}
          >
            {err}
          </div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {/* Row 1 */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Coupon Code *">
              <input
                style={inputStyle}
                value={form.code}
                onChange={(e) =>
                  set(
                    "code",
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                  )
                }
                placeholder="e.g. DIWALI500"
                disabled={mode === "edit"}
              />
            </Field>
            <Field label="Internal Name *">
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Diwali 2026 Flat ₹500"
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description (shown to customer)">
            <input
              style={inputStyle}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Get ₹500 off on orders above ₹2000"
            />
          </Field>

          {/* Discount Type + Value */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="Discount Type *">
              <select
                style={inputStyle}
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value)}
              >
                <option value="flat">Flat (₹ off)</option>
                <option value="percent">Percent (% off)</option>
                <option value="free_shipping">Free Shipping</option>
                <option value="buy_x_get_y">Buy X Get Y</option>
              </select>
            </Field>
            {["flat", "percent"].includes(form.discountType) && (
              <Field
                label={form.discountType === "flat" ? "₹ Amount *" : "% Off *"}
              >
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  max={form.discountType === "percent" ? 100 : undefined}
                  value={form.discountValue || ""}
                  onChange={(e) => set("discountValue", Number(e.target.value))}
                />
              </Field>
            )}
            {form.discountType === "percent" && (
              <Field label="Max Discount (₹ cap)">
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount}
                  onChange={(e) => set("maxDiscountAmount", e.target.value)}
                  placeholder="No cap"
                />
              </Field>
            )}
          </div>

          {/* Cart conditions */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Min Order Amount (₹)">
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount", Number(e.target.value))}
              />
            </Field>
            <Field label="Min Item Count">
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.minItemCount}
                onChange={(e) => set("minItemCount", Number(e.target.value))}
              />
            </Field>
          </div>

          {/* Usage limits */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Total Usage Limit (blank = unlimited)">
              <input
                style={inputStyle}
                type="number"
                min={1}
                value={form.usageLimitTotal}
                onChange={(e) => set("usageLimitTotal", e.target.value)}
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Per Customer Limit">
              <input
                style={inputStyle}
                type="number"
                min={1}
                value={form.usageLimitPerUser}
                onChange={(e) =>
                  set("usageLimitPerUser", Number(e.target.value))
                }
              />
            </Field>
          </div>

          {/* Dates */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Starts At">
              <input
                style={inputStyle}
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </Field>
            <Field label="Expires At (blank = never)">
              <input
                style={inputStyle}
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </Field>
          </div>

          {/* Tags + Note */}
          <Field label="Tags (comma-separated)">
            <input
              style={inputStyle}
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="diwali, influencer, vip"
            />
          </Field>
          <Field label="Internal Note">
            <input
              style={inputStyle}
              value={form.internalNote}
              onChange={(e) => set("internalNote", e.target.value)}
              placeholder="For admin reference only"
            />
          </Field>

          {/* Toggles */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { key: "isActive", label: "Active" },
              { key: "isStackable", label: "Stackable with other coupons" },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                  fontSize: 13,
                  color: T.charcoal,
                }}
              >
                <div
                  onClick={() =>
                    set(key, !(form as Record<string, unknown>)[key])
                  }
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    cursor: "pointer",
                    background: (form as Record<string, unknown>)[key]
                      ? T.emerald
                      : T.bone,
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      background: "#fff",
                      transition: "left 0.2s",
                      left: (form as Record<string, unknown>)[key] ? 19 : 3,
                    }}
                  />
                </div>
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${T.bone}`,
          }}
        >
          <button onClick={onClose} style={btnSecondary}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              ...btnPrimary,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving
              ? "Saving…"
              : mode === "create"
              ? "Create Coupon"
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK GENERATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function BulkGenerateModal({
  onDone,
  onClose,
}: {
  onDone: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    prefix: "RJ",
    count: 10,
    discountType: "flat" as DiscountType,
    discountValue: 500,
    minOrderAmount: 0,
    expiresAt: "",
    tags: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    generated: string[];
    errors: { attempt: string; error: string }[];
  } | null>(null);
  const [err, setErr] = useState("");
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handle = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch("/bulk-generate", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          count: Number(form.count),
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount),
          expiresAt: form.expiresAt || undefined,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      setResult(data);
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1.5px solid ${T.bone}`,
    background: T.ivory,
    fontFamily: "sans-serif",
    fontSize: 13,
    color: T.charcoal,
    outline: "none",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ ...panelStyle, maxWidth: 500, width: "95%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={labelStyle}>Bulk Generate</div>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 18,
                fontWeight: 700,
                color: T.charcoal,
              }}
            >
              Unique Single-Use Codes
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {!result ? (
          <>
            {err && (
              <div
                style={{
                  background: "#fef2f2",
                  border: `1px solid #fecaca`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  color: T.red,
                  fontSize: 13,
                }}
              >
                {err}
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: T.ash,
                    }}
                  >
                    Prefix
                  </label>
                  <input
                    style={inputStyle}
                    value={form.prefix}
                    onChange={(e) =>
                      set("prefix", e.target.value.toUpperCase())
                    }
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: T.ash,
                    }}
                  >
                    Count (max 500)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    max={500}
                    value={form.count}
                    onChange={(e) => set("count", e.target.value)}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: T.ash,
                    }}
                  >
                    Discount Type
                  </label>
                  <select
                    style={inputStyle}
                    value={form.discountType}
                    onChange={(e) => set("discountType", e.target.value)}
                  >
                    <option value="flat">Flat (₹)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: T.ash,
                    }}
                  >
                    Value
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    value={form.discountValue}
                    onChange={(e) => set("discountValue", e.target.value)}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: T.ash,
                    }}
                  >
                    Min Order (₹)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    value={form.minOrderAmount}
                    onChange={(e) => set("minOrderAmount", e.target.value)}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: T.ash,
                    }}
                  >
                    Expires At
                  </label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => set("expiresAt", e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: T.ash,
                  }}
                >
                  Internal Name
                </label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Influencer Drop 2026"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: T.ash,
                  }}
                >
                  Tags (comma-separated)
                </label>
                <input
                  style={inputStyle}
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="influencer, one-time"
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button onClick={onClose} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={handle}
                disabled={loading}
                style={{
                  ...btnPrimary,
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Generating…" : `Generate ${form.count} Codes`}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div
              style={{
                background: "#f0fdf4",
                border: `1px solid #bbf7d0`,
                borderRadius: 8,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 13,
                  color: T.green,
                  fontWeight: 700,
                }}
              >
                ✓ {result.generated.length} Codes Generated
              </div>
            </div>
            <div
              style={{
                background: T.ivory,
                borderRadius: 8,
                padding: 12,
                fontFamily: "monospace",
                fontSize: 11,
                maxHeight: 200,
                overflowY: "auto",
                border: `1px solid ${T.bone}`,
              }}
            >
              {result.generated.join("\n")}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() =>
                  navigator.clipboard.writeText(result.generated.join("\n"))
                }
                style={{ ...btnSecondary, cursor: "pointer" }}
              >
                Copy All Codes
              </button>
              <button
                onClick={onClose}
                style={{ ...btnPrimary, cursor: "pointer" }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9000,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
};
const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: "28px 28px 24px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
  width: "100%",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "Cinzel, serif",
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: T.ash,
  marginBottom: 2,
};
const btnPrimary: React.CSSProperties = {
  background: T.emerald,
  color: "#fff",
  fontFamily: "Cinzel, serif",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  background: "transparent",
  color: T.charcoal,
  fontFamily: "Cinzel, serif",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontWeight: 700,
  padding: "10px 20px",
  borderRadius: 8,
  border: `1.5px solid ${T.bone}`,
  cursor: "pointer",
};
const closeBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: `1.5px solid ${T.bone}`,
  background: T.ivory,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: T.ash,
  flexShrink: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DiscountManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [formModal, setFormModal] = useState<{
    mode: "create" | "edit";
    coupon: Coupon | null;
  } | null>(null);
  const [analyticsModal, setAnalyticsModal] = useState<Coupon | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => void;
    danger?: boolean;
  } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { discountType: typeFilter }),
      });
      const data = await apiFetch(`?${params}`);
      setCoupons(data.coupons || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast("error", "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleCreate = async (form: typeof emptyForm) => {
    await apiFetch("/", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        usageLimitTotal: form.usageLimitTotal
          ? Number(form.usageLimitTotal)
          : null,
        maxDiscountAmount: form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : null,
        expiresAt: form.expiresAt || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    toast("success", "Coupon created successfully.");
    setFormModal(null);
    fetchCoupons();
  };

  const handleEdit = async (form: typeof emptyForm) => {
    const id = formModal?.coupon?._id;
    if (!id) return;
    await apiFetch(`/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        usageLimitTotal: form.usageLimitTotal
          ? Number(form.usageLimitTotal)
          : null,
        maxDiscountAmount: form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : null,
        expiresAt: form.expiresAt || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    toast("success", "Coupon updated.");
    setFormModal(null);
    fetchCoupons();
  };

  const handleToggle = (c: Coupon) => {
    setConfirm({
      title: c.isActive ? "Deactivate Coupon" : "Activate Coupon",
      message: `Are you sure you want to ${
        c.isActive ? "deactivate" : "activate"
      } coupon "${c.code}"?`,
      danger: c.isActive,
      action: async () => {
        try {
          await apiFetch(`/${c._id}/toggle`, { method: "PATCH" });
          toast(
            "success",
            `Coupon ${c.isActive ? "deactivated" : "activated"}.`,
          );
          fetchCoupons();
        } catch {
          toast("error", "Action failed.");
        }
        setConfirm(null);
      },
    });
  };

  const handlePause = (c: Coupon) => {
    setConfirm({
      title: c.isPaused ? "Resume Coupon" : "Pause Coupon",
      message: `This will ${c.isPaused ? "resume" : "pause"} coupon "${
        c.code
      }" without changing its dates.`,
      action: async () => {
        try {
          await apiFetch(`/${c._id}/pause`, { method: "PATCH" });
          toast("success", `Coupon ${c.isPaused ? "resumed" : "paused"}.`);
          fetchCoupons();
        } catch {
          toast("error", "Action failed.");
        }
        setConfirm(null);
      },
    });
  };

  const handleDelete = (c: Coupon) => {
    setConfirm({
      title: "Delete Coupon",
      message:
        c.usageCount > 0
          ? `Coupon "${c.code}" has ${c.usageCount} redemption(s). It will be deactivated instead of deleted to preserve order history.`
          : `Are you sure you want to permanently delete coupon "${c.code}"? This cannot be undone.`,
      danger: true,
      confirmLabel: "Delete",
      action: async () => {
        try {
          await apiFetch(`/${c._id}`, { method: "DELETE" });
          toast(
            "success",
            c.usageCount > 0 ? "Coupon deactivated." : "Coupon deleted.",
          );
          fetchCoupons();
        } catch {
          toast("error", "Delete failed.");
        }
        setConfirm(null);
      },
    } as { title: string; message: string; action: () => void; danger?: boolean });
  };

  const openEdit = (c: Coupon) => {
    const localDt = (iso: string | null) => {
      if (!iso) return "";
      const d = new Date(iso);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    setFormModal({
      mode: "edit",
      coupon: c,
    });
    // pre-fill form via initial prop
    setFormModal({
      mode: "edit",
      coupon: { ...c },
    });
    // We map coupon → form inside the modal via initial prop
    setTimeout(() => {
      setFormModal({
        mode: "edit",
        coupon: c,
      });
    }, 0);
  };

  const couponToForm = (c: Coupon): typeof emptyForm => {
    const localDt = (iso: string | null) => {
      if (!iso) return "";
      const d = new Date(iso);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    return {
      code: c.code,
      name: c.name,
      description: c.description || "",
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountAmount:
        c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : "",
      minOrderAmount: c.minOrderAmount,
      minItemCount: 0,
      usageLimitTotal:
        c.usageLimitTotal != null ? String(c.usageLimitTotal) : "",
      usageLimitPerUser: c.usageLimitPerUser,
      startsAt: localDt(c.startsAt),
      expiresAt: localDt(c.expiresAt),
      isActive: c.isActive,
      isPaused: c.isPaused,
      isStackable: c.isStackable,
      tags: (c.tags || []).join(", "),
      internalNote: c.internalNote || "",
    };
  };

  console.log(coupons);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.ivory,
        fontFamily: "sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${T.ivory}; }
        ::-webkit-scrollbar-thumb { background: ${T.bone}; border-radius: 4px; }
        .coupon-row:hover { background: ${T.ivory} !important; }
        .action-btn:hover { background: ${T.bone} !important; }
        .filter-btn:hover { border-color: ${T.emerald} !important; color: ${T.emerald} !important; }
      `}</style>

      <ToastContainer
        toasts={toasts}
        remove={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />

      {/* Confirm modal */}
      <ConfirmModal
        open={!!confirm}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        danger={confirm?.danger}
        onConfirm={() => confirm?.action()}
        onCancel={() => setConfirm(null)}
      />

      {/* Form modal */}
      {formModal && (
        <CouponFormModal
          mode={formModal.mode}
          initial={formModal.coupon ? couponToForm(formModal.coupon) : null}
          onSave={formModal.mode === "create" ? handleCreate : handleEdit}
          onClose={() => setFormModal(null)}
        />
      )}

      {/* Analytics modal */}
      {analyticsModal && (
        <AnalyticsModal
          coupon={analyticsModal}
          onClose={() => setAnalyticsModal(null)}
        />
      )}

      {/* Bulk generate modal */}
      {bulkModal && (
        <BulkGenerateModal
          onDone={fetchCoupons}
          onClose={() => setBulkModal(false)}
        />
      )}

      {/* Page */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: T.ash,
                marginBottom: 4,
              }}
            >
              ✦ Admin Panel
            </div>
            <h1
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 26,
                fontWeight: 700,
                color: T.charcoal,
                margin: 0,
              }}
            >
              Discount & Coupons
            </h1>
            <p style={{ color: T.ash, fontSize: 13, margin: "4px 0 0" }}>
              {total} coupon{total !== 1 ? "s" : ""} total
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setBulkModal(true)}
              style={{ ...btnSecondary, cursor: "pointer" }}
            >
              ⚡ Bulk Generate
            </button>
            <button
              onClick={() => setFormModal({ mode: "create", coupon: null })}
              style={{ ...btnPrimary, cursor: "pointer" }}
            >
              + Create Coupon
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 16,
            border: `1px solid ${T.bone}`,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search codes, names, tags…"
            style={{
              flex: "1 1 200px",
              padding: "8px 12px",
              borderRadius: 8,
              border: `1.5px solid ${T.bone}`,
              fontSize: 13,
              color: T.charcoal,
              background: T.ivory,
              outline: "none",
              cursor: "text",
            }}
          />
          {[
            { label: "All Status", value: "" },
            { label: "Active", value: "active" },
            { label: "Paused", value: "paused" },
            { label: "Expired", value: "expired" },
            { label: "Inactive", value: "inactive" },
          ].map((f) => (
            <button
              key={f.value}
              className="filter-btn"
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1.5px solid ${
                  statusFilter === f.value ? T.emerald : T.bone
                }`,
                fontFamily: "Cinzel, serif",
                fontSize: 10,
                letterSpacing: "0.08em",
                color: statusFilter === f.value ? T.emerald : T.ash,
                background:
                  statusFilter === f.value
                    ? "rgba(0,55,32,0.06)"
                    : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1.5px solid ${T.bone}`,
              fontSize: 13,
              color: T.ash,
              background: T.ivory,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Types</option>
            <option value="flat">Flat</option>
            <option value="percent">Percent</option>
            <option value="free_shipping">Free Shipping</option>
            <option value="buy_x_get_y">Buy X Get Y</option>
          </select>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: `1px solid ${T.bone}`,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr 110px 120px 100px 110px 130px",
              gap: 0,
              padding: "10px 20px",
              borderBottom: `1px solid ${T.bone}`,
              background: T.ivory,
            }}
          >
            {[
              "Code",
              "Name / Tags",
              "Discount",
              "Min Order",
              "Usage",
              "Status",
              "Actions",
            ].map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.ash,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {loading ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                fontFamily: "Cinzel, serif",
                fontSize: 12,
                color: T.ash,
                letterSpacing: "0.1em",
              }}
            >
              Loading coupons…
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏷️</div>
              <div
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 13,
                  color: T.ash,
                }}
              >
                No coupons found
              </div>
              <button
                onClick={() => setFormModal({ mode: "create", coupon: null })}
                style={{ ...btnPrimary, marginTop: 16, cursor: "pointer" }}
              >
                Create Your First Coupon
              </button>
            </div>
          ) : (
            coupons.map((c, i) => {
              const badge = statusBadge(c);
              return (
                <div
                  key={c._id}
                  className="coupon-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "160px 1fr 110px 120px 100px 110px 130px",
                    gap: 0,
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom:
                      i < coupons.length - 1 ? `1px solid ${T.bone}` : "none",
                    background: "#fff",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Code */}
                  <div>
                    <div
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: T.charcoal,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {c.code}
                    </div>
                    <div style={{ fontSize: 10, color: T.ash, marginTop: 2 }}>
                      {fmtDate(c.startsAt)} →{" "}
                      {c.expiresAt ? fmtDate(c.expiresAt) : "∞"}
                    </div>
                  </div>

                  {/* Name + tags */}
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: T.charcoal,
                        fontWeight: 500,
                        marginBottom: 3,
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(c.tags || []).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: T.ivory,
                            border: `1px solid ${T.bone}`,
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontSize: 9,
                            fontFamily: "Cinzel, serif",
                            letterSpacing: "0.06em",
                            color: T.ash,
                            textTransform: "uppercase",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Discount */}
                  <div
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: T.emerald,
                    }}
                  >
                    {discountLabel(c)}
                  </div>

                  {/* Min order */}
                  <div style={{ fontSize: 13, color: T.charcoal }}>
                    {c.minOrderAmount > 0 ? fmt(c.minOrderAmount) : "No min"}
                  </div>

                  {/* Usage */}
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: T.charcoal,
                        fontWeight: 600,
                      }}
                    >
                      {c.usageCount}
                      {c.usageLimitTotal !== null
                        ? ` / ${c.usageLimitTotal}`
                        : ""}
                    </div>
                    {c.usageLimitTotal !== null && (
                      <div
                        style={{
                          height: 3,
                          borderRadius: 2,
                          background: T.bone,
                          marginTop: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: T.gold,
                            width: `${Math.min(
                              100,
                              (c.usageCount / c.usageLimitTotal) * 100,
                            )}%`,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        fontFamily: "Cinzel, serif",
                        fontSize: 9,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      {
                        icon: "📊",
                        title: "Analytics",
                        action: () => setAnalyticsModal(c),
                      },
                      { icon: "✏️", title: "Edit", action: () => openEdit(c) },
                      {
                        icon: c.isPaused ? "▶" : "⏸",
                        title: c.isPaused ? "Resume" : "Pause",
                        action: () => handlePause(c),
                      },
                      {
                        icon: c.isActive ? "🔴" : "🟢",
                        title: c.isActive ? "Deactivate" : "Activate",
                        action: () => handleToggle(c),
                      },
                      {
                        icon: "🗑",
                        title: "Delete",
                        action: () => handleDelete(c),
                      },
                    ].map(({ icon, title, action }) => (
                      <button
                        key={title}
                        className="action-btn"
                        title={title}
                        onClick={action}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: `1px solid ${T.bone}`,
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background 0.15s",
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                ...btnSecondary,
                padding: "7px 14px",
                opacity: page === 1 ? 0.4 : 1,
                cursor: page === 1 ? "default" : "pointer",
              }}
            >
              ‹ Prev
            </button>
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 11,
                color: T.ash,
              }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                ...btnSecondary,
                padding: "7px 14px",
                opacity: page === totalPages ? 0.4 : 1,
                cursor: page === totalPages ? "default" : "pointer",
              }}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
