"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type CollectionTag =
  | "Bestseller"
  | "New"
  | "Popular"
  | "Limited"
  | "Exclusive"
  | "Trending"
  | "Featured"
  | "";

export interface ProductSummary {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  isActive: boolean;
  tag: string;
  category: string;
  purity: string;
  rating: number;
  reviewCount: number;
  images?: { src: string; alt?: string }[];
  subtitle?: string;
  sku?: string;
  weightGrams?: string;
  shortDescription?: string;
  collection?: { _id: string; name: string } | null;
}

export interface Collection {
  _id: string;
  name: string;
  slug: string;
  label: string;
  tagline: string;
  description: string;
  heroImage: string;
  accentColor: string;
  tag: CollectionTag;
  purity: string;
  breadcrumb: string[];
  productCount: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  products?: ProductSummary[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ModalState =
  | { type: "none" }
  | { type: "view"; collection: Collection }
  | { type: "confirm-delete"; id: string; name: string }
  | { type: "confirm-toggle"; id: string; name: string; currentStatus: boolean }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const TAGS: CollectionTag[] = [
  "",
  "Bestseller",
  "New",
  "Popular",
  "Limited",
  "Exclusive",
  "Trending",
  "Featured",
];
export const PURITIES = ["22kt", "18kt", "24kt", "14kt", "925 Silver"];
export const EMPTY_FORM = {
  name: "",
  slug: "",
  label: "",
  tagline: "",
  description: "",
  heroImage: "",
  accentColor: "rgba(0,36,16,0.88)",
  tag: "" as CollectionTag,
  purity: "22kt",
  breadcrumb: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  isActive: true,
  sortOrder: "0",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("admin_token") || ""
    : "";
}
export function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}
export function authOnlyHeaders(): Record<string, string> {
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
function inr(n?: number) {
  if (n == null) return "—";
  return `\u20B9${n.toLocaleString("en-IN")}`;
}

// ─── Shared small components ──────────────────────────────────────────────────

function TagPill({ tag }: { tag: string }) {
  if (!tag) return <span style={{ color: "#ccc", fontSize: 11 }}>—</span>;
  const map: Record<string, { bg: string; color: string }> = {
    Bestseller: { bg: "#FFF8E6", color: "#a06800" },
    New: { bg: "#EBF5FF", color: "#1a6fbf" },
    Popular: { bg: "#FFF0F9", color: "#9c2b7a" },
    Limited: { bg: "#FFF0F0", color: "#c0392b" },
    Exclusive: { bg: "#F0F4FF", color: "#3730a3" },
    Trending: { bg: "#F0FFF4", color: "#166534" },
    Featured: { bg: "#FDF4FF", color: "#7e22ce" },
  };
  const s = map[tag] || { bg: "#F5F5F5", color: "#555" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {tag}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: active ? "#EDFAF3" : "#F5F5F5",
        color: active ? "#1a7a4a" : "#888",
        border: `1px solid ${active ? "#2ecc7130" : "#E0E0E0"}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "#2ecc71" : "#ccc",
          display: "inline-block",
        }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: 12,
            color: i <= Math.round(rating) ? "#f0a500" : "#E5E0D4",
          }}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

// ─── Product Detail Popup (centered modal) ────────────────────────────────────

export function ProductDetailModal({
  product,
  onClose,
}: {
  product: ProductSummary;
  onClose: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = product.images ?? [];

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        background: "rgba(10,8,5,0.68)",
        backdropFilter: "blur(7px)",
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
          maxWidth: 780,
          background: "#fff",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          animation: "cmFadeUp 0.25s ease",
          margin: "auto",
        }}
      >
        <div
          style={{
            height: 3,
            background: product.isActive
              ? "linear-gradient(90deg,#D4A017,#f0c040)"
              : "#E5E0D4",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 12px",
            borderBottom: "1px solid #F0EBE0",
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
              Product Detail
            </p>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#1a1a1a",
                margin: "3px 0 0",
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </h2>
            {product.subtitle && (
              <p style={{ fontSize: 12, color: "#999", margin: "3px 0 0" }}>
                {product.subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "#F5F1E8",
              color: "#666",
              cursor: "pointer",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            &#10005;
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            maxHeight: "76vh",
            overflowY: "auto",
          }}
        >
          {/* Left: gallery */}
          <div
            style={{
              background: "#FDFAF4",
              borderRight: "1px solid #F0EBE0",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                aspectRatio: "1/1",
                borderRadius: 12,
                overflow: "hidden",
                background: "#F5F2EA",
                border: "1px solid #EEE9DD",
              }}
            >
              {images[imgIdx] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[imgIdx].src}
                  alt={images[imgIdx].alt || product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#CCC",
                    fontSize: 32,
                  }}
                >
                  &#128444;
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: `2px solid ${
                        i === imgIdx ? "#D4A017" : "#E5E0D4"
                      }`,
                      cursor: "pointer",
                      padding: 0,
                      background: "none",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            <div
              style={{
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid #EEE9DD",
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}
                >
                  {inr(product.price)}
                </span>
                {product.originalPrice && (
                  <span
                    style={{
                      fontSize: 13,
                      color: "#bbb",
                      textDecoration: "line-through",
                    }}
                  >
                    {inr(product.originalPrice)}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1a7a4a",
                    background: "#EDFAF3",
                    padding: "2px 7px",
                    borderRadius: 8,
                    display: "inline-block",
                    marginTop: 4,
                  }}
                >
                  {discount}% off
                </span>
              )}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Stars rating={product.rating} />
                <span style={{ fontSize: 11, color: "#999" }}>
                  ({product.reviewCount})
                </span>
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div style={{ padding: "20px 22px", overflowY: "auto" }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              <StatusBadge active={product.isActive} />
              {product.tag && <TagPill tag={product.tag} />}
              {product.purity && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 12,
                    background: "#FFF8E6",
                    color: "#a06800",
                    fontSize: 11,
                    fontWeight: 600,
                    border: "1px solid #f0a50030",
                  }}
                >
                  {product.purity}
                </span>
              )}
            </div>
            {product.shortDescription && (
              <p
                style={{
                  fontSize: 13,
                  color: "#555",
                  lineHeight: 1.6,
                  margin: "0 0 16px",
                }}
              >
                {product.shortDescription}
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 20px",
                marginBottom: 18,
              }}
            >
              {[
                { label: "SKU", value: product.sku || "—" },
                { label: "Category", value: product.category || "—" },
                { label: "Weight", value: product.weightGrams || "—" },
                {
                  label: "Collection",
                  value: product.collection?.name || "None",
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#8B7355",
                      margin: "0 0 2px",
                    }}
                  >
                    {label}
                  </p>
                  <p style={{ fontSize: 13, color: "#333", margin: 0 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "#8B7355",
                  margin: "0 0 3px",
                }}
              >
                Slug
              </p>
              <code
                style={{
                  fontSize: 11,
                  background: "#F5F2EA",
                  padding: "3px 8px",
                  borderRadius: 5,
                  color: "#7a6040",
                }}
              >
                {product.slug}
              </code>
            </div>
            {images.length > 0 && (
              <div
                style={{
                  padding: "12px 14px",
                  background: "#FDFAF4",
                  border: "1px solid #EEE9DD",
                  borderRadius: 10,
                  marginTop: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "#8B7355",
                    margin: "0 0 10px",
                  }}
                >
                  All Images ({images.length})
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {images.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 10px",
                        background: "#fff",
                        borderRadius: 8,
                        border: "1px solid #EEE9DD",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt=""
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 6,
                          objectFit: "cover",
                          border: "1px solid #E5E0D4",
                          flexShrink: 0,
                        }}
                      />
                      <p
                        style={{
                          fontSize: 11,
                          color: "#888",
                          margin: 0,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {img.alt || `Image ${i + 1}`}
                      </p>
                      {i === 0 && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            background: "#D4A017",
                            color: "#fff",
                            padding: "2px 7px",
                            borderRadius: 8,
                            flexShrink: 0,
                          }}
                        >
                          MAIN
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Picker ───────────────────────────────────────────────────────────

// Ordered list of the selected products: edit the position number, drag a row,
// or use the arrows. Moving one product only shifts the products between its
// old and new position — everything else keeps its place.
function PositionInput({
  value,
  max,
  onCommit,
}: {
  value: number;
  max: number;
  onCommit: (pos: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Math.round(Number(text));
    if (!Number.isFinite(n) || n < 1) return setText(String(value));
    onCommit(Math.min(n, max));
  };
  return (
    <input
      type="number"
      min={1}
      max={max}
      value={text}
      aria-label="Position in collection"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) =>
        e.key === "Enter" && (e.target as HTMLInputElement).blur()
      }
      style={{
        width: 44,
        padding: "4px 6px",
        borderRadius: 6,
        border: "1.5px solid #E5E0D4",
        fontSize: 12,
        fontWeight: 700,
        textAlign: "center",
        color: "#a06800",
        outline: "none",
      }}
    />
  );
}

function SelectedOrderList({
  selected,
  lookup,
  onChange,
}: {
  selected: string[];
  lookup: (id: string) => ProductSummary | undefined;
  onChange: (ids: string[]) => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= selected.length) return;
    const next = [...selected];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const endDrag = () => {
    setDragIdx(null);
    setOverIdx(null);
  };
  const arrowBtn: React.CSSProperties = {
    width: 22,
    height: 18,
    border: "1px solid #E5E0D4",
    background: "#fff",
    borderRadius: 4,
    fontSize: 9,
    lineHeight: 1,
    color: "#777",
    cursor: "pointer",
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#8B7355",
          margin: "0 0 6px",
        }}
      >
        Display order{" "}
        <span style={{ fontWeight: 400, textTransform: "none", color: "#aaa" }}>
          — drag rows or type a position
        </span>
      </p>
      <div
        style={{
          border: "1px solid #E5E0D4",
          borderRadius: 10,
          background: "#fff",
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {selected.map((id, i) => {
          const p = lookup(id);
          const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => {
                setDragIdx(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (overIdx !== i) setOverIdx(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null) move(dragIdx, i);
                endDrag();
              }}
              onDragEnd={endDrag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderBottom:
                  i < selected.length - 1 ? "1px solid #F5F2EA" : "none",
                background: dragIdx === i ? "#FFF8E6" : "#fff",
                opacity: dragIdx === i ? 0.5 : 1,
                borderTop: isOver
                  ? "2px solid #D4A017"
                  : "2px solid transparent",
              }}
            >
              <span
                title="Drag to reorder"
                aria-hidden
                style={{
                  cursor: "grab",
                  color: "#bbb",
                  fontSize: 16,
                  userSelect: "none",
                }}
              >
                &#8942;&#8942;
              </span>
              <PositionInput
                value={i + 1}
                max={selected.length}
                onCommit={(pos) => move(i, pos - 1)}
              />
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "#F5F2EA",
                  border: "1px solid #E5E0D4",
                }}
              >
                {p?.images?.[0]?.src && (
                  <img
                    src={p.images[0].src}
                    alt=""
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  /> // eslint-disable-line @next/next/no-img-element
                )}
              </div>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1a1a1a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p?.name ?? id}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  style={{ ...arrowBtn, opacity: i === 0 ? 0.35 : 1 }}
                >
                  &#9650;
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === selected.length - 1}
                  onClick={() => move(i, i + 1)}
                  style={{
                    ...arrowBtn,
                    opacity: i === selected.length - 1 ? 0.35 : 1,
                  }}
                >
                  &#9660;
                </button>
              </div>
              <button
                type="button"
                aria-label="Remove from collection"
                onClick={() => onChange(selected.filter((s) => s !== id))}
                style={{
                  background: "none",
                  border: "none",
                  color: "#c0392b",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                &#10005;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProductPicker({
  selected,
  onChange,
  onViewProduct,
  initialProducts,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  onViewProduct: (p: ProductSummary) => void;
  initialProducts?: ProductSummary[];
}) {
  // Remembers every product seen so selected ones keep their name/image
  // even after paging or searching away from them.
  const knownProducts = useRef(
    new Map<string, ProductSummary>(
      (initialProducts ?? []).map((p) => [p._id, p]),
    ),
  );
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const [prodPage, setProdPage] = useState(1);
  const [prodTotal, setProdTotal] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const PROD_LIMIT = 8;

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (prodSearch) params.set("search", prodSearch);
      params.set("page", String(prodPage));
      params.set("limit", String(PROD_LIMIT));
      const res = await fetch(`${API_BASE}/api/products/admin/all?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        (data.data as ProductSummary[]).forEach((p) =>
          knownProducts.current.set(p._id, p),
        );
        setProducts(data.data);
        setProdTotal(data.pagination?.total ?? 0);
      }
    } catch {
      /* non-fatal */
    } finally {
      setLoadingProducts(false);
    }
  }, [prodSearch, prodPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );

  const totalPages = Math.ceil(prodTotal / PROD_LIMIT);

  useEffect(() => {
    if (!addOpen) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && setAddOpen(false);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [addOpen]);

  return (
    <div>
      {/* Clean summary: only the ordered products of this collection */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>
          {selected.length > 0
            ? `${selected.length} product${selected.length !== 1 ? "s" : ""} in this collection`
            : "No products added yet"}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                fontSize: 12,
                color: "#c0392b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: "#D4A017",
              color: "#fff",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            + Add products
          </button>
        </div>
      </div>

      {selected.length > 0 ? (
        <SelectedOrderList
          selected={selected}
          lookup={(id) => knownProducts.current.get(id)}
          onChange={onChange}
        />
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            border: "1.5px dashed #E5E0D4",
            borderRadius: 10,
            color: "#aaa",
            fontSize: 13,
          }}
        >
          Click &ldquo;Add products&rdquo; to choose what belongs in this
          collection.
        </div>
      )}

      {addOpen && (
        <div
          onClick={() => setAddOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
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
            role="dialog"
            aria-modal="true"
            aria-label="Add products to collection"
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 28px 70px rgba(0,0,0,0.22)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #F0EBE0",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
                Add products
              </h3>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "#F5F1E8",
                  color: "#666",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                &#10005;
              </button>
            </div>

            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                <input
                  value={prodSearch}
                  onChange={(e) => {
                    setProdSearch(e.target.value);
                    setProdPage(1);
                  }}
                  placeholder="Search products by name or SKU..."
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #E5E0D4",
                    fontSize: 12,
                    outline: "none",
                    background: "#fff",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D4A017")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E0D4")}
                />
                <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {selected.length} selected
                </span>
              </div>

      <div
        style={{
          border: "1px solid #E5E0D4",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {loadingProducts ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 24,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "2px solid #E5E0D4",
                borderTop: "2px solid #D4A017",
                animation: "cmSpin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: 12, color: "#aaa" }}>
              Loading products...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 24,
              color: "#bbb",
              fontSize: 13,
            }}
          >
            No products found
          </div>
        ) : (
          products.map((p, i) => {
            const isChecked = selected.includes(p._id);
            return (
              <div
                key={p._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom:
                    i < products.length - 1 ? "1px solid #F5F2EA" : "none",
                  background: isChecked ? "#FFFBF0" : "#fff",
                  transition: "background 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(p._id)}
                  style={{
                    width: 15,
                    height: 15,
                    accentColor: "#D4A017",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <div
                  onClick={() => toggle(p._id)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 7,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "#F5F2EA",
                    border: "1px solid #E5E0D4",
                    cursor: "pointer",
                  }}
                >
                  {p.images?.[0]?.src ? (
                    <img
                      src={p.images[0].src}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    /> // eslint-disable-line @next/next/no-img-element
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}
                    >
                      &#128444;
                    </div>
                  )}
                </div>
                <div
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() => toggle(p._id)}
                >
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
                    {p.name}
                  </p>
                  <p style={{ fontSize: 11, color: "#999", margin: "2px 0 0" }}>
                    {inr(p.price)}
                    {p.category ? ` · ${p.category}` : ""}
                    {p.purity ? ` · ${p.purity}` : ""}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <StatusBadge active={p.isActive} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProduct(p);
                    }}
                    title="View product details"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "1px solid #BDD9FF",
                      background: "#F0F7FF",
                      color: "#1a6fbf",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    &#128065;
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <button
            onClick={() => setProdPage((p) => Math.max(1, p - 1))}
            disabled={prodPage === 1}
            style={{
              ...ppBtn,
              opacity: prodPage === 1 ? 0.4 : 1,
              cursor: prodPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            &#8592; Prev
          </button>
          <span style={{ fontSize: 11, color: "#aaa" }}>
            Page {prodPage} / {totalPages} &middot; {prodTotal} products
          </span>
          <button
            onClick={() => setProdPage((p) => Math.min(totalPages, p + 1))}
            disabled={prodPage === totalPages}
            style={{
              ...ppBtn,
              opacity: prodPage === totalPages ? 0.4 : 1,
              cursor: prodPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next &#8594;
          </button>
        </div>
      )}
            </div>

            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #F0EBE0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#FDFAF5",
              }}
            >
              <span style={{ fontSize: 12, color: "#aaa" }}>
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 9,
                  border: "none",
                  background: "#D4A017",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ppBtn: React.CSSProperties = {
  padding: "5px 12px",
  borderRadius: 7,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  color: "#555",
  fontSize: 11,
  cursor: "pointer",
};

// ─── Feedback Modal ───────────────────────────────────────────────────────────

function FeedbackModal({
  modal,
  onConfirm,
  onClose,
}: {
  modal: ModalState;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (["none", "add", "edit", "view"].includes(modal.type)) return null;

  const isSuccess = modal.type === "success";
  const isError = modal.type === "error";
  const isConfirm =
    modal.type === "confirm-delete" || modal.type === "confirm-toggle";
  const accentColor = isSuccess
    ? "#2ecc71"
    : isError
    ? "#e74c3c"
    : modal.type === "confirm-toggle"
    ? "#f0a500"
    : "#e74c3c";
  const iconBg = isSuccess
    ? "#EDFAF3"
    : isError
    ? "#FFF0F0"
    : modal.type === "confirm-toggle"
    ? "#FFF8E6"
    : "#FFF0F0";
  const iconColor = isSuccess
    ? "#1a7a4a"
    : isError
    ? "#c0392b"
    : modal.type === "confirm-toggle"
    ? "#a06800"
    : "#c0392b";
  const icon = isSuccess
    ? "&#10003;"
    : isError
    ? "&#9888;"
    : modal.type === "confirm-toggle"
    ? "&#8644;"
    : "&#128465;";
  const title = isSuccess
    ? "Done!"
    : isError
    ? "Something went wrong"
    : modal.type === "confirm-delete"
    ? `Delete "${modal.name}"?`
    : modal.type === "confirm-toggle"
    ? `${modal.currentStatus ? "Deactivate" : "Activate"} "${modal.name}"?`
    : "";
  const body = isSuccess
    ? modal.message
    : isError
    ? modal.message
    : modal.type === "confirm-delete"
    ? "This will permanently delete the collection and unlink all its products. This cannot be undone."
    : modal.type === "confirm-toggle"
    ? `This collection will be ${
        modal.currentStatus
          ? "hidden from the public store"
          : "made visible to customers"
      }.`
    : "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
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
          animation: "cmFadeUp 0.22s ease",
        }}
      >
        <div style={{ height: 3, background: accentColor }} />
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
              color: iconColor,
            }}
            dangerouslySetInnerHTML={{ __html: icon }}
          />
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
                  style={{
                    ...btnPrimary,
                    background:
                      modal.type === "confirm-toggle" ? "#f0a500" : "#e74c3c",
                    cursor: "pointer",
                  }}
                >
                  {modal.type === "confirm-delete"
                    ? "Yes, delete"
                    : modal.currentStatus
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                style={{
                  ...btnPrimary,
                  background: accentColor,
                  cursor: "pointer",
                }}
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

// ─── View Pop up ──────────────────────────────────────────────────────────────

function CollectionPopup({
  collection,
  onClose,
  onEdit,
  onDelete,
  onToggle,
  onViewProduct,
}: {
  collection: Collection;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onViewProduct: (p: ProductSummary) => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const breadcrumb = Array.isArray(collection.breadcrumb)
    ? collection.breadcrumb
    : [];

  const keywords = Array.isArray(collection.seoKeywords)
    ? collection.seoKeywords
    : [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100"
      >
        {/* HERO */}
        <div
          className="relative h-52 rounded-t-3xl overflow-hidden"
          style={{
            background: collection.heroImage
              ? `url(${collection.heroImage}) center/cover`
              : collection.accentColor,
          }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur text-white cursor-pointer"
          >
            ✕
          </button>

          <div className="absolute bottom-5 left-6 text-white">
            <p className="text-xs uppercase opacity-70">Collection</p>
            <h2 className="text-2xl font-bold">{collection.name}</h2>
            <p className="text-sm opacity-80">{collection.tagline}</p>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* ACTIONS */}
          <div className="flex justify-between items-center">
            <StatusBadge active={collection.isActive} />

            <div className="flex gap-2">
              <button
                onClick={onToggle}
                className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700"
              >
                {collection.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-600"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600"
              >
                Delete
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Products", value: collection.productCount },
              { label: "Sort", value: collection.sortOrder },
              { label: "Purity", value: collection.purity },
              { label: "Tag", value: collection.tag || "None" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 rounded-xl p-3 text-center border"
              >
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px] uppercase text-gray-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* DESCRIPTION */}
          <div>
            <h4 className="text-xs uppercase text-gray-400 mb-1">
              Description
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {collection.description || "—"}
            </p>
          </div>

          {/* META GRID */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Slug</p>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {collection.slug}
              </code>
            </div>

            <div>
              <p className="text-xs text-gray-400">Accent Color</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border"
                  style={{ background: collection.accentColor }}
                />
                {collection.accentColor}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400">Created</p>
              <p>{fmtFull(collection.createdAt)}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Updated</p>
              <p>{fmtFull(collection.updatedAt)}</p>
            </div>
          </div>

          {/* BREADCRUMB */}
          {/* <div>
            <p className="text-xs text-gray-400 mb-1">Breadcrumb</p>
            <div className="flex flex-wrap gap-2">
              {breadcrumb.length ? (
                breadcrumb.map((b, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                  >
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div> */}

          {/* SEO */}
          {(collection.seoTitle || collection.seoDescription) && (
            <div className="border rounded-xl p-4 bg-gray-50">
              <p className="text-xs uppercase text-gray-400 mb-2">SEO</p>

              <p className="font-semibold text-sm">{collection.seoTitle}</p>
              <p className="text-xs text-gray-600 mt-1">
                {collection.seoDescription}
              </p>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((k, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white border px-2 py-1 rounded-full"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS IDS (fallback if not populated) */}
          {collection.products && collection.products.length > 0 && (
            <div>
              <p className="text-xs uppercase text-gray-400 mb-2">
                Products ({collection.products.length})
              </p>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[32px_1fr_auto] gap-3 items-center bg-gray-50 border-b border-gray-200 px-3 py-2">
                  <span /> {/* thumbnail col — no label */}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Name / ID
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Status
                  </span>
                </div>

                {/* Rows */}
                {collection.products?.map((product, i) => {
                  const isPopulated =
                    typeof product === "object" && product !== null;
                  const key = isPopulated ? product._id : String(product);
                  const fullId = isPopulated ? product._id : String(product);

                  return (
                    <div
                      key={key ?? i}
                      className={`grid grid-cols-[32px_1fr_auto] gap-3 items-center px-3 py-2.5
              ${
                i < (collection.products?.length ?? 0) - 1
                  ? "border-b border-gray-100"
                  : ""
              }
              ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                    >
                      {/* Thumbnail */}
                      <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {isPopulated && product.images?.[0]?.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].src}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-300 text-[11px]">🖼</span>
                        )}
                      </div>

                      {/* Name + ID */}
                      <div className="min-w-0">
                        {isPopulated ? (
                          <>
                            <p className="text-sm font-medium text-gray-800 truncate leading-tight">
                              {product.name}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate">
                              {fullId}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs font-mono text-gray-500 truncate">
                            {fullId}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className="flex-shrink-0">
                        {isPopulated ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              product.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                product.isActive
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CollectionManagement() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [productPopup, setProductPopup] = useState<ProductSummary | null>(null);

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterActive !== "") params.set("isActive", filterActive);
      params.set("page", String(page));
      params.set("limit", "12");
      const res = await fetch(
        `${API_BASE}/api/collections/admin/all?${params}`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setCollections(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [search, filterActive, page]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Success message handed over by the add/edit pages
  useEffect(() => {
    const flash = sessionStorage.getItem("cm_flash");
    if (flash) {
      sessionStorage.removeItem("cm_flash");
      setModal({ type: "success", message: flash });
    }
  }, []);

  console.log(collections);

  const openView = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/collections/admin/${id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setModal({ type: "view", collection: data.data });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load collection",
      );
    }
  };

  const executeToggle = async () => {
    if (modal.type !== "confirm-toggle") return;
    const { id } = modal;
    setModal({ type: "none" });
    setTogglingId(id);
    try {
      const res = await fetch(
        `${API_BASE}/api/collections/admin/${id}/toggle`,
        { method: "PATCH", headers: authHeaders() },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCollections((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c)),
      );
      setModal({ type: "success", message: data.message });
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Toggle failed",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const executeDelete = async () => {
    if (modal.type !== "confirm-delete") return;
    const { id } = modal;
    setModal({ type: "none" });
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/collections/admin/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCollections((prev) => prev.filter((c) => c._id !== id));
      setModal({
        type: "success",
        message: "Collection deleted successfully.",
      });
    } catch (err: unknown) {
      setModal({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalConfirm = () => {
    if (modal.type === "confirm-delete") executeDelete();
    else if (modal.type === "confirm-toggle") executeToggle();
  };

  return (
    <>
      <style>{`
        @keyframes cmFadeUp { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes cmSlideIn { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes cmSpin { to{transform:rotate(360deg)} }
        .cm-row:hover{background:#FDFAF3!important}
        .cm-filter:focus{border-color:#D4A017!important;outline:none}
      `}</style>

      {/* Product detail popup — topmost z-index */}
      {productPopup && (
        <ProductDetailModal
          product={productPopup}
          onClose={() => setProductPopup(null)}
        />
      )}

      {modal.type === "view" && (
        <CollectionPopup
          collection={modal.collection}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => router.push(`/admin/collections/${modal.collection._id}`)}
          onDelete={() =>
            setModal({
              type: "confirm-delete",
              id: modal.collection._id,
              name: modal.collection.name,
            })
          }
          onToggle={() =>
            setModal({
              type: "confirm-toggle",
              id: modal.collection._id,
              name: modal.collection.name,
              currentStatus: modal.collection.isActive,
            })
          }
          onViewProduct={(p) => setProductPopup(p)}
        />
      )}

      <FeedbackModal
        modal={modal}
        onConfirm={handleModalConfirm}
        onClose={() => setModal({ type: "none" })}
      />

      <div style={{ padding: "24px 28px" }}>
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
              Collections
            </h2>
            <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
              {pagination
                ? `${pagination.total} total collections`
                : "Manage your jewellery collections"}
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/collections/add")}
            style={{
              ...btnPrimary,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New
            Collection
          </button>
        </div>

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
            <span>&#9888; {error}</span>
            <button
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                color: "#c0392b",
                cursor: "pointer",
              }}
            >
              &#10005;
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            className="cm-filter"
            placeholder="&#128269; Search name or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ ...filterInput, minWidth: 220 }}
          />
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value as "" | "true" | "false");
              setPage(1);
            }}
            style={{ ...filterInput, cursor: "pointer", minWidth: 140 }}
            className="cm-filter"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            onClick={fetchCollections}
            style={{ ...btnOutline, cursor: "pointer" }}
          >
            &#8635; Refresh
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
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 64,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "3px solid #E5E0D4",
                  borderTop: "3px solid #D4A017",
                  animation: "cmSpin 0.8s linear infinite",
                }}
              />
              <span style={{ color: "#999", fontSize: 14 }}>
                Loading collections...
              </span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 820,
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
                      "Collection",
                      "Slug",
                      "Label",
                      "Tag",
                      "Products",
                      "Status",
                      "Sort",
                      "Created",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#8B7355",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {collections.map((col, idx) => (
                    <tr
                      key={col._id}
                      className="cm-row"
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "#FAFAF8",
                        borderBottom: "1px solid #EEEAE0",
                        transition: "background 0.15s",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              flexShrink: 0,
                              overflow: "hidden",
                              background: col.heroImage
                                ? `url(${col.heroImage}) center/cover no-repeat`
                                : col.accentColor || "#1a3a2a",
                              border: "1px solid #E5E0D4",
                            }}
                          />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1a1a1a",
                            }}
                          >
                            {col.name}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <code
                          style={{
                            fontSize: 11,
                            background: "#F5F2EA",
                            padding: "2px 7px",
                            borderRadius: 4,
                            color: "#7a6040",
                          }}
                        >
                          {col.slug}
                        </code>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#555",
                          verticalAlign: "middle",
                        }}
                      >
                        {col.label}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <TagPill tag={col.tag} />
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#555",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        {col.productCount ?? 0}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <StatusBadge active={col.isActive} />
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#888",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        {col.sortOrder}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 12,
                          color: "#999",
                          verticalAlign: "middle",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt(col.createdAt)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          verticalAlign: "middle",
                        }}
                      >
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            onClick={() => openView(col._id)}
                            style={{
                              ...actionBtn,
                              background: "#F0F7FF",
                              color: "#1a6fbf",
                              border: "1px solid #BDD9FF",
                              cursor: "pointer",
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/admin/collections/${col._id}`)
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
                                type: "confirm-toggle",
                                id: col._id,
                                name: col.name,
                                currentStatus: col.isActive,
                              })
                            }
                            disabled={togglingId === col._id}
                            style={{
                              ...actionBtn,
                              background: col.isActive ? "#FFF0F0" : "#EDFAF3",
                              color: col.isActive ? "#c0392b" : "#1a7a4a",
                              border: `1px solid ${
                                col.isActive ? "#e74c3c30" : "#2ecc7130"
                              }`,
                              cursor:
                                togglingId === col._id ? "wait" : "pointer",
                              opacity: togglingId === col._id ? 0.5 : 1,
                            }}
                          >
                            {col.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() =>
                              setModal({
                                type: "confirm-delete",
                                id: col._id,
                                name: col.name,
                              })
                            }
                            disabled={deletingId === col._id}
                            style={{
                              ...actionBtn,
                              background: "#FFF5F5",
                              color: "#c0392b",
                              border: "1px solid #FFCDD2",
                              cursor:
                                deletingId === col._id ? "wait" : "pointer",
                              opacity: deletingId === col._id ? 0.5 : 1,
                            }}
                          >
                            {deletingId === col._id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {collections.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: "center",
                          padding: 56,
                          color: "#bbb",
                          fontSize: 14,
                        }}
                      >
                        <div style={{ fontSize: 36, marginBottom: 10 }}>
                          &#128194;
                        </div>
                        No collections found
                        <div style={{ marginTop: 12 }}>
                          <button
                            onClick={() => router.push("/admin/collections/add")}
                            style={{
                              ...btnPrimary,
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            + Create your first collection
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

        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 18,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                ...btnOutline,
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              &#8592; Prev
            </button>
            <span style={{ color: "#888", fontSize: 13 }}>
              Page {pagination.page} of {pagination.totalPages} &middot;{" "}
              {pagination.total} collections
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              style={{
                ...btnOutline,
                cursor:
                  page === pagination.totalPages ? "not-allowed" : "pointer",
                opacity: page === pagination.totalPages ? 0.5 : 1,
              }}
            >
              Next &#8594;
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Style tokens ─────────────────────────────────────────────────────────────

export const btnPrimary: React.CSSProperties = {
  padding: "9px 20px",
  borderRadius: 9,
  border: "none",
  background: "#D4A017",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
};
export const btnOutline: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: 9,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  color: "#555",
  fontWeight: 500,
  fontSize: 13,
  cursor: "pointer",
};
const filterInput: React.CSSProperties = {
  padding: "9px 13px",
  borderRadius: 8,
  border: "1.5px solid #E5E0D4",
  background: "#fff",
  color: "#333",
  fontSize: 13,
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
