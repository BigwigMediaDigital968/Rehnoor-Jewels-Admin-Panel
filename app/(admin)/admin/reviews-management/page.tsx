"use client";

import ConfirmModal from "@/app/Component/products/models/ConfirmModal";
import FeedbackModal from "@/app/Component/products/models/FeedbackModal";
import AddReviewModal from "@/app/Component/reviews/AddReviewModal";
import RejectModal from "@/app/Component/reviews/models/RejectModal";
import ReviewFilters from "@/app/Component/reviews/ReviewFilters";
import ReviewStatsBar from "@/app/Component/reviews/ReviewStatsBar";
import ReviewTable from "@/app/Component/reviews/ReviewTable";
import ReviewViewDrawer, {
  Review,
} from "@/app/Component/reviews/ReviewViewDrawer";
import { useState, useEffect, useCallback, useMemo } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackState = {
  open: boolean;
  type: "success" | "error";
  message: string;
};
type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  loading: boolean;
  onConfirm: () => void;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [drawerReview, setDrawerReview] = useState<Review | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Review | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>({
    open: false,
    type: "success",
    message: "",
  });
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    danger: false,
    loading: false,
    onConfirm: () => {},
  });

  const showFeedback = (type: "success" | "error", message: string) =>
    setFeedback({ open: true, type, message });

  const closeConfirm = () =>
    setConfirm((c) => ({ ...c, open: false, loading: false }));

  // ─── Fetch stats ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/admin/stats`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      /* silent */
    }
  }, []);

  // ─── Fetch reviews ────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`${API_BASE}/api/reviews/admin/all?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReviews(data.data || []);
      setPagination(
        data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 },
      );
    } catch {
      showFeedback("error", "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, sort, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  console.log(reviews);

  // ─── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = (review: Review) => {
    setConfirm({
      open: true,
      title: "Approve this review?",
      message: `"${review.reviewTitle}" will be published on the product page and the product rating will be updated.`,
      confirmLabel: "Approve",
      danger: false,
      loading: false,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          const res = await fetch(
            `${API_BASE}/api/reviews/admin/${review._id}/approve`,
            {
              method: "PATCH",
              headers: authHeaders(),
              body: JSON.stringify({ adminNote: "" }),
            },
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          // Update in-place
          setReviews((prev) =>
            prev.map((r) =>
              r._id === review._id
                ? {
                    ...r,
                    status: "approved",
                    approvedAt: new Date().toISOString(),
                  }
                : r,
            ),
          );
          if (drawerReview?._id === review._id)
            setDrawerReview((r) => (r ? { ...r, status: "approved" } : r));
          showFeedback("success", "Review approved. Product rating updated.");
          fetchStats();
        } catch (err: unknown) {
          showFeedback("error", err instanceof Error ? err.message : "Failed");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // ─── Reject ───────────────────────────────────────────────────────────────
  const handleRejectRequest = (review: Review) => {
    setRejectTarget(review);
  };

  const handleRejectConfirm = async (adminNote: string) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/reviews/admin/${rejectTarget._id}/reject`,
        {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({ adminNote }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReviews((prev) =>
        prev.map((r) =>
          r._id === rejectTarget._id
            ? {
                ...r,
                status: "rejected",
                rejectedAt: new Date().toISOString(),
                adminNote,
              }
            : r,
        ),
      );
      if (drawerReview?._id === rejectTarget._id)
        setDrawerReview((r) =>
          r ? { ...r, status: "rejected", adminNote } : r,
        );
      showFeedback("success", "Review rejected.");
      fetchStats();
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setRejectLoading(false);
      setRejectTarget(null);
    }
  };

  // ─── Toggle feature ───────────────────────────────────────────────────────
  const handleToggleFeature = async (review: Review) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/reviews/admin/${review._id}/feature`,
        {
          method: "PATCH",
          headers: authHeaders(),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const next = data.data.isFeatured;
      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...r, isFeatured: next } : r,
        ),
      );
      if (drawerReview?._id === review._id)
        setDrawerReview((r) => (r ? { ...r, isFeatured: next } : r));
      showFeedback(
        "success",
        next ? "Review pinned to top." : "Review unpinned.",
      );
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Failed");
    }
  };

  // ─── Delete single ────────────────────────────────────────────────────────
  const handleDelete = (review: Review) => {
    setConfirm({
      open: true,
      title: "Delete review?",
      message: `"${review.reviewTitle}" will be permanently deleted. If approved, the product rating will be recalculated.`,
      confirmLabel: "Delete",
      danger: true,
      loading: false,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          const res = await fetch(
            `${API_BASE}/api/reviews/admin/${review._id}`,
            {
              method: "DELETE",
              headers: authHeaders(),
            },
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setReviews((prev) => prev.filter((r) => r._id !== review._id));
          setSelectedIds((prev) => {
            prev.delete(review._id);
            return new Set(prev);
          });
          if (drawerReview?._id === review._id) setDrawerOpen(false);
          showFeedback("success", "Review deleted.");
          fetchStats();
        } catch (err: unknown) {
          showFeedback("error", err instanceof Error ? err.message : "Failed");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // ─── Bulk delete ─────────────────────────────────────────────────────────
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirm({
      open: true,
      title: `Delete ${selectedIds.size} review${
        selectedIds.size > 1 ? "s" : ""
      }?`,
      message:
        "These reviews will be permanently deleted and affected product ratings recalculated.",
      confirmLabel: "Delete all",
      danger: true,
      loading: false,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          const res = await fetch(`${API_BASE}/api/reviews/admin/bulk`, {
            method: "DELETE",
            headers: authHeaders(),
            body: JSON.stringify({ ids: Array.from(selectedIds) }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setReviews((prev) => prev.filter((r) => !selectedIds.has(r._id)));
          setSelectedIds(new Set());
          showFeedback("success", data.message);
          fetchStats();
        } catch (err: unknown) {
          showFeedback("error", err instanceof Error ? err.message : "Failed");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // ─── Selection ────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === reviews.length
        ? new Set()
        : new Set(reviews.map((r) => r._id)),
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Modals */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        loading={confirm.loading}
        onConfirm={confirm.onConfirm}
        onClose={closeConfirm}
      />
      <FeedbackModal
        open={feedback.open}
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
      />
      <AddReviewModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={(msg: string) => {
          showFeedback("success", msg);
          fetchReviews();
          fetchStats();
        }}
        onError={(msg: string) => showFeedback("error", msg)}
      />
      <RejectModal
        open={!!rejectTarget}
        reviewTitle={rejectTarget?.reviewTitle || ""}
        loading={rejectLoading}
        onConfirm={handleRejectConfirm}
        onClose={() => setRejectTarget(null)}
      />
      <ReviewViewDrawer
        review={drawerReview}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={(r) => {
          setDrawerOpen(false);
          handleApprove(r);
        }}
        onReject={(r) => {
          setDrawerOpen(false);
          handleRejectRequest(r);
        }}
        onDelete={(r) => {
          setDrawerOpen(false);
          handleDelete(r);
        }}
        onToggleFeature={handleToggleFeature}
      />

      {/* Page */}
      <div className="p-6 lg:p-8 min-h-full" style={{ background: "#F5F3EE" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              Admin / Reviews
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              Reviews & Ratings
            </h1>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#003720] hover:bg-[#004d2d] text-white rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Review
          </button>
        </div>

        {/* Stats — clickable to filter */}
        <ReviewStatsBar
          stats={stats}
          activeFilter={statusFilter}
          onFilter={(s) => {
            setStatusFilter(s);
            setPage(1);
          }}
        />

        {/* Filters */}
        <ReviewFilters
          search={search}
          sort={sort}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onSort={setSort}
          onClear={() => {
            setSearch("");
            setSort("-createdAt");
            setPage(1);
          }}
        />

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-sm text-amber-700 font-medium">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Delete selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer ml-auto"
            >
              Deselect all
            </button>
          </div>
        )}

        {/* Pending banner */}
        {stats.pending > 0 && !statusFilter && (
          <div
            className="flex items-center justify-between p-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => {
              setStatusFilter("pending");
              setPage(1);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </div>
              <p className="text-sm font-medium text-amber-800">
                {stats.pending} review{stats.pending > 1 ? "s" : ""} waiting for
                approval
              </p>
            </div>
            <span className="text-xs text-amber-600 font-medium">
              View pending →
            </span>
          </div>
        )}

        {/* Table */}
        <ReviewTable
          reviews={reviews}
          loading={loading}
          selectedIds={selectedIds}
          onSelectId={toggleSelect}
          onSelectAll={toggleSelectAll}
          onView={(r) => {
            setDrawerReview(r);
            setDrawerOpen(true);
          }}
          onApprove={handleApprove}
          onReject={handleRejectRequest}
          onDelete={handleDelete}
          onToggleFeature={handleToggleFeature}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * pagination.limit + 1}–
              {Math.min(page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} reviews
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500 px-2">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
