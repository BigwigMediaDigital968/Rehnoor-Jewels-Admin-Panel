"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Brand theme (mirrors rj-* CSS vars) ─────────────────────────────────────
const T = {
  emerald: "#003720",
  emeraldLt: "rgba(0,55,32,0.07)",
  gold: "#FCC151",
  goldLt: "rgba(252,193,81,0.15)",
  bone: "#E8DFD0",
  ivory: "#F8F5F0",
  ivoryDark: "#EDE8E0",
  ash: "#9B8E7E",
  charcoal: "#1C1C1C",
  red: "#ef4444",
  redLt: "#fef2f2",
  green: "#22c55e",
  greenLt: "#f0fdf4",
};

// ─── Utilities (provided by project) ─────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("admin_token") || ""
    : "";
}
function authHeaders(): Record<string, string> {
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface RawOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  source: string;
  placedAt: string;
  createdAt: string;
  pricing: {
    subtotal: number;
    total: number;
    discountAmount: number;
    shippingCharge: number;
  };
  payment: { method: string; status: string };
  coupon?: { code: string; discountAmount: number } | null;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
  };
  items: {
    name: string;
    image: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    sizeSelected?: string;
  }[];
}

interface Customer {
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  orderCount: number;
  totalSpent: number;
  avgOrderValue: number;
  firstOrder: string;
  lastOrder: string;
  orders: RawOrder[];
  sources: string[];
  paymentMethods: string[];
  usedCoupons: string[];
  status: "vip" | "loyal" | "new" | "at_risk";
  savedAmount: number;
}

type SortKey =
  | "name"
  | "orderCount"
  | "totalSpent"
  | "lastOrder"
  | "firstOrder";
type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// ─── Derive customer status ───────────────────────────────────────────────────
function deriveStatus(c: Customer): Customer["status"] {
  const daysSinceLast =
    (Date.now() - new Date(c.lastOrder).getTime()) / 86400000;
  if (c.orderCount >= 5 && c.totalSpent >= 20000) return "vip";
  if (c.orderCount >= 2 && daysSinceLast < 90) return "loyal";
  if (daysSinceLast > 180) return "at_risk";
  return "new";
}

const STATUS_META: Record<
  Customer["status"],
  { label: string; bg: string; color: string }
> = {
  vip: { label: "⚜ VIP", bg: T.goldLt, color: "#92650a" },
  loyal: { label: "✦ Loyal", bg: T.emeraldLt, color: T.emerald },
  new: { label: "✶ New", bg: "#eff6ff", color: "#3b82f6" },
  at_risk: { label: "⚑ At Risk", bg: T.redLt, color: T.red },
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  delivered: T.green,
  confirmed: T.emerald,
  shipped: "#3b82f6",
  processing: "#f59e0b",
  pending: T.ash,
  cancelled: T.red,
  failed: T.red,
};

// ─── Aggregate raw orders → Customer map ─────────────────────────────────────
function aggregateCustomers(orders: RawOrder[]): Customer[] {
  const map = new Map<string, Customer>();

  for (const o of orders) {
    const email = o.customerEmail.toLowerCase();
    if (!map.has(email)) {
      map.set(email, {
        email,
        name: o.customerName,
        phone: o.customerPhone,
        city: o.shippingAddress?.city || "",
        state: o.shippingAddress?.state || "",
        orderCount: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        firstOrder: o.placedAt || o.createdAt,
        lastOrder: o.placedAt || o.createdAt,
        orders: [],
        sources: [],
        paymentMethods: [],
        usedCoupons: [],
        savedAmount: 0,
        status: "new",
      });
    }

    const c = map.get(email)!;
    c.orderCount += 1;
    c.totalSpent += o.pricing?.total || 0;
    c.savedAmount +=
      (o.pricing?.discountAmount || 0) + (o.coupon?.discountAmount || 0);
    c.orders.push(o);

    if (!c.sources.includes(o.source)) c.sources.push(o.source);
    if (!c.paymentMethods.includes(o.payment?.method))
      c.paymentMethods.push(o.payment.method);
    if (o.coupon?.code && !c.usedCoupons.includes(o.coupon.code))
      c.usedCoupons.push(o.coupon.code);

    const oDate = new Date(o.placedAt || o.createdAt);
    if (oDate < new Date(c.firstOrder))
      c.firstOrder = o.placedAt || o.createdAt;
    if (oDate > new Date(c.lastOrder)) c.lastOrder = o.placedAt || o.createdAt;

    // Keep most recent address / name
    if (oDate >= new Date(c.lastOrder)) {
      c.name = o.customerName;
      c.phone = o.customerPhone;
      c.city = o.shippingAddress?.city || c.city;
      c.state = o.shippingAddress?.state || c.state;
    }
  }

  for (const c of map.values()) {
    c.avgOrderValue = c.orderCount > 0 ? c.totalSpent / c.orderCount : 0;
    c.orders.sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
    );
    c.status = deriveStatus(c);
  }

  return Array.from(map.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLE ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9100,
  background: "rgba(0,0,0,0.58)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};
const panel = (w = 680): React.CSSProperties => ({
  background: "#fff",
  borderRadius: 18,
  width: "100%",
  maxWidth: w,
  maxHeight: "92vh",
  overflowY: "auto",
  boxShadow: "0 28px 72px rgba(0,0,0,0.2)",
});
const cinzel = (sz = 11, w: number | string = 400): React.CSSProperties => ({
  fontFamily: "Cinzel, serif",
  fontSize: sz,
  fontWeight: w,
  letterSpacing: "0.06em",
});
const pill = (bg: string, color: string): React.CSSProperties => ({
  ...cinzel(8, 700),
  background: bg,
  color,
  padding: "2px 10px",
  borderRadius: 20,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "inline-block",
  whiteSpace: "nowrap",
});
const btnBase: React.CSSProperties = {
  ...cinzel(10, 700),
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  padding: "9px 18px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};
const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: T.emerald,
  color: "#fff",
};
const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: T.charcoal,
  border: `1.5px solid ${T.bone}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function ToastBar({
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
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
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
            padding: "11px 16px",
            borderRadius: 10,
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            ...cinzel(11),
            cursor: "pointer",
            minWidth: 240,
            maxWidth: 360,
            animation: "toastIn 0.22s ease",
          }}
        >
          <span>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn{from{transform:translateX(32px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER HISTORY MINI-ROW
// ─────────────────────────────────────────────────────────────────────────────
function OrderRow({ o }: { o: RawOrder }) {
  const sc = ORDER_STATUS_COLOR[o.status] || T.ash;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "130px 1fr 90px 100px 90px",
        gap: 0,
        padding: "10px 16px",
        alignItems: "center",
        borderBottom: `1px solid ${T.bone}`,
        fontSize: 12,
      }}
    >
      <span style={{ ...cinzel(10, 700), color: T.emerald }}>
        {o.orderNumber}
      </span>
      <span style={{ fontFamily: "sans-serif", color: T.ash, fontSize: 11 }}>
        {fmt(o.placedAt)}
      </span>
      <span style={{ ...cinzel(11, 700), color: T.charcoal }}>
        {inr(o.pricing.total)}
      </span>
      <span style={{ ...pill(sc + "18", sc) }}>{o.status}</span>
      <span style={{ ...cinzel(9), color: T.ash, textTransform: "uppercase" }}>
        {o.payment.method}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function CustomerDrawer({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const sm = STATUS_META[customer.status];
  const daysSinceLast = Math.floor(
    (Date.now() - new Date(customer.lastOrder).getTime()) / 86400000,
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div
        style={{ ...panel(720), padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: T.emerald,
            padding: "24px 28px",
            borderRadius: "18px 18px 0 0",
            position: "sticky",
            top: 0,
            zIndex: 10,
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
              <div
                style={{
                  ...cinzel(9),
                  color: "rgba(252,193,81,0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  marginBottom: 4,
                }}
              >
                Customer Profile
              </div>
              <div
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {customer.name}
              </div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 3,
                }}
              >
                {customer.email} · {customer.phone}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ ...pill(T.goldLt, "#92650a"), fontSize: 9 }}>
                {sm.label}
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* KPI row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 12,
            }}
          >
            {[
              { label: "Total Orders", value: customer.orderCount },
              { label: "Total Spent", value: inr(customer.totalSpent) },
              {
                label: "Avg Order",
                value: inr(Math.round(customer.avgOrderValue)),
              },
              { label: "Savings", value: inr(customer.savedAmount) },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  background: T.ivory,
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${T.bone}`,
                }}
              >
                <div
                  style={{
                    ...cinzel(8),
                    color: T.ash,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 4,
                  }}
                >
                  {k.label}
                </div>
                <div style={{ ...cinzel(18, 700), color: T.emerald }}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          {/* Info grid */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <InfoBlock title="Location">
              <Line label="City" value={customer.city || "—"} />
              <Line label="State" value={customer.state || "—"} />
            </InfoBlock>
            <InfoBlock title="Activity">
              <Line label="First Order" value={fmt(customer.firstOrder)} />
              <Line label="Last Order" value={fmt(customer.lastOrder)} />
              <Line label="Days Since Last" value={`${daysSinceLast}d ago`} />
            </InfoBlock>
            <InfoBlock title="Channels & Payment">
              <Line
                label="Sources"
                value={customer.sources.join(", ") || "—"}
              />
              <Line
                label="Payment"
                value={customer.paymentMethods.join(", ") || "—"}
              />
            </InfoBlock>
            <InfoBlock title="Coupons Used">
              {customer.usedCoupons.length ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  {customer.usedCoupons.map((c) => (
                    <span
                      key={c}
                      style={{ ...pill(T.goldLt, "#92650a"), fontSize: 9 }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: 12,
                    color: T.ash,
                  }}
                >
                  No coupons used
                </span>
              )}
            </InfoBlock>
          </div>

          {/* Order history */}
          <div>
            <div
              style={{
                ...cinzel(9),
                color: T.ash,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: 10,
              }}
            >
              Order History ({customer.orderCount})
            </div>
            <div
              style={{
                border: `1px solid ${T.bone}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Table head */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr 90px 100px 90px",
                  padding: "8px 16px",
                  background: T.ivory,
                  borderBottom: `1px solid ${T.bone}`,
                }}
              >
                {["Order #", "Date", "Total", "Status", "Payment"].map((h) => (
                  <span
                    key={h}
                    style={{
                      ...cinzel(8),
                      color: T.ash,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {customer.orders.slice(0, 15).map((o) => (
                <OrderRow key={o._id} o={o} />
              ))}
              {customer.orderCount > 15 && (
                <div
                  style={{
                    padding: "10px 16px",
                    textAlign: "center",
                    ...cinzel(9),
                    color: T.ash,
                  }}
                >
                  +{customer.orderCount - 15} more orders
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              paddingTop: 8,
              borderTop: `1px solid ${T.bone}`,
            }}
          >
            <a
              href={`mailto:${customer.email}`}
              style={{
                ...btnSecondary,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ✉ Email Customer
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(customer.email)}
              style={{ ...btnPrimary, cursor: "pointer" }}
            >
              Copy Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
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
          ...cinzel(8),
          color: T.ash,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {children}
      </div>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontFamily: "sans-serif", fontSize: 11, color: T.ash }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "sans-serif",
          fontSize: 12,
          fontWeight: 600,
          color: T.charcoal,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS BANNER
// ─────────────────────────────────────────────────────────────────────────────
function StatsBanner({ customers }: { customers: Customer[] }) {
  const total = customers.length;
  const vip = customers.filter((c) => c.status === "vip").length;
  const loyal = customers.filter((c) => c.status === "loyal").length;
  const atRisk = customers.filter((c) => c.status === "at_risk").length;
  const totalRev = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgLtv = total ? totalRev / total : 0;
  const repeat = customers.filter((c) => c.orderCount > 1).length;
  const repeatRate = total ? Math.round((repeat / total) * 100) : 0;

  const stats = [
    { label: "Total Customers", value: total.toLocaleString() },
    { label: "VIP", value: vip.toLocaleString(), accent: T.gold },
    { label: "Loyal", value: loyal.toLocaleString(), accent: T.emerald },
    { label: "At Risk", value: atRisk.toLocaleString(), accent: T.red },
    { label: "Total Revenue", value: inr(totalRev) },
    { label: "Avg LTV", value: inr(Math.round(avgLtv)) },
    { label: "Repeat Rate", value: `${repeatRate}%`, accent: T.emerald },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "14px 16px",
            border: `1px solid ${T.bone}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...cinzel(18, 700),
              color: s.accent || T.charcoal,
              lineHeight: 1.1,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              ...cinzel(8),
              color: T.ash,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginTop: 4,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false); // background refetch
  const [selected, setSelected] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilt, setStatusFilt] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("lastOrder");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [toasts, setToasts] = useState<Toast[]>([]);
  const tidRef = useRef(0);
  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++tidRef.current;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // ── Fetch ALL orders then aggregate into customers ────────────────────────
  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setFetching(true);
      try {
        // Fetch up to 2000 orders (enough for most stores).
        // Paginate in batches of 500 to stay within server limits.
        const allOrders: RawOrder[] = [];
        let pg = 1;
        const BATCH = 500;

        while (true) {
          const res = await fetch(
            `${API_BASE}/api/orders/admin/all?page=${pg}&limit=${BATCH}&sort=-placedAt`,
            { headers: authHeaders() },
          );
          if (!res.ok) throw new Error("Failed to fetch orders");
          const data = await res.json();
          const batch: RawOrder[] = data.data || [];
          allOrders.push(...batch);

          const { totalPages } = data.pagination || {};
          if (pg >= (totalPages || 1) || pg >= 4) break; // cap at 2000
          pg++;
        }

        const derived = aggregateCustomers(allOrders);
        setCustomers(derived);
      } catch (e: unknown) {
        toast(
          "error",
          e instanceof Error ? e.message : "Failed to load customer data.",
        );
      } finally {
        setLoading(false);
        setFetching(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Filter → sort → paginate ──────────────────────────────────────────────
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.city.toLowerCase().includes(q);
    const matchStatus = !statusFilt || c.status === statusFilt;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string;
    if (sortKey === "name") {
      av = a.name.toLowerCase();
      bv = b.name.toLowerCase();
    } else if (sortKey === "orderCount") {
      av = a.orderCount;
      bv = b.orderCount;
    } else if (sortKey === "totalSpent") {
      av = a.totalSpent;
      bv = b.totalSpent;
    } else if (sortKey === "lastOrder") {
      av = a.lastOrder;
      bv = b.lastOrder;
    } else {
      av = a.firstOrder;
      bv = b.firstOrder;
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span style={{ marginLeft: 3, opacity: 0.7 }}>{sortAsc ? "↑" : "↓"}</span>
    ) : null;

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = [
      "Name",
      "Email",
      "Phone",
      "City",
      "State",
      "Orders",
      "Total Spent",
      "Avg Order",
      "First Order",
      "Last Order",
      "Status",
      "Coupons",
    ].join(",");
    const rows = sorted.map((c) =>
      [
        `"${c.name}"`,
        c.email,
        c.phone,
        c.city,
        c.state,
        c.orderCount,
        c.totalSpent,
        Math.round(c.avgOrderValue),
        fmt(c.firstOrder),
        fmt(c.lastOrder),
        c.status,
        `"${c.usedCoupons.join("|")}"`,
      ].join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("success", `Exported ${sorted.length} customers.`);
  };

  // ─────────────────────────────────────────────────────────────────────────
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
        .cm-row:hover { background: ${T.ivory} !important; }
        .cm-sort-btn { cursor:pointer; user-select:none; }
        .cm-sort-btn:hover { color: ${T.emerald} !important; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${T.ivory}; }
        ::-webkit-scrollbar-thumb { background:${T.bone}; border-radius:4px; }
      `}</style>

      <ToastBar
        toasts={toasts}
        remove={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />

      {selected && (
        <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />
      )}

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 20px" }}>
        {/* ── Page header ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                ...cinzel(9),
                color: T.ash,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
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
              Customer Management
            </h1>
            <p
              style={{
                fontFamily: "sans-serif",
                color: T.ash,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Derived from order history · {customers.length} unique customers
              {fetching && (
                <span style={{ marginLeft: 8, color: T.gold }}>
                  Refreshing…
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => fetchAll(true)}
              disabled={fetching}
              style={{
                ...btnSecondary,
                cursor: fetching ? "default" : "pointer",
                opacity: fetching ? 0.5 : 1,
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={exportCSV}
              style={{ ...btnPrimary, cursor: "pointer" }}
            >
              ↓ Export CSV
            </button>
          </div>
        </div>

        {/* ── Stats banner ──────────────────────────────────────────────── */}
        {!loading && <StatsBanner customers={customers} />}

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 14,
            border: `1px solid ${T.bone}`,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone, city…"
            style={{
              flex: "1 1 220px",
              padding: "8px 12px",
              borderRadius: 8,
              border: `1.5px solid ${T.bone}`,
              fontSize: 13,
              color: T.charcoal,
              background: T.ivory,
              outline: "none",
              cursor: "text",
              fontFamily: "sans-serif",
            }}
          />
          {(["", "vip", "loyal", "new", "at_risk"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilt(s);
                setPage(1);
              }}
              style={{
                ...cinzel(9, 700),
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "7px 14px",
                borderRadius: 8,
                cursor: "pointer",
                border: `1.5px solid ${statusFilt === s ? T.emerald : T.bone}`,
                background: statusFilt === s ? T.emeraldLt : "transparent",
                color: statusFilt === s ? T.emerald : T.ash,
                transition: "all 0.15s",
              }}
            >
              {s === "" ? "All" : STATUS_META[s as Customer["status"]].label}
            </button>
          ))}
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
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
              gridTemplateColumns:
                "2fr 1.6fr 90px 100px 110px 110px 100px 80px",
              padding: "10px 18px",
              background: T.ivory,
              borderBottom: `1px solid ${T.bone}`,
            }}
          >
            {[
              { label: "Customer", key: "name" as SortKey },
              { label: "Email", key: null },
              { label: "Orders", key: "orderCount" as SortKey },
              { label: "Total Spent", key: "totalSpent" as SortKey },
              { label: "First Order", key: "firstOrder" as SortKey },
              { label: "Last Order", key: "lastOrder" as SortKey },
              { label: "Status", key: null },
              { label: "", key: null },
            ].map((h, i) => (
              <div
                key={i}
                className={h.key ? "cm-sort-btn" : ""}
                onClick={() => h.key && toggleSort(h.key)}
                style={{
                  ...cinzel(8),
                  color: T.ash,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {h.label}
                {h.key && <SortIcon k={h.key} />}
              </div>
            ))}
          </div>

          {loading ? (
            <div
              style={{
                padding: 72,
                textAlign: "center",
                ...cinzel(12),
                color: T.ash,
                letterSpacing: "0.12em",
              }}
            >
              Loading customer data…
            </div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: 72, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
              <div style={{ ...cinzel(13), color: T.ash }}>
                No customers found
              </div>
            </div>
          ) : (
            paginated.map((c, i) => {
              const sm = STATUS_META[c.status];
              const daysSince = Math.floor(
                (Date.now() - new Date(c.lastOrder).getTime()) / 86400000,
              );
              return (
                <div
                  key={c.email}
                  className="cm-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "2fr 1.6fr 90px 100px 110px 110px 100px 80px",
                    padding: "12px 18px",
                    alignItems: "center",
                    borderBottom:
                      i < paginated.length - 1 ? `1px solid ${T.bone}` : "none",
                    background: "#fff",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Name + location */}
                  <div>
                    <div style={{ ...cinzel(12, 700), color: T.charcoal }}>
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: 11,
                        color: T.ash,
                        marginTop: 2,
                      }}
                    >
                      {c.phone}
                      {c.city ? ` · ${c.city}` : ""}
                    </div>
                  </div>

                  {/* Email */}
                  <div
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 12,
                      color: T.ash,
                      wordBreak: "break-all",
                    }}
                  >
                    {c.email}
                  </div>

                  {/* Orders */}
                  <div style={{ ...cinzel(13, 700), color: T.charcoal }}>
                    {c.orderCount}
                  </div>

                  {/* Total spent */}
                  <div style={{ ...cinzel(13, 700), color: T.emerald }}>
                    {inr(c.totalSpent)}
                  </div>

                  {/* First order */}
                  <div
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 12,
                      color: T.ash,
                    }}
                  >
                    {fmt(c.firstOrder)}
                  </div>

                  {/* Last order + recency */}
                  <div>
                    <div
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: 12,
                        color: T.charcoal,
                      }}
                    >
                      {fmt(c.lastOrder)}
                    </div>
                    <div
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: 10,
                        color: daysSince > 180 ? T.red : T.ash,
                        marginTop: 1,
                      }}
                    >
                      {daysSince}d ago
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ ...pill(sm.bg, sm.color), fontSize: 8 }}>
                      {sm.label}
                    </span>
                  </div>

                  {/* View button */}
                  <div>
                    <button
                      onClick={() => setSelected(c)}
                      style={{
                        ...cinzel(8, 700),
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: `1.5px solid ${T.bone}`,
                        background: "transparent",
                        color: T.emerald,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
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
            <span style={{ ...cinzel(11), color: T.ash }}>
              Page {page} of {totalPages} · {sorted.length} customers
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
