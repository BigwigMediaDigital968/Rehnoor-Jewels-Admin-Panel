"use client";

import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
// TYPES — swap these out when API is ready
// ─────────────────────────────────────────────
interface StatCardData {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  change: number;
  icon: string;
  accent: string;
  sparkline?: number[];
}

interface OrderRow {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: "Delivered" | "Processing" | "Shipped" | "Pending" | "Cancelled";
  date: string;
  avatar: string;
}

interface CollectionRow {
  name: string;
  products: number;
  revenue: string;
  trend: number;
  category: string;
}

interface TopProduct {
  name: string;
  category: string;
  sold: number;
  revenue: string;
  stock: number;
  image: string;
}

// ─────────────────────────────────────────────
// DUMMY DATA — replace with API calls later
// ─────────────────────────────────────────────
const STATS: StatCardData[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "₹24.8L",
    subValue: "This month",
    change: +18,
    icon: "◈",
    accent: "#fcc151",
    sparkline: [40, 55, 48, 70, 65, 82, 75, 90, 85, 102, 95, 115],
  },
  {
    id: "orders",
    label: "Total Orders",
    value: "3,284",
    subValue: "All time",
    change: +12,
    icon: "◇",
    accent: "#4caf50",
    sparkline: [20, 35, 28, 45, 38, 55, 48, 62, 58, 70, 65, 80],
  },
  {
    id: "customers",
    label: "Active Customers",
    value: "1,847",
    subValue: "Registered",
    change: +9,
    icon: "◉",
    accent: "#42a5f5",
    sparkline: [30, 28, 35, 32, 40, 38, 45, 42, 50, 48, 55, 60],
  },
  {
    id: "aov",
    label: "Avg Order Value",
    value: "₹7,550",
    subValue: "Per order",
    change: +5,
    icon: "⬡",
    accent: "#ab47bc",
    sparkline: [60, 58, 65, 62, 68, 66, 72, 70, 74, 72, 78, 76],
  },
];

const PRODUCT_STATS = {
  total: 184,
  active: 142,
  inactive: 28,
  outOfStock: 14,
  newThisMonth: 12,
};

const COLLECTION_STATS = {
  total: 18,
  active: 14,
  inactive: 4,
  totalCategories: 7,
  featuredCollections: 5,
};

const CATEGORY_BREAKDOWN = [
  { name: "Necklaces", count: 48, pct: 26, color: "#fcc151" },
  { name: "Earrings", count: 36, pct: 20, color: "#4caf50" },
  { name: "Rings", count: 32, pct: 17, color: "#42a5f5" },
  { name: "Bangles", count: 28, pct: 15, color: "#ab47bc" },
  { name: "Bracelets", count: 22, pct: 12, color: "#ef5350" },
  { name: "Pendants", count: 18, pct: 10, color: "#26c6da" },
];

const ORDERS: OrderRow[] = [
  {
    id: "#RJ-3284",
    customer: "Aisha Malik",
    product: "Rose Gold Necklace Set",
    amount: "₹18,500",
    status: "Delivered",
    date: "27 Mar",
    avatar: "AM",
  },
  {
    id: "#RJ-3283",
    customer: "Priya Sharma",
    product: "Diamond Earrings Pair",
    amount: "₹32,999",
    status: "Processing",
    date: "27 Mar",
    avatar: "PS",
  },
  {
    id: "#RJ-3282",
    customer: "Fatima Khan",
    product: "Emerald Cocktail Ring",
    amount: "₹11,200",
    status: "Shipped",
    date: "26 Mar",
    avatar: "FK",
  },
  {
    id: "#RJ-3281",
    customer: "Meera Patel",
    product: "Gold Bangles (4 Piece)",
    amount: "₹26,100",
    status: "Delivered",
    date: "26 Mar",
    avatar: "MP",
  },
  {
    id: "#RJ-3280",
    customer: "Sana Qureshi",
    product: "Pearl Pendant Chain",
    amount: "₹8,750",
    status: "Pending",
    date: "25 Mar",
    avatar: "SQ",
  },
  {
    id: "#RJ-3279",
    customer: "Divya Nair",
    product: "Kundan Choker Necklace",
    amount: "₹42,000",
    status: "Delivered",
    date: "25 Mar",
    avatar: "DN",
  },
  {
    id: "#RJ-3278",
    customer: "Rania Ahmed",
    product: "Platinum Wedding Band",
    amount: "₹55,500",
    status: "Shipped",
    date: "24 Mar",
    avatar: "RA",
  },
];

const COLLECTIONS: CollectionRow[] = [
  {
    name: "Bridal Collection",
    products: 48,
    revenue: "₹3.8L",
    trend: +15,
    category: "Wedding",
  },
  {
    name: "Gold Classics",
    products: 32,
    revenue: "₹2.9L",
    trend: +8,
    category: "Everyday",
  },
  {
    name: "Gemstone Series",
    products: 24,
    revenue: "₹2.1L",
    trend: +22,
    category: "Premium",
  },
  {
    name: "Daily Wear",
    products: 56,
    revenue: "₹1.4L",
    trend: -3,
    category: "Casual",
  },
  {
    name: "Heritage Heirlooms",
    products: 18,
    revenue: "₹4.2L",
    trend: +31,
    category: "Luxury",
  },
  {
    name: "Modern Minimal",
    products: 22,
    revenue: "₹0.9L",
    trend: +5,
    category: "Contemporary",
  },
];

const TOP_PRODUCTS: TopProduct[] = [
  {
    name: "Rose Gold Pendant Necklace",
    category: "Necklaces",
    sold: 142,
    revenue: "₹2.1L",
    stock: 24,
    image: "◈",
  },
  {
    name: "Diamond Solitaire Ring",
    category: "Rings",
    sold: 98,
    revenue: "₹3.4L",
    stock: 8,
    image: "◇",
  },
  {
    name: "Kundan Jhumka Earrings",
    category: "Earrings",
    sold: 187,
    revenue: "₹1.6L",
    stock: 35,
    image: "⬟",
  },
  {
    name: "Gold Kada Bangle",
    category: "Bangles",
    sold: 124,
    revenue: "₹1.8L",
    stock: 16,
    image: "◉",
  },
  {
    name: "Pearl Layered Bracelet",
    category: "Bracelets",
    sold: 76,
    revenue: "₹0.8L",
    stock: 42,
    image: "⬡",
  },
];

const MONTHLY_REVENUE = [
  88, 102, 94, 118, 108, 134, 126, 158, 148, 172, 165, 196,
];
const WEEKLY_ORDERS = [42, 68, 55, 89, 74, 96, 61];
const ORDER_STATUS_DATA = [
  { label: "Pending", value: 42, color: "#ef9a9a", bg: "rgba(239,83,80,0.12)" },
  {
    label: "Processing",
    value: 108,
    color: "#fcc151",
    bg: "rgba(252,193,81,0.12)",
  },
  {
    label: "Shipped",
    value: 234,
    color: "#64b5f6",
    bg: "rgba(33,150,243,0.12)",
  },
  {
    label: "Delivered",
    value: 2862,
    color: "#81c784",
    bg: "rgba(76,175,80,0.12)",
  },
  {
    label: "Cancelled",
    value: 38,
    color: "#ff8a65",
    bg: "rgba(255,87,34,0.12)",
  },
];

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────
const STATUS_STYLE: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Delivered: {
    bg: "rgba(76,175,80,0.13)",
    color: "#81c784",
    border: "rgba(76,175,80,0.25)",
  },
  Processing: {
    bg: "rgba(252,193,81,0.13)",
    color: "#fcc151",
    border: "rgba(252,193,81,0.28)",
  },
  Shipped: {
    bg: "rgba(33,150,243,0.13)",
    color: "#64b5f6",
    border: "rgba(33,150,243,0.28)",
  },
  Pending: {
    bg: "rgba(239,83,80,0.13)",
    color: "#ef9a9a",
    border: "rgba(239,83,80,0.25)",
  },
  Cancelled: {
    bg: "rgba(255,87,34,0.12)",
    color: "#ff8a65",
    border: "rgba(255,87,34,0.22)",
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const CARD_BASE: React.CSSProperties = {
  background:
    "linear-gradient(160deg, rgba(0,55,32,0.55) 0%, rgba(0,36,16,0.75) 100%)",
  border: "1px solid rgba(252,193,81,0.12)",
  borderRadius: 16,
  overflow: "hidden",
  position: "relative",
};

const SECTION_TITLE: React.CSSProperties = {
  margin: "0 0 4px",
  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  color: "var(--rj-ivory)",
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: "0.02em",
};

const MUTED: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(250,248,243,0.4)",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

// ─────────────────────────────────────────────
// SPARKLINE SVG
// ─────────────────────────────────────────────
function Sparkline({
  data,
  color = "#fcc151",
  height = 44,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
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
  const uid = color.replace("#", "sg");
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
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
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* last point dot */}
      {(() => {
        const last = data[data.length - 1];
        const x = w;
        const y = height - ((last - min) / range) * (height - 6) - 3;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
}

// ─────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────
function BarChart({
  data,
  labels,
  color = "#fcc151",
}: {
  data: number[];
  labels: string[];
  color?: string;
}) {
  const max = Math.max(...data);
  return (
    <div
      style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 90 }}
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
                i === data.indexOf(Math.max(...data))
                  ? `linear-gradient(180deg, ${color}, ${color}cc)`
                  : `rgba(252,193,81,0.22)`,
              transition: "height 0.6s cubic-bezier(0.4,0,0.2,1)",
              cursor: "default",
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

// ─────────────────────────────────────────────
// DONUT CHART (pure SVG)
// ─────────────────────────────────────────────
function DonutChart({
  data,
}: {
  data: { name: string; count: number; pct: number; color: string }[];
}) {
  const r = 52,
    cx = 64,
    cy = 64,
    stroke = 18;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
      />
      {data.map((d, i) => {
        const dash = (d.pct / 100) * circumference;
        const offset = circumference - (cumulative * circumference) / 100;
        cumulative += d.pct;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "64px 64px",
              transition: "stroke-dasharray 0.8s ease",
            }}
          />
        );
      })}
      {/* center label */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="#faf8f3"
        fontSize="16"
        fontFamily="'Cormorant Garamond', serif"
        fontWeight="600"
      >
        184
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="rgba(250,248,243,0.4)"
        fontSize="8"
        fontFamily="'DM Sans', sans-serif"
        letterSpacing="1"
      >
        PRODUCTS
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
function StatCard({ d }: { d: StatCardData }) {
  const isPos = d.change >= 0;
  return (
    <div style={{ ...CARD_BASE, padding: "22px 22px 18px" }}>
      {/* glow */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${d.accent}28 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <p
            style={{
              ...MUTED,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            {d.label}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32,
              color: "var(--rj-ivory)",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {d.value}
          </p>
          {d.subValue && <p style={{ ...MUTED, marginTop: 3 }}>{d.subValue}</p>}
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${d.accent}20`,
            border: `1px solid ${d.accent}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          <span style={{ color: d.accent }}>{d.icon}</span>
        </div>
      </div>

      {d.sparkline && (
        <div style={{ marginBottom: 10 }}>
          <Sparkline data={d.sparkline} color={d.accent} height={40} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            color: isPos ? "#81c784" : "#ef9a9a",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span>{isPos ? "▲" : "▼"}</span>
          <span>{Math.abs(d.change)}%</span>
        </span>
        <span style={{ ...MUTED }}>vs last month</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MINI METRIC PILL
// ─────────────────────────────────────────────
function MetricPill({
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
        background: `${color}12`,
        border: `1px solid ${color}22`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16, color }}>{icon}</span>
        <span
          style={{
            fontSize: 13,
            color: "rgba(250,248,243,0.65)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 20,
          color: "var(--rj-ivory)",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────
function Section({
  title,
  subtitle,
  action,
  actionLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...CARD_BASE, padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h3 style={SECTION_TITLE}>{title}</h3>
          {subtitle && <p style={{ ...MUTED, marginTop: 3 }}>{subtitle}</p>}
        </div>
        {action && (
          <button
            onClick={action}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid rgba(252,193,81,0.25)",
              background: "transparent",
              color: "var(--rj-gold)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(252,193,81,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {actionLabel ?? "View All →"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────
export default function DummyDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "var(--rj-ivory)",
      }}
    >
      {/* ── Page heading ─────────────────────────── */}
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
            <h1
              style={{
                margin: "0 0 4px",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                fontWeight: 600,
                color: "var(--rj-ivory)",
                letterSpacing: "0.02em",
              }}
            >
              Good morning, Admin ✦
            </h1>
            <p style={{ ...MUTED, fontSize: 13 }}>
              {today} · Here's what's happening with your store today.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                padding: "9px 18px",
                borderRadius: 9,
                border: "1px solid rgba(252,193,81,0.25)",
                background: "rgba(252,193,81,0.07)",
                color: "var(--rj-gold)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              ↓ Export Report
            </button>
            <button
              style={{
                padding: "9px 18px",
                borderRadius: 9,
                border: "none",
                background: "var(--gradient-gold)",
                color: "var(--rj-emerald-dark)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.04em",
                boxShadow: "var(--shadow-gold)",
              }}
            >
              + Add Product
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Stats Row ─────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {STATS.map((s) => (
          <StatCard key={s.id} d={s} />
        ))}
      </div>

      {/* ── Revenue Chart + Weekly Orders ─────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Revenue Trend */}
        <Section
          title="Revenue Trend"
          subtitle="Monthly performance — last 12 months"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: "var(--rj-gold)",
                }}
              >
                ₹24.8L
              </p>
              <p style={{ ...MUTED, marginTop: 2 }}>
                YTD Revenue ·{" "}
                <span style={{ color: "#81c784" }}>▲ 18% YoY</span>
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["1W", "1M", "3M", "1Y"].map((t, i) => (
                <button
                  key={t}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    border:
                      i === 3
                        ? "1px solid rgba(252,193,81,0.4)"
                        : "1px solid rgba(252,193,81,0.12)",
                    background:
                      i === 3 ? "rgba(252,193,81,0.1)" : "transparent",
                    color:
                      i === 3 ? "var(--rj-gold)" : "rgba(250,248,243,0.35)",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Sparkline data={MONTHLY_REVENUE} color="#fcc151" height={80} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].map((m) => (
              <span
                key={m}
                style={{ fontSize: 9, color: "rgba(250,248,243,0.3)" }}
              >
                {m}
              </span>
            ))}
          </div>
        </Section>

        {/* Weekly Orders */}
        <Section title="Weekly Orders" subtitle="This week's volume">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                fontWeight: 600,
                color: "var(--rj-ivory)",
              }}
            >
              485
            </p>
            <span
              style={{
                fontSize: 11,
                background: "rgba(252,193,81,0.1)",
                color: "var(--rj-gold)",
                border: "1px solid rgba(252,193,81,0.2)",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              This week
            </span>
          </div>
          <BarChart
            data={WEEKLY_ORDERS}
            labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 16,
            }}
          >
            {[
              { l: "Avg/day", v: "69" },
              { l: "Peak day", v: "Sat" },
              { l: "Growth", v: "+12%" },
              { l: "Returns", v: "3" },
            ].map((x) => (
              <div
                key={x.l}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(252,193,81,0.07)",
                  textAlign: "center",
                }}
              >
                <p style={{ ...MUTED, margin: "0 0 2px", fontSize: 10 }}>
                  {x.l}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 18,
                    color: "var(--rj-ivory)",
                    fontWeight: 600,
                  }}
                >
                  {x.v}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Products + Collections + Categories ───── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Products overview */}
        <Section title="Products" subtitle="Catalogue health">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <MetricPill
              label="Total Products"
              value={PRODUCT_STATS.total}
              color="#fcc151"
              icon="◇"
            />
            <MetricPill
              label="Active"
              value={PRODUCT_STATS.active}
              color="#4caf50"
              icon="●"
            />
            <MetricPill
              label="Inactive / Hidden"
              value={PRODUCT_STATS.inactive}
              color="#ef5350"
              icon="○"
            />
            <MetricPill
              label="Out of Stock"
              value={PRODUCT_STATS.outOfStock}
              color="#ff8a65"
              icon="⚠"
            />
            <MetricPill
              label="Added This Month"
              value={PRODUCT_STATS.newThisMonth}
              color="#42a5f5"
              icon="✦"
            />
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(76,175,80,0.08)",
              border: "1px solid rgba(76,175,80,0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(250,248,243,0.6)" }}>
              Catalogue health
            </span>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                color: "#81c784",
                fontWeight: 600,
              }}
            >
              {Math.round((PRODUCT_STATS.active / PRODUCT_STATS.total) * 100)}%
            </span>
          </div>
        </Section>

        {/* Collections overview */}
        <Section title="Collections" subtitle="Store organisation">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <MetricPill
              label="Total Collections"
              value={COLLECTION_STATS.total}
              color="#fcc151"
              icon="⬟"
            />
            <MetricPill
              label="Active"
              value={COLLECTION_STATS.active}
              color="#4caf50"
              icon="●"
            />
            <MetricPill
              label="Inactive / Drafts"
              value={COLLECTION_STATS.inactive}
              color="#ef5350"
              icon="○"
            />
            <MetricPill
              label="Total Categories"
              value={COLLECTION_STATS.totalCategories}
              color="#42a5f5"
              icon="⬡"
            />
            <MetricPill
              label="Featured Collections"
              value={COLLECTION_STATS.featuredCollections}
              color="#ab47bc"
              icon="◈"
            />
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 8,
                border: "1px solid rgba(252,193,81,0.2)",
                background: "rgba(252,193,81,0.06)",
                color: "var(--rj-gold)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              + New Collection
            </button>
            <button
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: 8,
                border: "1px solid rgba(252,193,81,0.12)",
                background: "transparent",
                color: "rgba(250,248,243,0.5)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Manage All →
            </button>
          </div>
        </Section>

        {/* Category donut */}
        <Section title="By Category" subtitle="Product distribution">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <DonutChart data={CATEGORY_BREAKDOWN} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                flex: 1,
              }}
            >
              {CATEGORY_BREAKDOWN.map((c) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: c.color,
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{ fontSize: 12, color: "rgba(250,248,243,0.65)" }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 3,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${c.pct}%`,
                          height: "100%",
                          background: c.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(250,248,243,0.45)",
                        width: 26,
                        textAlign: "right",
                      }}
                    >
                      {c.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ── Recent Orders + Collections list ──────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Orders table */}
        <Section
          title="Recent Orders"
          subtitle="Latest transactions"
          actionLabel="View All →"
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 560,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Product",
                    "Amount",
                    "Status",
                    "Date",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "0 10px 12px",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(250,248,243,0.35)",
                        fontWeight: 600,
                        borderBottom: "1px solid rgba(252,193,81,0.08)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ORDERS.map((o, i) => {
                  const sc = STATUS_STYLE[o.status];
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid rgba(252,193,81,0.05)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLTableRowElement
                        ).style.background = "rgba(255,255,255,0.02)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLTableRowElement
                        ).style.background = "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "11px 10px",
                          fontSize: 12,
                          color: "var(--rj-gold)",
                          fontFamily: "'DM Sans', sans-serif",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.id}
                      </td>
                      <td style={{ padding: "11px 10px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: "rgba(252,193,81,0.15)",
                              border: "1px solid rgba(252,193,81,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: "var(--rj-gold)",
                              flexShrink: 0,
                            }}
                          >
                            {o.avatar}
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              color: "rgba(250,248,243,0.85)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {o.customer}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "11px 10px",
                          fontSize: 12,
                          color: "rgba(250,248,243,0.65)",
                          maxWidth: 150,
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o.product}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "11px 10px",
                          fontSize: 13,
                          color: "var(--rj-ivory)",
                          fontFamily: "'Cormorant Garamond', serif",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.amount}
                      </td>
                      <td style={{ padding: "11px 10px" }}>
                        <span
                          style={{
                            background: sc.bg,
                            color: sc.color,
                            border: `1px solid ${sc.border}`,
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "11px 10px",
                          fontSize: 11,
                          color: "rgba(250,248,243,0.35)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Collections list */}
        <Section
          title="Collections"
          subtitle="Performance by collection"
          actionLabel="Manage →"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {COLLECTIONS.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(252,193,81,0.07)",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "rgba(252,193,81,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    "rgba(255,255,255,0.025)";
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.trend > 0 ? "#81c784" : "#ef9a9a",
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${c.trend > 0 ? "#81c784" : "#ef9a9a"}`,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--rj-ivory)",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </p>
                  <p style={{ ...MUTED, margin: "2px 0 0", fontSize: 10 }}>
                    {c.products} products · {c.revenue}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: c.trend > 0 ? "#81c784" : "#ef9a9a",
                    }}
                  >
                    {c.trend > 0 ? "▲" : "▼"} {Math.abs(c.trend)}%
                  </p>
                  <p style={{ ...MUTED, margin: "2px 0 0", fontSize: 10 }}>
                    {c.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Order Status Summary + Top Products ───── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Order status */}
        <Section title="Order Status" subtitle="Current fulfilment snapshot">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ORDER_STATUS_DATA.map((s) => {
              const total = ORDER_STATUS_DATA.reduce((a, x) => a + x.value, 0);
              const pct = Math.round((s.value / total) * 100);
              return (
                <div key={s.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: s.color,
                          display: "inline-block",
                          boxShadow: `0 0 5px ${s.color}`,
                        }}
                      />
                      <span
                        style={{ fontSize: 12, color: "rgba(250,248,243,0.7)" }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 17,
                          color: s.color,
                          fontWeight: 600,
                        }}
                      >
                        {s.value.toLocaleString()}
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
                        background: s.color,
                        borderRadius: 2,
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Total */}
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
            <span style={{ fontSize: 12, color: "rgba(250,248,243,0.55)" }}>
              Total Orders
            </span>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22,
                color: "var(--rj-gold)",
                fontWeight: 600,
              }}
            >
              {ORDER_STATUS_DATA.reduce(
                (a, s) => a + s.value,
                0,
              ).toLocaleString()}
            </span>
          </div>
        </Section>

        {/* Top products */}
        <Section
          title="Top Products"
          subtitle="Best performers by units sold"
          actionLabel="Full Catalogue →"
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Product", "Category", "Sold", "Revenue", "Stock"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "0 8px 10px",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(250,248,243,0.3)",
                        fontWeight: 600,
                        borderBottom: "1px solid rgba(252,193,81,0.08)",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid rgba(252,193,81,0.05)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "transparent";
                  }}
                >
                  <td style={{ padding: "11px 8px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "rgba(252,193,81,0.1)",
                          border: "1px solid rgba(252,193,81,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {p.image}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--rj-ivory)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 130,
                          display: "block",
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 8px" }}>
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
                      {p.category}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "11px 8px",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 16,
                      color: "var(--rj-ivory)",
                      fontWeight: 600,
                    }}
                  >
                    {p.sold}
                  </td>
                  <td
                    style={{
                      padding: "11px 8px",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 15,
                      color: "var(--rj-gold)",
                      fontWeight: 600,
                    }}
                  >
                    {p.revenue}
                  </td>
                  <td style={{ padding: "11px 8px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          p.stock < 10
                            ? "#ef9a9a"
                            : p.stock < 20
                            ? "#fcc151"
                            : "#81c784",
                      }}
                    >
                      {p.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      {/* ── Quick Actions ─────────────────────────── */}
      <div style={{ ...CARD_BASE, padding: "22px 24px" }}>
        <h3 style={{ ...SECTION_TITLE, marginBottom: 16 }}>Quick Actions</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6,1fr)",
            gap: 12,
          }}
        >
          {[
            { label: "Add Product", icon: "◇", color: "#fcc151" },
            { label: "New Collection", icon: "⬟", color: "#4caf50" },
            { label: "Process Orders", icon: "◈", color: "#42a5f5" },
            { label: "Add Customer", icon: "◉", color: "#ab47bc" },
            { label: "View Analytics", icon: "◬", color: "#ef5350" },
            { label: "Store Settings", icon: "◎", color: "#26c6da" },
          ].map((a) => (
            <button
              key={a.label}
              style={{
                padding: "14px 10px",
                borderRadius: 12,
                border: `1px solid ${a.color}22`,
                background: `${a.color}0d`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${a.color}20`;
                e.currentTarget.style.borderColor = `${a.color}44`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${a.color}0d`;
                e.currentTarget.style.borderColor = `${a.color}22`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  color: a.color,
                  filter: `drop-shadow(0 0 4px ${a.color}88)`,
                }}
              >
                {a.icon}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(250,248,243,0.65)",
                  fontFamily: "'DM Sans', sans-serif",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
