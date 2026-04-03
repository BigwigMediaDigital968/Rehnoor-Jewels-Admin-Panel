"use client";

import AddSubscriberModal from "@/app/Component/news/AddSubscribermodal";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubStatus = "active" | "unsubscribed" | "bounced" | "complained";
type CampaignStatus = "draft" | "sending" | "sent" | "failed" | "scheduled";
type RecipientType = "all" | "selected" | "tag";

interface Subscriber {
  _id: string;
  email: string;
  name: string;
  source: string;
  tags: string[];
  status: SubStatus;
  brevoContactId: number | null;
  subscribedAt: string;
  unsubscribedAt?: string;
}

interface Attachment {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

interface Campaign {
  _id: string;
  subject: string;
  previewText: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  htmlContent: string;
  textContent: string;
  recipientType: RecipientType;
  selectedSubscriberIds: string[];
  recipientTag: string;
  attachments: Attachment[];
  status: CampaignStatus;
  sentAt?: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  notes: string;
  createdAt: string;
  scheduledAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
interface Stats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  recentCount: number;
}

type Modal =
  | { type: "none" }
  | { type: "add-subscriber" }
  | { type: "view-subscriber"; subscriber: Subscriber }
  | { type: "compose"; campaign?: Campaign } // add or edit campaign
  | { type: "view-campaign"; campaign: Campaign }
  | { type: "preview"; html: string }
  | { type: "send-confirm"; campaign: Campaign }
  | { type: "test-email"; campaign: Campaign }
  | { type: "confirm-delete-sub"; id: string; email: string }
  | { type: "confirm-delete-camp"; id: string; subject: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

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
function authOnlyHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}` };
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
function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

const SUB_STATUS_CFG: Record<
  SubStatus,
  { label: string; bg: string; color: string; dot: string }
> = {
  active: { label: "Active", bg: "#EDFAF3", color: "#1a7a4a", dot: "#2ecc71" },
  unsubscribed: {
    label: "Unsubscribed",
    bg: "#F5F5F5",
    color: "#888",
    dot: "#ccc",
  },
  bounced: {
    label: "Bounced",
    bg: "#FFF0F0",
    color: "#c0392b",
    dot: "#e74c3c",
  },
  complained: {
    label: "Complained",
    bg: "#FFF8E6",
    color: "#a06800",
    dot: "#f0a500",
  },
};

const CAMP_STATUS_CFG: Record<
  CampaignStatus,
  { label: string; bg: string; color: string; dot: string }
> = {
  draft: { label: "Draft", bg: "#F5F5F5", color: "#777", dot: "#ccc" },
  sending: {
    label: "Sending",
    bg: "#EBF5FF",
    color: "#1a6fbf",
    dot: "#3b9eff",
  },
  sent: { label: "Sent", bg: "#EDFAF3", color: "#1a7a4a", dot: "#2ecc71" },
  failed: { label: "Failed", bg: "#FFF0F0", color: "#c0392b", dot: "#e74c3c" },
  scheduled: {
    label: "Scheduled",
    bg: "#FFF8E6",
    color: "#a06800",
    dot: "#f0a500",
  },
};

// ─── HTML Email Templates ─────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  {
    label: "New Arrival",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9F6EE;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F6EE;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#003720;padding:40px 48px;text-align:center">
          <h1 style="color:#FCC131;font-size:28px;margin:0;letter-spacing:2px;font-weight:400">REHNOOR JEWELS</h1>
          <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:13px;letter-spacing:3px;text-transform:uppercase">New Arrivals</p>
        </td></tr>
        <tr><td style="padding:48px">
          <h2 style="color:#003720;font-size:24px;margin:0 0 16px;font-weight:400">Something beautiful just arrived ✦</h2>
          <p style="color:#555;line-height:1.8;font-size:15px;margin:0 0 24px">We're delighted to introduce our newest pieces, crafted with the finest 22kt gold. Each piece tells a story of heritage, elegance and artisan mastery.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px">
            <tr>
              <td style="background:#F9F6EE;border-radius:12px;padding:24px;text-align:center">
                <p style="color:#8B7355;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px">Featured Piece</p>
                <h3 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;font-weight:400">[Product Name]</h3>
                <p style="color:#D4A017;font-size:22px;font-weight:700;margin:0">₹[Price]</p>
              </td>
            </tr>
          </table>
          <div style="text-align:center">
            <a href="{{SHOP_URL}}" style="display:inline-block;background:#003720;color:#FCC131;text-decoration:none;padding:14px 36px;border-radius:40px;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Shop Now</a>
          </div>
        </td></tr>
        <tr><td style="background:#F9F6EE;padding:24px 48px;text-align:center;border-top:1px solid #E5E0D4">
          <p style="color:#aaa;font-size:12px;margin:0">You received this because you subscribed to Rehnoor Jewels updates.</p>
          <p style="color:#aaa;font-size:12px;margin:6px 0 0"><a href="{{UNSUBSCRIBE_URL}}" style="color:#D4A017;text-decoration:none">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    label: "Sale / Offer",
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#003720;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#D4A017,#FCC131);padding:48px;text-align:center">
          <p style="color:#003720;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Exclusive Offer</p>
          <h1 style="color:#003720;font-size:48px;margin:0;font-weight:700;line-height:1">UP TO<br>30% OFF</h1>
          <p style="color:#003720;margin:16px 0 0;font-size:14px">On select 22kt gold collections</p>
        </td></tr>
        <tr><td style="padding:48px;text-align:center">
          <p style="color:#555;line-height:1.8;font-size:15px;margin:0 0 32px">For a limited time, celebrate our anniversary with exclusive discounts across our finest jewellery collections.</p>
          <a href="{{SHOP_URL}}" style="display:inline-block;background:#003720;color:#FCC131;text-decoration:none;padding:16px 40px;border-radius:40px;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Explore Offers</a>
        </td></tr>
        <tr><td style="padding:20px 48px 24px;text-align:center;border-top:1px solid #F0EBE0">
          <p style="color:#aaa;font-size:12px;margin:0"><a href="{{UNSUBSCRIBE_URL}}" style="color:#D4A017;text-decoration:none">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
  {
    label: "Simple Text",
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F9F6EE;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
        <tr><td style="padding:8px 48px 0;text-align:center;border-bottom:2px solid #D4A017">
          <h1 style="color:#003720;font-size:22px;margin:24px 0;letter-spacing:2px;font-weight:400">REHNOOR JEWELS</h1>
        </td></tr>
        <tr><td style="padding:40px 48px">
          <p style="color:#555;line-height:2;font-size:15px;margin:0">Dear Valued Customer,</p>
          <p style="color:#555;line-height:2;font-size:15px;margin:16px 0">[Write your message here...]</p>
          <p style="color:#555;line-height:2;font-size:15px;margin:16px 0 0">With warmth,<br><strong style="color:#003720">Rehnoor Jewels Team</strong></p>
        </td></tr>
        <tr><td style="background:#F9F6EE;padding:20px 48px;text-align:center;border-top:1px solid #E5E0D4">
          <p style="color:#aaa;font-size:12px;margin:0"><a href="{{UNSUBSCRIBE_URL}}" style="color:#D4A017;text-decoration:none">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  },
];

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function SubStatusBadge({ status }: { status: SubStatus }) {
  const c = SUB_STATUS_CFG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
        }}
      />
      {c.label}
    </span>
  );
}

function CampStatusBadge({ status }: { status: CampaignStatus }) {
  const c = CAMP_STATUS_CFG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
        }}
      />
      {c.label}
    </span>
  );
}

function Spinner({ size = 22 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "3px solid #E5E0D4",
        borderTop: "3px solid #D4A017",
        animation: "nmSpin 0.8s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Feedback / Confirm Modal ─────────────────────────────────────────────────

function FeedbackModal({
  modal,
  onConfirm,
  onClose,
}: {
  modal: Modal;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const relevant = [
    "confirm-delete-sub",
    "confirm-delete-camp",
    "success",
    "error",
  ];
  if (!relevant.includes(modal.type)) return null;

  const isSuccess = modal.type === "success";
  const isError = modal.type === "error";
  const isConfirm = modal.type.startsWith("confirm-");

  const accent = isSuccess ? "#2ecc71" : isError ? "#e74c3c" : "#e74c3c";
  const icon = isSuccess ? "✓" : isError ? "⚠" : "🗑";
  const iconBg = isSuccess ? "#EDFAF3" : "#FFF0F0";
  const title = isSuccess
    ? "Done!"
    : isError
    ? "Something went wrong"
    : modal.type === "confirm-delete-sub"
    ? `Delete ${modal.email}?`
    : modal.type === "confirm-delete-camp"
    ? `Delete "${modal.subject}"?`
    : "";
  const body = isSuccess
    ? modal.message
    : isError
    ? modal.message
    : "This action cannot be undone.";

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
        zIndex: 1500,
        background: "rgba(10,8,5,0.6)",
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
          animation: "nmFadeUp 0.22s ease",
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
              color: isSuccess ? "#1a7a4a" : "#c0392b",
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

// ─── Email Preview Modal ──────────────────────────────────────────────────────

function PreviewModal({
  html,
  onClose,
}: {
  html: string;
  onClose: () => void;
}) {
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
        background: "rgba(10,8,5,0.65)",
        backdropFilter: "blur(6px)",
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
          maxWidth: 680,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          animation: "nmFadeUp 0.25s ease",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid #F0EBE0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <div
                  key={c}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: c,
                  }}
                />
              ))}
            </div>
            <span
              style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}
            >
              Email Preview
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
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
            flex: 1,
            overflowY: "auto",
            background: "#F0F0F0",
            padding: 20,
          }}
        >
          <iframe
            srcDoc={html}
            style={{
              width: "100%",
              minHeight: 500,
              border: "none",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Test Email Modal ─────────────────────────────────────────────────────────

function TestEmailModal({
  campaign,
  onClose,
  onSuccess,
  onError,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSend = async () => {
    if (!testEmail) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/campaigns/${campaign._id}/test`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ testEmail }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess(`Test email sent to ${testEmail}`);
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to send test email");
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
        zIndex: 1400,
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
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          animation: "nmFadeUp 0.22s ease",
        }}
      >
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#1a6fbf,#3b9eff)",
          }}
        />
        <div style={{ padding: "20px 24px" }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: "0 0 6px",
            }}
          >
            Send Test Email
          </h3>
          <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 18px" }}>
            Sends a copy of "{campaign.subject}" to the address below
          </p>
          <label style={lblStyle}>Test Email Address</label>
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
        </div>
        <div
          style={{
            padding: "14px 24px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button onClick={onClose} style={btnOutline}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !testEmail}
            style={{
              ...btnBlue,
              opacity: loading || !testEmail ? 0.5 : 1,
              cursor: loading || !testEmail ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending…" : "Send Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Confirm Modal ───────────────────────────────────────────────────────

function SendConfirmModal({
  campaign,
  onClose,
  onSuccess,
  onError,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/campaigns/${campaign._id}/send`,
        {
          method: "POST",
          headers: authHeaders(),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Send failed");
      onSuccess(data.message || "Campaign sent successfully!");
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setLoading(false);
    }
  };

  const recipientLabel =
    campaign.recipientType === "all"
      ? "all active subscribers"
      : campaign.recipientType === "tag"
      ? `subscribers tagged "${campaign.recipientTag}"`
      : `${campaign.selectedSubscriberIds?.length || 0} selected subscribers`;

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
          maxWidth: 440,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
          animation: "nmFadeUp 0.22s ease",
        }}
      >
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#003720,#166534)",
          }}
        />
        <div style={{ padding: "32px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📧</div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: "0 0 10px",
            }}
          >
            Ready to send?
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "#555",
              lineHeight: 1.7,
              margin: "0 0 6px",
            }}
          >
            <strong>"{campaign.subject}"</strong>
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#888",
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            Will be sent to <strong>{recipientLabel}</strong>. This action
            cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={onClose} style={btnOutline}>
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                ...btnGreen,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <Spinner size={14} /> Sending…
                </>
              ) : (
                "✉ Send Campaign"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Compose Modal ───────────────────────────────────────────────────

function ComposeModal({
  campaign,
  subscribers,
  onClose,
  onSuccess,
  onError,
}: {
  campaign?: Campaign;
  subscribers: Subscriber[];
  onClose: () => void;
  onSuccess: (m: string) => void;
  onError: (m: string) => void;
}) {
  const isEdit = !!campaign;
  const [tab, setTab] = useState<
    "basics" | "content" | "recipients" | "attachments"
  >("basics");
  const [loading, setLoading] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    subject: campaign?.subject || "",
    previewText: campaign?.previewText || "",
    fromName: campaign?.fromName || "Rehnoor Jewels",
    fromEmail: campaign?.fromEmail || "",
    replyTo: campaign?.replyTo || "",
    htmlContent: campaign?.htmlContent || EMAIL_TEMPLATES[0].html,
    textContent: campaign?.textContent || "",
    recipientType: (campaign?.recipientType || "all") as RecipientType,
    selectedSubscriberIds: campaign?.selectedSubscriberIds || [],
    recipientTag: campaign?.recipientTag || "",
    notes: campaign?.notes || "",
    // ✅ NEW
    sendMode: campaign?.scheduledAt ? "schedule" : "now", // "now" | "schedule"
    scheduledAt: campaign?.scheduledAt
      ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
      : "",
  });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const setF = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSubscriber = (id: string) => {
    setF(
      "selectedSubscriberIds",
      form.selectedSubscriberIds.includes(id)
        ? form.selectedSubscriberIds.filter((s) => s !== id)
        : [...form.selectedSubscriberIds, id],
    );
  };

  const handleSave = async () => {
    if (!form.subject.trim() || !form.htmlContent.trim()) {
      onError("Subject and email content are required.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();

      fd.append("sendMode", form.sendMode);

      if (form.sendMode === "schedule" && form.scheduledAt) {
        fd.append("scheduledAt", new Date(form.scheduledAt).toISOString());
      }
      (
        [
          "subject",
          "previewText",
          "fromName",
          "fromEmail",
          "replyTo",
          "htmlContent",
          "textContent",
          "recipientType",
          "recipientTag",
          "notes",
        ] as const
      ).forEach((k) => fd.append(k, form[k]));
      fd.append(
        "selectedSubscriberIds",
        JSON.stringify(form.selectedSubscriberIds),
      );
      attachmentFiles.forEach((f) => fd.append("attachments", f));

      const url = isEdit
        ? `${API_BASE}/api/newsletter/admin/campaigns/${campaign!._id}`
        : `${API_BASE}/api/newsletter/admin/campaigns`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authOnlyHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess(isEdit ? "Campaign updated." : "Campaign saved as draft.");
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Unique tags from subscribers
  const allTags = [...new Set(subscribers.flatMap((s) => s.tags))].filter(
    Boolean,
  );

  const TABS = [
    { id: "basics", label: "📋 Basics" },
    { id: "content", label: "✏️ Content" },
    {
      id: "recipients",
      label: `👥 Recipients${
        form.recipientType === "selected"
          ? ` (${form.selectedSubscriberIds.length})`
          : ""
      }`,
    },
    {
      id: "attachments",
      label: `📎 Files${
        attachmentFiles.length ? ` (${attachmentFiles.length})` : ""
      }`,
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: "rgba(10,8,5,0.58)",
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
          animation: "nmFadeUp 0.25s ease",
          margin: "auto",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px 0",
            borderBottom: "1px solid #F0EBE0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 14,
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
                {isEdit ? "Edit Campaign" : "New Campaign"}
              </p>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  margin: "3px 0 0",
                }}
              >
                {isEdit ? form.subject || "Untitled" : "Compose Email"}
              </h2>
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
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", overflowX: "auto" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: tab === t.id ? 700 : 500,
                  color: tab === t.id ? "#D4A017" : "#888",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: `2px solid ${
                    tab === t.id ? "#D4A017" : "transparent"
                  }`,
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* ── BASICS tab ── */}
          {tab === "basics" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lblStyle}>Email Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setF("subject", e.target.value)}
                  placeholder="e.g. ✦ New Arrivals — Bridal Gold Collection"
                  style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lblStyle}>
                  Preview Text{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "#aaa",
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (Gmail snippet)
                  </span>
                </label>
                <input
                  value={form.previewText}
                  onChange={(e) => setF("previewText", e.target.value)}
                  placeholder="Discover our latest 22kt gold pieces, crafted with love…"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
              </div>
              <div>
                <label style={lblStyle}>From Name</label>
                <input
                  value={form.fromName}
                  onChange={(e) => setF("fromName", e.target.value)}
                  placeholder="Rehnoor Jewels"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
              </div>
              <div>
                <label style={lblStyle}>From Email</label>
                <input
                  value={form.fromEmail}
                  onChange={(e) => setF("fromEmail", e.target.value)}
                  placeholder="hello@rehnoorjewels.com"
                  style={{
                    ...inputStyle,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
              </div>
              <div>
                <label style={lblStyle}>Reply-To</label>
                <input
                  value={form.replyTo}
                  onChange={(e) => setF("replyTo", e.target.value)}
                  placeholder="support@rehnoorjewels.com"
                  style={{
                    ...inputStyle,
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
              </div>
              <div>
                <label style={lblStyle}>Internal Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setF("notes", e.target.value)}
                  placeholder="e.g. April Bridal Campaign"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
              </div>

              {/* Schedule button */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lblStyle}>Send Timing</label>

                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  {[
                    { val: "now", label: "🚀 Send Now" },
                    { val: "schedule", label: "⏰ Schedule" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setF("sendMode", opt.val)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: 10,
                        border: `1.5px solid ${
                          form.sendMode === opt.val ? "#D4A017" : "#E5E0D4"
                        }`,
                        background:
                          form.sendMode === opt.val ? "#FFF8E6" : "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {form.sendMode === "schedule" && (
                  <div className="mt-2">
                    <div className="relative group">
                      {/* Icon */}
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition">
                        ⏰
                      </span>

                      {/* Input */}
                      <input
                        type="datetime-local"
                        value={form.scheduledAt}
                        onChange={(e) => setF("scheduledAt", e.target.value)}
                        className="
          w-full pl-10 pr-3 py-2.5
          rounded-xl border border-gray-200
          bg-white
          text-sm text-gray-700
          shadow-sm
          outline-none
          transition-all duration-200

          focus:border-amber-500
          focus:ring-2 focus:ring-amber-200
          focus:shadow-md

          hover:border-amber-300
        "
                      />
                    </div>

                    {/* Helper text */}
                    <p className="text-[11px] text-gray-400 mt-1">
                      Time will be scheduled in IST (Asia/Kolkata)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CONTENT tab ── */}
          {tab === "content" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Template chooser */}
              <div>
                <label style={lblStyle}>Start from a template</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {EMAIL_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => setF("htmlContent", t.html)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "1.5px solid #E5E0D4",
                        background: "#FDFAF5",
                        color: "#7a6040",
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = "#D4A017")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "#E5E0D4")
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toolbar */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <label style={lblStyle}>HTML Email Body *</label>
                  <button
                    type="button"
                    onClick={() => {
                      // Open preview in a new window for larger screen
                      const win = window.open(
                        "",
                        "_blank",
                        "width=700,height=600",
                      );
                      if (win) {
                        win.document.write(form.htmlContent);
                        win.document.close();
                      }
                    }}
                    style={{
                      fontSize: 11,
                      color: "#1a6fbf",
                      background: "#F0F7FF",
                      border: "1px solid #BDD9FF",
                      padding: "4px 12px",
                      borderRadius: 7,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    👁 Preview in new tab
                  </button>
                </div>

                {/* Mini formatting toolbar */}
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    padding: "8px 10px",
                    background: "#F9F6EE",
                    border: "1px solid #E5E0D4",
                    borderBottom: "none",
                    borderRadius: "10px 10px 0 0",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { label: "B", action: () => insertTag("strong") },
                    { label: "I", action: () => insertTag("em") },
                    { label: "U", action: () => insertTag("u") },
                    { label: "H1", action: () => insertTag("h1") },
                    { label: "H2", action: () => insertTag("h2") },
                    { label: "P", action: () => insertTag("p") },
                    {
                      label: "Link",
                      action: () =>
                        insertSnippet(
                          '<a href="URL" style="color:#D4A017">Link text</a>',
                        ),
                    },
                    {
                      label: "Button",
                      action: () =>
                        insertSnippet(
                          '<a href="URL" style="display:inline-block;background:#003720;color:#FCC131;text-decoration:none;padding:12px 28px;border-radius:40px;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Button Text</a>',
                        ),
                    },
                    {
                      label: "Divider",
                      action: () =>
                        insertSnippet(
                          '<hr style="border:none;border-top:1px solid #E5E0D4;margin:24px 0">',
                        ),
                    },
                    {
                      label: "Unsub link",
                      action: () =>
                        insertSnippet(
                          '<a href="{{UNSUBSCRIBE_URL}}" style="color:#D4A017;text-decoration:none">Unsubscribe</a>',
                        ),
                    },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={action}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid #E5E0D4",
                        background: "#fff",
                        color: "#555",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <textarea
                  id="nm-html-editor"
                  value={form.htmlContent}
                  onChange={(e) => setF("htmlContent", e.target.value)}
                  rows={18}
                  spellCheck={false}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "0 0 10px 10px",
                    border: "1px solid #E5E0D4",
                    background: "#fff",
                    fontSize: 12,
                    color: "#333",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "monospace",
                    lineHeight: 1.6,
                    boxSizing: "border-box",
                    minHeight: 320,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
              </div>

              {/* Live preview strip */}
              <div>
                <label style={lblStyle}>Live Preview</label>
                <div
                  style={{
                    border: "1px solid #E5E0D4",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#F0F0F0",
                    padding: 16,
                  }}
                >
                  <iframe
                    srcDoc={form.htmlContent}
                    style={{
                      width: "100%",
                      height: 340,
                      border: "none",
                      borderRadius: 8,
                      background: "#fff",
                    }}
                    title="Live email preview"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── RECIPIENTS tab ── */}
          {tab === "recipients" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lblStyle}>Send To</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { val: "all", label: "🌐 All Subscribers" },
                    { val: "tag", label: "🏷 By Tag" },
                    { val: "selected", label: "✓ Selected" },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setF("recipientType", val)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1.5px solid ${
                          form.recipientType === val ? "#D4A017" : "#E5E0D4"
                        }`,
                        background:
                          form.recipientType === val ? "#FFF8E6" : "#fff",
                        color: form.recipientType === val ? "#a06800" : "#555",
                        fontSize: 12,
                        fontWeight: form.recipientType === val ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {form.recipientType === "tag" && (
                <div>
                  <label style={lblStyle}>Tag</label>
                  <select
                    value={form.recipientTag}
                    onChange={(e) => setF("recipientTag", e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">Select a tag…</option>
                    {allTags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.recipientType === "selected" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <label style={{ ...lblStyle, margin: 0 }}>
                      Select Subscribers
                    </label>
                    <span style={{ fontSize: 11, color: "#aaa" }}>
                      {form.selectedSubscriberIds.length} of{" "}
                      {subscribers.filter((s) => s.status === "active").length}{" "}
                      selected
                    </span>
                  </div>
                  <div
                    style={{
                      border: "1px solid #E5E0D4",
                      borderRadius: 10,
                      overflow: "hidden",
                      maxHeight: 320,
                      overflowY: "auto",
                    }}
                  >
                    {subscribers
                      .filter((s) => s.status === "active")
                      .map((sub, i, arr) => {
                        const checked = form.selectedSubscriberIds.includes(
                          sub._id,
                        );
                        return (
                          <div
                            key={sub._id}
                            onClick={() => toggleSubscriber(sub._id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "10px 14px",
                              borderBottom:
                                i < arr.length - 1
                                  ? "1px solid #F5F2EA"
                                  : "none",
                              background: checked ? "#FFFBF0" : "#fff",
                              cursor: "pointer",
                              transition: "background 0.12s",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              style={{
                                width: 15,
                                height: 15,
                                accentColor: "#D4A017",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            />
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
                                {sub.name || sub.email}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#999",
                                  margin: "2px 0 0",
                                }}
                              >
                                {sub.email}
                              </p>
                            </div>
                            {sub.tags.length > 0 &&
                              sub.tags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 9,
                                    background: "#F0EBE0",
                                    color: "#7a6040",
                                    padding: "2px 7px",
                                    borderRadius: 8,
                                    flexShrink: 0,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ATTACHMENTS tab ── */}
          {tab === "attachments" && (
            <div>
              <p
                style={{
                  fontSize: 13,
                  color: "#777",
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                Upload files to attach to this email. Supported: PDF, images,
                Word docs. Max 10MB each, up to 5 files. Files are uploaded to
                Cloudinary and linked in the email.
              </p>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "2px dashed #E5E0D4",
                  borderRadius: 12,
                  padding: 24,
                  cursor: "pointer",
                  textAlign: "center",
                  background: "#FDFAF5",
                  marginBottom: 16,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#D4A017")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#E5E0D4")
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "#D4A017";
                  e.currentTarget.style.background = "#FFF8E6";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E5E0D4";
                  e.currentTarget.style.background = "#FDFAF5";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).slice(
                    0,
                    5 - attachmentFiles.length,
                  );
                  setAttachmentFiles((p) => [...p, ...files]);
                  e.currentTarget.style.borderColor = "#E5E0D4";
                  e.currentTarget.style.background = "#FDFAF5";
                }}
              >
                <p style={{ fontSize: 24, margin: "0 0 8px" }}>📎</p>
                <p
                  style={{
                    fontSize: 14,
                    color: "#888",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  Drop files here or click to browse
                </p>
                <p style={{ fontSize: 11, color: "#bbb", margin: "4px 0 0" }}>
                  PDF, images, Word · max 10MB each · up to 5 files
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                style={{ display: "none" }}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(
                    0,
                    5 - attachmentFiles.length,
                  );
                  setAttachmentFiles((p) => [...p, ...files]);
                }}
                onClick={(e) => ((e.target as HTMLInputElement).value = "")}
              />

              {/* New files */}
              {attachmentFiles.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...lblStyle, marginBottom: 8 }}>
                    New Attachments ({attachmentFiles.length})
                  </label>
                  {attachmentFiles.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        background: "#EDFAF3",
                        border: "1px solid #2ecc7120",
                        borderRadius: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.name}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#888",
                            margin: "2px 0 0",
                          }}
                        >
                          {fileSize(f.size)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setAttachmentFiles((p) => p.filter((_, j) => j !== i))
                        }
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: "none",
                          background: "#e74c3c20",
                          color: "#c0392b",
                          cursor: "pointer",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing attachments (edit mode) */}
              {campaign?.attachments && campaign.attachments.length > 0 && (
                <div>
                  <label style={{ ...lblStyle, marginBottom: 8 }}>
                    Existing Attachments
                  </label>
                  {campaign.attachments.map((att, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        background: "#F9F6EE",
                        border: "1px solid #E5E0D4",
                        borderRadius: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📎</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                          }}
                        >
                          {att.filename}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#888",
                            margin: "2px 0 0",
                          }}
                        >
                          {fileSize(att.size)} ·{" "}
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#1a6fbf" }}
                          >
                            View ↗
                          </a>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #F0EBE0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#FDFAF5",
            flexShrink: 0,
          }}
        >
          <button onClick={onClose} style={btnOutline}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              ...btnPrimary,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Spinner size={14} /> Saving…
              </>
            ) : isEdit ? (
              "Update Campaign"
            ) : (
              "Save as Draft"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Toolbar helpers ──────────────────────────────────────────────────────
  function insertTag(tag: string) {
    const el = document.getElementById("nm-html-editor") as HTMLTextAreaElement;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || "text";
    const replacement = `<${tag}>${selected}</${tag}>`;
    const next = value.slice(0, start) + replacement + value.slice(end);
    setF("htmlContent", next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + tag.length + 2,
        start + tag.length + 2 + selected.length,
      );
    }, 0);
  }
  function insertSnippet(snippet: string) {
    const el = document.getElementById("nm-html-editor") as HTMLTextAreaElement;
    if (!el) return;
    const { selectionStart: start, value } = el;
    const next = value.slice(0, start) + snippet + value.slice(start);
    setF("htmlContent", next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewsletterManagement() {
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns">(
    "subscribers",
  );
  const [modal, setModal] = useState<Modal>({ type: "none" });

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subPagination, setSubPagination] = useState<Pagination | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedSubIds, setSelectedSubIds] = useState<Set<string>>(new Set());
  const [subSearch, setSubSearch] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [subSource, setSubSource] = useState("");
  const [subPage, setSubPage] = useState(1);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campPagination, setCampPagination] = useState<Pagination | null>(null);
  const [campLoading, setCampLoading] = useState(true);
  const [campStatus, setCampStatus] = useState("");
  const [campPage, setCampPage] = useState(1);

  const [error, setError] = useState("");

  // ── Fetch Subscribers ───────────────────────────────────────────────────────
  const fetchSubscribers = useCallback(async () => {
    setSubLoading(true);
    try {
      const params = new URLSearchParams();
      if (subSearch) params.set("search", subSearch);
      if (subStatus) params.set("status", subStatus);
      if (subSource) params.set("source", subSource);
      params.set("page", String(subPage));
      params.set("limit", "20");
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/subscribers?${params}`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.data);
        setSubPagination(data.pagination);
      }
    } catch {
      setError("Failed to load subscribers");
    } finally {
      setSubLoading(false);
    }
  }, [subSearch, subStatus, subSource, subPage]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/subscribers/stats`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      /* non-fatal */
    }
  }, []);

  // ── Fetch Campaigns ──────────────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    setCampLoading(true);
    try {
      const params = new URLSearchParams();
      if (campStatus) params.set("status", campStatus);
      params.set("page", String(campPage));
      params.set("limit", "15");
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/campaigns?${params}`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
        setCampPagination(data.pagination);
      }
    } catch {
      setError("Failed to load campaigns");
    } finally {
      setCampLoading(false);
    }
  }, [campStatus, campPage]);

  useEffect(() => {
    fetchSubscribers();
    fetchStats();
  }, [fetchSubscribers, fetchStats]);
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ── Subscriber actions ──────────────────────────────────────────────────────
  const deleteSub = async () => {
    if (modal.type !== "confirm-delete-sub") return;
    const { id } = modal;
    setModal({ type: "none" });
    try {
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/subscribers/${id}`,
        { method: "DELETE", headers: authHeaders() },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSubscribers((p) => p.filter((s) => s._id !== id));
      setModal({ type: "success", message: "Subscriber deleted." });
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    }
  };

  const bulkDeleteSubs = async () => {
    if (!selectedSubIds.size) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/subscribers/bulk`,
        {
          method: "DELETE",
          headers: authHeaders(),
          body: JSON.stringify({ ids: Array.from(selectedSubIds) }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSubscribers((p) => p.filter((s) => !selectedSubIds.has(s._id)));
      setSelectedSubIds(new Set());
      setModal({ type: "success", message: data.message });
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Bulk delete failed",
      });
    }
  };

  const toggleSubSelect = (id: string) =>
    setSelectedSubIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleSelectAll = () =>
    setSelectedSubIds(
      selectedSubIds.size === subscribers.length
        ? new Set()
        : new Set(subscribers.map((s) => s._id)),
    );

  // ── Campaign actions ────────────────────────────────────────────────────────
  const deleteCamp = async () => {
    if (modal.type !== "confirm-delete-camp") return;
    const { id } = modal;
    setModal({ type: "none" });
    try {
      const res = await fetch(
        `${API_BASE}/api/newsletter/admin/campaigns/${id}`,
        { method: "DELETE", headers: authHeaders() },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCampaigns((p) => p.filter((c) => c._id !== id));
      setModal({ type: "success", message: "Campaign deleted." });
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    }
  };

  const handleModalConfirm = () => {
    if (modal.type === "confirm-delete-sub") deleteSub();
    else if (modal.type === "confirm-delete-camp") deleteCamp();
  };

  return (
    <>
      <style>{`
        @keyframes nmFadeUp { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes nmSpin { to{transform:rotate(360deg)} }
        .nm-row:hover { background:#FDFAF3 !important; }
        .nm-filter:focus { border-color:#D4A017 !important; outline:none; }
      `}</style>

      {/* ── Modals ── */}

      {(modal.type === "success" ||
        modal.type === "error" ||
        modal.type === "confirm-delete-sub" ||
        modal.type === "confirm-delete-camp") && (
        <FeedbackModal
          modal={modal}
          onConfirm={handleModalConfirm}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "preview" && (
        <PreviewModal
          html={modal.html}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {modal.type === "test-email" && (
        <TestEmailModal
          campaign={modal.campaign}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => setModal({ type: "success", message: m })}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}

      {modal.type === "send-confirm" && (
        <SendConfirmModal
          campaign={modal.campaign}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => {
            setModal({ type: "success", message: m });
            fetchCampaigns();
          }}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}

      {modal.type === "compose" && (
        <ComposeModal
          campaign={modal.campaign}
          subscribers={subscribers}
          onClose={() => setModal({ type: "none" })}
          onSuccess={(m) => {
            setModal({ type: "success", message: m });
            fetchCampaigns();
          }}
          onError={(m) => setModal({ type: "error", message: m })}
        />
      )}

      {modal.type === "add-subscriber" && (
        <AddSubscriberModal
          onClose={() => setModal({ type: "none" })}
          onSuccess={(msg) => {
            setModal({ type: "success", message: msg });
            fetchSubscribers();
          }}
          onError={(msg) => setModal({ type: "error", message: msg })}
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
              Newsletter
            </h2>
            <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
              Manage subscribers and email campaigns via Brevo
            </p>
          </div>
          <button
            onClick={() => setModal({ type: "compose" })}
            style={{
              ...btnPrimary,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            ✉ New Campaign
          </button>
        </div>

        {/* Stats row */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Total Subscribers",
                value: stats.total.toLocaleString(),
                icon: "👥",
              },
              {
                label: "Active",
                value: (stats.byStatus.active || 0).toLocaleString(),
                icon: "✅",
              },
              {
                label: "New (30d)",
                value: stats.recentCount.toLocaleString(),
                icon: "📈",
              },
              {
                label: "Unsubscribed",
                value: (stats.byStatus.unsubscribed || 0).toLocaleString(),
                icon: "🚫",
              },
            ].map(({ label, value, icon }) => (
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
                    justifyContent: "space-between",
                    alignItems: "flex-start",
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
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#1a1a1a",
                        margin: "6px 0 0",
                        lineHeight: 1,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 16,
            borderBottom: "2px solid #E5E0D4",
          }}
        >
          {[
            ["subscribers", "👥 Subscribers"],
            ["campaigns", "✉ Campaigns"],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setActiveTab(val as typeof activeTab)}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: activeTab === val ? 700 : 500,
                color: activeTab === val ? "#D4A017" : "#888",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: `2px solid ${
                  activeTab === val ? "#D4A017" : "transparent"
                }`,
                marginBottom: -2,
                transition: "color 0.15s",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

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

        {/* ─── SUBSCRIBERS TAB ─── */}
        {activeTab === "subscribers" && (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 14,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                className="nm-filter"
                placeholder="🔍 Search email or name…"
                value={subSearch}
                onChange={(e) => {
                  setSubSearch(e.target.value);
                  setSubPage(1);
                }}
                style={{ ...filterStyle, minWidth: 220 }}
              />
              <select
                className="nm-filter"
                value={subStatus}
                onChange={(e) => {
                  setSubStatus(e.target.value);
                  setSubPage(1);
                }}
                style={{ ...filterStyle, cursor: "pointer" }}
              >
                <option value="">All statuses</option>
                {(
                  [
                    "active",
                    "unsubscribed",
                    "bounced",
                    "complained",
                  ] as SubStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {SUB_STATUS_CFG[s].label}
                  </option>
                ))}
              </select>
              <select
                className="nm-filter"
                value={subSource}
                onChange={(e) => {
                  setSubSource(e.target.value);
                  setSubPage(1);
                }}
                style={{ ...filterStyle, cursor: "pointer" }}
              >
                <option value="">All sources</option>
                {["website", "admin", "import", "checkout", "other"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
              <button
                onClick={fetchSubscribers}
                style={{ ...btnOutline, cursor: "pointer", fontSize: 12 }}
              >
                ↻ Refresh
              </button>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                {selectedSubIds.size > 0 && (
                  <button
                    onClick={bulkDeleteSubs}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid #FFCDD2",
                      background: "#FFF0F0",
                      color: "#c0392b",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    🗑 Delete ({selectedSubIds.size})
                  </button>
                )}
                <button
                  onClick={() => setModal({ type: "add-subscriber" })}
                  style={{ ...btnPrimary, fontSize: 12, cursor: "pointer" }}
                >
                  + Add Subscriber
                </button>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E0D4",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              {subLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: 60,
                  }}
                >
                  <Spinner />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 680,
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#F9F6EE",
                          borderBottom: "2px solid #E5E0D4",
                        }}
                      >
                        <th style={th}>
                          <input
                            type="checkbox"
                            style={{ cursor: "pointer" }}
                            checked={
                              selectedSubIds.size === subscribers.length &&
                              subscribers.length > 0
                            }
                            onChange={toggleSelectAll}
                          />
                        </th>
                        {[
                          "Email",
                          "Name",
                          "Source",
                          "Tags",
                          "Status",
                          "Subscribed",
                          "Actions",
                        ].map((h) => (
                          <th key={h} style={th}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub, idx) => (
                        <tr
                          key={sub._id}
                          className="nm-row"
                          style={{
                            background: selectedSubIds.has(sub._id)
                              ? "#FFFBF0"
                              : idx % 2 === 0
                              ? "#fff"
                              : "#FAFAF8",
                            borderBottom: "1px solid #EEEAE0",
                            transition: "background 0.12s",
                          }}
                        >
                          <td style={td}>
                            <input
                              type="checkbox"
                              checked={selectedSubIds.has(sub._id)}
                              onChange={() => toggleSubSelect(sub._id)}
                              style={{ cursor: "pointer" }}
                            />
                          </td>
                          <td
                            style={{
                              ...td,
                              fontFamily: "monospace",
                              fontSize: 12,
                              color: "#333",
                            }}
                          >
                            {sub.email}
                          </td>
                          <td style={{ ...td, fontSize: 13, color: "#555" }}>
                            {sub.name || (
                              <span style={{ color: "#ccc" }}>—</span>
                            )}
                          </td>
                          <td style={{ ...td, fontSize: 11, color: "#888" }}>
                            {sub.source}
                          </td>
                          <td style={td}>
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                flexWrap: "wrap",
                              }}
                            >
                              {sub.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 9,
                                    background: "#F0EBE0",
                                    color: "#7a6040",
                                    padding: "2px 7px",
                                    borderRadius: 8,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                              {sub.tags.length === 0 && (
                                <span style={{ color: "#ccc", fontSize: 11 }}>
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={td}>
                            <SubStatusBadge status={sub.status} />
                          </td>
                          <td
                            style={{
                              ...td,
                              fontSize: 11,
                              color: "#999",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmt(sub.subscribedAt)}
                          </td>
                          <td style={td}>
                            <button
                              onClick={() =>
                                setModal({
                                  type: "confirm-delete-sub",
                                  id: sub._id,
                                  email: sub.email,
                                })
                              }
                              style={{
                                padding: "4px 10px",
                                borderRadius: 7,
                                border: "1px solid #FFCDD2",
                                background: "#FFF5F5",
                                color: "#c0392b",
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              Del
                            </button>
                          </td>
                        </tr>
                      ))}
                      {subscribers.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              textAlign: "center",
                              padding: 52,
                              color: "#bbb",
                              fontSize: 14,
                            }}
                          >
                            <div style={{ fontSize: 36, marginBottom: 10 }}>
                              📭
                            </div>
                            No subscribers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {subPagination && subPagination.totalPages > 1 && (
              <PaginationRow
                page={subPage}
                pagination={subPagination}
                onChange={setSubPage}
              />
            )}
          </>
        )}

        {/* ─── CAMPAIGNS TAB ─── */}
        {activeTab === "campaigns" && (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 14,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <select
                className="nm-filter"
                value={campStatus}
                onChange={(e) => {
                  setCampStatus(e.target.value);
                  setCampPage(1);
                }}
                style={{ ...filterStyle, cursor: "pointer" }}
              >
                <option value="">All statuses</option>
                {(
                  [
                    "draft",
                    "sending",
                    "sent",
                    "failed",
                    "scheduled",
                  ] as CampaignStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {CAMP_STATUS_CFG[s].label}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchCampaigns}
                style={{ ...btnOutline, cursor: "pointer", fontSize: 12 }}
              >
                ↻ Refresh
              </button>
              <button
                onClick={() => setModal({ type: "compose" })}
                style={{
                  ...btnPrimary,
                  fontSize: 12,
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                ✉ New Campaign
              </button>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E0D4",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
            >
              {campLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: 60,
                  }}
                >
                  <Spinner />
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 760,
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
                          "Subject",
                          "Recipients",
                          "Status",
                          "Sent",
                          "Stats",
                          "Actions",
                        ].map((h) => (
                          <th key={h} style={th}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((camp, idx) => (
                        <tr
                          key={camp._id}
                          className="nm-row"
                          style={{
                            background: idx % 2 === 0 ? "#fff" : "#FAFAF8",
                            borderBottom: "1px solid #EEEAE0",
                          }}
                        >
                          <td style={{ ...td, maxWidth: 280 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#1a1a1a",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {camp.subject}
                            </p>
                            {camp.notes && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#aaa",
                                  margin: "2px 0 0",
                                }}
                              >
                                {camp.notes}
                              </p>
                            )}
                            {camp.attachments?.length > 0 && (
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "#D4A017",
                                  margin: "2px 0 0",
                                }}
                              >
                                📎 {camp.attachments.length} attachment
                                {camp.attachments.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </td>
                          <td style={{ ...td, fontSize: 12, color: "#777" }}>
                            {camp.recipientType === "all"
                              ? "All subscribers"
                              : camp.recipientType === "tag"
                              ? `Tag: ${camp.recipientTag}`
                              : `${
                                  camp.selectedSubscriberIds?.length || 0
                                } selected`}
                          </td>
                          <td style={td}>
                            <CampStatusBadge status={camp.status} />
                          </td>
                          <td
                            style={{
                              ...td,
                              fontSize: 11,
                              color: "#999",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {camp.sentAt ? fmtFull(camp.sentAt) : "—"}
                          </td>
                          <td style={td}>
                            {camp.status === "sent" ||
                            camp.status === "failed" ? (
                              <div>
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "#1a7a4a",
                                    margin: 0,
                                  }}
                                >
                                  ✓ {camp.successCount} sent
                                </p>
                                {camp.failureCount > 0 && (
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: "#c0392b",
                                      margin: "1px 0 0",
                                    }}
                                  >
                                    ✕ {camp.failureCount} failed
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: "#ccc" }}>
                                —
                              </span>
                            )}
                          </td>
                          <td style={td}>
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={() =>
                                  setModal({
                                    type: "preview",
                                    html: camp.htmlContent || "",
                                  })
                                }
                                style={{
                                  ...actionBtn,
                                  background: "#F0F7FF",
                                  color: "#1a6fbf",
                                  border: "1px solid #BDD9FF",
                                  cursor: "pointer",
                                }}
                              >
                                Preview
                              </button>
                              {camp.status === "draft" && (
                                <>
                                  <button
                                    onClick={() =>
                                      setModal({
                                        type: "compose",
                                        campaign: camp,
                                      })
                                    }
                                    style={{
                                      ...actionBtn,
                                      background: "#FFF8E6",
                                      color: "#a06800",
                                      border: "1px solid #f0a50030",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      setModal({
                                        type: "test-email",
                                        campaign: camp,
                                      })
                                    }
                                    style={{
                                      ...actionBtn,
                                      background: "#F0FFF4",
                                      color: "#166534",
                                      border: "1px solid #22c55e30",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Test
                                  </button>
                                  <button
                                    onClick={() =>
                                      setModal({
                                        type: "send-confirm",
                                        campaign: camp,
                                      })
                                    }
                                    style={{
                                      ...actionBtn,
                                      background: "#003720",
                                      color: "#FCC131",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Send
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() =>
                                  setModal({
                                    type: "confirm-delete-camp",
                                    id: camp._id,
                                    subject: camp.subject,
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
                      {campaigns.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              textAlign: "center",
                              padding: 52,
                              color: "#bbb",
                              fontSize: 14,
                            }}
                          >
                            <div style={{ fontSize: 36, marginBottom: 10 }}>
                              ✉
                            </div>
                            No campaigns yet
                            <div style={{ marginTop: 12 }}>
                              <button
                                onClick={() => setModal({ type: "compose" })}
                                style={{
                                  ...btnPrimary,
                                  cursor: "pointer",
                                  fontSize: 12,
                                }}
                              >
                                Create your first campaign
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {campPagination && campPagination.totalPages > 1 && (
              <PaginationRow
                page={campPage}
                pagination={campPagination}
                onChange={setCampPage}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Pagination row ───────────────────────────────────────────────────────────

function PaginationRow({
  page,
  pagination,
  onChange,
}: {
  page: number;
  pagination: Pagination;
  onChange: (p: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        marginTop: 16,
      }}
    >
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{
          ...btnOutline,
          cursor: page === 1 ? "not-allowed" : "pointer",
          opacity: page === 1 ? 0.5 : 1,
          fontSize: 12,
        }}
      >
        ← Prev
      </button>
      <span style={{ color: "#888", fontSize: 13 }}>
        Page {pagination.page} of {pagination.totalPages} ·{" "}
        {pagination.total.toLocaleString()} total
      </span>
      <button
        onClick={() => onChange(Math.min(pagination.totalPages, page + 1))}
        disabled={page === pagination.totalPages}
        style={{
          ...btnOutline,
          cursor: page === pagination.totalPages ? "not-allowed" : "pointer",
          opacity: page === pagination.totalPages ? 0.5 : 1,
          fontSize: 12,
        }}
      >
        Next →
      </button>
    </div>
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
const filterStyle: React.CSSProperties = {
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
const th: React.CSSProperties = {
  padding: "11px 14px",
  fontSize: 11,
  fontWeight: 700,
  color: "#8B7355",
  textAlign: "left",
  whiteSpace: "nowrap",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};
const td: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: "#333",
  verticalAlign: "middle",
};
const lblStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase" as const,
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
  boxSizing: "border-box" as const,
};
