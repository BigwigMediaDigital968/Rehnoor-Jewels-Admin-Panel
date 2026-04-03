"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AddSubscriberModal({
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      return onError("Email is required");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/newsletter/admin/subscribers`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      onSuccess(data.message || "Subscriber added");
      onClose();
    } catch (err: any) {
      onError(err.message || "Failed to add subscriber");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <h3 style={{ margin: 0 }}>Add Subscriber</h3>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          <div style={field}>
            <label style={label}>Email *</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              style={input}
            />
          </div>

          <div style={field}>
            <label style={label}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              style={input}
            />
          </div>

          <div style={field}>
            <label style={label}>Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vip, customer, leads"
              style={input}
            />
            <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
              Separate tags with commas
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={footer}>
          <button onClick={onClose} style={btnOutline}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={btnPrimary} disabled={loading}>
            {loading ? "Adding..." : "Add Subscriber"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles (match your theme) ─── */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  width: 420,
  background: "#fff",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
  animation: "nmFadeUp 0.2s ease",
};

const header: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const footer: React.CSSProperties = {
  padding: "12px 16px",
  borderTop: "1px solid #eee",
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const field: React.CSSProperties = {
  marginBottom: 14,
};

const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 4,
  display: "block",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 13,
};

const closeBtn: React.CSSProperties = {
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: 16,
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "#003720",
  color: "#FCC131",
  fontSize: 13,
  cursor: "pointer",
};

const btnOutline: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "#fff",
  fontSize: 13,
  cursor: "pointer",
};

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
