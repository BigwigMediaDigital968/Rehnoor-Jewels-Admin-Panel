"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Bell,
  Search,
  X,
  Check,
} from "lucide-react";

// ─── Page meta ────────────────────────────────────────────────────────────────
const PAGE_META: Record<string, { label: string; icon: React.ElementType }> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  orders: { label: "Orders", icon: ShoppingCart },
  products: { label: "Products", icon: Package },
  collections: { label: "Collections", icon: Package },
  customers: { label: "Customers", icon: Users },
  analytics: { label: "Analytics", icon: BarChart2 },
  settings: { label: "Settings", icon: Settings },
  newsletter: { label: "Newsletter", icon: LayoutDashboard },
  leads: { label: "Lead Management", icon: Users },
  reviews: { label: "Reviews", icon: LayoutDashboard },
  discount: { label: "Discount & Coupon", icon: Package },
  blog: { label: "Blog Management", icon: Package },
};

interface AdminHeaderProps {
  onLogout: () => void;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#003720",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: 12,
        boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
        fontFamily: "Cinzel, serif",
        fontSize: 12,
        letterSpacing: "0.06em",
        animation: "slideIn 0.22s ease",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "rgba(252,193,81,0.2)",
          border: "1.5px solid #FCC151",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Check size={11} color="#FCC151" />
      </div>
      {message}
      <style>{`@keyframes slideIn{from{transform:translateX(32px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmLogoutModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          animation: "scaleIn 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "#fef2f2",
            border: "1.5px solid #fecaca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <LogOut size={20} color="#ef4444" />
        </div>

        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#1C1C1C",
            marginBottom: 8,
          }}
        >
          Sign Out?
        </div>
        <p
          style={{
            fontFamily: "sans-serif",
            fontSize: 13,
            color: "#9B8E7E",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          You will be logged out of the admin console. Any unsaved changes will
          be lost.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              cursor: "pointer",
              border: "1.5px solid #E8DFD0",
              background: "transparent",
              fontFamily: "Cinzel, serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#1C1C1C",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F5F0")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              cursor: "pointer",
              border: "none",
              background: "#ef4444",
              fontFamily: "Cinzel, serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; }                              to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HEADER
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Derive active page from pathname
  const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const pageKey = (() => {
    if (segment.includes("order")) return "orders";
    if (segment.includes("product")) return "products";
    if (segment.includes("collection")) return "collections";
    if (segment.includes("customer")) return "customers";
    if (segment.includes("newsletter")) return "newsletter";
    if (segment.includes("lead")) return "leads";
    if (segment.includes("review")) return "reviews";
    if (segment.includes("discount")) return "discount";
    if (segment.includes("blog")) return "blog";
    if (segment.includes("analytic")) return "analytics";
    if (segment.includes("setting")) return "settings";
    return "dashboard";
  })();

  const meta = PAGE_META[pageKey] ?? { label: "Admin", icon: LayoutDashboard };
  const Icon = meta.icon;

  const handleLogoutConfirm = () => {
    setShowConfirm(false);
    setShowToast(true);
    // Give toast 1 second to show, then actually log out
    setTimeout(() => {
      onLogout();
    }, 1200);
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      {/* ── Modals / Toasts ─────────────────────────────────────────────────── */}
      {showConfirm && (
        <ConfirmLogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showToast && (
        <Toast
          message="Signed out successfully"
          onDone={() => setShowToast(false)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        style={{
          height: 62,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          gap: 16,
          background: "rgba(0,36,16,0.97)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.25)",
        }}
      >
        {/* ── Left: page title ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "rgba(252,193,81,0.12)",
              border: "1px solid rgba(252,193,81,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={15} color="#FCC151" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(252,193,81,0.4)",
                marginBottom: 2,
              }}
            >
              Admin Console
            </div>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#FAF8F3",
                letterSpacing: "0.03em",
                lineHeight: 1,
              }}
            >
              {meta.label}
            </div>
          </div>

          {/* Date — hidden on small screens */}
          <div
            style={{
              marginLeft: 6,
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontFamily: "sans-serif",
              fontSize: 11,
              color: "rgba(250,248,243,0.3)",
              letterSpacing: "0.03em",
              display: "var(--date-display, none)",
            }}
          >
            {today}
          </div>
        </div>

        {/* ── Right: actions ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: searchFocused
                ? "rgba(255,255,255,0.07)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                searchFocused
                  ? "rgba(252,193,81,0.35)"
                  : "rgba(255,255,255,0.1)"
              }`,
              borderRadius: 9,
              padding: "0 12px",
              height: 36,
              width: searchFocused ? 200 : 150,
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: searchFocused
                ? "0 0 0 3px rgba(252,193,81,0.08)"
                : "none",
            }}
          >
            <Search
              size={13}
              color="rgba(250,248,243,0.35)"
              style={{ flexShrink: 0 }}
            />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#FAF8F3",
                fontSize: 12,
                fontFamily: "sans-serif",
                width: "100%",
              }}
            />
            {searchVal && (
              <button
                onClick={() => setSearchVal("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={11} color="rgba(250,248,243,0.35)" />
              </button>
            )}
          </div>

          {/* Notification bell */}
          {/* <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(252,193,81,0.4)";
              e.currentTarget.style.background = "rgba(252,193,81,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
          >
            <Bell size={15} color="rgba(250,248,243,0.55)" />
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#FCC151",
                boxShadow: "0 0 5px #FCC151",
                border: "1.5px solid rgba(0,36,16,0.95)",
              }}
            />
          </button> */}

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 24,
              background: "rgba(255,255,255,0.09)",
              flexShrink: 0,
            }}
          />

          {/* Avatar + name */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#FCC151,#e8a820)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Cinzel, serif",
                fontWeight: 700,
                color: "#003720",
                fontSize: 13,
                flexShrink: 0,
                border: "2px solid rgba(252,193,81,0.3)",
                boxShadow: "0 2px 8px rgba(252,193,81,0.2)",
              }}
            >
              A
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#FAF8F3",
                }}
              >
                Admin
              </div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 10,
                  color: "rgba(250,248,243,0.38)",
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
              height: 24,
              background: "rgba(255,255,255,0.09)",
              flexShrink: 0,
            }}
          />

          {/* Logout */}
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              fontFamily: "Cinzel, serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(250,248,243,0.45)",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
              e.currentTarget.style.background = "rgba(239,68,68,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(250,248,243,0.45)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={13} />
            <span style={{ display: "var(--logout-label, none)" }}>Logout</span>
          </button>
        </div>

        {/* Responsive CSS */}
        <style>{`
          @media (min-width: 900px) {
            header { --date-display: block; --logout-label: inline; }
          }
        `}</style>
      </header>
    </>
  );
}
