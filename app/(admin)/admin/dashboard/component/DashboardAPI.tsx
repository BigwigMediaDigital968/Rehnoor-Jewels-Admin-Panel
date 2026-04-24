"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────
interface ApiStats {
  products: {
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
    newThisMonth: number;
  };
  collections: {
    total: number;
    active: number;
    inactive: number;
  };
  leads: {
    total: number;
    newToday: number;
    thisMonth: number;
  };
  subscribers: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    todayRevenue: number;
    monthRevenue: number;
    avgOrderValue: number;
  };
  reviews: {
    total: number;
    avgRating: number;
    pending: number;
  };
}

interface Order {
  _id: string;
  orderNumber?: string;
  user?: { name?: string; email?: string };
  guestEmail?: string;

  items: {
    name?: string;
    productId?: { name?: string };
  }[];

  // ❌ remove this if not used
  // totalAmount: number;

  pricing?: {
    subtotal: number;
    shippingCharge: number;
    discountAmount: number;
    taxAmount: number;
    taxRate?: number;
  };

  totalAmount?: number;

  status: string;
  createdAt: string;
  paymentStatus?: string;
}

interface Product {
  _id: string;
  name: string;
  category?: string;
  price: number;
  stock?: number;
  isActive?: boolean;
  images?: { src: string }[];
  tag?: string;
}

interface Collection {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  productCount?: number;
  heroImage?: string;
}

interface Lead {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  createdAt: string;
  status?: string;
}

interface Subscriber {
  _id: string;
  email: string;
  isActive?: boolean;
  createdAt: string;
}

type TabKey =
  | "overview"
  | "orders"
  | "products"
  | "collections"
  | "leads"
  | "subscribers";

// ─────────────────────────────────────────────────────────────────
// FETCH HELPER with auth header
// ─────────────────────────────────────────────────────────────────
async function apiFetch(path: string) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_token") ?? ""
      : "";
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background:
    "linear-gradient(155deg, rgba(0,55,32,0.55) 0%, rgba(0,28,14,0.8) 100%)",
  border: "1px solid rgba(252,193,81,0.13)",
  borderRadius: 18,
  overflow: "hidden",
  position: "relative",
  backdropFilter: "blur(12px)",
};

const SERIF = "'Cormorant Garamond','Playfair Display',Georgia,serif";
const SANS = "'DM Sans',system-ui,sans-serif";

const MUTED: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(250,248,243,0.4)",
  fontFamily: SANS,
};

const STATUS_CFG: Record<
  string,
  { bg: string; color: string; border: string; label: string }
> = {
  pending: {
    bg: "rgba(239,83,80,.14)",
    color: "#ef9a9a",
    border: "rgba(239,83,80,.28)",
    label: "Pending",
  },
  processing: {
    bg: "rgba(252,193,81,.14)",
    color: "#fcc151",
    border: "rgba(252,193,81,.28)",
    label: "Processing",
  },
  shipped: {
    bg: "rgba(33,150,243,.14)",
    color: "#64b5f6",
    border: "rgba(33,150,243,.28)",
    label: "Shipped",
  },
  delivered: {
    bg: "rgba(76,175,80,.14)",
    color: "#81c784",
    border: "rgba(76,175,80,.28)",
    label: "Delivered",
  },
  cancelled: {
    bg: "rgba(255,87,34,.12)",
    color: "#ff8a65",
    border: "rgba(255,87,34,.24)",
    label: "Cancelled",
  },
};

const ACCENT_COLORS = [
  "#fcc151",
  "#4caf50",
  "#42a5f5",
  "#ab47bc",
  "#ef5350",
  "#26c6da",
];

// ─────────────────────────────────────────────────────────────────
// SPARKLINE
// ─────────────────────────────────────────────────────────────────
function Sparkline({
  data,
  color = "#fcc151",
  height = 44,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const w = 120;
  const min = Math.min(...data),
    max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${
          height - ((v - min) / range) * (height - 6) - 3
        }`,
    )
    .join(" ");
  const uid = `sg${color.replace(/[^a-z0-9]/gi, "")}${height}`;
  const last = data[data.length - 1];
  const lx = w,
    ly = height - ((last - min) / range) * (height - 6) - 3;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${w},${height}`}
        fill={`url(#${uid})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r="3.5" fill={color} />
      <circle cx={lx} cy={ly} r="6" fill={color} fillOpacity="0.25" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────────────────────────
function BarChart({
  data,
  labels,
  color = "#fcc151",
}: {
  data: number[];
  labels: string[];
  color?: string;
}) {
  const max = Math.max(...data) || 1;
  const peak = data.indexOf(Math.max(...data));
  return (
    <div
      style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 80 }}
    >
      {data.map((v, i) => (
        <div
          key={i}
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
              borderRadius: "4px 4px 0 0",
              height: `${(v / max) * 100}%`,
              minHeight: 4,
              background:
                i === peak
                  ? `linear-gradient(180deg,${color},${color}bb)`
                  : "rgba(252,193,81,0.18)",
              transition: "height 0.7s cubic-bezier(.4,0,.2,1)",
              boxShadow: i === peak ? `0 0 10px ${color}55` : "none",
            }}
            title={`${labels[i]}: ${v}`}
          />
          <span style={{ fontSize: 9, color: "rgba(250,248,243,0.4)" }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DONUT
// ─────────────────────────────────────────────────────────────────
function Donut({
  segments,
  centerLabel,
  centerSub,
}: {
  segments: { value: number; color: string }[];
  centerLabel: string;
  centerSub: string;
}) {
  const r = 50,
    cx = 64,
    cy = 64,
    sw = 16;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let cum = 0;
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={sw}
      />
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ;
        const off = circ - (cum * circ) / total;
        cum += s.value;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={off}
            strokeLinecap="butt"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "64px 64px",
              transition: "stroke-dasharray 0.9s ease",
            }}
          />
        );
      })}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        fill="#faf8f3"
        fontSize="15"
        fontFamily={SERIF}
        fontWeight="600"
      >
        {centerLabel}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="rgba(250,248,243,0.4)"
        fontSize="7.5"
        fontFamily={SANS}
        letterSpacing="1.2"
      >
        {centerSub}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────────────────────────
function Skeleton({
  h = 20,
  w = "100%",
  r = 8,
}: {
  h?: number;
  w?: string | number;
  r?: number;
}) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background:
          "linear-gradient(90deg,rgba(252,193,81,0.06) 25%,rgba(252,193,81,0.12) 50%,rgba(252,193,81,0.06) 75%)",
        backgroundSize: "200% 100%",
        animation: "rj-shimmer 1.5s infinite",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  change,
  icon,
  accent,
  sparkline,
  loading,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  change?: number;
  icon: string;
  accent: string;
  sparkline?: number[];
  loading?: boolean;
  onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  const isPos = (change ?? 0) >= 0;
  return (
    <div
      style={{
        ...CARD,
        padding: "22px 22px 18px",
        cursor: onClick ? "pointer" : "default",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hov
          ? `0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px ${accent}33`
          : "0 4px 20px rgba(0,0,0,0.2)",
        transition: "all 0.28s cubic-bezier(.4,0,.2,1)",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {/* glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle,${accent}22 0%,transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              ...MUTED,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0 0 7px",
            }}
          >
            {label}
          </p>
          {loading ? (
            <Skeleton h={36} w={120} />
          ) : (
            <p
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: 34,
                color: "#faf8f3",
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {value}
            </p>
          )}
          {sub && <p style={{ ...MUTED, marginTop: 4 }}>{sub}</p>}
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            flexShrink: 0,
            background: `${accent}1f`,
            border: `1px solid ${accent}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      {sparkline && !loading && (
        <div style={{ marginBottom: 10 }}>
          <Sparkline data={sparkline} color={accent} height={38} />
        </div>
      )}
      {loading && <Skeleton h={38} />}
      {change !== undefined && !loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              color: isPos ? "#81c784" : "#ef9a9a",
              fontFamily: SANS,
            }}
          >
            {isPos ? "▲" : "▼"} {Math.abs(change)}%
          </span>
          <span style={MUTED}>vs last month</span>
        </div>
      )}
      {onClick && (
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 16,
            fontSize: 10,
            color: accent,
            fontFamily: SANS,
            opacity: hov ? 0.9 : 0,
            transition: "opacity 0.2s",
            letterSpacing: "0.08em",
          }}
        >
          VIEW ALL →
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  noPad,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <div style={{ ...CARD, padding: noPad ? 0 : 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          padding: noPad ? "22px 24px 0" : 0,
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 4px",
              fontFamily: SERIF,
              color: "#faf8f3",
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </h3>
          {subtitle && <p style={{ ...MUTED, marginTop: 2 }}>{subtitle}</p>}
        </div>
        {onAction && (
          <button
            onClick={onAction}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid rgba(252,193,81,0.25)",
              background: "transparent",
              color: "var(--rj-gold, #fcc151)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: SANS,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(252,193,81,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {actionLabel ?? "View All →"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status?.toLowerCase()] ?? STATUS_CFG.pending;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// AVATAR INITIAL
// ─────────────────────────────────────────────────────────────────
function Avatar({ text, color = "#fcc151" }: { text: string; color?: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        flexShrink: 0,
        background: `${color}22`,
        border: `1px solid ${color}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color,
        fontFamily: SANS,
      }}
    >
      {text.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TABLE WRAPPER
// ─────────────────────────────────────────────────────────────────
function DataTable({
  heads,
  children,
}: {
  heads: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}
      >
        <thead>
          <tr>
            {heads.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "0 10px 12px",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(250,248,243,0.3)",
                  fontWeight: 600,
                  borderBottom: "1px solid rgba(252,193,81,0.09)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function TR({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      style={{
        borderBottom: "1px solid rgba(252,193,81,0.05)",
        background: hov ? "rgba(255,255,255,0.025)" : "transparent",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

function TD({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "11px 10px",
        fontSize: 12,
        color: "rgba(250,248,243,0.8)",
        fontFamily: SANS,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────
function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <p style={{ ...MUTED, fontSize: 13 }}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// METRIC PILL
// ─────────────────────────────────────────────────────────────────
function Pill({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: 10,
        background: `${color}10`,
        border: `1px solid ${color}20`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 15, color }}>{icon}</span>
        <span
          style={{
            fontSize: 13,
            color: "rgba(250,248,243,0.65)",
            fontFamily: SANS,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: SERIF,
          fontSize: 20,
          color: "#faf8f3",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROGRESS BAR ROW
// ─────────────────────────────────────────────────────────────────
function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              display: "inline-block",
              boxShadow: `0 0 5px ${color}`,
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "rgba(250,248,243,0.7)",
              fontFamily: SANS,
            }}
          >
            {label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{ fontFamily: SERIF, fontSize: 17, color, fontWeight: 600 }}
          >
            {value.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "rgba(250,248,243,0.35)",
              width: 28,
              textAlign: "right",
            }}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

function QuickActionItem({
  a,
  router,
  setActiveTab,
}: {
  a: {
    label: string;
    icon: string;
    color: string;
    path?: string;
    tab?: TabKey;
  };
  router: any;
  setActiveTab: (tab: TabKey) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <button
      style={{
        padding: "16px 10px",
        borderRadius: 14,
        cursor: "pointer",
        border: `1px solid ${hov ? a.color + "44" : a.color + "20"}`,
        background: hov ? `${a.color}18` : `${a.color}0c`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        transition: "all 0.22s",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov ? `0 8px 24px ${a.color}22` : "none",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => {
        if (a.path) router.push(a.path);
        if (a.tab) setActiveTab(a.tab);
      }}
    >
      <span
        style={{
          fontSize: 24,
          color: a.color,
          filter: hov ? `drop-shadow(0 0 6px ${a.color}88)` : "none",
          transition: "filter 0.2s",
        }}
      >
        {a.icon}
      </span>

      <span
        style={{
          fontSize: 11,
          color: hov ? "#faf8f3" : "rgba(250,248,243,0.55)",
          fontFamily: SANS,
          textAlign: "center",
          lineHeight: 1.3,
          transition: "color 0.2s",
        }}
      >
        {a.label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────
export default function DashboardPageAPI() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Data state ────────────────────────────────────────────────
  const [stats, setStats] = useState<Partial<ApiStats>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // ── Loading / error state ─────────────────────────────────────
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({
    stats: true,
    orders: true,
    products: true,
    collections: true,
    leads: true,
    subscribers: true,
  });
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const setLoading = (key: string, v: boolean) =>
    setLoadingMap((m) => ({ ...m, [key]: v }));
  const setError = (key: string, msg: string | null) =>
    setErrorMap((m) => ({ ...m, [key]: msg }));

  const getOrderTotal = (o: Order) => {
    const p = o.pricing;

    if (p) {
      return (
        (p.subtotal || 0) +
        (p.shippingCharge || 0) -
        (p.discountAmount || 0) +
        (p.taxAmount || 0)
      );
    }

    return o.totalAmount ?? 0; // fallback
  };

  // ── Fetch helpers ─────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading("orders", true);
    try {
      const data = await apiFetch(
        "/api/orders/admin/all?limit=50&sort=createdAt&order=desc",
      );
      const list: Order[] = data.data ?? data.orders ?? data ?? [];
      setOrders(list);

      // Derive order stats
      const statCounts = list.reduce(
        (acc, o) => {
          acc.total++;
          acc.totalRevenue += getOrderTotal(o);
          const s = o.status?.toLowerCase();
          if (s === "pending") acc.pending++;
          else if (s === "processing") acc.processing++;
          else if (s === "shipped") acc.shipped++;
          else if (s === "delivered") acc.delivered++;
          else if (s === "cancelled") acc.cancelled++;
          return acc;
        },
        {
          total: 0,
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          totalRevenue: 0,
        },
      );

      setStats((prev) => ({
        ...prev,
        orders: {
          ...statCounts,
          todayRevenue: 0,
          monthRevenue: 0,
          avgOrderValue:
            statCounts.total > 0
              ? Math.round(statCounts.totalRevenue / statCounts.total)
              : 0,
        },
      }));
      setError("orders", null);
    } catch (e: any) {
      setError("orders", e.message);
    } finally {
      setLoading("orders", false);
    }
  }, []);

  console.log(orders);

  const fetchProducts = useCallback(async () => {
    setLoading("products", true);
    try {
      const data = await apiFetch("/api/products?limit=100");
      const list: Product[] = data.data ?? data.products ?? data ?? [];
      setProducts(list);

      const active = list.filter((p) => p.isActive !== false).length;
      const outOfStock = list.filter((p) => (p.stock ?? 1) === 0).length;
      setStats((prev) => ({
        ...prev,
        products: {
          total: list.length,
          active,
          inactive: list.length - active,
          outOfStock,
          newThisMonth: 0,
        },
      }));
      setError("products", null);
    } catch (e: any) {
      setError("products", e.message);
    } finally {
      setLoading("products", false);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    setLoading("collections", true);
    try {
      const data = await apiFetch("/api/collections?limit=50");
      const list: Collection[] = data.data ?? data.collections ?? data ?? [];
      setCollections(list);

      const active = list.filter((c) => c.isActive !== false).length;
      setStats((prev) => ({
        ...prev,
        collections: {
          total: list.length,
          active,
          inactive: list.length - active,
        },
      }));
      setError("collections", null);
    } catch (e: any) {
      setError("collections", e.message);
    } finally {
      setLoading("collections", false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading("leads", true);
    try {
      const data = await apiFetch("/api/leads?limit=50");
      const list: Lead[] = data.data ?? data.leads ?? data ?? [];
      setLeads(list);

      const today = new Date().toDateString();
      const newToday = list.filter(
        (l) => new Date(l.createdAt).toDateString() === today,
      ).length;
      setStats((prev) => ({
        ...prev,
        leads: { total: list.length, newToday, thisMonth: 0 },
      }));
      setError("leads", null);
    } catch (e: any) {
      setError("leads", e.message);
    } finally {
      setLoading("leads", false);
    }
  }, []);

  const fetchSubscribers = useCallback(async () => {
    setLoading("subscribers", true);
    try {
      const data = await apiFetch("/api/newsletter/admin/subscribers");
      const list: Subscriber[] = data.data ?? data.subscribers ?? data ?? [];
      setSubscribers(list);

      const active = list.filter((s) => s.isActive !== false).length;
      setStats((prev) => ({
        ...prev,
        subscribers: { total: list.length, active, newThisMonth: 0 },
      }));
      setError("subscribers", null);
    } catch (e: any) {
      setError("subscribers", e.message);
    } finally {
      setLoading("subscribers", false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
    fetchProducts();
    fetchCollections();
    fetchLeads();
    fetchSubscribers();
  }, [
    fetchOrders,
    fetchProducts,
    fetchCollections,
    fetchLeads,
    fetchSubscribers,
  ]);

  if (!mounted) return null;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // const fmtCurrency = (n: number) => {
  //   if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  //   if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  //   return `₹${n.toLocaleString("en-IN")}`;
  // };

  const fmtCurrency = (n?: number) => {
    if (!n) return "₹0";

    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  const os = stats.orders;
  const ps = stats.products;
  const cs = stats.collections;
  const ls = stats.leads;
  const ss = stats.subscribers;

  // Build sparkline from orders grouped (last 7 days placeholder)
  const revenueSparkline = orders
    .slice(0, 12)
    .map((o) => getOrderTotal(o) ?? 0)
    .reverse();
  const orderSparkline = [20, 35, 28, 45, 38, 55, 48, 62, 58, 70, 65, 80]; // static until orders API returns timeseries

  const TAB_NAV: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "◈" },
    { key: "orders", label: "Orders", icon: "◇" },
    { key: "products", label: "Products", icon: "⬟" },
    { key: "collections", label: "Collections", icon: "◉" },
    { key: "leads", label: "Leads", icon: "◬" },
    { key: "subscribers", label: "Newsletter", icon: "✦" },
  ];

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: SANS, color: "#faf8f3" }}>
      <style>{`
        @keyframes rj-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes rj-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rj-fade { animation: rj-fade-in 0.35s ease both; }
      `}</style>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 4px",
                fontFamily: SERIF,
                fontSize: 28,
                fontWeight: 600,
                color: "#003720",
                letterSpacing: "0.02em",
              }}
            >
              Rehnoor Admin Dashboard ✦
            </h2>
            <p style={{ color: "#003720", fontSize: 13 }}>
              {today} · Live data from your store.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={fetchOrders}
              style={{
                padding: "9px 18px",
                borderRadius: 9,
                border: "1px solid rgba(252,193,81,0.8)",
                background: "rgba(252,193,81,0.07)",
                color: "#003720",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: SANS,
                letterSpacing: "0.04em",
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={() => router.push("/admin/products/new")}
              style={{
                padding: "9px 18px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg,#fcc151,#e8a020)",
                color: "#003720",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: SANS,
                fontWeight: 700,
                letterSpacing: "0.04em",
                boxShadow: "0 4px 16px rgba(252,193,81,0.3)",
              }}
            >
              + Add Product
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab nav ──────────────────────────────────────────── */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 26, flexWrap: "wrap" }}
      >
        {TAB_NAV.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: SANS,
                letterSpacing: "0.04em",
                transition: "all 0.2s",
                border: active
                  ? "1px solid rgba(252,193,81,0.9)"
                  : "1px solid rgba(252,193,81,0.5)",
                background: active ? "rgba(252,193,81,0.12)" : "transparent",
                color: active ? "#003720" : "#f5a623",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span style={{ fontSize: 13, color: "#f5a623" }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="rj-fade">
          {/* KPI cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard
              label="Total Revenue"
              icon="◈"
              accent="#fcc151"
              value={os ? fmtCurrency(os.totalRevenue) : "—"}
              sub="All orders"
              sparkline={
                revenueSparkline.length > 1
                  ? revenueSparkline
                  : [40, 55, 48, 70, 65, 82, 95, 115]
              }
              loading={loadingMap.orders}
              onClick={() => setActiveTab("orders")}
            />
            <StatCard
              label="Total Orders"
              icon="◇"
              accent="#4caf50"
              value={os?.total?.toLocaleString() ?? "—"}
              sub="All time"
              change={12}
              sparkline={orderSparkline}
              loading={loadingMap.orders}
              onClick={() => setActiveTab("orders")}
            />
            <StatCard
              label="Products"
              icon="⬟"
              accent="#42a5f5"
              value={ps?.total?.toLocaleString() ?? "—"}
              sub={ps ? `${ps.active} active` : "Loading…"}
              sparkline={[30, 28, 35, 32, 40, 38, 45, 50, 55, 60]}
              loading={loadingMap.products}
              onClick={() => setActiveTab("products")}
            />
            <StatCard
              label="Collections"
              icon="◉"
              accent="#ab47bc"
              value={cs?.total?.toLocaleString() ?? "—"}
              sub={cs ? `${cs.active} active` : "Loading…"}
              sparkline={[10, 12, 11, 15, 14, 16, 15, 18]}
              loading={loadingMap.collections}
              onClick={() => setActiveTab("collections")}
            />
            <StatCard
              label="Leads"
              icon="◬"
              accent="#ef5350"
              value={ls?.total?.toLocaleString() ?? "—"}
              sub={ls ? `${ls.newToday} today` : "Loading…"}
              sparkline={[5, 8, 6, 12, 9, 14, 11, 16]}
              loading={loadingMap.leads}
              onClick={() => setActiveTab("leads")}
            />
            <StatCard
              label="Subscribers"
              icon="✦"
              accent="#26c6da"
              value={ss?.total?.toLocaleString() ?? "—"}
              sub={ss ? `${ss.active} active` : "Loading…"}
              sparkline={[20, 25, 22, 30, 28, 35, 33, 40]}
              loading={loadingMap.subscribers}
              onClick={() => setActiveTab("subscribers")}
            />
          </div>

          {/* Order status + Collections mini ─────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Order status breakdown */}
            <SectionCard
              title="Order Fulfilment"
              subtitle="Current status snapshot"
              onAction={() => setActiveTab("orders")}
              actionLabel="All Orders →"
            >
              {loadingMap.orders ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} h={32} />
                  ))}
                </div>
              ) : os ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <ProgressRow
                      label="Delivered"
                      value={os.delivered}
                      total={os.total}
                      color="#81c784"
                    />
                    <ProgressRow
                      label="Shipped"
                      value={os.shipped}
                      total={os.total}
                      color="#64b5f6"
                    />
                    <ProgressRow
                      label="Processing"
                      value={os.processing}
                      total={os.total}
                      color="#fcc151"
                    />
                    <ProgressRow
                      label="Pending"
                      value={os.pending}
                      total={os.total}
                      color="#ef9a9a"
                    />
                    <ProgressRow
                      label="Cancelled"
                      value={os.cancelled}
                      total={os.total}
                      color="#ff8a65"
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: "rgba(252,193,81,0.06)",
                      border: "1px solid rgba(252,193,81,0.15)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ fontSize: 12, color: "rgba(250,248,243,0.55)" }}
                    >
                      Total Orders
                    </span>
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontSize: 22,
                        color: "#fcc151",
                        fontWeight: 600,
                      }}
                    >
                      {os.total.toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <EmptyState icon="◇" label="No order data" />
              )}
            </SectionCard>

            {/* Catalogue health */}
            <SectionCard
              title="Catalogue Health"
              subtitle="Products & Collections at a glance"
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {loadingMap.products ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} h={44} />)
                ) : (
                  <>
                    <Pill
                      label="Total Products"
                      value={ps?.total ?? "—"}
                      color="#fcc151"
                      icon="◇"
                    />
                    <Pill
                      label="Active Products"
                      value={ps?.active ?? "—"}
                      color="#4caf50"
                      icon="●"
                    />
                    <Pill
                      label="Out of Stock"
                      value={ps?.outOfStock ?? "—"}
                      color="#ef5350"
                      icon="⚠"
                    />
                  </>
                )}
                <div
                  style={{
                    height: 1,
                    background: "rgba(252,193,81,0.08)",
                    margin: "4px 0",
                  }}
                />
                {loadingMap.collections ? (
                  [1, 2].map((i) => <Skeleton key={i} h={44} />)
                ) : (
                  <>
                    <Pill
                      label="Total Collections"
                      value={cs?.total ?? "—"}
                      color="#ab47bc"
                      icon="⬟"
                    />
                    <Pill
                      label="Active Collections"
                      value={cs?.active ?? "—"}
                      color="#26c6da"
                      icon="◉"
                    />
                  </>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Recent orders table ──────────────────────── */}
          <SectionCard
            title="Recent Orders"
            subtitle="Last 10 transactions"
            onAction={() => setActiveTab("orders")}
            actionLabel="All Orders →"
          >
            {loadingMap.orders ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} h={44} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState icon="◇" label="No orders found" />
            ) : (
              <DataTable
                heads={[
                  "Order",
                  "Customer",
                  "Product",
                  "Amount",
                  "Status",
                  "Date",
                ]}
              >
                {orders.slice(0, 10).map((o, i) => (
                  <TR
                    key={o._id || i}
                    onClick={() => router.push(`/admin/orders/${o._id}`)}
                  >
                    <TD style={{ color: "#fcc151" }}>
                      {o.orderNumber ?? `#${o._id.slice(-6).toUpperCase()}`}
                    </TD>
                    <TD>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Avatar
                          text={(o.user?.name ?? o.guestEmail ?? "G").slice(
                            0,
                            2,
                          )}
                        />
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 120,
                          }}
                        >
                          {o.user?.name ?? o.guestEmail ?? "Guest"}
                        </span>
                      </div>
                    </TD>
                    <TD
                      style={{ color: "rgba(250,248,243,0.6)", maxWidth: 150 }}
                    >
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.items?.[0]?.name ??
                          o.items?.[0]?.productId?.name ??
                          "—"}
                      </span>
                    </TD>
                    <TD
                      style={{
                        fontFamily: SERIF,
                        fontSize: 14,
                        color: "#faf8f3",
                        fontWeight: 600,
                      }}
                    >
                      {fmtCurrency(o.totalAmount)}
                    </TD>
                    <TD>
                      <Badge status={o.status} />
                    </TD>
                    <TD
                      style={{
                        color: "rgba(250,248,243,0.35)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TD>
                  </TR>
                ))}
              </DataTable>
            )}
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: ORDERS
      ════════════════════════════════════════════════════════ */}
      {activeTab === "orders" && (
        <div className="rj-fade">
          {/* Mini stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Total", value: os?.total, color: "#fcc151" },
              { label: "Pending", value: os?.pending, color: "#ef9a9a" },
              { label: "Processing", value: os?.processing, color: "#fcc151" },
              { label: "Shipped", value: os?.shipped, color: "#64b5f6" },
              { label: "Delivered", value: os?.delivered, color: "#81c784" },
              { label: "Cancelled", value: os?.cancelled, color: "#ff8a65" },
            ].map((s) => (
              <div key={s.label} style={{ ...CARD, padding: "16px 18px" }}>
                <p
                  style={{
                    ...MUTED,
                    margin: "0 0 5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.label}
                </p>
                {loadingMap.orders ? (
                  <Skeleton h={28} w={60} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SERIF,
                      fontSize: 28,
                      color: s.color,
                      fontWeight: 600,
                    }}
                  >
                    {(s.value ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SectionCard
            title="All Orders"
            subtitle={`${orders.length} orders total`}
            onAction={fetchOrders}
            actionLabel="↻ Refresh"
          >
            {loadingMap.orders ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} h={50} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState icon="◇" label="No orders yet" />
            ) : (
              <DataTable
                heads={[
                  "Order",
                  "Customer",
                  "Email",
                  "Amount",
                  "Status",
                  "Payment",
                  "Date",
                ]}
              >
                {orders.map((o, i) => (
                  <TR
                    key={o._id || i}
                    onClick={() => router.push(`/admin/orders/${o._id}`)}
                  >
                    <TD style={{ color: "#fcc151", whiteSpace: "nowrap" }}>
                      {o.orderNumber ?? `#${o._id.slice(-6).toUpperCase()}`}
                    </TD>
                    <TD>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Avatar
                          text={(o.user?.name ?? o.guestEmail ?? "G").slice(
                            0,
                            2,
                          )}
                        />
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 110,
                          }}
                        >
                          {o.user?.name ?? "Guest"}
                        </span>
                      </div>
                    </TD>
                    <TD
                      style={{ color: "rgba(250,248,243,0.5)", maxWidth: 140 }}
                    >
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.user?.email ?? o.guestEmail ?? "—"}
                      </span>
                    </TD>
                    <TD
                      style={{
                        fontFamily: SERIF,
                        fontSize: 14,
                        color: "#faf8f3",
                        fontWeight: 600,
                      }}
                    >
                      {fmtCurrency(o.totalAmount)}
                    </TD>
                    <TD>
                      <Badge status={o.status} />
                    </TD>
                    <TD>
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            o.paymentStatus === "paid" ? "#81c784" : "#ef9a9a",
                          textTransform: "capitalize",
                          fontWeight: 600,
                        }}
                      >
                        {o.paymentStatus ?? "—"}
                      </span>
                    </TD>
                    <TD
                      style={{
                        color: "rgba(250,248,243,0.35)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TD>
                  </TR>
                ))}
              </DataTable>
            )}
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: PRODUCTS
      ════════════════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="rj-fade">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Total", value: ps?.total, color: "#fcc151" },
              { label: "Active", value: ps?.active, color: "#81c784" },
              { label: "Inactive", value: ps?.inactive, color: "#ef9a9a" },
              {
                label: "Out of Stock",
                value: ps?.outOfStock,
                color: "#ff8a65",
              },
            ].map((s) => (
              <div key={s.label} style={{ ...CARD, padding: "16px 18px" }}>
                <p
                  style={{
                    ...MUTED,
                    margin: "0 0 5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.label}
                </p>
                {loadingMap.products ? (
                  <Skeleton h={28} w={60} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SERIF,
                      fontSize: 28,
                      color: s.color,
                      fontWeight: 600,
                    }}
                  >
                    {(s.value ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SectionCard
            title="Products Catalogue"
            subtitle={`${products.length} products`}
            onAction={() => router.push("/admin/products/new")}
            actionLabel="+ Add Product"
          >
            {loadingMap.products ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} h={50} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState icon="⬟" label="No products found" />
            ) : (
              <DataTable
                heads={[
                  "Product",
                  "Category",
                  "Price",
                  "Stock",
                  "Tag",
                  "Status",
                ]}
              >
                {products.map((p, i) => (
                  <TR
                    key={p._id || i}
                    onClick={() => router.push(`/admin/products/${p._id}`)}
                  >
                    <TD>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {p.images?.[0]?.src ? (
                          <img
                            src={p.images[0].src}
                            alt={p.name}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              objectFit: "cover",
                              border: "1px solid rgba(252,193,81,0.2)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: "rgba(252,193,81,0.1)",
                              border: "1px solid rgba(252,193,81,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              color: "#fcc151",
                            }}
                          >
                            ◇
                          </div>
                        )}
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 180,
                            color: "#faf8f3",
                          }}
                        >
                          {p.name}
                        </span>
                      </div>
                    </TD>
                    <TD style={{ color: "rgba(250,248,243,0.55)" }}>
                      <span
                        style={{
                          fontSize: 10,
                          background: "rgba(252,193,81,0.08)",
                          color: "rgba(252,193,81,0.7)",
                          border: "1px solid rgba(252,193,81,0.15)",
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}
                      >
                        {p.category ?? "—"}
                      </span>
                    </TD>
                    <TD
                      style={{
                        fontFamily: SERIF,
                        fontSize: 14,
                        color: "#fcc151",
                        fontWeight: 600,
                      }}
                    >
                      ₹{(p.price ?? 0).toLocaleString("en-IN")}
                    </TD>
                    <TD
                      style={{
                        color:
                          (p.stock ?? 1) === 0
                            ? "#ef9a9a"
                            : (p.stock ?? 10) < 5
                            ? "#fcc151"
                            : "#81c784",
                      }}
                    >
                      {p.stock ?? "—"}
                    </TD>
                    <TD>
                      {p.tag ? (
                        <span
                          style={{
                            fontSize: 10,
                            background: "rgba(252,193,81,0.12)",
                            color: "#fcc151",
                            border: "1px solid rgba(252,193,81,0.2)",
                            padding: "2px 8px",
                            borderRadius: 20,
                          }}
                        >
                          {p.tag}
                        </span>
                      ) : (
                        <span style={{ color: "rgba(250,248,243,0.25)" }}>
                          —
                        </span>
                      )}
                    </TD>
                    <TD>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: p.isActive !== false ? "#81c784" : "#ef9a9a",
                        }}
                      >
                        {p.isActive !== false ? "● Active" : "○ Inactive"}
                      </span>
                    </TD>
                  </TR>
                ))}
              </DataTable>
            )}
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: COLLECTIONS
      ════════════════════════════════════════════════════════ */}
      {activeTab === "collections" && (
        <div className="rj-fade">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Total Collections",
                value: cs?.total,
                color: "#ab47bc",
              },
              { label: "Active", value: cs?.active, color: "#81c784" },
              {
                label: "Inactive / Drafts",
                value: cs?.inactive,
                color: "#ef9a9a",
              },
            ].map((s) => (
              <div key={s.label} style={{ ...CARD, padding: "16px 18px" }}>
                <p
                  style={{
                    ...MUTED,
                    margin: "0 0 5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.label}
                </p>
                {loadingMap.collections ? (
                  <Skeleton h={28} w={60} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SERIF,
                      fontSize: 28,
                      color: s.color,
                      fontWeight: 600,
                    }}
                  >
                    {(s.value ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SectionCard
            title="All Collections"
            subtitle={`${collections.length} collections`}
            onAction={() => router.push("/admin/collections/new")}
            actionLabel="+ New Collection"
          >
            {loadingMap.collections ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} h={64} />
                ))}
              </div>
            ) : collections.length === 0 ? (
              <EmptyState icon="◉" label="No collections found" />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {collections.map((c) => (
                  <CollectionItem key={c._id} c={c} router={router} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: LEADS
      ════════════════════════════════════════════════════════ */}
      {activeTab === "leads" && (
        <div className="rj-fade">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Total Leads", value: ls?.total, color: "#ef5350" },
              { label: "New Today", value: ls?.newToday, color: "#fcc151" },
            ].map((s) => (
              <div key={s.label} style={{ ...CARD, padding: "16px 18px" }}>
                <p
                  style={{
                    ...MUTED,
                    margin: "0 0 5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.label}
                </p>
                {loadingMap.leads ? (
                  <Skeleton h={28} w={60} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SERIF,
                      fontSize: 28,
                      color: s.color,
                      fontWeight: 600,
                    }}
                  >
                    {(s.value ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SectionCard
            title="All Leads"
            subtitle={`${leads.length} enquiries`}
            onAction={fetchLeads}
            actionLabel="↻ Refresh"
          >
            {loadingMap.leads ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} h={50} />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <EmptyState icon="◬" label="No leads yet" />
            ) : (
              <DataTable heads={["Name", "Email", "Phone", "Message", "Date"]}>
                {leads.map((l, i) => (
                  <TR key={l._id || i}>
                    <TD>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Avatar
                          text={(l.name ?? l.email ?? "?").slice(0, 2)}
                          color="#ef5350"
                        />
                        <span style={{ whiteSpace: "nowrap" }}>
                          {l.name ?? "—"}
                        </span>
                      </div>
                    </TD>
                    <TD style={{ color: "rgba(250,248,243,0.6)" }}>
                      {l.email ?? "—"}
                    </TD>
                    <TD style={{ color: "rgba(250,248,243,0.6)" }}>
                      {l.phone ?? "—"}
                    </TD>
                    <TD
                      style={{ color: "rgba(250,248,243,0.5)", maxWidth: 200 }}
                    >
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.message ?? "—"}
                      </span>
                    </TD>
                    <TD
                      style={{
                        color: "rgba(250,248,243,0.35)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(l.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TD>
                  </TR>
                ))}
              </DataTable>
            )}
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: SUBSCRIBERS
      ════════════════════════════════════════════════════════ */}
      {activeTab === "subscribers" && (
        <div className="rj-fade">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Total Subscribers",
                value: ss?.total,
                color: "#26c6da",
              },
              { label: "Active", value: ss?.active, color: "#81c784" },
              {
                label: "Inactive",
                value: ss ? ss.total - ss.active : 0,
                color: "#ef9a9a",
              },
            ].map((s) => (
              <div key={s.label} style={{ ...CARD, padding: "16px 18px" }}>
                <p
                  style={{
                    ...MUTED,
                    margin: "0 0 5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.label}
                </p>
                {loadingMap.subscribers ? (
                  <Skeleton h={28} w={60} />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SERIF,
                      fontSize: 28,
                      color: s.color,
                      fontWeight: 600,
                    }}
                  >
                    {(s.value ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SectionCard
            title="Newsletter Subscribers"
            subtitle={`${subscribers.length} subscribers`}
            onAction={fetchSubscribers}
            actionLabel="↻ Refresh"
          >
            {loadingMap.subscribers ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} h={50} />
                ))}
              </div>
            ) : subscribers.length === 0 ? (
              <EmptyState icon="✦" label="No subscribers yet" />
            ) : (
              <DataTable heads={["Email", "Status", "Subscribed On"]}>
                {subscribers.map((s, i) => (
                  <TR key={s._id || i}>
                    <TD>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Avatar text={s.email.slice(0, 2)} color="#26c6da" />
                        <span style={{ color: "rgba(250,248,243,0.85)" }}>
                          {s.email}
                        </span>
                      </div>
                    </TD>
                    <TD>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: s.isActive !== false ? "#81c784" : "#ef9a9a",
                        }}
                      >
                        {s.isActive !== false ? "● Active" : "○ Inactive"}
                      </span>
                    </TD>
                    <TD
                      style={{
                        color: "rgba(250,248,243,0.35)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(s.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </TD>
                  </TR>
                ))}
              </DataTable>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div style={{ ...CARD, padding: "22px 24px", marginTop: 24 }}>
        <h3
          style={{
            margin: "0 0 16px",
            fontFamily: SERIF,
            color: "#faf8f3",
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          Quick Actions
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
            gap: 12,
          }}
        >
          {[
            {
              label: "Add Product",
              icon: "◇",
              color: "#fcc151",
              path: "/admin/products/new",
            },
            {
              label: "New Collection",
              icon: "⬟",
              color: "#4caf50",
              path: "/admin/collections/new",
            },
            {
              label: "View Orders",
              icon: "◈",
              color: "#42a5f5",
              tab: "orders" as TabKey,
            },
            {
              label: "View Leads",
              icon: "◬",
              color: "#ef5350",
              tab: "leads" as TabKey,
            },
            {
              label: "Newsletter",
              icon: "✦",
              color: "#26c6da",
              tab: "subscribers" as TabKey,
            },
            {
              label: "Store Settings",
              icon: "◎",
              color: "#ab47bc",
              path: "/admin/settings",
            },
          ].map((a) => (
            <QuickActionItem
              key={a.label}
              a={a}
              router={router}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CollectionItem({ c, router }: { c: Collection; router: any }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        borderRadius: 12,
        cursor: "pointer",
        transition: "all 0.15s",
        background: hov ? "rgba(252,193,81,0.06)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${
          hov ? "rgba(252,193,81,0.2)" : "rgba(252,193,81,0.07)"
        }`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => router.push(`/admin/collections/${c._id}`)}
    >
      {c.heroImage ? (
        <img
          src={c.heroImage}
          alt={c.name}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            objectFit: "cover",
            border: "1px solid rgba(252,193,81,0.2)",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            flexShrink: 0,
            background: "rgba(252,193,81,0.1)",
            border: "1px solid rgba(252,193,81,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "#fcc151",
          }}
        >
          ⬟
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 3px",
            fontSize: 14,
            color: "#faf8f3",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {c.name}
        </p>
        <p style={{ ...MUTED, margin: 0, fontSize: 10 }}>/{c.slug}</p>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: c.isActive !== false ? "#81c784" : "#ef9a9a",
          }}
        >
          {c.isActive !== false ? "● Active" : "○ Inactive"}
        </span>

        {c.productCount !== undefined && (
          <p style={{ ...MUTED, margin: "3px 0 0", fontSize: 10 }}>
            {c.productCount} products
          </p>
        )}
      </div>
    </div>
  );
}
