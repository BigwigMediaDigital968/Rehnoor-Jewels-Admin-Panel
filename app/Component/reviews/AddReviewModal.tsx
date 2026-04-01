"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  name: string;
  slug: string;
  price?: number;
  tag?: string;
  isActive?: boolean;
  category?: string;
  purity?: string;
  images?: { src: string; alt?: string }[];
}

interface AddReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("admin_token") || ""
    : "";
}

const MAX_FILES = 5;
const MAX_MB = 5;

function inr(n?: number) {
  if (n == null) return null;
  return `₹${n.toLocaleString("en-IN")}`;
}

// ─── Tag pill colors ──────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Bestseller: { bg: "#FFF8E6", color: "#a06800" },
  New: { bg: "#EBF5FF", color: "#1a6fbf" },
  Popular: { bg: "#FFF0F9", color: "#9c2b7a" },
  Limited: { bg: "#FFF0F0", color: "#c0392b" },
  Exclusive: { bg: "#F0F4FF", color: "#3730a3" },
  Trending: { bg: "#F0FFF4", color: "#166534" },
  Featured: { bg: "#FDF4FF", color: "#7e22ce" },
};

// ─── ProductSelect ────────────────────────────────────────────────────────────
// A fully custom searchable dropdown that shows thumbnail, price, tag and purity.

interface ProductSelectProps {
  products: Product[];
  value: string; // selected product _id
  onChange: (id: string) => void;
  loading: boolean;
  onSearch: (q: string) => void;
  searchQuery: string;
  totalProducts: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function ProductSelect({
  products,
  value,
  onChange,
  loading,
  onSearch,
  searchQuery,
  totalProducts,
  page,
  totalPages,
  onPageChange,
}: ProductSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = products.find((p) => p._id === value) ?? null;

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    onSearch(""); // reset search
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    onSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 border rounded-xl text-left transition-all cursor-pointer ${
          open
            ? "border-amber-400 ring-2 ring-amber-100 bg-white"
            : "border-gray-200 bg-white hover:border-amber-300"
        }`}
      >
        {selected ? (
          <>
            {/* Thumb */}
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50">
              {selected.images?.[0]?.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.images[0].src}
                  alt={selected.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-base">
                  🖼
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                {selected.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {inr(selected.price) && (
                  <span className="text-[11px] font-medium text-amber-700">
                    {inr(selected.price)}
                  </span>
                )}
                {selected.purity && (
                  <span className="text-[10px] text-gray-400">
                    {selected.purity}
                  </span>
                )}
                {selected.category && (
                  <span className="text-[10px] text-gray-400">
                    · {selected.category}
                  </span>
                )}
              </div>
            </div>

            {/* Tag + clear */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {selected.tag && TAG_COLORS[selected.tag] && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: TAG_COLORS[selected.tag].bg,
                    color: TAG_COLORS[selected.tag].color,
                  }}
                >
                  {selected.tag}
                </span>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer text-xs"
                title="Clear selection"
              >
                ×
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-300 flex-shrink-0 text-base">
              🔍
            </div>
            <span className="text-sm text-gray-400 flex-1">
              Select a product…
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                open ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          style={{
            maxHeight: 340,
            animation: "psDropIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Search input */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-amber-400 focus-within:bg-white transition-all">
              <svg
                className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => {
                  onSearch(e.target.value);
                  onPageChange(1);
                }}
                placeholder="Search products by name…"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearch("");
                    onPageChange(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 px-0.5">
              {loading
                ? "Searching…"
                : `${totalProducts} product${
                    totalProducts !== 1 ? "s" : ""
                  } found`}
            </p>
          </div>

          {/* Product list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <svg
                  className="animate-spin w-4 h-4 text-amber-400"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-xs text-gray-400">Loading products…</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-sm text-gray-400">No products found</p>
                {searchQuery && (
                  <p className="text-xs text-gray-300 mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              products.map((p) => {
                const isSelected = p._id === value;
                const tagStyle = p.tag ? TAG_COLORS[p.tag] : null;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => handleSelect(p._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all cursor-pointer group ${
                      isSelected
                        ? "bg-amber-50 border-l-2 border-l-amber-400"
                        : "hover:bg-gray-50 border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-50 relative">
                      {p.images?.[0]?.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0].src}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                          🖼
                        </div>
                      )}
                      {/* Active indicator dot */}
                      {p.isActive !== undefined && (
                        <div
                          className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white ${
                            p.isActive ? "bg-emerald-400" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate leading-tight ${
                            isSelected ? "text-amber-800" : "text-gray-800"
                          }`}
                        >
                          {p.name}
                        </p>
                        {isSelected && (
                          <svg
                            className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {inr(p.price) && (
                          <span className="text-[11px] font-semibold text-amber-600">
                            {inr(p.price)}
                          </span>
                        )}
                        {p.purity && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {p.purity}
                          </span>
                        )}
                        {p.category && (
                          <span className="text-[10px] text-gray-400">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tag badge */}
                    {p.tag && tagStyle && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: tagStyle.bg,
                          color: tagStyle.color,
                        }}
                      >
                        {p.tag}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 flex-shrink-0 bg-gray-50/60">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="text-[11px] text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-[11px] text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="text-[11px] text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Keyframe for dropdown */}
      <style>{`
        @keyframes psDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── AddReviewModal ───────────────────────────────────────────────────────────

export default function AddReviewModal({
  open,
  onClose,
  onSuccess,
  onError,
}: AddReviewModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const [prodPage, setProdPage] = useState(1);
  const [prodTotal, setProdTotal] = useState(0);
  const PROD_LIMIT = 10;

  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    productId: "",
    rating: "5",
    reviewTitle: "",
    reviewDescription: "",
    username: "",
    userCity: "",
    sizePurchased: "",
    adminNote: "",
  });

  // ── Fetch products with search + pagination ──────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!open) return;
    setProdLoading(true);
    try {
      const params = new URLSearchParams();
      if (prodSearch) params.set("search", prodSearch);
      params.set("page", String(prodPage));
      params.set("limit", String(PROD_LIMIT));

      const res = await fetch(`${API_BASE}/api/products/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setProducts(data.data || []);
      setProdTotal(data.pagination?.total ?? 0);
    } catch {
      // non-fatal
    } finally {
      setProdLoading(false);
    }
  }, [open, prodSearch, prodPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Cleanup on close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
      setProdSearch("");
      setProdPage(1);
      setForm({
        productId: "",
        rating: "5",
        reviewTitle: "",
        reviewDescription: "",
        username: "",
        userCity: "",
        sizePurchased: "",
        adminNote: "",
      });
    }
  }, [open]); // eslint-disable-line

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // ── Image handling ───────────────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_FILES - previews.length;
    const errs: string[] = [];
    const next: { file: File; url: string }[] = [];
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        if (!file.type.startsWith("image/")) {
          errs.push(`${file.name} is not an image`);
          return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
          errs.push(`${file.name} exceeds ${MAX_MB}MB`);
          return;
        }
        next.push({ file, url: URL.createObjectURL(file) });
      });
    if (errs.length) onError(errs.join(", "));
    if (next.length) setPreviews((p) => [...p, ...next]);
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i].url);
    setPreviews((p) => p.filter((_, j) => j !== i));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (
      !form.productId ||
      !form.reviewTitle ||
      !form.reviewDescription ||
      !form.username
    ) {
      onError("Product, title, description and username are required.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("rating", form.rating);
      fd.append("reviewTitle", form.reviewTitle);
      fd.append("reviewDescription", form.reviewDescription);
      fd.append("username", form.username);
      if (form.userCity) fd.append("userCity", form.userCity);
      if (form.sizePurchased) fd.append("sizePurchased", form.sizePurchased);
      previews.forEach((p) => fd.append("images", p.file));

      const submitRes = await fetch(
        `${API_BASE}/api/reviews/${form.productId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd,
        },
      );
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.message || "Submit failed");

      const approveRes = await fetch(
        `${API_BASE}/api/reviews/admin/${submitData.data._id}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            adminNote: form.adminNote || "Added directly by admin",
          }),
        },
      );
      const approveData = await approveRes.json();
      if (!approveRes.ok)
        throw new Error(approveData.message || "Approve failed");

      onSuccess("Review added and approved successfully.");
      onClose();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const prodTotalPages = Math.ceil(prodTotal / PROD_LIMIT);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        style={{ animation: "fadeUp 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Add review</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Review will be submitted and auto-approved
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ── Product selector — upgraded ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Product *
              </label>
              {form.productId && (
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  ✓ Selected
                </span>
              )}
            </div>
            <ProductSelect
              products={products}
              value={form.productId}
              onChange={(id) => set("productId", id)}
              loading={prodLoading}
              onSearch={setProdSearch}
              searchQuery={prodSearch}
              totalProducts={prodTotal}
              page={prodPage}
              totalPages={prodTotalPages}
              onPageChange={setProdPage}
            />
          </div>

          {/* Rating stars */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("rating", String(s))}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-8 h-8 ${
                      s <= Number(form.rating)
                        ? "text-amber-400"
                        : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="text-sm font-semibold text-gray-700 ml-1">
                {form.rating}/5
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Review Title *
            </label>
            <input
              value={form.reviewTitle}
              onChange={(e) => set("reviewTitle", e.target.value)}
              placeholder="e.g. Absolutely stunning quality!"
              maxLength={120}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Review Description *
            </label>
            <textarea
              value={form.reviewDescription}
              onChange={(e) => set("reviewDescription", e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Detailed review…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
            />
            <p className="text-right text-xs text-gray-300 mt-1">
              {form.reviewDescription.length}/2000
            </p>
          </div>

          {/* Reviewer details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Username *
              </label>
              <input
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="Arjun Mehta"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                City
              </label>
              <input
                value={form.userCity}
                onChange={(e) => set("userCity", e.target.value)}
                placeholder="New Delhi"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Size Purchased
              </label>
              <input
                value={form.sizePurchased}
                onChange={(e) => set("sizePurchased", e.target.value)}
                placeholder='e.g. 18" or M'
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Admin Note
              </label>
              <input
                value={form.adminNote}
                onChange={(e) => set("adminNote", e.target.value)}
                placeholder="Optional note"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-600">
                Review Photos
              </label>
              <span className="text-[10px] text-gray-400">
                {previews.length}/{MAX_FILES}
              </span>
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 rounded-xl py-5 cursor-pointer transition-all"
            >
              <svg
                className="w-6 h-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <p className="text-xs text-gray-500">Click to add photos</p>
              <p className="text-[10px] text-gray-400">
                JPG, PNG, WebP · Max {MAX_MB}MB each
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              onClick={(e) => ((e.target as HTMLInputElement).value = "")}
            />
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {previews.map((p, i) => (
                  <div key={i} className="relative group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {previews.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 flex items-center justify-center text-gray-400 hover:text-amber-500 transition-colors cursor-pointer text-xl"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#003720] hover:bg-[#004d2d] text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Adding…
              </>
            ) : (
              "Add & Approve"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
