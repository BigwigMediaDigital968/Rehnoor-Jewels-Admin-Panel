"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/Component/Sidebar";
import AdminHeader from "@/app/Component/AdminHeader";

type Props = { children: ReactNode };

export default function AdminLayout({ children }: Props) {
  const router = useRouter();

  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
    } else {
      setIsAuth(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/");
  };

  if (loading) return null;
  if (!isAuth) return null;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--rj-ivory)",
      }}
    >
      {/* ── Sticky sidebar ───────────────────────── */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Sticky topbar ──────────────────────── */}
        <AdminHeader onLogout={handleLogout} />

        {/* ── Scrollable main content ────────────── */}
        <main
          className="admin-main"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "auto",
            background: "var(--rj-ivory)",
            padding: "30px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
