"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Mail,
  Users,
  Target,
  Star,
  Tag,
  FileText,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    children: [
      { id: "all-products", label: "All Products", href: "/admin/products" },
      { id: "add-product", label: "Add Product", href: "/admin/products/add" },
    ],
  },
  {
    id: "collections",
    label: "Collections",
    icon: FolderOpen,
    children: [
      {
        id: "collections",
        label: "Collection List",
        href: "/admin/collections",
      },
    ],
  },
  {
    id: "orders",
    label: "Order Management",
    icon: ShoppingCart,
    href: "/admin/order-management",
  },
  {
    id: "news",
    label: "Newsletter",
    icon: Mail,
    href: "/admin/newsletter-management",
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    href: "/admin/customer-management",
  },
  {
    id: "leads",
    label: "Lead Management",
    icon: Target,
    href: "/admin/leads",
  },
  {
    id: "reviews",
    label: "Reviews & Ratings",
    icon: Star,
    href: "/admin/reviews-management",
  },
  {
    id: "discount",
    label: "Discount & Coupon",
    icon: Tag,
    href: "/admin/discount-coupon-management",
  },
  {
    id: "blog",
    label: "Blog Management",
    icon: FileText,
    href: "/admin/blog-management",
  },
];

// ─── Shared ───────────────────────────────────────────────────────────────────
const SIDEBAR_W = 256;
const COLLAPSED_W = 72;
const MOBILE_BREAK = 768;

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // ── Responsive detection ─────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < MOBILE_BREAK;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Close mobile drawer on route change ──────────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ── Auto-open parent menus that contain the active child ─────────────────
  useEffect(() => {
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((c) => c.href === pathname)) {
        setOpenMenus((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  }, [pathname]);

  const toggleMenu = (id: string) =>
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));

  const isActive = (href?: string) => !!href && pathname === href;
  const isChildActive = (item: (typeof NAV_ITEMS)[0]) =>
    item.children?.some((c) => c.href === pathname);

  // ─── The actual sidebar content ──────────────────────────────────────────
  const SidebarContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Logo / Header ─────────────────────────────────────────────── */}
      <div
        style={{
          padding: collapsed && !isMobile ? "20px 0" : "20px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && !isMobile ? "center" : "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
          minHeight: 72,
        }}
      >
        {/* Logo mark — always visible */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(252,193,81,0.18)",
              border: "1.5px solid rgba(252,193,81,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 16,
              color: "#fff",
            }}
          >
            ✦
          </div>

          <div
            style={{
              overflow: "hidden",
              transition:
                "max-width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
              maxWidth: collapsed && !isMobile ? 0 : 160,
              opacity: collapsed && !isMobile ? 0 : 1,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#FCC151",
                letterSpacing: "0.1em",
              }}
            >
              REHNOOR
            </div>
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Admin Console
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "10px 8px",
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          nav::-webkit-scrollbar { display: none; }
          .nav-item-btn { transition: background 0.18s ease, color 0.18s ease; }
          .nav-item-btn:hover { background: rgba(255,255,255,0.07) !important; }
          .sub-item-btn { transition: background 0.15s ease, color 0.15s ease; }
          .sub-item-btn:hover { background: rgba(255,255,255,0.05) !important; color: #FCC151 !important; }
          .collapse-btn { transition: background 0.18s ease; }
          .collapse-btn:hover { background: rgba(255,255,255,0.08) !important; }
          @keyframes subSlide {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>

        {/* Section label */}
        {!collapsed || isMobile ? (
          <div
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 8,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              padding: "4px 10px 10px",
              transition: "opacity 0.2s ease",
            }}
          >
            Main Menu
          </div>
        ) : (
          <div style={{ height: 14 }} />
        )}

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const childActive = isChildActive(item);
          const isOpen = openMenus[item.id];
          const Icon = item.icon;
          const showLabel = !collapsed || isMobile;

          return (
            <div key={item.id} style={{ marginBottom: 2 }}>
              {/* ── Parent button ── */}
              <div style={{ position: "relative" }}>
                <button
                  className="nav-item-btn"
                  onClick={() => {
                    if (item.children) {
                      if (collapsed && !isMobile) {
                        setCollapsed(false);
                        setTimeout(
                          () =>
                            setOpenMenus((p) => ({ ...p, [item.id]: true })),
                          50,
                        );
                      } else {
                        toggleMenu(item.id);
                      }
                    } else if (item.href) {
                      router.push(item.href);
                    }
                  }}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: collapsed && !isMobile ? "10px 0" : "10px 12px",
                    justifyContent:
                      collapsed && !isMobile ? "center" : "flex-start",
                    border: "none",
                    borderRadius: 10,
                    background:
                      active || childActive
                        ? "rgba(252,193,81,0.12)"
                        : "transparent",
                    color:
                      active || childActive
                        ? "#FCC151"
                        : "rgba(255,255,255,0.75)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Active indicator bar */}
                  {(active || childActive) && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        height: "60%",
                        width: 3,
                        borderRadius: "0 3px 3px 0",
                        background: "#FCC151",
                        animation: "fadeIn 0.2s ease",
                      }}
                    />
                  )}

                  {/* Icon */}
                  <Icon
                    size={16}
                    style={{
                      flexShrink: 0,
                      color:
                        active || childActive
                          ? "#FCC151"
                          : "rgba(255,255,255,0.8)",
                      transition: "color 0.18s",
                    }}
                  />

                  {/* Label */}
                  <span
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 15,
                      fontWeight: active || childActive ? 700 : 400,
                      letterSpacing: "0.04em",
                      flex: 1,

                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      maxWidth: showLabel ? 160 : 0,
                      opacity: showLabel ? 1 : 0,
                      transition:
                        "max-width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease",
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Chevron for expandable items */}
                  {item.children && showLabel && (
                    <div
                      style={{
                        flexShrink: 0,
                        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: "rgba(255,255,255,0.35)",
                        display: "flex",
                      }}
                    >
                      <ChevronDown size={13} />
                    </div>
                  )}
                </button>

                {/* Collapsed tooltip */}
                {collapsed && !isMobile && hoveredItem === item.id && (
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(100% + 12px)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "#1C1C1C",
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontFamily: "Cinzel, serif",
                      fontSize: 16,
                      letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      zIndex: 9999,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                      animation: "fadeIn 0.15s ease",
                    }}
                  >
                    {item.label}
                    <div
                      style={{
                        position: "absolute",
                        left: -4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 8,
                        height: 8,
                        background: "#1C1C1C",
                        rotate: "45deg",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ── Submenu (animated) ── */}
              {item.children && showLabel && (
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isOpen ? `${item.children.length * 48}px` : 0,
                    transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
                  }}
                >
                  <div
                    style={{
                      paddingLeft: 14,
                      paddingTop: 2,
                      paddingBottom: 2,
                      opacity: isOpen ? 1 : 0,
                      transition: "opacity 0.25s ease",
                      animation: isOpen ? "subSlide 0.2s ease" : "none",
                    }}
                  >
                    {/* Connector line */}
                    <div
                      style={{
                        position: "relative",
                        paddingLeft: 16,
                        borderLeft: "1.5px solid rgba(255,255,255,0.1)",
                        marginLeft: 7,
                      }}
                    >
                      {item.children.map((sub) => {
                        const subActive = isActive(sub.href);
                        return (
                          <button
                            key={sub.id}
                            className="sub-item-btn"
                            onClick={() => router.push(sub.href)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "8px 10px",
                              border: "none",
                              borderRadius: 8,
                              background: subActive
                                ? "rgba(252,193,81,0.08)"
                                : "transparent",
                              color: subActive
                                ? "#FCC151"
                                : "rgba(255,255,255,0.5)",
                              cursor: "pointer",
                              fontFamily: "sans-serif",
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: subActive
                                  ? "#FCC151"
                                  : "rgba(255,255,255,0.25)",
                                flexShrink: 0,
                                transition: "background 0.15s",
                              }}
                            />
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Collapse toggle (desktop only) ───────────────────────────── */}
      {!isMobile && (
        <div
          style={{
            padding: "12px 8px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10,
              padding: "9px 12px",
              border: "none",
              borderRadius: 10,
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    opacity: collapsed ? 0 : 1,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  Collapse
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  // ─── DESKTOP sidebar ──────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <aside
        style={{
          width: collapsed ? COLLAPSED_W : SIDEBAR_W,
          height: "100vh",
          background:
            "var(--gradient-emerald, linear-gradient(180deg,#003720 0%,#001f12 100%))",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          transition: "width 0.32s cubic-bezier(0.4,0,0.2,1)",
          overflow: "visible",
          zIndex: 100,
          boxShadow: "2px 0 20px rgba(0,0,0,0.15)",
        }}
      >
        <SidebarContent />
      </aside>
    );
  }

  // ─── MOBILE: hamburger trigger + drawer ───────────────────────────────────
  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 900,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "1px solid rgba(0,55,32,0.2)",
          background: "#003720",
          color: "#FCC151",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            width: 18,
            height: 2,
            background: "#FCC151",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 14,
            height: 2,
            background: "#FCC151",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: 18,
            height: 2,
            background: "#FCC151",
            borderRadius: 2,
          }}
        />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 950,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: SIDEBAR_W,
          zIndex: 999,
          background:
            "var(--gradient-emerald, linear-gradient(180deg,#003720 0%,#001f12 100%))",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: mobileOpen ? "4px 0 32px rgba(0,0,0,0.35)" : "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
