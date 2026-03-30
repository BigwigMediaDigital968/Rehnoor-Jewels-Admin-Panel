"use client";

import { useState } from "react";

const PAGE_META: Record<string, { label: string; icon: string }> = {
  dashboard: { label: "Dashboard", icon: "⬡" },
  orders: { label: "Orders", icon: "◈" },
  products: { label: "Products", icon: "◇" },
  collections: { label: "Collections", icon: "⬟" },
  customers: { label: "Customers", icon: "◉" },
  analytics: { label: "Analytics", icon: "◬" },
  settings: { label: "Settings", icon: "◎" },
};

import { usePathname } from "next/navigation";

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const pathname = usePathname();

  const getActivePage = () => {
    if (pathname.includes("products")) return "products";
    if (pathname.includes("orders")) return "orders";
    if (pathname.includes("customers")) return "customers";
    if (pathname.includes("analytics")) return "analytics";
    if (pathname.includes("settings")) return "settings";
    return "dashboard";
  };

  const activePage = getActivePage();

  const meta = PAGE_META[activePage] ?? { label: activePage, icon: "◆" };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: "var(--z-header)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        gap: 20,
        background: "rgba(0,36,16,0.97)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--glass-border)",
        boxShadow: "0 2px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* ── Left: page title ────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 22,
            color: "var(--rj-gold)",
            filter: "drop-shadow(0 0 6px rgba(252,193,81,0.5))",
            lineHeight: 1,
          }}
        >
          {meta.icon}
        </span>
        <div>
          <p
            className="font-accent"
            style={{
              margin: 0,
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(252,193,81,0.4)",
              lineHeight: 1,
              marginBottom: 3,
            }}
          >
            Admin
          </p>
          <h2
            className="font-display"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "var(--rj-ivory)",
              letterSpacing: "0.03em",
              lineHeight: 1,
            }}
          >
            {meta.label}
          </h2>
        </div>

        {/* Date pill */}
        <span
          className="font-body"
          style={{
            marginLeft: 8,
            fontSize: 11,
            color: "rgba(250,248,243,0.3)",
            letterSpacing: "0.03em",
            display: "none" /* show on md+ via CSS if needed */,
          }}
        >
          {today}
        </span>
      </div>

      {/* ── Right: actions ──────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: searchFocused
              ? "rgba(255,255,255,0.07)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              searchFocused ? "rgba(252,193,81,0.35)" : "rgba(252,193,81,0.12)"
            }`,
            borderRadius: 10,
            padding: "8px 14px",
            width: 200,
            transition: "var(--transition-smooth)",
            boxShadow: searchFocused
              ? "0 0 0 3px rgba(252,193,81,0.08)"
              : "none",
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: "rgba(250,248,243,0.35)",
              lineHeight: 1,
            }}
          >
            ⌕
          </span>
          <input
            placeholder="Search…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--rj-ivory)",
              fontSize: 13,
              fontFamily: "var(--font-body, 'DM Sans'), system-ui, sans-serif",
              width: "100%",
            }}
          />
        </div>

        {/* Notification bell */}
        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            color: "rgba(250,248,243,0.55)",
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "var(--transition-smooth)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--rj-gold)";
            e.currentTarget.style.borderColor = "rgba(252,193,81,0.4)";
            e.currentTarget.style.background = "rgba(252,193,81,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(250,248,243,0.55)";
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.background = "var(--glass-bg)";
          }}
        >
          🔔
          <span
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--rj-gold)",
              boxShadow: "0 0 6px var(--rj-gold)",
              border: "1.5px solid rgba(0,36,16,0.9)",
            }}
          />
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 26,
            background: "var(--glass-border)",
            flexShrink: 0,
          }}
        />

        {/* Avatar + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--gradient-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "var(--rj-emerald-dark)",
              fontSize: 13,
              flexShrink: 0,
              border: "2px solid rgba(252,193,81,0.3)",
              boxShadow: "0 2px 10px rgba(252,193,81,0.2)",
            }}
          >
            A
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div
              className="font-body"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--rj-ivory)",
                whiteSpace: "nowrap",
              }}
            >
              Admin
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 10,
                color: "rgba(250,248,243,0.4)",
                letterSpacing: "0.04em",
              }}
            >
              Super Admin
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 26,
            background: "var(--glass-border)",
            flexShrink: 0,
          }}
        />

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            border: "1px solid var(--glass-border)",
            background: "transparent",
            color: "rgba(250,248,243,0.45)",
            fontSize: 11,
            fontFamily: "var(--font-body, 'DM Sans'), system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "var(--transition-smooth)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--rj-gold)";
            e.currentTarget.style.borderColor = "rgba(252,193,81,0.4)";
            e.currentTarget.style.background = "rgba(252,193,81,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(250,248,243,0.45)";
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
