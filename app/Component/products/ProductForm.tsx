"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import SingleImageUpload, { type SingleImageState } from "./SingleImageUpload";

interface Collection {
  _id: string;
  name: string;
  slug: string;
}
interface Spec {
  key: string;
  value: string;
  icon: string;
}

interface CareGuideItem {
  title: string;
  description: string;
  icon: string;
}

interface Size {
  label: string;
  available: boolean;
}
type ImageSlot =
  | { type: "existing"; src: string; alt: string }
  | { type: "new"; file: File; preview: string; alt: string };
interface ProductFormProps {
  mode: "add" | "edit";
  productId?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_IMAGES = 8;
const MAX_FILE_MB = 5;
function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("admin_token") || ""
    : "";
}
function authHeadersOnly() {
  return { Authorization: `Bearer ${getToken()}` };
}
const TAGS = [
  "",
  "Bestseller",
  "New",
  "Popular",
  "Limited",
  "Exclusive",
  "Trending",
];
const PURITIES = ["22kt", "18kt", "24kt", "14kt", "925 Silver"];
const METALS = ["Yellow Gold", "White Gold", "Rose Gold", "Silver", "Platinum"];

function ImageUploadSection({
  slots,
  onChange,
}: {
  slots: ImageSlot[];
  onChange: (s: ImageSlot[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_IMAGES - slots.length;
      if (remaining <= 0) return;
      const valid: ImageSlot[] = [];
      const errs: string[] = [];
      Array.from(files)
        .slice(0, remaining)
        .forEach((file) => {
          if (!file.type.startsWith("image/")) {
            errs.push(`"${file.name}" not an image`);
            return;
          }
          if (file.size > MAX_FILE_MB * 1024 * 1024) {
            errs.push(`"${file.name}" exceeds ${MAX_FILE_MB}MB`);
            return;
          }
          valid.push({
            type: "new",
            file,
            preview: URL.createObjectURL(file),
            alt: file.name.replace(/\.[^/.]+$/, ""),
          });
        });
      if (errs.length) alert(errs.join("\n"));
      if (valid.length) onChange([...slots, ...valid]);
    },
    [slots, onChange],
  );

  const removeSlot = (i: number) => {
    const s = slots[i];
    if (s.type === "new") URL.revokeObjectURL(s.preview);
    onChange(slots.filter((_, j) => j !== i));
  };
  const updateAlt = (i: number, alt: string) => {
    const n = [...slots];
    n[i] = { ...n[i], alt } as ImageSlot;
    onChange(n);
  };
  const onDragStart = (i: number) => setDragIdx(i);
  const onDragEnter = (i: number) => setDropIdx(i);
  const onDragEnd = () => {
    if (dragIdx !== null && dropIdx !== null && dragIdx !== dropIdx) {
      const n = [...slots];
      const [m] = n.splice(dragIdx, 1);
      n.splice(dropIdx, 0, m);
      onChange(n);
    }
    setDragIdx(null);
    setDropIdx(null);
  };
  const src = (s: ImageSlot) => (s.type === "new" ? s.preview : s.src);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 cursor-pointer transition-all ${
          dragOver
            ? "border-amber-400 bg-amber-50"
            : slots.length >= MAX_IMAGES
            ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
            : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/40"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
          <svg
            className="w-5 h-5"
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
        </div>
        <p className="text-sm font-medium text-gray-600">
          {slots.length >= MAX_IMAGES
            ? `Max ${MAX_IMAGES} images reached`
            : "Drop images here or click to browse"}
        </p>
        <p className="text-xs text-gray-400">
          JPG, PNG, WebP · Max {MAX_FILE_MB}MB each · Up to {MAX_IMAGES} images
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          onClick={(e) => ((e.target as HTMLInputElement).value = "")}
        />
      </div>
      {slots.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {slots.map((slot, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-grab ${
                dragIdx === i
                  ? "opacity-40 scale-95 border-amber-400"
                  : dropIdx === i
                  ? "border-amber-400 shadow-lg"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <div className="aspect-square bg-gray-50 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src(slot)}
                  alt={slot.alt}
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Main
                  </span>
                )}
                {slot.type === "new" && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    New
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <span className="text-white text-xs bg-black/40 px-2 py-1 rounded-lg">
                    ⠿ drag to reorder
                  </span>
                </div>
              </div>
              <div className="p-2 bg-white">
                <input
                  value={slot.alt}
                  onChange={(e) => updateAlt(i, e.target.value)}
                  placeholder="Alt text…"
                  className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSlot(i);
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 z-10"
                style={{ top: slot.type === "new" ? "1.5rem" : "0.375rem" }}
              >
                ×
              </button>
            </div>
          ))}
          {slots.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-amber-500 transition-all cursor-pointer"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-xs">Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [activeSection, setActiveSection] = useState("basic");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    subtitle: "",
    sku: "",
    collection: "",
    category: "",
    tag: "",
    price: "",
    originalPrice: "",
    purity: "22kt",
    metal: "Yellow Gold",
    bisHallmark: true,
    countryOfOrigin: "Jaipur, India",
    shortDescription: "",
    longDescription: "",
    ourPromise: "",
    weightGrams: "",
    returnWindowDays: "30",
    isActive: true,
    isFeatured: false,
    stock: "",
    seoTitle: "",
    seoDescription: "",
    shippingNote: "All shipments are fully insured.",
    sortOrder: "0",
    returnNote: "",
    careGuide: [{ title: "", description: "", icon: "" }],
    seoKeywords: "",
  });

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [offerBannerState, setOfferBannerState] = useState<SingleImageState>({
    type: "none",
  });
  const [sizeChartState, setSizeChartState] = useState<SingleImageState>({
    type: "none",
  });
  const [sizes, setSizes] = useState<Size[]>([{ label: "", available: true }]);
  const [specs, setSpecs] = useState<Spec[]>([
    { key: "", value: "", icon: "" },
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/api/collections/admin/all`, {
      headers: authHeadersOnly(),
    })
      .then((r) => r.json())
      .then((d) => setCollections(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    setFetching(true);
    fetch(`${API_BASE}/api/products/admin/${productId}`, {
      headers: authHeadersOnly(),
    })
      .then((r) => r.json())
      .then((d) => {
        const p = d.data;
        if (!p) return;
        setForm({
          name: p.name || "",
          slug: p.slug || "",
          subtitle: p.subtitle || "",
          sku: p.sku || "",
          collection: p.collection?._id || "",
          category: p.category || "",
          tag: p.tag || "",
          price: String(p.price || ""),
          originalPrice: String(p.originalPrice || ""),
          purity: p.purity || "22kt",
          metal: p.metal || "Yellow Gold",
          bisHallmark: p.bisHallmark ?? true,
          countryOfOrigin: p.countryOfOrigin || "Jaipur, India",
          shortDescription: p.shortDescription || "",
          longDescription: p.longDescription || "",
          ourPromise: p.ourPromise || "",
          weightGrams: p.weightGrams || "",
          returnWindowDays: String(p.returnWindowDays || 30),
          isActive: p.isActive ?? true,
          isFeatured: p.isFeatured ?? false,
          stock: p.stock != null ? String(p.stock) : "",
          seoTitle: p.seoTitle || "",
          seoDescription: p.seoDescription || "",
          shippingNote: p.shippingNote || "",
          sortOrder: String(p.sortOrder || 0),
          returnNote: p.returnNote || "",
          careGuide: p.careGuide?.length
            ? p.careGuide
            : [{ title: "", description: "", icon: "" }],
          seoKeywords: p.seoKeywords?.join(", ") || "",
        });
        if (p.images?.length)
          setImageSlots(
            p.images.map((img: { src: string; alt: string }) => ({
              type: "existing" as const,
              src: img.src,
              alt: img.alt || "",
            })),
          );
        if (p.offerBannerImage)
          setOfferBannerState({ type: "existing", url: p.offerBannerImage });
        if (p.sizeChartImage)
          setSizeChartState({ type: "existing", url: p.sizeChartImage });
        if (p.sizes?.length) setSizes(p.sizes);
        if (p.specifications?.length) setSpecs(p.specifications);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [mode, productId]);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleNameChange = (name: string) => {
    set("name", name);
    if (mode === "add")
      set(
        "slug",
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price || !form.ourPromise) {
      setFeedback({
        type: "error",
        msg: "Name, slug, price and Our Promise are required.",
      });
      return;
    }
    if (imageSlots.length === 0) {
      setFeedback({
        type: "error",
        msg: "At least one product image is required.",
      });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      (
        [
          "name",
          "slug",
          "subtitle",
          "sku",
          "category",
          "tag",
          "purity",
          "metal",
          "countryOfOrigin",
          "shortDescription",
          "longDescription",
          "ourPromise",
          "weightGrams",
          "shippingNote",
          "seoTitle",
          "seoDescription",
        ] as const
      ).forEach((k) => {
        if (form[k] !== "") fd.append(k, String(form[k]));
      });
      fd.append("price", String(Number(form.price)));
      if (form.originalPrice)
        fd.append("originalPrice", String(Number(form.originalPrice)));
      if (form.stock) fd.append("stock", String(Number(form.stock)));
      fd.append("returnWindowDays", String(Number(form.returnWindowDays)));
      fd.append("sortOrder", String(Number(form.sortOrder)));
      fd.append("bisHallmark", String(form.bisHallmark));
      fd.append("isActive", String(form.isActive));
      fd.append("isFeatured", String(form.isFeatured));
      if (form.collection) fd.append("collection", form.collection);
      const vs = sizes.filter((s) => s.label.trim());
      if (vs.length) fd.append("sizes", JSON.stringify(vs));
      const vsp = specs.filter((s) => s.key.trim() && s.value.trim());
      if (vsp.length) fd.append("specifications", JSON.stringify(vsp));

      // Gallery
      const existing = imageSlots
        .filter(
          (s): s is Extract<ImageSlot, { type: "existing" }> =>
            s.type === "existing",
        )
        .map((s) => ({ src: s.src, alt: s.alt }));
      fd.append("existingImages", JSON.stringify(existing));
      imageSlots
        .filter(
          (s): s is Extract<ImageSlot, { type: "new" }> => s.type === "new",
        )
        .forEach((s) => fd.append("images", s.file));
      fd.append("replaceImages", "false");

      // Offer banner
      if (offerBannerState.type === "new")
        fd.append("offerBanner", offerBannerState.file);
      else if (offerBannerState.type === "cleared")
        fd.append("clearOfferBanner", "true");

      // Size chart
      if (sizeChartState.type === "new")
        fd.append("sizeChart", sizeChartState.file);
      else if (sizeChartState.type === "cleared")
        fd.append("clearSizeChart", "true");

      // return note
      if (form.returnNote) {
        fd.append("returnNote", form.returnNote);
      }

      const validCareGuide = form.careGuide.filter(
        (c) => c.title.trim() && c.description.trim(),
      );

      // seo keywords (convert string → array)
      if (form.seoKeywords) {
        const keywords = form.seoKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);

        if (keywords.length) {
          fd.append("seoKeywords", JSON.stringify(keywords));
        }
      }

      const url =
        mode === "edit"
          ? `${API_BASE}/api/products/admin/${productId}`
          : `${API_BASE}/api/products/admin/create`;
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: authHeadersOnly(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setFeedback({
        type: "success",
        msg: mode === "edit" ? "Product updated!" : "Product created!",
      });
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        msg: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const SECTIONS = [
    { id: "basic", label: "Basic Info" },
    { id: "pricing", label: "Pricing" },
    { id: "media", label: "Images & Media" },
    { id: "variants", label: "Sizes & Variants" },
    { id: "content", label: "Content" },
    { id: "specs", label: "Specifications" },
    { id: "seo", label: "SEO & Settings" },
  ];

  if (fetching)
    return (
      <div className="flex items-center justify-center py-20">
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
      </div>
    );

  return (
    <div className="flex gap-6 items-start">
      <div className="hidden lg:block w-48 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-6">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id);
                document
                  .getElementById(`section-${s.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
                activeSection === s.id
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-5">
        {feedback && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
            <span>{feedback.msg}</span>
            <button
              onClick={() => setFeedback(null)}
              className="ml-auto text-lg leading-none cursor-pointer opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Basic Info */}
        <div
          id="section-basic"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
            Basic Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Product Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Nawabi Chain"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
            {(
              [
                { k: "slug", l: "Slug *", p: "nawabi-chain-22kt", m: true },
                { k: "sku", l: "SKU", p: "RJ-CH-001", m: true },
                {
                  k: "subtitle",
                  l: "Subtitle",
                  p: "22kt Yellow Gold · 18 inch",
                  m: false,
                },
                { k: "category", l: "Category", p: "Chains", m: false },
                { k: "weightGrams", l: "Weight", p: "8–12 grams", m: false },
                {
                  k: "countryOfOrigin",
                  l: "Country of Origin",
                  p: "Jaipur, India",
                  m: false,
                },
              ] as { k: string; l: string; p: string; m: boolean }[]
            ).map(({ k, l, p, m }) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {l}
                </label>
                <input
                  value={form[k as keyof typeof form] as string}
                  onChange={(e) => set(k, e.target.value)}
                  placeholder={p}
                  className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all${
                    m ? " font-mono" : ""
                  }`}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Collection
              </label>
              <select
                value={form.collection}
                onChange={(e) => set("collection", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
              >
                <option value="">No collection</option>
                {collections.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Tag
              </label>
              <select
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
              >
                {TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t || "None"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Purity
              </label>
              <select
                value={form.purity}
                onChange={(e) => set("purity", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
              >
                {PURITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Metal
              </label>
              <select
                value={form.metal}
                onChange={(e) => set("metal", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
              >
                {METALS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6 pt-2">
              {(
                [
                  {
                    k: "bisHallmark",
                    l: "BIS Hallmark",
                    c: "accent-amber-500",
                  },
                  { k: "isActive", l: "Active", c: "accent-emerald-500" },
                  { k: "isFeatured", l: "Featured", c: "accent-amber-500" },
                ] as { k: string; l: string; c: string }[]
              ).map(({ k, l, c }) => (
                <label
                  key={k}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form[k as keyof typeof form] as boolean}
                    onChange={(e) => set(k, e.target.checked)}
                    className={`w-4 h-4 ${c} cursor-pointer rounded`}
                  />
                  <span className="text-sm text-gray-600">{l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div
          id="section-pricing"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
            Pricing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                { k: "price", l: "Price (₹) *", p: "8999" },
                { k: "originalPrice", l: "Original Price (₹)", p: "10499" },
                { k: "stock", l: "Stock (empty = unlimited)", p: "Unlimited" },
              ] as { k: string; l: string; p: string }[]
            ).map(({ k, l, p }) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {l}
                </label>
                <input
                  type="number"
                  value={form[k as keyof typeof form] as string}
                  onChange={(e) => set(k, e.target.value)}
                  placeholder={p}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Images & Media */}
        <div
          id="section-media"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
              Images & Media
            </h3>
            <span className="text-xs text-gray-400">
              {imageSlots.length} / {MAX_IMAGES} gallery images
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            First image is the main product photo. Drag thumbnails to reorder.
          </p>
          <ImageUploadSection slots={imageSlots} onChange={setImageSlots} />

          <div className="border-t border-gray-100 mt-6 pt-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
              Supporting images
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SingleImageUpload
                label="Offer Banner"
                hint="Promotional banner in product tabs. Recommended 1200×400px."
                state={offerBannerState}
                onChange={setOfferBannerState}
                fieldName="offerBanner"
              />
              <SingleImageUpload
                label="Size Chart"
                hint="Size guide shown with the size selector. Recommended 800×600px."
                state={sizeChartState}
                onChange={setSizeChartState}
                fieldName="sizeChart"
              />
            </div>
          </div>
        </div>

        {/* Sizes */}
        <div
          id="section-variants"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
              Sizes & Variants
            </h3>
            <button
              onClick={() =>
                setSizes((s) => [...s, { label: "", available: true }])
              }
              className="text-xs text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              + Add size
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {sizes.map((size, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
              >
                <input
                  value={size.label}
                  onChange={(e) => {
                    const n = [...sizes];
                    n[i] = { ...n[i], label: e.target.value };
                    setSizes(n);
                  }}
                  placeholder='e.g. 18"'
                  className="w-20 bg-transparent text-sm focus:outline-none text-gray-700"
                />
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={size.available}
                    onChange={(e) => {
                      const n = [...sizes];
                      n[i] = { ...n[i], available: e.target.checked };
                      setSizes(n);
                    }}
                    className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">In stock</span>
                </label>
                {sizes.length > 1 && (
                  <button
                    onClick={() => setSizes((s) => s.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 text-sm cursor-pointer leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          id="section-content"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
            Content
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Short Description{" "}
                <span className="text-gray-400">(max 300)</span>
              </label>
              <textarea
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Brief product summary…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
              />
              <p className="text-right text-xs text-gray-300 mt-1">
                {form.shortDescription.length}/300
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Long Description
              </label>
              <textarea
                value={form.longDescription}
                onChange={(e) => set("longDescription", e.target.value)}
                rows={4}
                placeholder="Detailed description…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Our Promise *{" "}
                <span className="text-amber-500 font-normal">
                  (shown in Instruction icon)
                </span>
              </label>
              <textarea
                value={form.ourPromise}
                onChange={(e) => set("ourPromise", e.target.value)}
                rows={3}
                placeholder="e.g. 30-day returns, no questions asked."
                className="w-full px-4 py-2.5 border border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none bg-amber-50/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Return Note
              </label>
              <textarea
                value={form.returnNote}
                onChange={(e) => set("returnNote", e.target.value)}
                rows={2}
                placeholder="Any special return instructions..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Return Window (days)
                </label>
                <input
                  type="number"
                  value={form.returnWindowDays}
                  onChange={(e) => set("returnWindowDays", e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">
                  Care Guide
                </label>
                <button
                  type="button"
                  onClick={() =>
                    set("careGuide", [
                      ...form.careGuide,
                      { title: "", description: "", icon: "" },
                    ])
                  }
                  className="text-xs text-amber-600 cursor-pointer"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-3">
                {form.careGuide.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_2fr_80px_auto] gap-2 items-start bg-gray-50 border border-gray-200 rounded-xl p-3"
                  >
                    {/* Title */}
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const n = [...form.careGuide];
                        n[i] = { ...n[i], title: e.target.value };
                        set("careGuide", n);
                      }}
                      placeholder="Title (e.g. Avoid Water)"
                      className="px-3 py-2 border rounded-lg text-sm"
                    />

                    {/* Description */}
                    <input
                      value={item.description}
                      onChange={(e) => {
                        const n = [...form.careGuide];
                        n[i] = { ...n[i], description: e.target.value };
                        set("careGuide", n);
                      }}
                      placeholder="Short description..."
                      className="px-3 py-2 border rounded-lg text-sm"
                    />

                    {/* Icon */}
                    <input
                      value={item.icon}
                      onChange={(e) => {
                        const n = [...form.careGuide];
                        n[i] = { ...n[i], icon: e.target.value };
                        set("careGuide", n);
                      }}
                      placeholder="icon"
                      className="px-2 py-2 border rounded-lg text-sm text-center"
                    />

                    {/* Delete */}
                    {form.careGuide.length > 1 && (
                      <button
                        onClick={() =>
                          set(
                            "careGuide",
                            form.careGuide.filter((_, j) => j !== i),
                          )
                        }
                        className="text-red-500 cursor-pointer text-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div
          id="section-specs"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
              Specifications
            </h3>
            <button
              onClick={() =>
                setSpecs((s) => [...s, { key: "", value: "", icon: "" }])
              }
              className="text-xs text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              + Add row
            </button>
          </div>
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 items-center"
              >
                <input
                  value={spec.key}
                  onChange={(e) => {
                    const n = [...specs];
                    n[i] = { ...n[i], key: e.target.value };
                    setSpecs(n);
                  }}
                  placeholder="Metal"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all"
                />
                <input
                  value={spec.value}
                  onChange={(e) => {
                    const n = [...specs];
                    n[i] = { ...n[i], value: e.target.value };
                    setSpecs(n);
                  }}
                  placeholder="22kt Yellow Gold"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all"
                />
                <input
                  value={spec.icon}
                  onChange={(e) => {
                    const n = [...specs];
                    n[i] = { ...n[i], icon: e.target.value };
                    setSpecs(n);
                  }}
                  placeholder="icon"
                  className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all text-center"
                />
                {specs.length > 1 && (
                  <button
                    onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
                    className="w-8 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div
          id="section-seo"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
            SEO & Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                SEO Title
              </label>
              <input
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                placeholder="Nawabi Chain | Rehnoor Jewels"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                SEO Description
              </label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                rows={2}
                placeholder="Hand-crafted 22kt gold…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                SEO Keywords
              </label>
              <input
                value={form.seoKeywords}
                onChange={(e) => set("seoKeywords", e.target.value)}
                placeholder="gold ring, 22kt jewellery, wedding ring"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Separate keywords with commas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-200"
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
                Saving…
              </>
            ) : mode === "edit" ? (
              "Save Changes"
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
