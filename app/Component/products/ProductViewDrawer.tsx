"use client";

import { useState } from "react";
import Image from "next/image";

interface Product {
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
  longDescription?: string;
  ourPromise?: string;
  returnNote?: string;
  careGuide?: string[];
  seoKeywords?: string[];
  shippingNote?: string;
  specifications?: { key: string; value: string }[];
  sizes?: { label: string; available: boolean }[];
  images: { src: string; alt: string }[];
  collection?: { name: string };
}

export default function ProductViewModal({
  product,
  open,
  onClose,
  onEdit,
}: any) {
  const [activeImage, setActiveImage] = useState(0);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold text-lg">{product.name}</h2>
          <div className="flex gap-4">
            <button
              onClick={() => onEdit(product._id)}
              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm cursor-pointer border-2"
            >
              Edit
            </button>
            <button className="cursor-pointer font-bold" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* IMAGE GALLERY */}
          <div>
            <div className="relative w-full h-100 bg-gray-100 rounded-xl overflow-hidden">
              {product.images?.[activeImage] && (
                <Image
                  src={product.images[activeImage].src}
                  alt=""
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div className="flex gap-2 mt-3">
              {product.images.map((img: any, i: number) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer border ${
                    i === activeImage ? "border-amber-500" : "border-gray-200"
                  }`}
                >
                  <Image src={img.src} alt="" width={64} height={64} />
                </div>
              ))}
            </div>
          </div>

          {/* PRICE */}
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-semibold">
              ₹{product.price.toLocaleString("en-IN")}
            </h3>
            {product.originalPrice && (
              <>
                <span className="line-through text-gray-400">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 text-xs rounded">
                  {Math.round(
                    (1 - product.price / product.originalPrice) * 100,
                  )}
                  % OFF
                </span>
              </>
            )}
          </div>

          {/* BADGES */}
          <div className="flex gap-2 flex-wrap">
            {product.isActive && <span className="badge">Active</span>}
            {product.isFeatured && <span className="badge">Featured</span>}
            {product.bisHallmark && <span className="badge">BIS</span>}
            {product.tag && <span className="badge">{product.tag}</span>}
          </div>

          {/* DETAILS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Detail label="SKU" value={product.sku} />
            <Detail label="Category" value={product.category} />
            <Detail label="Purity" value={product.purity} />
            <Detail label="Metal" value={product.metal} />
            <Detail label="Weight" value={product.weightGrams} />
            <Detail label="Stock" value={product.stock ?? "Unlimited"} />
            <Detail label="Slug" value={product.slug} />
          </div>

          {/* DESCRIPTION */}
          {product.shortDescription && (
            <Section title="Short Description">
              {product.shortDescription}
            </Section>
          )}

          {product.longDescription && (
            <Section title="Long Description">
              {product.longDescription}
            </Section>
          )}

          {/* OUR PROMISE */}
          {product.ourPromise && (
            <Section title="Our Promise">{product.ourPromise}</Section>
          )}

          {/* RETURN NOTE */}
          {product.returnNote && (
            <Section title="Return Note">{product.returnNote}</Section>
          )}

          {/* CARE GUIDE */}
          {product.careGuide?.length > 0 && (
            <Section title="Care Guide">
              <ul className="list-disc pl-5">
                {product.careGuide.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* SPECIFICATIONS */}
          {product.specifications?.length > 0 && (
            <Section title="Specifications">
              <div className="grid grid-cols-2 gap-2">
                {product.specifications.map((s: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-2 rounded">
                    <b>{s.key}:</b> {s.value}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* SIZES */}
          {product.sizes?.length > 0 && (
            <Section title="Sizes">
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((s: any, i: number) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded ${
                      s.available
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* SEO */}
          {product.seoKeywords?.length > 0 && (
            <Section title="SEO Keywords">
              {product.seoKeywords.join(", ")}
            </Section>
          )}

          {product.shippingNote && (
            <Section title="Shipping Note">{product.shippingNote}</Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: any) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  );
}
