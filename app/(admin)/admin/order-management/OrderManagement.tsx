"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "return_in_transit"
  | "returned"
  | "refunded"
  | "failed";

type PaymentMethod =
  | "cod"
  | "razorpay"
  | "stripe"
  | "payu"
  | "upi"
  | "bank_transfer"
  | "other";

type PaymentStatus =
  | "pending"
  | "initiated"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

interface OrderItem {
  _id: string;
  name: string;
  image: string;
  sku: string;
  purity: string;
  metal: string;
  category: string;
  sizeSelected: string;
  unitPrice: number;
  originalPrice: number | null;
  quantity: number;
  lineTotal: number;
  customNote: string;
}

interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;
}

interface Payment {
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  amountPaid: number;
  currency: string;
  paidAt?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
}

interface Shipping {
  method: string;
  charge: number;
  isFree: boolean;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  awbCode?: string;
  courierName?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface StatusEntry {
  status: string;
  note: string;
  changedBy: string;
  changedAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  pricing: {
    subtotal: number;
    shippingCharge: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    currency: string;
  };
  payment: Payment;
  shipping: Shipping;
  status: OrderStatus;
  statusHistory: StatusEntry[];
  adminNote?: string;
  internalTags?: string[];
  isPriority?: boolean;
  customerNote?: string;
  giftMessage?: string;
  isGift?: boolean;
  cancellationReason?: string;
  returnReason?: string;
  source: string;
  placedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Stats {
  totalOrders: number;
  byStatus: Record<string, number>;
  revenue: { total: number; paidOrders: number };
  period: {
    label: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
  };
}

type Modal =
  | { type: "none" }
  | { type: "view"; order: Order }
  | { type: "status"; order: Order }
  | { type: "shipping"; order: Order }
  | { type: "payment"; order: Order }
  | { type: "note"; order: Order }
  | { type: "confirm-delete"; id: string; orderNumber: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

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
function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready_to_ship",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "return_in_transit",
  "returned",
  "refunded",
  "failed",
];

const STATUS_CFG: Record<
  OrderStatus,
  { label: string; bg: string; color: string; dot: string; border: string }
> = {
  pending: {
    label: "Pending",
    bg: "#FFF8E6",
    color: "#a06800",
    dot: "#f0a500",
    border: "#f0a50030",
  },
  confirmed: {
    label: "Confirmed",
    bg: "#EBF5FF",
    color: "#1a6fbf",
    dot: "#3b9eff",
    border: "#3b9eff30",
  },
  processing: {
    label: "Processing",
    bg: "#F0F4FF",
    color: "#3730a3",
    dot: "#6366f1",
    border: "#6366f130",
  },
  ready_to_ship: {
    label: "Ready to Ship",
    bg: "#FDF4FF",
    color: "#7e22ce",
    dot: "#a855f7",
    border: "#a855f730",
  },
  shipped: {
    label: "Shipped",
    bg: "#F0FFF4",
    color: "#166534",
    dot: "#22c55e",
    border: "#22c55e30",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    bg: "#ECFDF5",
    color: "#065f46",
    dot: "#10b981",
    border: "#10b98130",
  },
  delivered: {
    label: "Delivered",
    bg: "#EDFAF3",
    color: "#1a7a4a",
    dot: "#2ecc71",
    border: "#2ecc7130",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#FFF0F0",
    color: "#c0392b",
    dot: "#e74c3c",
    border: "#e74c3c30",
  },
  return_requested: {
    label: "Return Requested",
    bg: "#FFF7ED",
    color: "#c2410c",
    dot: "#f97316",
    border: "#f9731630",
  },
  return_in_transit: {
    label: "Return in Transit",
    bg: "#FFF7ED",
    color: "#9a3412",
    dot: "#ea580c",
    border: "#ea580c30",
  },
  returned: {
    label: "Returned",
    bg: "#F5F5F5",
    color: "#555",
    dot: "#aaa",
    border: "#aaa30",
  },
  refunded: {
    label: "Refunded",
    bg: "#F5F5F5",
    color: "#166534",
    dot: "#22c55e",
    border: "#22c55e30",
  },
  failed: {
    label: "Failed",
    bg: "#FFF0F0",
    color: "#7f1d1d",
    dot: "#dc2626",
    border: "#dc262630",
  },
};

const PAY_STATUS_CFG: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FFF8E6", color: "#a06800" },
  initiated: { bg: "#EBF5FF", color: "#1a6fbf" },
  paid: { bg: "#EDFAF3", color: "#1a7a4a" },
  failed: { bg: "#FFF0F0", color: "#c0392b" },
  refunded: { bg: "#F5F5F5", color: "#555" },
  partially_refunded: { bg: "#FFF8E6", color: "#a06800" },
};

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
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
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}

function PayBadge({ status }: { status: string }) {
  const c = PAY_STATUS_CFG[status] || { bg: "#F5F5F5", color: "#555" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 9px",
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 700,
        background: c.bg,
        color: c.color,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: "3px solid #E5E0D4",
        borderTop: "3px solid #D4A017",
        animation: "omSpin 0.8s linear infinite",
      }}
    />
  );
}

// ─── Feedback / Confirm modals ────────────────────────────────────────────────

function FeedbackModal({
  modal,
  onConfirm,
  onClose,
}: {
  modal: Modal;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!["confirm-delete", "success", "error"].includes(modal.type)) return null;

  const isSuccess = modal.type === "success";
  const isError = modal.type === "error";
  const isConfirm = modal.type === "confirm-delete";

  const accent = isSuccess ? "#2ecc71" : isError ? "#e74c3c" : "#e74c3c";
  const iconBg = isSuccess ? "#EDFAF3" : "#FFF0F0";
  const iconColor = isSuccess ? "#1a7a4a" : "#c0392b";
  const icon = isSuccess ? "✓" : isError ? "⚠" : "🗑";
  const title = isSuccess
    ? "Done!"
    : isError
    ? "Something went wrong"
    : modal.type === "confirm-delete"
    ? `Delete order ${modal.orderNumber}?`
    : "";
  const body = isSuccess
    ? modal.message
    : isError
    ? modal.message
    : "This will permanently delete the order. This cannot be undone.";

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
        zIndex: 1400,
        background: "rgba(10,8,5,0.58)",
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
          animation: "omFadeUp 0.22s ease",
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

// ─── Status Update Modal ──────────────────────────────────────────────────────

function StatusModal({
  order,
  onClose,
  onSuccess,
  onError,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/orders/admin/${order._id}/status`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ status, note, changedBy: "admin" }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess(
        `Order ${order.orderNumber} status updated to "${STATUS_CFG[status]?.label}".`,
      );
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
          maxWidth: 460,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(0,0,0,0.22)",
          animation: "omFadeUp 0.22s ease",
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
              Update Status
            </p>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "3px 0 0",
              }}
            >
              {order.orderNumber}
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
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <label style={lblStyle}>New Status</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {ALL_STATUSES.map((s) => {
              const c = STATUS_CFG[s];
              const sel = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1.5px solid ${sel ? c.dot : "#E5E0D4"}`,
                    background: sel ? c.bg : "#fff",
                    color: sel ? c.color : "#666",
                    fontSize: 11,
                    fontWeight: sel ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
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
          <label style={lblStyle}>Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an internal note about this status change…"
            rows={3}
            style={textareaStyle}
          />
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

// ─── Shipping Modal ───────────────────────────────────────────────────────────

function ShippingModal({
  order,
  onClose,
  onSuccess,
  onError,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [form, setForm] = useState({
    carrier: order.shipping?.carrier || "",
    trackingNumber: order.shipping?.trackingNumber || "",
    trackingUrl: order.shipping?.trackingUrl || "",
    awbCode: order.shipping?.awbCode || "",
    courierName: order.shipping?.courierName || "",
    estimatedDeliveryDate: "",
    method: order.shipping?.method || "standard",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v) payload[k] = v;
      });
      const res = await fetch(
        `${API_BASE}/api/orders/admin/${order._id}/shipping`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess(`Shipping info updated for ${order.orderNumber}.`);
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
          maxWidth: 500,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(0,0,0,0.22)",
          animation: "omFadeUp 0.22s ease",
        }}
      >
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#166534,#22c55e)",
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
              Shipping Details
            </p>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "3px 0 0",
              }}
            >
              {order.orderNumber}
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
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            padding: "20px 24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          {[
            {
              key: "carrier",
              label: "Carrier",
              placeholder: "Shiprocket, Delhivery…",
            },
            {
              key: "courierName",
              label: "Courier Name",
              placeholder: "BlueDart, DTDC…",
            },
            {
              key: "trackingNumber",
              label: "Tracking Number",
              placeholder: "AWB123456",
            },
            { key: "awbCode", label: "AWB Code", placeholder: "AWB code" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={lblStyle}>{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setF(key, e.target.value)}
                placeholder={placeholder}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
              />
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lblStyle}>Tracking URL</label>
            <input
              value={form.trackingUrl}
              onChange={(e) => setF("trackingUrl", e.target.value)}
              placeholder="https://track.shiprocket.in/…"
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }}
              onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
            />
          </div>
          <div>
            <label style={lblStyle}>Estimated Delivery</label>
            <input
              type="date"
              value={form.estimatedDeliveryDate}
              onChange={(e) => setF("estimatedDeliveryDate", e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
            />
          </div>
          <div>
            <label style={lblStyle}>Shipping Method</label>
            <select
              value={form.method}
              onChange={(e) => setF("method", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {[
                "standard",
                "express",
                "same_day",
                "store_pickup",
                "custom",
              ].map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
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
              ...btnGreen,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Saving…" : "Save Shipping"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({
  order,
  onClose,
  onSuccess,
  onError,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [form, setForm] = useState({
    status: order.payment.status,
    gatewayOrderId: order.payment.gatewayOrderId || "",
    gatewayPaymentId: order.payment.gatewayPaymentId || "",
    amountPaid: String(order.payment.amountPaid || ""),
    refundId: order.payment.refundId || "",
    refundAmount: String(order.payment.refundAmount || ""),
    refundReason: order.payment.refundReason || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: Record<string, string | number> = { status: form.status };
      if (form.gatewayOrderId) payload.gatewayOrderId = form.gatewayOrderId;
      if (form.gatewayPaymentId)
        payload.gatewayPaymentId = form.gatewayPaymentId;
      if (form.amountPaid) payload.amountPaid = Number(form.amountPaid);
      if (form.refundId) payload.refundId = form.refundId;
      if (form.refundAmount) payload.refundAmount = Number(form.refundAmount);
      if (form.refundReason) payload.refundReason = form.refundReason;
      const res = await fetch(
        `${API_BASE}/api/orders/admin/${order._id}/payment`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess(`Payment details updated for ${order.orderNumber}.`);
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
          maxWidth: 500,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(0,0,0,0.22)",
          animation: "omFadeUp 0.22s ease",
        }}
      >
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#1a6fbf,#3b9eff)",
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
              Payment Details
            </p>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "3px 0 0",
              }}
            >
              {order.orderNumber}
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
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            padding: "20px 24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lblStyle}>Payment Status</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                [
                  "pending",
                  "initiated",
                  "paid",
                  "failed",
                  "refunded",
                  "partially_refunded",
                ] as PaymentStatus[]
              ).map((s) => {
                const c = PAY_STATUS_CFG[s] || { bg: "#F5F5F5", color: "#555" };
                const sel = form.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setF("status", s)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${sel ? "#D4A017" : "#E5E0D4"}`,
                      background: sel ? c.bg : "#fff",
                      color: sel ? c.color : "#888",
                      fontSize: 11,
                      fontWeight: sel ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          {[
            {
              key: "gatewayOrderId",
              label: "Gateway Order ID",
              placeholder: "order_xxx",
            },
            {
              key: "gatewayPaymentId",
              label: "Gateway Payment ID",
              placeholder: "pay_xxx",
            },
            { key: "amountPaid", label: "Amount Paid (₹)", placeholder: "0" },
            { key: "refundId", label: "Refund ID", placeholder: "rfnd_xxx" },
            {
              key: "refundAmount",
              label: "Refund Amount (₹)",
              placeholder: "0",
            },
            {
              key: "refundReason",
              label: "Refund Reason",
              placeholder: "Customer cancelled…",
            },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={lblStyle}>{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setF(key, e.target.value)}
                placeholder={placeholder}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
              />
            </div>
          ))}
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
              ...btnBlue,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Saving…" : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────

function NoteModal({
  order,
  onClose,
  onSuccess,
  onError,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [adminNote, setAdminNote] = useState(order.adminNote || "");
  const [internalTags, setInternalTags] = useState(
    order.internalTags?.join(", ") || "",
  );
  const [isPriority, setIsPriority] = useState(order.isPriority || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/admin/${order._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          adminNote,
          internalTags: internalTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          isPriority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess("Admin note and tags updated.");
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
          animation: "omFadeUp 0.22s ease",
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
              Admin Note & Tags
            </p>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "3px 0 0",
              }}
            >
              {order.orderNumber}
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
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div>
            <label style={lblStyle}>Admin Note</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={4}
              placeholder="Internal note…"
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={lblStyle}>
              Internal Tags{" "}
              <span
                style={{
                  fontWeight: 400,
                  color: "#aaa",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (comma-separated)
              </span>
            </label>
            <input
              value={internalTags}
              onChange={(e) => setInternalTags(e.target.value)}
              placeholder="vip, fragile, gift"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
            />
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isPriority}
              onChange={(e) => setIsPriority(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: "#D4A017",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 13, color: "#444", fontWeight: 500 }}>
              Mark as Priority Order ⚡
            </span>
          </label>
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
            {loading ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
  onStatusClick,
  onShippingClick,
  onPaymentClick,
  onNoteClick,
  onDeleteClick,
}: {
  order: Order;
  onClose: () => void;
  onStatusClick: () => void;
  onShippingClick: () => void;
  onPaymentClick: () => void;
  onNoteClick: () => void;
  onDeleteClick: () => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const s = STATUS_CFG[order.status] || STATUS_CFG.pending;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(10,8,5,0.62)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 860,
          background: "#fff",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          animation: "omFadeUp 0.25s ease",
          margin: "auto",
        }}
      >
        {/* Color accent bar */}
        <div
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${s.dot}, ${s.color})`,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #F0EBE0",
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
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#B8AFA0",
                margin: 0,
              }}
            >
              Order Detail
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 4,
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                {order.orderNumber}
              </h2>
              <StatusBadge status={order.status} />
              {order.isPriority && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#FFF8E6",
                    color: "#a06800",
                    border: "1px solid #f0a50030",
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  ⚡ Priority
                </span>
              )}
              {order.isGift && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#FDF4FF",
                    color: "#7e22ce",
                    border: "1px solid #a855f730",
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  🎁 Gift
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#999", margin: "4px 0 0" }}>
              Placed {fmtFull(order.placedAt)} · via {order.source}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {[
              {
                label: "Status",
                fn: onStatusClick,
                bg: "#FFF8E6",
                color: "#a06800",
              },
              {
                label: "Shipping",
                fn: onShippingClick,
                bg: "#F0FFF4",
                color: "#166534",
              },
              {
                label: "Payment",
                fn: onPaymentClick,
                bg: "#EBF5FF",
                color: "#1a6fbf",
              },
              {
                label: "Note",
                fn: onNoteClick,
                bg: "#FDFAF4",
                color: "#7a6040",
              },
            ].map(({ label, fn, bg, color }) => (
              <button
                key={label}
                onClick={fn}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: bg,
                  color,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
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
                marginLeft: 4,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            maxHeight: "76vh",
            overflowY: "auto",
          }}
        >
          {/* Left column */}
          <div
            style={{
              padding: "20px 20px 20px 24px",
              borderRight: "1px solid #F0EBE0",
            }}
          >
            {/* Customer */}
            <SectionHead>Customer</SectionHead>
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Email" value={order.customerEmail} mono />
            <InfoRow label="Phone" value={order.customerPhone} />

            {/* Shipping address */}
            <SectionHead>Shipping Address</SectionHead>
            <div style={{ fontSize: 13, color: "#444", lineHeight: 1.7 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {order.shippingAddress?.fullName}
              </p>
              <p style={{ margin: 0 }}>{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && (
                <p style={{ margin: 0 }}>
                  {order.shippingAddress.addressLine2}
                </p>
              )}
              {order.shippingAddress?.landmark && (
                <p style={{ margin: 0, color: "#888", fontSize: 12 }}>
                  Near: {order.shippingAddress.landmark}
                </p>
              )}
              <p style={{ margin: 0 }}>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} —{" "}
                {order.shippingAddress?.pincode}
              </p>
              <p style={{ margin: "2px 0 0", color: "#888", fontSize: 12 }}>
                📞 {order.shippingAddress?.phone}
              </p>
            </div>

            {/* Shipping info */}
            <SectionHead>Shipping Info</SectionHead>
            <InfoRow label="Carrier" value={order.shipping?.carrier || "—"} />
            <InfoRow
              label="Tracking"
              value={order.shipping?.trackingNumber || "—"}
              mono
            />
            {order.shipping?.trackingUrl && (
              <div style={{ marginBottom: 8 }}>
                <p style={infoLabelStyle}>Tracking URL</p>
                <a
                  href={order.shipping.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: "#1a6fbf",
                    fontFamily: "monospace",
                  }}
                >
                  Open ↗
                </a>
              </div>
            )}
            <InfoRow label="AWB" value={order.shipping?.awbCode || "—"} mono />
            <InfoRow label="Method" value={order.shipping?.method || "—"} />
            {order.shipping?.estimatedDeliveryDate && (
              <InfoRow
                label="ETA"
                value={fmt(order.shipping.estimatedDeliveryDate)}
              />
            )}
            {order.shipping?.shippedAt && (
              <InfoRow
                label="Shipped At"
                value={fmtFull(order.shipping.shippedAt)}
              />
            )}
            {order.shipping?.deliveredAt && (
              <InfoRow
                label="Delivered At"
                value={fmtFull(order.shipping.deliveredAt)}
              />
            )}

            {/* Notes */}
            {order.customerNote && (
              <>
                <SectionHead>Customer Note</SectionHead>
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.6,
                    margin: "0 0 16px",
                    fontStyle: "italic",
                  }}
                >
                  "{order.customerNote}"
                </p>
              </>
            )}
            {order.giftMessage && (
              <>
                <SectionHead>Gift Message</SectionHead>
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.6,
                    margin: "0 0 16px",
                    fontStyle: "italic",
                  }}
                >
                  "{order.giftMessage}"
                </p>
              </>
            )}
            {order.adminNote && (
              <div
                style={{
                  padding: "12px 14px",
                  background: "#FFF8E6",
                  border: "1px solid #f0a50030",
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#8B7355",
                    margin: "0 0 4px",
                    letterSpacing: "0.07em",
                  }}
                >
                  Admin Note
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {order.adminNote}
                </p>
              </div>
            )}
            {order.internalTags && order.internalTags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                {order.internalTags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      background: "#F0EBE0",
                      color: "#7a6040",
                      padding: "2px 9px",
                      borderRadius: 10,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ padding: "20px 24px 20px 20px" }}>
            {/* Order items */}
            <SectionHead>Items ({order.items?.length})</SectionHead>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {order.items?.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 12px",
                    background: "#FDFAF4",
                    border: "1px solid #EEE9DD",
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#F5F2EA",
                      border: "1px solid #E5E0D4",
                      flexShrink: 0,
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      /> // eslint-disable-line @next/next/no-img-element
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                        }}
                      >
                        🪙
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1a1a1a",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}
                    >
                      {item.purity}
                      {item.sizeSelected ? ` · ${item.sizeSelected}` : ""}
                      {item.customNote ? ` · ${item.customNote}` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1a1a1a",
                        margin: 0,
                      }}
                    >
                      {inr(item.lineTotal)}
                    </p>
                    <p
                      style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}
                    >
                      {inr(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <SectionHead>Pricing</SectionHead>
            <div
              style={{
                background: "#FDFAF4",
                border: "1px solid #EEE9DD",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {[
                { label: "Subtotal", value: inr(order.pricing.subtotal) },
                {
                  label: "Shipping",
                  value:
                    order.pricing.shippingCharge === 0
                      ? "Free"
                      : inr(order.pricing.shippingCharge),
                },
                ...(order.pricing.discountAmount
                  ? [
                      {
                        label: "Discount",
                        value: `-${inr(order.pricing.discountAmount)}`,
                      },
                    ]
                  : []),
                ...(order.pricing.taxAmount
                  ? [{ label: "Tax/GST", value: inr(order.pricing.taxAmount) }]
                  : []),
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    borderBottom: "1px solid #EEE9DD",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#555" }}>{value}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#003720",
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#FCC131" }}
                >
                  Total
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 800, color: "#FCC131" }}
                >
                  {inr(order.pricing.total)}
                </span>
              </div>
            </div>

            {/* Payment */}
            <SectionHead>Payment</SectionHead>
            <div
              style={{
                padding: "12px 14px",
                background: "#F9F9F9",
                border: "1px solid #EEE9DD",
                borderRadius: 10,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 16px",
                marginBottom: 20,
              }}
            >
              <InfoRow
                label="Method"
                value={order.payment.method.toUpperCase()}
                compact
              />
              <div>
                <p style={infoLabelStyle}>Status</p>
                <PayBadge status={order.payment.status} />
              </div>
              <InfoRow
                label="Amount Paid"
                value={
                  order.payment.amountPaid ? inr(order.payment.amountPaid) : "—"
                }
                compact
              />
              {order.payment.paidAt && (
                <InfoRow
                  label="Paid At"
                  value={fmtFull(order.payment.paidAt)}
                  compact
                />
              )}
              {order.payment.gatewayPaymentId && (
                <InfoRow
                  label="Gateway ID"
                  value={order.payment.gatewayPaymentId}
                  mono
                  compact
                />
              )}
              {order.payment.refundId && (
                <InfoRow
                  label="Refund ID"
                  value={order.payment.refundId}
                  mono
                  compact
                />
              )}
            </div>

            {/* Status timeline */}
            <SectionHead>
              Status Timeline ({order.statusHistory?.length})
            </SectionHead>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 9,
                  top: 12,
                  bottom: 12,
                  width: 2,
                  background: "#EEE9DD",
                  borderRadius: 2,
                }}
              />
              {order.statusHistory
                ?.slice()
                .reverse()
                .map((entry, i) => {
                  const sc = STATUS_CFG[entry.status as OrderStatus] || {
                    dot: "#ccc",
                    color: "#888",
                    label: entry.status,
                  };
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 14,
                        marginBottom: 14,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: sc.dot,
                          flexShrink: 0,
                          border: "2px solid #fff",
                          boxShadow: `0 0 0 2px ${sc.dot}40`,
                          zIndex: 1,
                          marginTop: 1,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: sc.color,
                            margin: 0,
                          }}
                        >
                          {sc.label}
                        </p>
                        {entry.note && (
                          <p
                            style={{
                              fontSize: 11,
                              color: "#888",
                              margin: "2px 0 0",
                            }}
                          >
                            {entry.note}
                          </p>
                        )}
                        <p
                          style={{
                            fontSize: 10,
                            color: "#bbb",
                            margin: "2px 0 0",
                          }}
                        >
                          {fmtFull(entry.changedAt)} · by {entry.changedBy}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Delete */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #F0EBE0",
              }}
            >
              <button
                onClick={onDeleteClick}
                style={{
                  fontSize: 12,
                  color: "#c0392b",
                  background: "#FFF5F5",
                  border: "1px solid #FFCDD2",
                  padding: "7px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                🗑 Delete Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small section helpers ────────────────────────────────────────────────────

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#8B7355",
        margin: "0 0 10px",
        paddingBottom: 6,
        borderBottom: "1px solid #F0EBE0",
        marginTop: 18,
      }}
    >
      {children}
    </p>
  );
}

function InfoRow({
  label,
  value,
  mono,
  compact,
}: {
  label: string;
  value: string;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div style={{ marginBottom: compact ? 6 : 10 }}>
      <p style={infoLabelStyle}>{label}</p>
      <p
        style={{
          fontSize: mono ? 11 : 13,
          color: "#333",
          margin: 0,
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-all",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  stats,
  period,
  onPeriodChange,
}: {
  stats: Stats | null;
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {[
        {
          label: "Total Orders",
          value: stats?.totalOrders?.toLocaleString() || "—",
          sub: `${period} period`,
          icon: "📦",
        },
        {
          label: `Revenue (${period})`,
          value: stats ? inr(stats.period.revenue) : "—",
          sub: `${stats?.period.orders || 0} orders`,
          icon: "💰",
        },
        {
          label: "Avg Order Value",
          value: stats ? inr(stats.period.avgOrderValue) : "—",
          sub: "this period",
          icon: "📊",
        },
        {
          label: "Delivered",
          value: stats?.byStatus?.delivered?.toString() || "0",
          sub: "all time",
          icon: "✅",
        },
      ].map(({ label, value, sub, icon }) => (
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
              alignItems: "flex-start",
              justifyContent: "space-between",
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
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1a1a1a",
                  margin: "6px 0 2px",
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>{sub}</p>
            </div>
            <span style={{ fontSize: 20 }}>{icon}</span>
          </div>
        </div>
      ))}
      {/* Period selector row */}
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6 }}>
        {[
          ["7d", "7 days"],
          ["30d", "30 days"],
          ["90d", "90 days"],
        ].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => onPeriodChange(val)}
            style={{
              padding: "5px 14px",
              borderRadius: 8,
              border: `1.5px solid ${period === val ? "#D4A017" : "#E5E0D4"}`,
              background: period === val ? "#FFF8E6" : "#fff",
              color: period === val ? "#a06800" : "#888",
              fontSize: 11,
              fontWeight: period === val ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {lbl}
          </button>
        ))}
        {/* Status mini badges */}
        {stats && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginLeft: "auto",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {(
              [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ] as OrderStatus[]
            ).map((s) => {
              const c = STATUS_CFG[s];
              const count = stats.byStatus[s] || 0;
              if (!count) return null;
              return (
                <span
                  key={s}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: c.bg,
                    color: c.color,
                    padding: "3px 9px",
                    borderRadius: 10,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  {c.label}: {count}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Modal>({ type: "none" });

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState("30d");

  // ── Fetch orders ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterPaymentStatus) params.set("paymentStatus", filterPaymentStatus);
      if (filterPaymentMethod) params.set("paymentMethod", filterPaymentMethod);
      if (filterSource) params.set("source", filterSource);
      if (filterPriority) params.set("isPriority", filterPriority);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", String(page));
      params.set("limit", "15");
      const res = await fetch(`${API_BASE}/api/orders/admin/all?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setOrders(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    filterStatus,
    filterPaymentStatus,
    filterPaymentMethod,
    filterSource,
    filterPriority,
    startDate,
    endDate,
    page,
  ]);

  console.log(orders);

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/orders/admin/stats?period=${period}`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      /* non-fatal */
    } finally {
      setStatsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Open detail (fetches full order with status history) ──────────────────
  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/admin/${id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setModal({ type: "view", order: data.data });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const executeDelete = async () => {
    if (modal.type !== "confirm-delete") return;
    const { id } = modal;
    setModal({ type: "none" });
    try {
      const res = await fetch(`${API_BASE}/api/orders/admin/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders((prev) => prev.filter((o) => o._id !== id));
      setModal({ type: "success", message: "Order deleted successfully." });
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    }
  };

  const handleModalConfirm = () => {
    if (modal.type === "confirm-delete") executeDelete();
  };

  // Convenience: get order from view modal
  const viewOrder = modal.type === "view" ? modal.order : null;

  return (
    <>
      <style>{`
        @keyframes omFadeUp { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes omSpin { to{transform:rotate(360deg)} }
        .om-row:hover { background:#FDFAF3 !important; }
        .om-filter:focus { border-color:#D4A017 !important; outline:none; }
      `}</style>

      {/* ── Modals ── */}
      <FeedbackModal
        key="feedback-modal"
        modal={modal}
        onConfirm={handleModalConfirm}
        onClose={() => setModal({ type: "none" })}
      />

      {modal.type === "view" && viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setModal({ type: "none" })}
          onStatusClick={() => setModal({ type: "status", order: viewOrder })}
          onShippingClick={() =>
            setModal({ type: "shipping", order: viewOrder })
          }
          onPaymentClick={() => setModal({ type: "payment", order: viewOrder })}
          onNoteClick={() => setModal({ type: "note", order: viewOrder })}
          onDeleteClick={() =>
            setModal({
              type: "confirm-delete",
              id: viewOrder._id,
              orderNumber: viewOrder.orderNumber,
            })
          }
        />
      )}

      {modal.type === "status" && (
        <StatusModal
          order={modal.order}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => {
            setModal({ type: "success", message: m });
            fetchOrders();
          }}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}
      {modal.type === "shipping" && (
        <ShippingModal
          order={modal.order}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => {
            setModal({ type: "success", message: m });
            fetchOrders();
          }}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}
      {modal.type === "payment" && (
        <PaymentModal
          order={modal.order}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => {
            setModal({ type: "success", message: m });
            fetchOrders();
          }}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}
      {modal.type === "note" && (
        <NoteModal
          order={modal.order}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => {
            setModal({ type: "success", message: m });
            fetchOrders();
          }}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}

      {/* ── Page ── */}
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
              Order Management
            </h2>
            <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
              {pagination
                ? `${pagination.total.toLocaleString()} total orders`
                : "Manage all customer orders"}
            </p>
          </div>
          <button
            onClick={fetchOrders}
            style={{
              ...btnOutline,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stats bar */}
        {statsLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "20px 0",
            }}
          >
            <Spinner />
          </div>
        ) : (
          <StatsBar
            stats={stats}
            period={period}
            onPeriodChange={(p) => {
              setPeriod(p);
            }}
          />
        )}

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
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              placeholder="Order #, name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-3 h-10 w-64 text-sm border border-gray-200 rounded-xl bg-white shadow-sm 
      focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
            />
          </div>

          {/* Reusable Select Style */}
          {[
            {
              value: filterStatus,
              onChange: (e: any) => {
                setFilterStatus(e.target.value);
                setPage(1);
              },
              options: ["", ...ALL_STATUSES],
              label: "All statuses",
              format: (s: string) =>
                s ? STATUS_CFG[s as OrderStatus].label : "All statuses",
            },
            {
              value: filterPaymentStatus,
              onChange: (e: any) => {
                setFilterPaymentStatus(e.target.value);
                setPage(1);
              },
              options: [
                "",
                "pending",
                "initiated",
                "paid",
                "failed",
                "refunded",
                "partially_refunded",
              ],
              label: "All payments",
              format: (s: string) => (s ? s : "All payments"),
            },
            {
              value: filterPaymentMethod,
              onChange: (e: any) => {
                setFilterPaymentMethod(e.target.value);
                setPage(1);
              },
              options: [
                "",
                "cod",
                "razorpay",
                "stripe",
                "payu",
                "upi",
                "bank_transfer",
                "other",
              ],
              label: "All methods",
              format: (m: string) => (m ? m.toUpperCase() : "All methods"),
            },
            {
              value: filterSource,
              onChange: (e: any) => {
                setFilterSource(e.target.value);
                setPage(1);
              },
              options: [
                "",
                "website",
                "instagram",
                "whatsapp",
                "admin",
                "app",
                "other",
              ],
              label: "All sources",
              format: (s: string) => s || "All sources",
            },
            {
              value: filterPriority,
              onChange: (e: any) => {
                setFilterPriority(e.target.value);
                setPage(1);
              },
              options: ["", "true", "false"],
              label: "Priority",
              format: (v: string) =>
                v === "true"
                  ? "⚡ Priority"
                  : v === "false"
                  ? "Normal"
                  : "Priority",
            },
          ].map((filter, idx) => (
            <div key={idx} className="relative">
              <select
                value={filter.value}
                onChange={filter.onChange}
                className="appearance-none h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-xl bg-white shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition cursor-pointer"
              >
                {filter.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {filter.format(opt)}
                  </option>
                ))}
              </select>

              {/* Custom Arrow */}
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
                ▼
              </span>
            </div>
          ))}

          {/* Date Inputs */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 text-sm border border-gray-200 rounded-xl shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 text-sm border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />

          {/* Clear Filters */}
          {(search ||
            filterStatus ||
            filterPaymentStatus ||
            filterPaymentMethod ||
            filterSource ||
            filterPriority ||
            startDate ||
            endDate) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("");
                setFilterPaymentStatus("");
                setFilterPaymentMethod("");
                setFilterSource("");
                setFilterPriority("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="h-10 px-4 text-xs font-medium text-red-600 border border-red-200 rounded-xl 
      bg-red-50 hover:bg-red-100 transition"
            >
              ✕ Clear
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
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 64,
              }}
            >
              <Spinner />
              <span style={{ color: "#999", fontSize: 14 }}>
                Loading orders…
              </span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 900,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#F9F6EE",
                      borderBottom: "2px solid #E5E0D4",
                    }}
                  >
                    {[
                      "Order",
                      "Customer",
                      "Items",
                      "Total",
                      "Payment",
                      "Status",
                      "Date",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 14px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#8B7355",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr
                      key={order._id}
                      className="om-row"
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "#FAFAF8",
                        borderBottom: "1px solid #EEEAE0",
                        transition: "background 0.15s",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {order.isPriority && (
                            <span title="Priority" style={{ fontSize: 12 }}>
                              ⚡
                            </span>
                          )}
                          {order.isGift && (
                            <span title="Gift" style={{ fontSize: 12 }}>
                              🎁
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#003720",
                              fontFamily: "monospace",
                            }}
                          >
                            {order.orderNumber}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            margin: "2px 0 0",
                          }}
                        >
                          {order.source}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                          }}
                        >
                          {order.customerName}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#999",
                            margin: "2px 0 0",
                            fontFamily: "monospace",
                          }}
                        >
                          {order.customerEmail}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div style={{ display: "flex", gap: 4 }}>
                          {order.items?.slice(0, 2).map((item) => (
                            <div
                              key={item._id}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                overflow: "hidden",
                                border: "1px solid #E5E0D4",
                                background: "#F5F2EA",
                              }}
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                /> // eslint-disable-line @next/next/no-img-element
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                  }}
                                >
                                  🪙
                                </div>
                              )}
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: "#F0EBE0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#7a6040",
                              }}
                            >
                              +{order.items.length - 2}
                            </div>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            margin: "4px 0 0",
                          }}
                        >
                          {order.items?.length} item
                          {order.items?.length !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#1a1a1a",
                            margin: 0,
                          }}
                        >
                          {inr(order.pricing.total)}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            margin: "2px 0 0",
                          }}
                        >
                          {order.payment.method.toUpperCase()}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <PayBadge status={order.payment.status} />
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <StatusBadge status={order.status} />
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          color: "#999",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt(order.placedAt)}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            onClick={() => openDetail(order._id)}
                            style={{
                              ...actionBtn,
                              background: "#F0F7FF",
                              color: "#1a6fbf",
                              border: "1px solid #BDD9FF",
                              cursor: "pointer",
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => setModal({ type: "status", order })}
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
                            onClick={() =>
                              setModal({
                                type: "confirm-delete",
                                id: order._id,
                                orderNumber: order.orderNumber,
                              })
                            }
                            style={{
                              ...actionBtn,
                              background: "#FFF5F5",
                              color: "#c0392b",
                              border: "1px solid #FFCDD2",
                              cursor: "pointer",
                            }}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: 56,
                          color: "#bbb",
                          fontSize: 14,
                        }}
                      >
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                        No orders found
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
              }}
            >
              ← Prev
            </button>
            <span style={{ color: "#888", fontSize: 13 }}>
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total.toLocaleString()} orders
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

// ─── Style tokens ─────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  padding: "9px 20px",
  borderRadius: 9,
  border: "none",
  background: "#D4A017",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
};
const btnGreen: React.CSSProperties = {
  padding: "9px 20px",
  borderRadius: 9,
  border: "none",
  background: "#166534",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
};
const btnBlue: React.CSSProperties = {
  padding: "9px 20px",
  borderRadius: 9,
  border: "none",
  background: "#1a6fbf",
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
const filterInputStyle: React.CSSProperties = {
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
  padding: "5px 10px",
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 500,
  border: "none",
  transition: "opacity 0.15s",
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
const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  fontSize: 13,
  color: "#333",
  outline: "none",
  resize: "vertical" as const,
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};
const infoLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
  color: "#8B7355",
  margin: "0 0 2px",
};
