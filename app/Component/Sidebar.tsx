"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SquareChevronDown, SquareChevronUp } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "⬡",
    href: "/admin/dashboard",
  },

  {
    id: "products",
    label: "Products",
    icon: "◇",
    children: [
      { id: "all-products", label: "All Products", href: "/admin/products" },
      { id: "add-product", label: "Add Product", href: "/admin/products/add" },
      { id: "categories", label: "Categories", href: "/admin/categories" },
      { id: "collections", label: "Collections", href: "/admin/collections" },
    ],
  },

  {
    id: "orders",
    label: "Order Management",
    icon: "◈",
    badge: 12,
    children: [
      { id: "all-orders", label: "All Orders", href: "/admin/orders" },
      { id: "pending-orders", label: "Pending", href: "/admin/orders/pending" },
      {
        id: "completed-orders",
        label: "Completed",
        href: "/admin/orders/completed",
      },
    ],
  },

  {
    id: "customers",
    label: "Customers",
    icon: "◉",
    href: "/admin/customers",
  },

  {
    id: "leads",
    label: "Lead Management",
    icon: "◎",
    href: "/admin/leads",
  },

  {
    id: "reviews",
    label: "Reviews & Ratings",
    icon: "★",
    href: "/admin/reviews",
  },

  {
    id: "analytics",
    label: "Analytics",
    icon: "◬",
    href: "/admin/analytics",
  },

  {
    id: "marketing",
    label: "Marketing",
    icon: "✦",
    children: [
      { id: "banners", label: "Promotional Banners", href: "/admin/banners" },
      { id: "offers", label: "Offers & Discounts", href: "/admin/offers" },
    ],
  },

  {
    id: "blog",
    label: "Blog Management",
    icon: "✎",
    children: [
      { id: "all-blogs", label: "All Blogs", href: "/admin/blogs" },
      { id: "add-blog", label: "Add Blog", href: "/admin/blogs/add" },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  return (
    <aside
      style={{
        width: collapsed ? 68 : 300,
        height: "100vh",
        background: "var(--gradient-emerald)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div
        className="text-center font-bold"
        style={{ padding: 25, color: "#fcc151" }}
      >
        <h2>REHNOOR</h2>
        <p>Admin Console</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: 10 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);

          return (
            <div key={item.id}>
              {/* Parent Item */}
              <button
                onClick={() => {
                  if (item.children) {
                    toggleMenu(item.id);
                  } else if (item.href) {
                    router.push(item.href);
                  }
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: "none",
                  background: active ? "rgba(252,193,81,0.1)" : "transparent",
                  color: active ? "#fcc151" : "#fff",
                  cursor: "pointer",
                }}
              >
                <span>{item.icon}</span>

                {!collapsed && <span>{item.label}</span>}

                {item.badge && !collapsed && (
                  <span style={{ marginLeft: "auto" }}>{item.badge}</span>
                )}

                {item.children && !collapsed && (
                  <span style={{ marginLeft: "auto" }}>
                    {openMenus[item.id] ? (
                      <SquareChevronUp size={16} />
                    ) : (
                      <SquareChevronDown size={16} />
                    )}
                  </span>
                )}
              </button>

              {/* Submenu */}
              {item.children && openMenus[item.id] && !collapsed && (
                <div style={{ paddingLeft: 20 }}>
                  {item.children.map((sub) => {
                    const subActive = isActive(sub.href);

                    return (
                      <button
                        key={sub.id}
                        onClick={() => router.push(sub.href)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 10px",
                          border: "none",
                          background: subActive
                            ? "rgba(252,193,81,0.08)"
                            : "transparent",
                          color: subActive ? "#fcc151" : "#ccc",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse */}
      <button onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? "▶" : "◀"}
      </button>
    </aside>
  );
}
