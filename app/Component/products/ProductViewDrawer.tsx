"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProductImage {
  src: string;
  alt: string;
}
interface Specification {
  key: string;
  value: string;
  icon?: string;
}
interface Size {
  label: string;
  available: boolean;
}
interface Collection {
  _id: string;
  name: string;
  slug: string;
}
interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  subtitle?: string;
  sku?: string;
  collection?: Collection | null;
  category?: string;
  price: number;
  originalPrice?: number;
  priceFormatted?: string;
  originalPriceFormatted?: string;
  discountPct?: number;
  currency?: string;
  tag?: string;
  purity?: string;
  metal?: string;
  bisHallmark?: boolean;
  countryOfOrigin?: string;
  shortDescription?: string;
  longDescription?: string;
  ourPromise?: string;
  weightGrams?: string;
  images: ProductImage[];
  offerBannerImage?: string;
  sizeChartImage?: string;
  sizes?: Size[];
  specifications?: Specification[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  isActive: boolean;
  isFeatured: boolean;
  stock?: number | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductViewDrawerProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Badge({
  label,
  color = "gray",
}: {
  label: string;
  color?: "amber" | "emerald" | "red" | "blue" | "gray" | "violet";
}) {
  const map = {
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    red: "bg-red-100 text-red-600 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    violet: "bg-violet-100 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${map[color]}`}
    >
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-800">
        {value ?? <span className="text-gray-300 font-normal">—</span>}
      </span>
    </div>
  );
}

function SectionBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        {icon && <span className="text-sm">{icon}</span>}
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

export default function ProductViewDrawer({
  product,
  open,
  onClose,
  onEdit,
}: ProductViewDrawerProps) {
  const [activeImage, setActiveImage] = useState(0);

  // Reset image index when product changes
  useEffect(() => {
    setActiveImage(0);
  }, [product?._id]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const discount =
    product?.discountPct ??
    (product?.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[999] w-full max-w-2xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {!product ? null : (
          <>
            {/* ── Drawer Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back / close arrow */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer flex-shrink-0"
                >
                  ←
                </button>
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 text-sm truncate leading-tight">
                    {product.name}
                  </h2>
                  {product.subtitle && (
                    <p className="text-xs text-gray-400 truncate">
                      {product.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(product._id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {/* Image gallery */}
              <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  {product.images?.[activeImage] ? (
                    <Image
                      src={product.images[activeImage].src}
                      alt={product.images[activeImage].alt || product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
                      🖼
                    </div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                      -{discount}%
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {activeImage + 1} / {product.images.length}
                  </span>
                </div>
                {product.images?.length > 1 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                          i === activeImage
                            ? "border-amber-500 shadow-sm shadow-amber-200"
                            : "border-gray-200 hover:border-amber-300"
                        }`}
                      >
                        <Image
                          src={img.src}
                          alt={img.alt || `view ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing + badges */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-end gap-3 flex-wrap mb-3">
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">
                    {product.priceFormatted ??
                      `₹${product.price.toLocaleString("en-IN")}`}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm line-through text-gray-400">
                      {product.originalPriceFormatted ??
                        `₹${product.originalPrice.toLocaleString("en-IN")}`}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-sm font-semibold text-red-500">
                      {discount}% off
                    </span>
                  )}
                  {product.currency && (
                    <span className="text-xs text-gray-400 ml-auto">
                      {product.currency}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {product.isActive ? (
                    <Badge label="Active" color="emerald" />
                  ) : (
                    <Badge label="Inactive" color="red" />
                  )}
                  {product.isFeatured && (
                    <Badge label="Featured" color="amber" />
                  )}
                  {product.bisHallmark && (
                    <Badge label="BIS Hallmark" color="blue" />
                  )}
                  {product.tag && <Badge label={product.tag} color="violet" />}
                </div>
              </div>

              {/* Details grid */}
              <div className="px-5 py-4 border-b border-gray-100 space-y-5">
                {/* Identity */}
                <SectionBlock title="Identity" icon="🏷️">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoRow label="SKU" value={product.sku} />
                    <InfoRow
                      label="Slug"
                      value={
                        <span className="font-mono text-xs break-all">
                          {product.slug}
                        </span>
                      }
                    />
                    <InfoRow label="Category" value={product.category} />
                    <InfoRow
                      label="Collection"
                      value={
                        product.collection ? (
                          <span>
                            {product.collection.name}{" "}
                            <span className="text-gray-400 text-xs font-normal">
                              /{product.collection.slug}
                            </span>
                          </span>
                        ) : undefined
                      }
                    />
                    <InfoRow
                      label="Stock"
                      value={
                        product.stock != null ? product.stock : "Unlimited"
                      }
                    />
                    <InfoRow label="Sort Order" value={product.sortOrder} />
                  </div>
                </SectionBlock>

                {/* Material */}
                <SectionBlock title="Material & Craftsmanship" icon="✨">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoRow label="Purity" value={product.purity} />
                    <InfoRow label="Metal" value={product.metal} />
                    <InfoRow label="Weight" value={product.weightGrams} />
                    <InfoRow
                      label="Country of Origin"
                      value={product.countryOfOrigin}
                    />
                    <InfoRow
                      label="BIS Hallmark"
                      value={
                        product.bisHallmark != null ? (
                          <span
                            className={
                              product.bisHallmark
                                ? "text-emerald-600"
                                : "text-gray-400"
                            }
                          >
                            {product.bisHallmark
                              ? "✓ Certified"
                              : "Not Certified"}
                          </span>
                        ) : undefined
                      }
                    />
                  </div>
                </SectionBlock>
              </div>

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <SectionBlock title="Sizes" icon="📐">
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map((s, i) => (
                        <span
                          key={i}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                            s.available
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-400 border-gray-200 line-through"
                          }`}
                        >
                          {s.label}
                          {!s.available && (
                            <span className="ml-1 text-[10px] no-underline">
                              OOS
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </SectionBlock>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <SectionBlock title="Specifications" icon="📋">
                    <div className="grid grid-cols-1 gap-2">
                      {product.specifications.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100"
                        >
                          {s.icon && (
                            <span className="text-base flex-shrink-0">
                              {s.icon}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 flex-shrink-0 w-24 truncate">
                            {s.key}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>
                </div>
              )}

              {/* Content */}
              {(product.shortDescription ||
                product.longDescription ||
                product.ourPromise) && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <SectionBlock title="Content" icon="📝">
                    <div className="space-y-3">
                      {product.shortDescription && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                            Short Description
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {product.shortDescription}
                          </p>
                        </div>
                      )}
                      {product.longDescription && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                            Long Description
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {product.longDescription}
                          </p>
                        </div>
                      )}
                      {product.ourPromise && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-1">
                            Our Promise
                          </p>
                          <p className="text-sm text-amber-800 leading-relaxed">
                            {product.ourPromise}
                          </p>
                        </div>
                      )}
                    </div>
                  </SectionBlock>
                </div>
              )}

              {/* Supporting Images */}
              {(product.offerBannerImage || product.sizeChartImage) && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <SectionBlock title="Supporting Images" icon="🖼️">
                    <div className="space-y-3">
                      {product.offerBannerImage && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                            Offer Banner
                          </p>
                          <div className="relative w-full h-20 rounded-xl overflow-hidden border border-gray-200">
                            <Image
                              src={product.offerBannerImage}
                              alt="Offer Banner"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}
                      {product.sizeChartImage && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                            Size Chart
                          </p>
                          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-white">
                            <Image
                              src={product.sizeChartImage}
                              alt="Size Chart"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionBlock>
                </div>
              )}

              {/* SEO */}
              {(product.seoTitle ||
                product.seoDescription ||
                (product.seoKeywords && product.seoKeywords.length > 0)) && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <SectionBlock title="SEO" icon="🔍">
                    <div className="space-y-3">
                      {product.seoTitle && (
                        <InfoRow label="SEO Title" value={product.seoTitle} />
                      )}
                      {product.seoDescription && (
                        <InfoRow
                          label="SEO Description"
                          value={product.seoDescription}
                        />
                      )}
                      {product.seoKeywords &&
                        product.seoKeywords.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                              Keywords
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {product.seoKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-medium"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </SectionBlock>
                </div>
              )}

              {/* Record Info */}
              <div className="px-5 py-4 pb-8">
                <SectionBlock title="Record Info" icon="🕐">
                  <div className="grid grid-cols-1 gap-3">
                    <InfoRow
                      label="Created"
                      value={formatDate(product.createdAt)}
                    />
                    <InfoRow
                      label="Last Updated"
                      value={formatDate(product.updatedAt)}
                    />
                    <InfoRow
                      label="Product ID"
                      value={
                        <span className="font-mono text-xs text-gray-500 break-all">
                          {product._id}
                        </span>
                      }
                    />
                  </div>
                </SectionBlock>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
