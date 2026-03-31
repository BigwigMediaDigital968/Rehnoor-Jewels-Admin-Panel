"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

function ActionMenu({
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

  const actions = [
    {
      icon: "👁",
      label: "View details",
      onClick: onView,
      color: "text-gray-700",
    },
    {
      icon: "✏",
      label: "Edit product",
      onClick: onEdit,
      color: "text-gray-700",
    },
    {
      icon: "📦",
      label: "Assign collection",
      onClick: onAssignCollection,
      color: "text-gray-700",
    },
    {
      icon: product.isActive ? "🚫" : "✅",
      label: product.isActive ? "Deactivate" : "Activate",
      onClick: onToggleStatus,
      color: product.isActive ? "text-amber-600" : "text-emerald-600",
    },
    {
      icon: "🗑",
      label: "Delete product",
      onClick: onDelete,
      color: "text-red-600",
    },
  ];

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-30 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden"
          style={{ animation: "fadeUp 0.15s ease" }}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                a.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm ${a.color} hover:bg-gray-50 transition-colors cursor-pointer text-left`}
            >
              <span className="text-base" style={{ fontSize: 14 }}>
                {a.icon}
              </span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const router = useRouter();
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
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
                "Product",
                "Price",
                "Collection",
                "Tag",
                "Status",
                "Rating",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3.5 text-left text-[11px] font-600 text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
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
                        <p className="font-medium text-sm text-gray-900 hover:text-amber-700 transition-colors truncate max-w-[180px]">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {product.subtitle || product.sku || product.slug}
                        </p>
                        {product.isFeatured && (
                          <span className="text-[9px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200">
                            FEATURED
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{product.price.toLocaleString("en-IN")}
                    </p>
                    {product.originalPrice && (
                      <p className="text-xs line-through text-gray-400">
                        ₹{product.originalPrice.toLocaleString("en-IN")}
                      </p>
                    )}
                  </td>

                  {/* Collection */}
                  <td className="px-4 py-4">
                    {product.collection ? (
                      <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full font-medium">
                        {product.collection.name}
                      </span>
                    ) : (
                      <button
                        onClick={() => onAssignCollection(product)}
                        className="text-xs text-gray-400 hover:text-amber-600 border border-dashed border-gray-200 hover:border-amber-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                      >
                        + Assign
                      </button>
                    )}
                  </td>

                  {/* Tag */}
                  <td className="px-4 py-4">
                    {product.tag ? (
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          TAG_STYLES[product.tag] || "bg-gray-100 text-gray-600"
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
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-4">
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
                      <span className="text-gray-300 text-xs">No reviews</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {/* Quick edit */}
                      <button
                        onClick={() => onEdit(product._id)}
                        title="Edit"
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
                      {/* Quick delete */}
                      <button
                        onClick={() => onDelete(product)}
                        title="Delete"
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
                      {/* More actions */}
                      <ActionMenu
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
    </div>
  );
}
