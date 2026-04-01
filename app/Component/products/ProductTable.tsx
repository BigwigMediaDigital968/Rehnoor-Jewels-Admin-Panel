"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export interface Product {
  _id: string;
  name: string;
  slug: string;
  subtitle?: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  tag?: string;
  purity?: string;
  metal?: string;
  category?: string;
  isActive: boolean;
  isFeatured: boolean;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  weightGrams?: string;
  bisHallmark?: boolean;
  shortDescription?: string;
  ourPromise?: string;
  images: { src: string; alt: string }[];
  collection?: { _id: string; name: string; slug: string } | null;
  createdAt: string;
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  selectedIds: Set<string>;
  onSelectId: (id: string) => void;
  onSelectAll: () => void;
  onView: (p: Product) => void;
  onEdit: (id: string) => void;
  onToggleStatus: (p: Product) => void;
  onAssignCollection: (p: Product) => void;
  onDelete: (p: Product) => void;
}

const TAG_STYLES: Record<string, string> = {
  Bestseller: "bg-amber-100 text-amber-800",
  New: "bg-emerald-100 text-emerald-800",
  Popular: "bg-blue-100 text-blue-800",
  Limited: "bg-red-100 text-red-800",
  Exclusive: "bg-purple-100 text-purple-800",
  Trending: "bg-orange-100 text-orange-800",
};

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────
function Tip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
            {label}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  );
}

// ─── Side action panel (opens on ⋮ click, closes only on × button) ────────────
function ActionPanel({
  product,
  onView,
  onEdit,
  onToggleStatus,
  onAssignCollection,
  onDelete,
}: {
  product: Product;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onAssignCollection: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const actions = [
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      label: "View details",
      hint: "Open full product detail panel",
      onClick: onView,
      color: "text-gray-700 hover:bg-blue-50 hover:text-blue-700",
      border: "border-blue-100",
    },
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      label: "Edit product",
      hint: "Edit all product fields and images",
      onClick: onEdit,
      color: "text-gray-700 hover:bg-amber-50 hover:text-amber-700",
      border: "border-amber-100",
    },
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      label: "Assign collection",
      hint: "Move to a different collection",
      onClick: onAssignCollection,
      color: "text-gray-700 hover:bg-purple-50 hover:text-purple-700",
      border: "border-purple-100",
    },
    {
      icon: product.isActive ? (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: product.isActive ? "Deactivate" : "Activate",
      hint: product.isActive
        ? "Hide from public website"
        : "Make visible on website",
      onClick: onToggleStatus,
      color: product.isActive
        ? "text-amber-700 hover:bg-amber-50"
        : "text-emerald-700 hover:bg-emerald-50",
      border: product.isActive ? "border-amber-100" : "border-emerald-100",
    },
    {
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      label: "Delete product",
      hint: "Permanently delete — cannot be undone",
      onClick: onDelete,
      color: "text-red-600 hover:bg-red-50",
      border: "border-red-100",
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <Tip label="More actions">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            open
              ? "bg-gray-200 text-gray-700"
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </Tip>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-10 z-40 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ animation: "fadeUp 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {product.name}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Choose an action below
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0 ml-2"
              title="Close"
            >
              <svg
                className="w-3.5 h-3.5"
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

          {/* Actions */}
          <div className="p-2">
            {actions.map((a, i) => (
              <button
                key={a.label}
                onClick={() => {
                  a.onClick();
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer text-left mb-0.5 last:mb-0 ${
                  a.color
                } ${
                  a.danger
                    ? "mt-1 border-t border-gray-100 pt-2.5 rounded-t-none border-0"
                    : ""
                }`}
              >
                <span className="flex-shrink-0 mt-0.5">{a.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium text-[13px] leading-tight">
                    {a.label}
                  </p>
                  <p className="text-[10px] opacity-60 mt-0.5 leading-tight">
                    {a.hint}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────
export default function ProductTable({
  products,
  loading,
  selectedIds,
  onSelectId,
  onSelectAll,
  onView,
  onEdit,
  onToggleStatus,
  onAssignCollection,
  onDelete,
}: ProductTableProps) {
  const allSelected =
    products.length > 0 && selectedIds.size === products.length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin w-8 h-8 text-amber-500"
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
            <p className="text-sm text-gray-400">Loading products…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="pl-5 pr-3 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                  />
                </th>
                {[
                  {
                    label: "Product",
                    hint: "Click product name to view details",
                  },
                  { label: "Price", hint: "Sale price / original price" },
                  {
                    label: "Collection",
                    hint: "Click + Assign to link to a collection",
                  },
                  { label: "Tag", hint: "Promotional label" },
                  {
                    label: "Status",
                    hint: "Click to toggle active / inactive",
                  },
                  // { label: "Rating", hint: "Avg rating from reviews" },
                  { label: "Actions", hint: "Edit · Delete · More" },
                ].map(({ label, hint }) => (
                  <th
                    key={label}
                    className="px-4 py-3.5 text-left whitespace-nowrap"
                  >
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-[9px] text-gray-300 font-normal mt-0.5 normal-case tracking-normal">
                      {hint}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📭</span>
                      <p className="text-gray-400 text-sm">No products found</p>
                      <p className="text-gray-300 text-xs">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr
                    key={product._id}
                    className={`border-b border-gray-50 transition-colors group ${
                      selectedIds.has(product._id)
                        ? "bg-amber-50/60"
                        : idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50/30"
                    } hover:bg-amber-50/40`}
                  >
                    {/* Checkbox */}
                    <td className="pl-5 pr-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product._id)}
                        onChange={() => onSelectId(product._id)}
                        className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                      />
                    </td>

                    {/* Product */}
                    <td className="px-4 py-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => onView(product)}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative border border-gray-200">
                          {product.images?.[0]?.src ? (
                            <Image
                              src={product.images[0].src}
                              alt={product.images[0].alt || product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                              ◆
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 group-hover:text-amber-700 transition-colors truncate max-w-[180px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {product.subtitle || product.sku || product.slug}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {product.isFeatured && (
                              <span className="text-[9px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200">
                                FEATURED
                              </span>
                            )}
                            {product.bisHallmark && (
                              <span className="text-[9px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-200">
                                BIS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{product.price.toLocaleString("en-IN")}
                      </p>
                      {product.originalPrice && (
                        <>
                          <p className="text-xs line-through text-gray-400">
                            ₹{product.originalPrice.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-red-500 font-medium">
                            {Math.round(
                              (1 - product.price / product.originalPrice) * 100,
                            )}
                            % off
                          </p>
                        </>
                      )}
                    </td>

                    {/* Collection */}
                    <td className="px-4 py-4">
                      {product.collection ? (
                        <Tip label="Click ⋯ → Assign collection to change">
                          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full font-medium cursor-default">
                            {product.collection.name}
                          </span>
                        </Tip>
                      ) : (
                        <Tip label="Assign this product to a collection">
                          <button
                            onClick={() => onAssignCollection(product)}
                            className="text-xs text-gray-400 hover:text-amber-600 border border-dashed border-gray-200 hover:border-amber-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            + Assign
                          </button>
                        </Tip>
                      )}
                    </td>

                    {/* Tag */}
                    <td className="px-4 py-4">
                      {product.tag ? (
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            TAG_STYLES[product.tag] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.tag}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <Tip
                        label={
                          product.isActive
                            ? "Click to deactivate (hide from site)"
                            : "Click to activate (show on site)"
                        }
                      >
                        <button
                          onClick={() => onToggleStatus(product)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                              product.isActive ? "bg-emerald-500" : "bg-red-400"
                            }`}
                          />
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </Tip>
                    </td>

                    {/* Rating */}
                    {/* <td className="px-4 py-4">
                      {product.rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="text-sm font-medium text-gray-700">
                            {product.rating}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({product.reviewCount})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">
                          No reviews
                        </span>
                      )}
                    </td> */}

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-0.5">
                        {/* Edit */}
                        <Tip label="Edit product">
                          <button
                            onClick={() => onEdit(product._id)}
                            className="w-8 h-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </Tip>
                        {/* Delete */}
                        <Tip label="Delete product">
                          <button
                            onClick={() => onDelete(product)}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </Tip>
                        {/* More actions panel */}
                        <ActionPanel
                          product={product}
                          onView={() => onView(product)}
                          onEdit={() => onEdit(product._id)}
                          onToggleStatus={() => onToggleStatus(product)}
                          onAssignCollection={() => onAssignCollection(product)}
                          onDelete={() => onDelete(product)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer hint */}
        {products.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center gap-4">
            <p className="text-[10px] text-gray-400">
              <span className="font-medium text-gray-500">Tip:</span> Click on a
              product name or image to view full details · Click the status
              badge to toggle · Use ⋯ for all actions
            </p>
          </div>
        )}
      </div>
    </>
  );
}
