"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/app/Component/products/models/ConfirmModal";
import FeedbackModal from "@/app/Component/products/models/FeedbackModal";
import CollectionModal from "@/app/Component/products/models/CollectionModal";
import ProductViewDrawer from "@/app/Component/products/ProductViewDrawer";
import ProductStatsBar from "@/app/Component/products/ProductStatsBar";
import ProductFilters from "@/app/Component/products/ProductFilters";
import ProductTable, { Product } from "@/app/Component/products/ProductTable";

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

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // View drawer
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Collection modal
  const [collectionTarget, setCollectionTarget] = useState<Product | null>(
    null,
  );

  // Modals
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

  // ─── Fetch ───────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("isActive", status);
      if (tag) params.set("tag", tag);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`${API_BASE}/api/products/admin/all?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(data.data || []);
      setPagination(
        data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 },
      );
    } catch {
      showFeedback("error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, status, tag, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  console.log(products);

  // ─── Stats ───────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: pagination.total,
      active: products.filter((p) => p.isActive).length,
      inactive: products.filter((p) => !p.isActive).length,
      featured: products.filter((p) => p.isFeatured).length,
    }),
    [products, pagination.total],
  );

  // ─── Selection ───────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === products.length
        ? new Set()
        : new Set(products.map((p) => p._id)),
    );
  };

  // ─── Toggle status ───────────────────────────────────────────────
  const handleToggleStatus = (product: Product) => {
    const action = product.isActive ? "Deactivate" : "Activate";
    setConfirm({
      open: true,
      title: `${action} product?`,
      message: `"${product.name}" will be ${
        product.isActive ? "hidden from" : "visible on"
      } the website.`,
      confirmLabel: action,
      danger: product.isActive,
      loading: false,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          const res = await fetch(
            `${API_BASE}/api/products/admin/${product._id}/toggle`,
            {
              method: "PATCH",
              headers: authHeaders(),
            },
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setProducts((prev) =>
            prev.map((p) =>
              p._id === product._id
                ? { ...p, isActive: data.data.isActive }
                : p,
            ),
          );
          showFeedback(
            "success",
            `Product ${data.data.isActive ? "activated" : "deactivated"}.`,
          );
        } catch (err: unknown) {
          showFeedback("error", err instanceof Error ? err.message : "Failed");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // ─── Delete single ───────────────────────────────────────────────
  const handleDelete = (product: Product) => {
    setConfirm({
      open: true,
      title: "Delete product?",
      message: `"${product.name}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      loading: false,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          const res = await fetch(
            `${API_BASE}/api/products/admin/${product._id}`,
            {
              method: "DELETE",
              headers: authHeaders(),
            },
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setProducts((prev) => prev.filter((p) => p._id !== product._id));
          setSelectedIds((prev) => {
            prev.delete(product._id);
            return new Set(prev);
          });
          showFeedback("success", "Product deleted.");
        } catch (err: unknown) {
          showFeedback("error", err instanceof Error ? err.message : "Failed");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // ─── Bulk delete ─────────────────────────────────────────────────
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirm({
      open: true,
      title: `Delete ${selectedIds.size} products?`,
      message:
        "These products will be permanently deleted. This cannot be undone.",
      confirmLabel: "Delete all",
      danger: true,
      loading: false,
      onConfirm: async () => {
        setConfirm((c) => ({ ...c, loading: true }));
        try {
          const res = await fetch(`${API_BASE}/api/products/admin/bulk`, {
            method: "DELETE",
            headers: authHeaders(),
            body: JSON.stringify({ ids: Array.from(selectedIds) }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setProducts((prev) => prev.filter((p) => !selectedIds.has(p._id)));
          setSelectedIds(new Set());
          showFeedback("success", data.message);
        } catch (err: unknown) {
          showFeedback("error", err instanceof Error ? err.message : "Failed");
        } finally {
          closeConfirm();
        }
      },
    });
  };

  // ─── Assign collection ────────────────────────────────────────────
  const handleAssignCollection = async (collectionId: string) => {
    if (!collectionTarget) return;
    const res = await fetch(
      `${API_BASE}/api/products/admin/${collectionTarget._id}`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ collection: collectionId }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    await fetchProducts();
    showFeedback("success", "Product assigned to collection.");
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
      <CollectionModal
        open={!!collectionTarget}
        productName={collectionTarget?.name || ""}
        currentCollectionId={collectionTarget?.collection?._id}
        onAssign={handleAssignCollection}
        onClose={() => setCollectionTarget(null)}
      />
      <ProductViewDrawer
        // product={viewProduct}
        // open={drawerOpen}
        // onClose={() => setDrawerOpen(false)}
        // onEdit={(id) => {
        //   setDrawerOpen(false);
        //   router.push(`/admin/products/${id}`);
        // }}
        product={viewProduct}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={(id: string) => {
          setDrawerOpen(false);
          router.push(`/admin/products/${id}`);
        }}
      />

      {/* Page */}
      <div className="p-6 lg:p-8 min-h-full" style={{ background: "#F5F3EE" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              Admin / Products
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          </div>
          <button
            onClick={() => router.push("/admin/products/add")}
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
            Add Product
          </button>
        </div>

        {/* Stats */}
        <ProductStatsBar stats={stats} />

        {/* Filters */}
        <ProductFilters
          search={search}
          status={status}
          tag={tag}
          sort={sort}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onStatus={(v) => {
            setStatus(v);
            setPage(1);
          }}
          onTag={(v) => {
            setTag(v);
            setPage(1);
          }}
          onSort={setSort}
          onClear={() => {
            setSearch("");
            setStatus("");
            setTag("");
            setSort("-createdAt");
            setPage(1);
          }}
        />

        {/* Bulk actions */}
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

        {/* Table */}
        <ProductTable
          products={products}
          loading={loading}
          selectedIds={selectedIds}
          onSelectId={toggleSelect}
          onSelectAll={toggleSelectAll}
          onView={(p) => {
            setViewProduct(p);
            setDrawerOpen(true);
          }}
          onEdit={(id) => router.push(`/admin/products/${id}`)}
          onToggleStatus={handleToggleStatus}
          onAssignCollection={(p) => setCollectionTarget(p)}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * pagination.limit + 1}–
              {Math.min(page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} products
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
