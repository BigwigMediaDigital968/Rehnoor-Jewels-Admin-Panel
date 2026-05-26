// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import SingleImageUpload, { type SingleImageState } from "./SingleImageUpload";

// interface Collection {
//   _id: string;
//   name: string;
//   slug: string;
// }
// interface Spec {
//   key: string;
//   value: string;
//   icon: string;
// }
// interface Size {
//   label: string;
//   available: boolean;
// }
// type ImageSlot =
//   | { type: "existing"; src: string; alt: string }
//   | { type: "new"; file: File; preview: string; alt: string };

// interface ProductFormProps {
//   mode: "add" | "edit";
//   productId?: string;
// }

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// const MAX_IMAGES = 8;
// const MAX_FILE_MB = 5;

// function getToken() {
//   return typeof window !== "undefined"
//     ? localStorage.getItem("admin_token") || ""
//     : "";
// }
// function authHeadersOnly() {
//   return { Authorization: `Bearer ${getToken()}` };
// }

// const TAGS = [
//   "",
//   "Bestseller",
//   "New",
//   "Popular",
//   "Limited",
//   "Exclusive",
//   "Trending",
// ];
// const PURITIES = ["22kt", "18kt", "24kt", "14kt", "925 Silver"];
// const METALS = ["Yellow Gold", "White Gold", "Rose Gold", "Silver", "Platinum"];

// // ─── Image Upload Section ─────────────────────────────────────────────────────

// function ImageUploadSection({
//   slots,
//   onChange,
// }: {
//   slots: ImageSlot[];
//   onChange: (s: ImageSlot[]) => void;
// }) {
//   const fileRef = useRef<HTMLInputElement>(null);
//   const [dragOver, setDragOver] = useState(false);
//   const [dragIdx, setDragIdx] = useState<number | null>(null);
//   const [dropIdx, setDropIdx] = useState<number | null>(null);

//   const addFiles = useCallback(
//     (files: FileList | null) => {
//       if (!files) return;
//       const remaining = MAX_IMAGES - slots.length;
//       if (remaining <= 0) return;
//       const valid: ImageSlot[] = [];
//       const errs: string[] = [];
//       Array.from(files)
//         .slice(0, remaining)
//         .forEach((file) => {
//           if (!file.type.startsWith("image/")) {
//             errs.push(`"${file.name}" not an image`);
//             return;
//           }
//           if (file.size > MAX_FILE_MB * 1024 * 1024) {
//             errs.push(`"${file.name}" exceeds ${MAX_FILE_MB}MB`);
//             return;
//           }
//           valid.push({
//             type: "new",
//             file,
//             preview: URL.createObjectURL(file),
//             alt: file.name.replace(/\.[^/.]+$/, ""),
//           });
//         });
//       if (errs.length) alert(errs.join("\n"));
//       if (valid.length) onChange([...slots, ...valid]);
//     },
//     [slots, onChange],
//   );

//   const removeSlot = (i: number) => {
//     const s = slots[i];
//     if (s.type === "new") URL.revokeObjectURL(s.preview);
//     onChange(slots.filter((_, j) => j !== i));
//   };
//   const updateAlt = (i: number, alt: string) => {
//     const n = [...slots];
//     n[i] = { ...n[i], alt } as ImageSlot;
//     onChange(n);
//   };
//   const onDragStart = (i: number) => setDragIdx(i);
//   const onDragEnter = (i: number) => setDropIdx(i);
//   const onDragEnd = () => {
//     if (dragIdx !== null && dropIdx !== null && dragIdx !== dropIdx) {
//       const n = [...slots];
//       const [m] = n.splice(dragIdx, 1);
//       n.splice(dropIdx, 0, m);
//       onChange(n);
//     }
//     setDragIdx(null);
//     setDropIdx(null);
//   };
//   const src = (s: ImageSlot) => (s.type === "new" ? s.preview : s.src);

//   return (
//     <div>
//       <div
//         onDragOver={(e) => {
//           e.preventDefault();
//           setDragOver(true);
//         }}
//         onDragLeave={() => setDragOver(false)}
//         onDrop={(e) => {
//           e.preventDefault();
//           setDragOver(false);
//           addFiles(e.dataTransfer.files);
//         }}
//         onClick={() => fileRef.current?.click()}
//         className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 cursor-pointer transition-all ${
//           dragOver
//             ? "border-amber-400 bg-amber-50"
//             : slots.length >= MAX_IMAGES
//             ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
//             : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/40"
//         }`}
//       >
//         <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
//           <svg
//             className="w-5 h-5"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={1.5}
//               d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
//             />
//           </svg>
//         </div>
//         <p className="text-sm font-medium text-gray-600">
//           {slots.length >= MAX_IMAGES
//             ? `Max ${MAX_IMAGES} images reached`
//             : "Drop images here or click to browse"}
//         </p>
//         <p className="text-xs text-gray-400">
//           JPG, PNG, WebP · Max {MAX_FILE_MB}MB each · Up to {MAX_IMAGES} images
//         </p>
//         <input
//           ref={fileRef}
//           type="file"
//           accept="image/*"
//           multiple
//           className="hidden"
//           onChange={(e) => addFiles(e.target.files)}
//           onClick={(e) => ((e.target as HTMLInputElement).value = "")}
//         />
//       </div>

//       {slots.length > 0 && (
//         <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
//           {slots.map((slot, i) => (
//             <div
//               key={i}
//               draggable
//               onDragStart={() => onDragStart(i)}
//               onDragEnter={() => onDragEnter(i)}
//               onDragEnd={onDragEnd}
//               className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-grab ${
//                 dragIdx === i
//                   ? "opacity-40 scale-95 border-amber-400"
//                   : dropIdx === i
//                   ? "border-amber-400 shadow-lg"
//                   : "border-gray-200 hover:border-amber-300"
//               }`}
//             >
//               <div className="aspect-square bg-gray-50 relative">
//                 {/* eslint-disable-next-line @next/next/no-img-element */}
//                 <img
//                   src={src(slot)}
//                   alt={slot.alt}
//                   className="w-full h-full object-cover"
//                 />
//                 {i === 0 && (
//                   <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full">
//                     Main
//                   </span>
//                 )}
//                 {slot.type === "new" && (
//                   <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
//                     New
//                   </span>
//                 )}
//                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
//                   <span className="text-white text-xs bg-black/40 px-2 py-1 rounded-lg">
//                     ⠿ drag to reorder
//                   </span>
//                 </div>
//               </div>
//               <div className="p-2 bg-white">
//                 <input
//                   value={slot.alt}
//                   onChange={(e) => updateAlt(i, e.target.value)}
//                   placeholder="Alt text…"
//                   className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
//                 />
//               </div>
//               <button
//                 type="button"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   removeSlot(i);
//                 }}
//                 className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 z-10"
//                 style={{ top: slot.type === "new" ? "1.5rem" : "0.375rem" }}
//               >
//                 ×
//               </button>
//             </div>
//           ))}
//           {slots.length < MAX_IMAGES && (
//             <button
//               type="button"
//               onClick={() => fileRef.current?.click()}
//               className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/40 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-amber-500 transition-all cursor-pointer"
//             >
//               <span className="text-2xl leading-none">+</span>
//               <span className="text-xs">Add more</span>
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Main Form ────────────────────────────────────────────────────────────────

// export default function ProductForm({ mode, productId }: ProductFormProps) {
//   const router = useRouter();
//   const [collections, setCollections] = useState<Collection[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(mode === "edit");
//   const [feedback, setFeedback] = useState<{
//     type: "success" | "error";
//     msg: string;
//   } | null>(null);
//   const [activeSection, setActiveSection] = useState("basic");

//   // ── Form state — mirrors the schema exactly ───────────────────────────────
//   const [form, setForm] = useState({
//     // Identity
//     name: "",
//     slug: "",
//     subtitle: "",
//     sku: "",
//     // Collection / category
//     collection: "",
//     category: "",
//     // Pricing
//     price: "",
//     originalPrice: "",
//     // Classification
//     tag: "",
//     purity: "22kt",
//     metal: "Yellow Gold",
//     bisHallmark: true,
//     countryOfOrigin: "Jaipur, India",
//     // Content
//     shortDescription: "",
//     longDescription: "",
//     ourPromise: "",
//     // Variants
//     weightGrams: "",
//     // Admin control
//     isActive: true,
//     isFeatured: false,
//     stock: "",
//     sortOrder: "0",
//     // SEO
//     seoTitle: "",
//     seoDescription: "",
//     seoKeywords: "", // comma-separated string → array on submit
//   });

//   const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
//   const [offerBannerState, setOfferBannerState] = useState<SingleImageState>({
//     type: "none",
//   });
//   const [sizeChartState, setSizeChartState] = useState<SingleImageState>({
//     type: "none",
//   });
//   const [sizes, setSizes] = useState<Size[]>([{ label: "", available: true }]);
//   const [specs, setSpecs] = useState<Spec[]>([
//     { key: "", value: "", icon: "" },
//   ]);

//   // ── Fetch collections ─────────────────────────────────────────────────────
//   useEffect(() => {
//     fetch(`${API_BASE}/api/collections/admin/all`, {
//       headers: authHeadersOnly(),
//     })
//       .then((r) => r.json())
//       .then((d) => setCollections(d.data || []))
//       .catch(() => {});
//   }, []);

//   // ── Fetch product for edit mode ───────────────────────────────────────────
//   useEffect(() => {
//     if (mode !== "edit" || !productId) return;
//     setFetching(true);
//     fetch(`${API_BASE}/api/products/admin/${productId}`, {
//       headers: authHeadersOnly(),
//     })
//       .then((r) => r.json())
//       .then((d) => {
//         const p = d.data;
//         if (!p) return;
//         setForm({
//           name: p.name || "",
//           slug: p.slug || "",
//           subtitle: p.subtitle || "",
//           sku: p.sku || "",
//           collection: p.collection?._id || "",
//           category: p.category || "",
//           price: String(p.price || ""),
//           originalPrice: p.originalPrice ? String(p.originalPrice) : "",
//           tag: p.tag || "",
//           purity: p.purity || "22kt",
//           metal: p.metal || "Yellow Gold",
//           bisHallmark: p.bisHallmark ?? true,
//           countryOfOrigin: p.countryOfOrigin || "Jaipur, India",
//           shortDescription: p.shortDescription || "",
//           longDescription: p.longDescription || "",
//           ourPromise: p.ourPromise || "",
//           weightGrams: p.weightGrams || "",
//           isActive: p.isActive ?? true,
//           isFeatured: p.isFeatured ?? false,
//           stock: p.stock != null ? String(p.stock) : "",
//           sortOrder: String(p.sortOrder || 0),
//           seoTitle: p.seoTitle || "",
//           seoDescription: p.seoDescription || "",
//           seoKeywords: p.seoKeywords?.join(", ") || "",
//         });
//         if (p.images?.length)
//           setImageSlots(
//             p.images.map((img: { src: string; alt: string }) => ({
//               type: "existing" as const,
//               src: img.src,
//               alt: img.alt || "",
//             })),
//           );
//         if (p.offerBannerImage)
//           setOfferBannerState({ type: "existing", url: p.offerBannerImage });
//         if (p.sizeChartImage)
//           setSizeChartState({ type: "existing", url: p.sizeChartImage });
//         if (p.sizes?.length) setSizes(p.sizes);
//         if (p.specifications?.length) setSpecs(p.specifications);
//       })
//       .catch(() => {})
//       .finally(() => setFetching(false));
//   }, [mode, productId]);

//   const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

//   const handleNameChange = (name: string) => {
//     set("name", name);
//     if (mode === "add")
//       set(
//         "slug",
//         name
//           .toLowerCase()
//           .replace(/[^a-z0-9]+/g, "-")
//           .replace(/^-|-$/g, ""),
//       );
//   };

//   // ── Submit ────────────────────────────────────────────────────────────────
//   const handleSubmit = async () => {
//     if (!form.name || !form.slug || !form.price || !form.ourPromise) {
//       setFeedback({
//         type: "error",
//         msg: "Name, slug, price and Our Promise are required.",
//       });
//       return;
//     }
//     if (imageSlots.length === 0) {
//       setFeedback({
//         type: "error",
//         msg: "At least one product image is required.",
//       });
//       return;
//     }

//     setLoading(true);
//     setFeedback(null);

//     try {
//       const fd = new FormData();

//       // String fields — only append if non-empty
//       (
//         [
//           "name",
//           "slug",
//           "subtitle",
//           "sku",
//           "category",
//           "tag",
//           "purity",
//           "metal",
//           "countryOfOrigin",
//           "shortDescription",
//           "longDescription",
//           "ourPromise",
//           "weightGrams",
//           "seoTitle",
//           "seoDescription",
//         ] as const
//       ).forEach((k) => {
//         if (form[k] !== "") fd.append(k, String(form[k]));
//       });

//       // Numbers
//       fd.append("price", String(Number(form.price)));
//       if (form.originalPrice)
//         fd.append("originalPrice", String(Number(form.originalPrice)));
//       if (form.stock) fd.append("stock", String(Number(form.stock)));
//       fd.append("sortOrder", String(Number(form.sortOrder)));

//       // Booleans
//       fd.append("bisHallmark", String(form.bisHallmark));
//       fd.append("isActive", String(form.isActive));
//       fd.append("isFeatured", String(form.isFeatured));

//       // Collection
//       if (form.collection) fd.append("collection", form.collection);

//       // Sizes (filter out blank rows)
//       const validSizes = sizes.filter((s) => s.label.trim());
//       if (validSizes.length) fd.append("sizes", JSON.stringify(validSizes));

//       // Specifications (filter out blank rows)
//       const validSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
//       if (validSpecs.length)
//         fd.append("specifications", JSON.stringify(validSpecs));

//       // SEO keywords — comma string → JSON array
//       if (form.seoKeywords) {
//         const keywords = form.seoKeywords
//           .split(",")
//           .map((k) => k.trim())
//           .filter(Boolean);
//         if (keywords.length) fd.append("seoKeywords", JSON.stringify(keywords));
//       }

//       // Gallery images
//       const existing = imageSlots
//         .filter(
//           (s): s is Extract<ImageSlot, { type: "existing" }> =>
//             s.type === "existing",
//         )
//         .map((s) => ({ src: s.src, alt: s.alt }));
//       fd.append("existingImages", JSON.stringify(existing));
//       imageSlots
//         .filter(
//           (s): s is Extract<ImageSlot, { type: "new" }> => s.type === "new",
//         )
//         .forEach((s) => fd.append("images", s.file));
//       fd.append("replaceImages", "false");

//       // Offer banner
//       if (offerBannerState.type === "new")
//         fd.append("offerBanner", offerBannerState.file);
//       else if (offerBannerState.type === "cleared")
//         fd.append("clearOfferBanner", "true");

//       // Size chart
//       if (sizeChartState.type === "new")
//         fd.append("sizeChart", sizeChartState.file);
//       else if (sizeChartState.type === "cleared")
//         fd.append("clearSizeChart", "true");

//       const url =
//         mode === "edit"
//           ? `${API_BASE}/api/products/admin/${productId}`
//           : `${API_BASE}/api/products/admin/create`;

//       const res = await fetch(url, {
//         method: mode === "edit" ? "PUT" : "POST",
//         headers: authHeadersOnly(),
//         body: fd,
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Failed");

//       setFeedback({
//         type: "success",
//         msg: mode === "edit" ? "Product updated!" : "Product created!",
//       });
//       setTimeout(() => router.push("/admin/products"), 1200);
//     } catch (err: unknown) {
//       setFeedback({
//         type: "error",
//         msg: err instanceof Error ? err.message : "Something went wrong",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const SECTIONS = [
//     { id: "basic", label: "Basic Info" },
//     { id: "pricing", label: "Pricing" },
//     { id: "media", label: "Images & Media" },
//     { id: "variants", label: "Sizes & Variants" },
//     { id: "content", label: "Content" },
//     { id: "specs", label: "Specifications" },
//     { id: "seo", label: "SEO & Settings" },
//   ];

//   if (fetching)
//     return (
//       <div className="flex items-center justify-center py-20">
//         <svg
//           className="animate-spin w-8 h-8 text-amber-500"
//           viewBox="0 0 24 24"
//           fill="none"
//         >
//           <circle
//             className="opacity-25"
//             cx="12"
//             cy="12"
//             r="10"
//             stroke="currentColor"
//             strokeWidth="4"
//           />
//           <path
//             className="opacity-75"
//             fill="currentColor"
//             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//           />
//         </svg>
//       </div>
//     );

//   return (
//     <div className="flex gap-6 items-start">
//       {/* Side nav */}
//       <div className="hidden lg:block w-48 flex-shrink-0">
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-6">
//           {SECTIONS.map((s) => (
//             <button
//               key={s.id}
//               onClick={() => {
//                 setActiveSection(s.id);
//                 document
//                   .getElementById(`section-${s.id}`)
//                   ?.scrollIntoView({ behavior: "smooth", block: "start" });
//               }}
//               className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer ${
//                 activeSection === s.id
//                   ? "bg-amber-50 text-amber-700 font-medium"
//                   : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
//               }`}
//             >
//               {s.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="flex-1 min-w-0 space-y-5">
//         {/* Feedback banner */}
//         {feedback && (
//           <div
//             className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
//               feedback.type === "success"
//                 ? "bg-emerald-50 border-emerald-200 text-emerald-700"
//                 : "bg-red-50 border-red-200 text-red-600"
//             }`}
//           >
//             <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
//             <span>{feedback.msg}</span>
//             <button
//               onClick={() => setFeedback(null)}
//               className="ml-auto text-lg leading-none cursor-pointer opacity-60 hover:opacity-100"
//             >
//               ×
//             </button>
//           </div>
//         )}

//         {/* ── Basic Info ─────────────────────────────────────────────────── */}
//         <div
//           id="section-basic"
//           className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
//         >
//           <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
//             Basic Info
//           </h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="sm:col-span-2">
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Product Name *
//               </label>
//               <input
//                 value={form.name}
//                 onChange={(e) => handleNameChange(e.target.value)}
//                 placeholder="e.g. Nawabi Chain"
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
//               />
//             </div>

//             {(
//               [
//                 { k: "slug", l: "Slug *", p: "nawabi-chain-22kt", m: true },
//                 { k: "sku", l: "SKU", p: "RJ-CH-001", m: true },
//                 {
//                   k: "subtitle",
//                   l: "Subtitle",
//                   p: "22kt Yellow Gold · 18 inch",
//                   m: false,
//                 },
//                 { k: "category", l: "Category", p: "Chains", m: false },
//                 { k: "weightGrams", l: "Weight", p: "8–12 grams", m: false },
//                 {
//                   k: "countryOfOrigin",
//                   l: "Country of Origin",
//                   p: "Jaipur, India",
//                   m: false,
//                 },
//               ] as { k: string; l: string; p: string; m: boolean }[]
//             ).map(({ k, l, p, m }) => (
//               <div key={k}>
//                 <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                   {l}
//                 </label>
//                 <input
//                   value={form[k as keyof typeof form] as string}
//                   onChange={(e) => set(k, e.target.value)}
//                   placeholder={p}
//                   className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all${
//                     m ? " font-mono" : ""
//                   }`}
//                 />
//               </div>
//             ))}

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Collection
//               </label>
//               <select
//                 value={form.collection}
//                 onChange={(e) => set("collection", e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
//               >
//                 <option value="">No collection</option>
//                 {collections.map((c) => (
//                   <option key={c._id} value={c._id}>
//                     {c.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Tag
//               </label>
//               <select
//                 value={form.tag}
//                 onChange={(e) => set("tag", e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
//               >
//                 {TAGS.map((t) => (
//                   <option key={t} value={t}>
//                     {t || "None"}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Purity
//               </label>
//               <select
//                 value={form.purity}
//                 onChange={(e) => set("purity", e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
//               >
//                 {PURITIES.map((p) => (
//                   <option key={p}>{p}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Metal
//               </label>
//               <select
//                 value={form.metal}
//                 onChange={(e) => set("metal", e.target.value)}
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white cursor-pointer transition-all"
//               >
//                 {METALS.map((m) => (
//                   <option key={m}>{m}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="flex items-center gap-6 pt-2">
//               {(
//                 [
//                   {
//                     k: "bisHallmark",
//                     l: "BIS Hallmark",
//                     c: "accent-amber-500",
//                   },
//                   { k: "isActive", l: "Active", c: "accent-emerald-500" },
//                   { k: "isFeatured", l: "Featured", c: "accent-amber-500" },
//                 ] as { k: string; l: string; c: string }[]
//               ).map(({ k, l, c }) => (
//                 <label
//                   key={k}
//                   className="flex items-center gap-2 cursor-pointer"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={form[k as keyof typeof form] as boolean}
//                     onChange={(e) => set(k, e.target.checked)}
//                     className={`w-4 h-4 ${c} cursor-pointer rounded`}
//                   />
//                   <span className="text-sm text-gray-600">{l}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* ── Pricing ────────────────────────────────────────────────────── */}
//         <div
//           id="section-pricing"
//           className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
//         >
//           <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
//             Pricing
//           </h3>
//           <p className="text-gray-500 mb-4 text-xs tracking-wider">
//             *** Include tax in the product price
//           </p>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             {(
//               [
//                 { k: "price", l: "Price (₹) *", p: "8999" },
//                 { k: "originalPrice", l: "Original Price (₹)", p: "10499" },
//                 { k: "stock", l: "Stock (empty = unlimited)", p: "Unlimited" },
//               ] as { k: string; l: string; p: string }[]
//             ).map(({ k, l, p }) => (
//               <div key={k}>
//                 <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                   {l}
//                 </label>
//                 <input
//                   type="number"
//                   value={form[k as keyof typeof form] as string}
//                   onChange={(e) => set(k, e.target.value)}
//                   placeholder={p}
//                   min="0"
//                   className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
//                 />
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── Images & Media ─────────────────────────────────────────────── */}
//         <div
//           id="section-media"
//           className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
//         >
//           <div className="flex items-center justify-between mb-1">
//             <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
//               Images & Media
//             </h3>
//             <span className="text-xs text-gray-400">
//               {imageSlots.length} / {MAX_IMAGES} gallery images
//             </span>
//           </div>
//           <p className="text-xs text-gray-400 mb-4">
//             First image is the main product photo. Drag thumbnails to reorder.
//           </p>
//           <ImageUploadSection slots={imageSlots} onChange={setImageSlots} />

//           <div className="border-t border-gray-100 mt-6 pt-6">
//             <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
//               Supporting images
//             </p>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//               <SingleImageUpload
//                 label="Offer Banner"
//                 hint="Promotional banner in product tabs. Recommended 1200×400px."
//                 state={offerBannerState}
//                 onChange={setOfferBannerState}
//                 fieldName="offerBanner"
//               />
//               <SingleImageUpload
//                 label="Size Chart"
//                 hint="Size guide shown with the size selector. Recommended 800×600px."
//                 state={sizeChartState}
//                 onChange={setSizeChartState}
//                 fieldName="sizeChart"
//               />
//             </div>
//           </div>
//         </div>

//         {/* ── Sizes & Variants ───────────────────────────────────────────── */}
//         <div
//           id="section-variants"
//           className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
//         >
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
//               Sizes & Variants
//             </h3>
//             <button
//               onClick={() =>
//                 setSizes((s) => [...s, { label: "", available: true }])
//               }
//               className="text-xs text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
//             >
//               + Add size
//             </button>
//           </div>
//           <div className="flex flex-wrap gap-3">
//             {sizes.map((size, i) => (
//               <div
//                 key={i}
//                 className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
//               >
//                 <input
//                   value={size.label}
//                   onChange={(e) => {
//                     const n = [...sizes];
//                     n[i] = { ...n[i], label: e.target.value };
//                     setSizes(n);
//                   }}
//                   placeholder='e.g. 18"'
//                   className="w-20 bg-transparent text-sm focus:outline-none text-gray-700"
//                 />
//                 <label className="flex items-center gap-1 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={size.available}
//                     onChange={(e) => {
//                       const n = [...sizes];
//                       n[i] = { ...n[i], available: e.target.checked };
//                       setSizes(n);
//                     }}
//                     className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
//                   />
//                   <span className="text-xs text-gray-500">In stock</span>
//                 </label>
//                 {sizes.length > 1 && (
//                   <button
//                     onClick={() => setSizes((s) => s.filter((_, j) => j !== i))}
//                     className="text-gray-400 hover:text-red-500 text-sm cursor-pointer leading-none"
//                   >
//                     ×
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── Content ────────────────────────────────────────────────────── */}
//         <div
//           id="section-content"
//           className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
//         >
//           <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
//             Content
//           </h3>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Short Description{" "}
//                 <span className="text-gray-400">(max 300 chars)</span>
//               </label>
//               <textarea
//                 value={form.shortDescription}
//                 onChange={(e) => set("shortDescription", e.target.value)}
//                 rows={2}
//                 maxLength={300}
//                 placeholder="Brief product summary…"
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
//               />
//               <p className="text-right text-xs text-gray-300 mt-1">
//                 {form.shortDescription.length}/300
//               </p>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Long Description
//               </label>
//               <textarea
//                 value={form.longDescription}
//                 onChange={(e) => set("longDescription", e.target.value)}
//                 rows={4}
//                 placeholder="Detailed description…"
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Our Promise *{" "}
//                 <span className="text-amber-500 font-normal">
//                   (shown in product trust section)
//                 </span>
//               </label>
//               <textarea
//                 value={form.ourPromise}
//                 onChange={(e) => set("ourPromise", e.target.value)}
//                 rows={3}
//                 placeholder="e.g. We stand behind every piece we sell. 30-day returns, no questions asked."
//                 className="w-full px-4 py-2.5 border border-amber-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none bg-amber-50/50 transition-all"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 Sort Order
//               </label>
//               <input
//                 type="number"
//                 value={form.sortOrder}
//                 onChange={(e) => set("sortOrder", e.target.value)}
//                 min="0"
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
//               />
//             </div>
//           </div>
//         </div>

//         {/* ── Specifications ─────────────────────────────────────────────── */}
//         <div
//           id="section-specs"
//           className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
//         >
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
//               Specifications
//             </h3>
//             <button
//               onClick={() =>
//                 setSpecs((s) => [...s, { key: "", value: "", icon: "" }])
//               }
//               className="text-xs text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
//             >
//               + Add row
//             </button>
//           </div>
//           <div className="space-y-2">
//             {specs.map((spec, i) => (
//               <div
//                 key={i}
//                 className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 items-center"
//               >
//                 <input
//                   value={spec.key}
//                   onChange={(e) => {
//                     const n = [...specs];
//                     n[i] = { ...n[i], key: e.target.value };
//                     setSpecs(n);
//                   }}
//                   placeholder="Metal"
//                   className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all"
//                 />
//                 <input
//                   value={spec.value}
//                   onChange={(e) => {
//                     const n = [...specs];
//                     n[i] = { ...n[i], value: e.target.value };
//                     setSpecs(n);
//                   }}
//                   placeholder="22kt Yellow Gold"
//                   className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all"
//                 />
//                 <input
//                   value={spec.icon}
//                   onChange={(e) => {
//                     const n = [...specs];
//                     n[i] = { ...n[i], icon: e.target.value };
//                     setSpecs(n);
//                   }}
//                   placeholder="icon"
//                   className="w-16 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-all text-center"
//                 />
//                 {specs.length > 1 && (
//                   <button
//                     onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
//                     className="w-8 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer"
//                   >
//                     ×
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── SEO & Settings ─────────────────────────────────────────────── */}
//         <div
//           id="section-seo"
//           className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
//         >
//           <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
//             SEO & Settings
//           </h3>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 SEO Title
//               </label>
//               <input
//                 value={form.seoTitle}
//                 onChange={(e) => set("seoTitle", e.target.value)}
//                 placeholder="Nawabi Chain | Rehnoor Jewels"
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 SEO Description
//               </label>
//               <textarea
//                 value={form.seoDescription}
//                 onChange={(e) => set("seoDescription", e.target.value)}
//                 rows={2}
//                 placeholder="Hand-crafted 22kt gold…"
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-medium text-gray-600 mb-1.5">
//                 SEO Keywords
//               </label>
//               <input
//                 value={form.seoKeywords}
//                 onChange={(e) => set("seoKeywords", e.target.value)}
//                 placeholder="gold ring, 22kt jewellery, wedding ring"
//                 className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
//               />
//               <p className="text-xs text-gray-400 mt-1">
//                 Separate keywords with commas
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* ── Actions ────────────────────────────────────────────────────── */}
//         <div className="flex items-center justify-end gap-3 pb-8">
//           <button
//             onClick={() => router.back()}
//             className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-200"
//           >
//             {loading ? (
//               <>
//                 <svg
//                   className="animate-spin w-4 h-4"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                   />
//                 </svg>
//                 Saving…
//               </>
//             ) : mode === "edit" ? (
//               "Save Changes"
//             ) : (
//               "Create Product"
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────

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
type ImageSlot =
  | { type: "existing"; src: string; alt: string }
  | { type: "new"; file: File; preview: string; alt: string };

type SingleImageState =
  | { type: "none" }
  | { type: "existing"; url: string }
  | { type: "new"; file: File; preview: string }
  | { type: "cleared" };

interface VariantOption {
  name: string; // e.g. "Size"
  values: string[]; // e.g. ["16\"", "18\"", "20\""]
}
interface Variant {
  _id?: string;
  title: string;
  sku: string;
  barcode: string;
  price: string;
  originalPrice: string;
  stock: string;
  weightGrams: string;
  isDefault: boolean;
  isActive: boolean;
  options: Record<string, string>; // { Size: "18\"", Metal: "Rose Gold" }
  images: ImageSlot[];
}

interface ProductFormProps {
  mode: "add" | "edit";
  productId?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_IMAGES = 8;
const MAX_FILE_MB = 5;

const TAGS = [
  "",
  "Bestseller",
  "New",
  "Popular",
  "Limited",
  "Exclusive",
  "Trending",
  "Sale",
];
const SECTIONS = [
  { id: "basic", label: "Basic Info", icon: "◈" },
  { id: "pricing", label: "Pricing", icon: "₹" },
  { id: "media", label: "Images & Media", icon: "⊟" },
  { id: "options", label: "Options", icon: "⊞" },
  { id: "variants", label: "Variants", icon: "◧" },
  { id: "content", label: "Content", icon: "≡" },
  { id: "specs", label: "Specifications", icon: "⊕" },
  { id: "seo", label: "SEO & Settings", icon: "◉" },
];

// ─── Auth ──────────────────────────────────────────────────────────────────────

function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("admin_token") || ""
    : "";
}
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// ─── Utility ───────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generate all combinations of option values (cartesian product). */
function cartesian(options: VariantOption[]): Record<string, string>[] {
  if (!options.length) return [];
  const filled = options.filter(
    (o) => o.name.trim() && o.values.some((v) => v.trim()),
  );
  if (!filled.length) return [];

  return filled.reduce<Record<string, string>[]>(
    (acc, opt) => {
      const validValues = opt.values.filter((v) => v.trim());
      return acc.flatMap((combo) =>
        validValues.map((val) => ({ ...combo, [opt.name]: val })),
      );
    },
    [{}],
  );
}

function variantTitle(options: Record<string, string>) {
  return Object.values(options).join(" / ");
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

type ModalType = "success" | "error";

function Modal({
  type,
  title,
  message,
  onClose,
  onConfirm,
}: {
  type: ModalType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: isSuccess
            ? "linear-gradient(145deg,#fffbeb,#fff)"
            : "linear-gradient(145deg,#fff1f1,#fff)",
          border: `1.5px solid ${isSuccess ? "#fbbf24" : "#fca5a5"}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top strip */}
        <div
          className="h-1.5 w-full"
          style={{
            background: isSuccess
              ? "linear-gradient(90deg,#f59e0b,#fbbf24,#f59e0b)"
              : "linear-gradient(90deg,#ef4444,#f87171,#ef4444)",
          }}
        />

        <div className="px-8 pt-8 pb-7">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-inner"
            style={{
              background: isSuccess ? "#fef3c7" : "#fee2e2",
              border: `1.5px solid ${isSuccess ? "#fde68a" : "#fecaca"}`,
            }}
          >
            {isSuccess ? "✓" : "✕"}
          </div>

          <h2
            className="text-center font-semibold text-xl mb-2 tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: isSuccess ? "#92400e" : "#991b1b",
            }}
          >
            {title}
          </h2>
          <p className="text-center text-sm text-gray-500 leading-relaxed mb-7">
            {message}
          </p>

          <div className="flex gap-3">
            {onConfirm && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onConfirm ?? onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer shadow-sm"
              style={{
                background: isSuccess
                  ? "linear-gradient(135deg,#f59e0b,#d97706)"
                  : "linear-gradient(135deg,#ef4444,#dc2626)",
              }}
            >
              {onConfirm ? "Confirm" : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Upload Section ──────────────────────────────────────────────────────

function ImageUploadSection({
  slots,
  onChange,
  maxImages = MAX_IMAGES,
  compact = false,
}: {
  slots: ImageSlot[];
  onChange: (s: ImageSlot[]) => void;
  maxImages?: number;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - slots.length;
      if (remaining <= 0) return;
      const valid: ImageSlot[] = [];
      const errs: string[] = [];
      Array.from(files)
        .slice(0, remaining)
        .forEach((f) => {
          if (!f.type.startsWith("image/")) {
            errs.push(`"${f.name}" is not an image`);
            return;
          }
          if (f.size > MAX_FILE_MB * 1024 * 1024) {
            errs.push(`"${f.name}" exceeds ${MAX_FILE_MB}MB`);
            return;
          }
          valid.push({
            type: "new",
            file: f,
            preview: URL.createObjectURL(f),
            alt: f.name.replace(/\.[^/.]+$/, ""),
          });
        });
      if (errs.length) alert(errs.join("\n"));
      if (valid.length) onChange([...slots, ...valid]);
    },
    [slots, onChange, maxImages],
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

  const full = slots.length >= maxImages;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => !full && fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl transition-all cursor-pointer
          ${compact ? "py-5" : "py-8"}
          ${
            drag
              ? "border-2 border-amber-400 bg-amber-50"
              : full
              ? "border-2 border-dashed border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
              : "border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
          }`}
      >
        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 text-lg">
          ⊕
        </div>
        <p className="text-xs font-medium text-gray-500">
          {full
            ? `${maxImages} images — maximum reached`
            : "Drop images or click to browse"}
        </p>
        {!compact && (
          <p className="text-[10px] text-gray-400">
            JPG · PNG · WebP · max {MAX_FILE_MB}MB · up to {maxImages}
          </p>
        )}
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

      {/* Thumbnails */}
      {slots.length > 0 && (
        <div
          className={`grid gap-2 ${
            compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
          }`}
        >
          {slots.map((slot, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragEnter={() => setDropIdx(i)}
              onDragEnd={onDragEnd}
              className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-grab
                ${
                  dragIdx === i
                    ? "opacity-40 scale-95 border-amber-400"
                    : dropIdx === i
                    ? "border-amber-400 shadow-lg"
                    : "border-gray-100 hover:border-amber-200"
                }`}
            >
              <div
                className={`${
                  compact ? "aspect-square" : "aspect-square"
                } bg-gray-50 relative`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src(slot)}
                  alt={slot.alt}
                  className="w-full h-full object-cover"
                />
                {i === 0 && !compact && (
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full tracking-wide">
                    Main
                  </span>
                )}
                {slot.type === "new" && (
                  <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded-full tracking-wide">
                    New
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlot(i);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 z-10 transition-opacity"
                >
                  ×
                </button>
              </div>
              {!compact && (
                <div className="p-1.5 bg-white">
                  <input
                    value={slot.alt}
                    onChange={(e) => updateAlt(i, e.target.value)}
                    placeholder="Alt text…"
                    className="w-full text-[10px] px-2 py-1 border border-gray-100 rounded-lg focus:outline-none focus:border-amber-300"
                  />
                </div>
              )}
            </div>
          ))}
          {!full && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`${
                compact ? "aspect-square" : "aspect-square"
              } rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 flex flex-col items-center justify-center gap-1 text-gray-300 hover:text-amber-400 transition-all cursor-pointer`}
            >
              <span className="text-xl leading-none">+</span>
              {!compact && <span className="text-[10px]">Add</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single Image Upload ───────────────────────────────────────────────────────

function SingleImageUpload({
  label,
  hint,
  state,
  onChange,
}: {
  label: string;
  hint: string;
  state: SingleImageState;
  onChange: (s: SingleImageState) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const preview =
    state.type === "existing"
      ? state.url
      : state.type === "new"
      ? state.preview
      : null;

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
      <p className="text-[10px] text-gray-400 mb-2">{hint}</p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-100 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 bg-white text-xs rounded-lg text-gray-700 font-medium cursor-pointer shadow-sm"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange({ type: "cleared" })}
              className="px-3 py-1.5 bg-red-500 text-xs rounded-lg text-white font-medium cursor-pointer shadow-sm"
            >
              Remove
            </button>
          </div>
          {state.type === "new" && (
            <span className="absolute top-2 left-2 text-[8px] font-bold uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-1.5 text-gray-400 hover:border-amber-300 hover:text-amber-400 hover:bg-amber-50/30 cursor-pointer transition-all"
        >
          <span className="text-2xl">⊞</span>
          <span className="text-xs">
            {state.type === "cleared"
              ? "Cleared — click to add"
              : "Click to upload"}
          </span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          onChange({ type: "new", file: f, preview: URL.createObjectURL(f) });
          (e.target as HTMLInputElement).value = "";
        }}
      />
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white placeholder:text-gray-300";
const selectCls = `${inputCls} cursor-pointer`;

// ─── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({
  id,
  icon,
  title,
  badge,
  action,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      id={`section-${id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-sm">
            {icon}
          </span>
          <h3 className="font-semibold text-gray-800 text-sm tracking-wide">
            {title}
          </h3>
          {badge && (
            <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Main Form ─────────────────────────────────────────────────────────────────

export default function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");
  const [activeSection, setActiveSection] = useState("basic");

  const [modal, setModal] = useState<{
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  // ── Core form state ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    slug: "",
    subtitle: "",
    sku: "",
    collection: "",
    category: "",
    price: "",
    originalPrice: "",
    tag: "",
    shortDescription: "",
    longDescription: "",
    ourPromise: "",
    weightGrams: "",
    isActive: true,
    isFeatured: false,
    stock: "",
    sortOrder: "0",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  // ── Media ────────────────────────────────────────────────────────────────────
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [offerBannerState, setOfferBannerState] = useState<SingleImageState>({
    type: "none",
  });
  const [sizeChartState, setSizeChartState] = useState<SingleImageState>({
    type: "none",
  });

  // ── Options & Variants ───────────────────────────────────────────────────────
  const [options, setOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([
    { key: "", value: "", icon: "" },
  ]);

  // ── Fetch collections ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/collections/admin/all`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setCollections(d.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch product for edit ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    setFetching(true);
    fetch(`${API_BASE}/api/products/admin/${productId}`, {
      headers: authHeaders(),
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
          price: String(p.price || ""),
          originalPrice: p.originalPrice ? String(p.originalPrice) : "",
          tag: p.tag || "",
          shortDescription: p.shortDescription || "",
          longDescription: p.longDescription || "",
          ourPromise: p.ourPromise || "",
          weightGrams: p.weightGrams != null ? String(p.weightGrams) : "",
          isActive: p.isActive ?? true,
          isFeatured: p.isFeatured ?? false,
          stock: p.stock != null ? String(p.stock) : "",
          sortOrder: String(p.sortOrder || 0),
          seoTitle: p.seoTitle || "",
          seoDescription: p.seoDescription || "",
          seoKeywords: p.seoKeywords?.join(", ") || "",
        });
        if (p.images?.length) {
          setImageSlots(
            p.images.map((img: { src: string; alt: string }) => ({
              type: "existing" as const,
              src: img.src,
              alt: img.alt || "",
            })),
          );
        }
        if (p.offerBannerImage)
          setOfferBannerState({ type: "existing", url: p.offerBannerImage });
        if (p.sizeChartImage)
          setSizeChartState({ type: "existing", url: p.sizeChartImage });
        if (p.specifications?.length) setSpecs(p.specifications);

        // Reconstruct options
        if (p.options?.length) setOptions(p.options);

        // Reconstruct variants — options is a Map on the server; arrives as plain object
        if (p.variants?.length) {
          setVariants(
            p.variants.map((v: Record<string, unknown>) => ({
              _id: v._id as string,
              title: String(v.title || ""),
              sku: String(v.sku || ""),
              barcode: String(v.barcode || ""),
              price: v.price != null ? String(v.price) : "",
              originalPrice:
                v.originalPrice != null ? String(v.originalPrice) : "",
              stock: v.stock != null ? String(v.stock) : "",
              weightGrams: v.weightGrams != null ? String(v.weightGrams) : "",
              isDefault: Boolean(v.isDefault),
              isActive: v.isActive !== false,
              options:
                v.options && typeof v.options === "object"
                  ? (v.options as Record<string, string>)
                  : {},
              images: Array.isArray(v.images)
                ? (v.images as { src: string; alt: string }[]).map((img) => ({
                    type: "existing" as const,
                    src: img.src,
                    alt: img.alt || "",
                  }))
                : [],
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [mode, productId]);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleNameChange = (name: string) => {
    set("name", name);
    if (mode === "add") set("slug", slugify(name));
  };

  // ── Options management ───────────────────────────────────────────────────────

  const addOption = () => setOptions((o) => [...o, { name: "", values: [""] }]);
  const removeOption = (i: number) =>
    setOptions((o) => o.filter((_, j) => j !== i));
  const updateOptionName = (i: number, name: string) =>
    setOptions((o) => o.map((opt, j) => (j === i ? { ...opt, name } : opt)));
  const updateOptionValues = (i: number, raw: string) =>
    setOptions((o) =>
      o.map((opt, j) =>
        j === i ? { ...opt, values: raw.split(",").map((v) => v.trim()) } : opt,
      ),
    );

  /** Generate variants from current options using cartesian product. */
  const generateVariants = () => {
    const combos = cartesian(options);
    if (!combos.length) {
      setModal({
        type: "error",
        title: "Nothing to generate",
        message:
          "Add at least one option with values before generating variants.",
      });
      return;
    }
    setVariants((existing) =>
      combos.map((combo) => {
        const title = variantTitle(combo);
        const match = existing.find((v) => variantTitle(v.options) === title);
        return match
          ? { ...match, options: combo, title } // preserve existing data
          : {
              title,
              sku: "",
              barcode: "",
              price: form.price,
              originalPrice: form.originalPrice,
              stock: "",
              weightGrams: "",
              isDefault: false,
              isActive: true,
              options: combo,
              images: [],
            };
      }),
    );
  };

  const updateVariant = (i: number, key: keyof Variant, value: unknown) =>
    setVariants((v) =>
      v.map((vt, j) => (j === i ? { ...vt, [key]: value } : vt)),
    );

  const setDefaultVariant = (i: number) =>
    setVariants((v) => v.map((vt, j) => ({ ...vt, isDefault: j === i })));

  const removeVariant = (i: number) =>
    setVariants((v) => v.filter((_, j) => j !== i));

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price || !form.ourPromise) {
      setModal({
        type: "error",
        title: "Missing required fields",
        message:
          "Name, slug, price, and Our Promise are required before saving.",
      });
      return;
    }
    if (imageSlots.length === 0) {
      setModal({
        type: "error",
        title: "No images",
        message: "At least one product image is required.",
      });
      return;
    }
    if (variants.length && !variants.some((v) => v.isDefault)) {
      setModal({
        type: "error",
        title: "No default variant",
        message: "Mark one variant as default before saving.",
      });
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();

      // Scalars
      (
        [
          "name",
          "slug",
          "subtitle",
          "sku",
          "category",
          "shortDescription",
          "longDescription",
          "ourPromise",
          "seoTitle",
          "seoDescription",
        ] as const
      ).forEach((k) => {
        if (form[k]) fd.append(k, form[k]);
      });

      fd.append("price", String(Number(form.price)));
      fd.append("isActive", String(form.isActive));
      fd.append("isFeatured", String(form.isFeatured));
      fd.append("sortOrder", String(Number(form.sortOrder)));

      if (form.originalPrice)
        fd.append("originalPrice", String(Number(form.originalPrice)));
      if (form.stock) fd.append("stock", String(Number(form.stock)));
      if (form.weightGrams)
        fd.append("weightGrams", String(Number(form.weightGrams)));
      if (form.collection) fd.append("collection", form.collection);
      if (form.tag) fd.append("tag", form.tag);

      if (form.seoKeywords) {
        const kws = form.seoKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
        if (kws.length) fd.append("seoKeywords", JSON.stringify(kws));
      }

      // Specs
      const validSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
      if (validSpecs.length)
        fd.append("specifications", JSON.stringify(validSpecs));

      // Options (axes)
      const validOptions = options.filter(
        (o) => o.name.trim() && o.values.some((v) => v.trim()),
      );
      fd.append("options", JSON.stringify(validOptions));

      // Variants — strip File objects; images are sent separately
      const variantPayload = variants.map((v) => ({
        ...(v._id ? { _id: v._id } : {}),
        title: v.title,
        sku: v.sku || undefined,
        barcode: v.barcode || undefined,
        price: Number(v.price) || 0,
        originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
        stock: v.stock !== "" ? Number(v.stock) : undefined,
        weightGrams: v.weightGrams ? Number(v.weightGrams) : 0,
        isDefault: v.isDefault,
        isActive: v.isActive,
        options: v.options,
        // Send existing images only; new ones come via variantImages_N
        images: v.images
          .filter(
            (img): img is Extract<ImageSlot, { type: "existing" }> =>
              img.type === "existing",
          )
          .map((img) => ({ src: img.src, alt: img.alt })),
      }));
      fd.append("variants", JSON.stringify(variantPayload));

      // Variant new images: field per variant index
      variants.forEach((v, idx) => {
        v.images
          .filter(
            (img): img is Extract<ImageSlot, { type: "new" }> =>
              img.type === "new",
          )
          .forEach((img) => fd.append(`variantImages_${idx}`, img.file));
      });

      // Gallery images
      const existingGallery = imageSlots
        .filter(
          (s): s is Extract<ImageSlot, { type: "existing" }> =>
            s.type === "existing",
        )
        .map((s) => ({ src: s.src, alt: s.alt }));
      fd.append("existingImages", JSON.stringify(existingGallery));
      imageSlots
        .filter(
          (s): s is Extract<ImageSlot, { type: "new" }> => s.type === "new",
        )
        .forEach((s) => fd.append("images", s.file));
      fd.append("replaceImages", "false");

      // Offer banner / size chart
      if (offerBannerState.type === "new")
        fd.append("offerBanner", offerBannerState.file);
      else if (offerBannerState.type === "cleared")
        fd.append("clearOfferBanner", "true");
      if (sizeChartState.type === "new")
        fd.append("sizeChart", sizeChartState.file);
      else if (sizeChartState.type === "cleared")
        fd.append("clearSizeChart", "true");

      const url =
        mode === "edit"
          ? `${API_BASE}/api/products/admin/${productId}`
          : `${API_BASE}/api/products/admin/create`;

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Request failed");

      setModal({
        type: "success",
        title: mode === "edit" ? "Product updated!" : "Product created!",
        message:
          mode === "edit"
            ? `"${form.name}" has been saved successfully.`
            : `"${form.name}" is now live in your catalogue.`,
        onConfirm: () => router.push("/admin/products"),
      });
    } catch (err: unknown) {
      setModal({
        type: "error",
        title: "Save failed",
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto animate-pulse">
            <span className="text-amber-500 text-xl">◈</span>
          </div>
          <p className="text-sm text-gray-400">Loading product…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {modal && (
        <Modal
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={() => setModal(null)}
          onConfirm={modal.onConfirm}
        />
      )}

      <div className="flex gap-6 items-start max-w-6xl mx-auto">
        {/* ── Sidebar nav ───────────────────────────────────────────────────── */}
        <aside className="hidden xl:block w-44 flex-shrink-0 sticky top-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  document
                    .getElementById(`section-${s.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === s.id
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-[11px] opacity-60">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Form body ─────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* ── Basic Info ───────────────────────────────────────────────── */}
          <SectionCard id="basic" icon="◈" title="Basic Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Product Name" required>
                  <input
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Nawabi Chain"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Slug" required>
                <input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="nawabi-chain"
                  className={`${inputCls} font-mono text-xs`}
                />
              </Field>
              <Field label="SKU">
                <input
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  placeholder="RJ-CH-001"
                  className={`${inputCls} font-mono text-xs`}
                />
              </Field>
              <Field label="Subtitle">
                <input
                  value={form.subtitle}
                  onChange={(e) => set("subtitle", e.target.value)}
                  placeholder="22kt Yellow Gold · 18 inch"
                  className={inputCls}
                />
              </Field>
              <Field label="Category">
                <input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Chains"
                  className={inputCls}
                />
              </Field>
              <Field label="Collection">
                <select
                  value={form.collection}
                  onChange={(e) => set("collection", e.target.value)}
                  className={selectCls}
                >
                  <option value="">No collection</option>
                  {collections.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tag">
                <select
                  value={form.tag}
                  onChange={(e) => set("tag", e.target.value)}
                  className={selectCls}
                >
                  {TAGS.map((t) => (
                    <option key={t} value={t}>
                      {t || "None"}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <div className="flex items-center gap-6 pt-1">
                  {(
                    [
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
          </SectionCard>

          {/* ── Pricing ──────────────────────────────────────────────────── */}
          <SectionCard id="pricing" icon="₹" title="Pricing">
            <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mb-4">
              Base price — used when no variant is selected. Override per
              variant below.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Price (₹)" required>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="8999"
                  min="0"
                  className={inputCls}
                />
              </Field>
              <Field
                label="Original Price (₹)"
                hint="Shows strikethrough + discount %"
              >
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => set("originalPrice", e.target.value)}
                  placeholder="10499"
                  min="0"
                  className={inputCls}
                />
              </Field>
              <Field label="Stock" hint="Leave blank for unlimited">
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  placeholder="—"
                  min="0"
                  className={inputCls}
                />
              </Field>
              <Field label="Weight (grams)">
                <input
                  type="number"
                  value={form.weightGrams}
                  onChange={(e) => set("weightGrams", e.target.value)}
                  placeholder="8"
                  min="0"
                  step="0.1"
                  className={inputCls}
                />
              </Field>
              <Field label="Sort Order">
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  min="0"
                  className={inputCls}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── Images & Media ───────────────────────────────────────────── */}
          <SectionCard
            id="media"
            icon="⊟"
            title="Images & Media"
            badge={`${imageSlots.length}/${MAX_IMAGES}`}
          >
            <p className="text-xs text-gray-400 mb-4">
              First image is the main product photo. Drag to reorder.
            </p>
            <ImageUploadSection slots={imageSlots} onChange={setImageSlots} />
            <div className="border-t border-gray-50 mt-6 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SingleImageUpload
                label="Offer Banner"
                hint="Promotional banner · 1200×400px recommended"
                state={offerBannerState}
                onChange={setOfferBannerState}
              />
              <SingleImageUpload
                label="Size Chart"
                hint="Size guide image · 800×600px recommended"
                state={sizeChartState}
                onChange={setSizeChartState}
              />
            </div>
          </SectionCard>

          {/* ── Options ──────────────────────────────────────────────────── */}
          <SectionCard
            id="options"
            icon="⊞"
            title="Options"
            action={
              <button
                onClick={addOption}
                className="text-xs text-amber-600 border border-amber-200 hover:border-amber-300 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                + Add option
              </button>
            }
          >
            <p className="text-xs text-gray-400 mb-4">
              Define product option axes (e.g. Size, Metal). Comma-separate
              values. Then generate variants below.
            </p>
            {options.length === 0 ? (
              <div className="text-center py-8 text-gray-300 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                No options yet — click "Add option" to get started
              </div>
            ) : (
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[140px_1fr_auto] gap-3 items-center p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <input
                      value={opt.name}
                      onChange={(e) => updateOptionName(i, e.target.value)}
                      placeholder="e.g. Size"
                      className={inputCls}
                    />
                    <div>
                      <input
                        value={opt.values.join(", ")}
                        onChange={(e) => updateOptionValues(i, e.target.value)}
                        placeholder='e.g. 16", 18", 20"'
                        className={inputCls}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Comma-separated values
                      </p>
                    </div>
                    <button
                      onClick={() => removeOption(i)}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {options.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {cartesian(options).length} combination
                  {cartesian(options).length !== 1 ? "s" : ""} will be generated
                </p>
                <button
                  onClick={generateVariants}
                  className="text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm shadow-amber-200"
                >
                  Generate variants →
                </button>
              </div>
            )}
          </SectionCard>

          {/* ── Variants ─────────────────────────────────────────────────── */}
          <SectionCard
            id="variants"
            icon="◧"
            title="Variants"
            badge={variants.length ? `${variants.length}` : undefined}
          >
            {variants.length === 0 ? (
              <div className="text-center py-10 text-gray-300 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-2xl mb-2">◧</p>
                No variants yet — define options above and click "Generate
                variants"
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((v, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border-2 transition-colors overflow-hidden ${
                      v.isDefault
                        ? "border-amber-300 shadow-sm shadow-amber-100"
                        : "border-gray-100"
                    }`}
                  >
                    {/* Variant header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {v.isDefault && (
                          <span className="text-[10px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full tracking-wide">
                            Default
                          </span>
                        )}
                        <span className="text-sm font-semibold text-gray-700">
                          {v.title ||
                            Object.values(v.options).join(" / ") ||
                            `Variant ${i + 1}`}
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {Object.entries(v.options).map(([k, val]) => (
                            <span
                              key={k}
                              className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full"
                            >
                              {k}: {val}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!v.isDefault && (
                          <button
                            onClick={() => setDefaultVariant(i)}
                            className="text-xs text-amber-600 border border-amber-200 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Set default
                          </button>
                        )}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={v.isActive}
                            onChange={(e) =>
                              updateVariant(i, "isActive", e.target.checked)
                            }
                            className="w-3.5 h-3.5 accent-emerald-500"
                          />
                          <span className="text-xs text-gray-500">Active</span>
                        </label>
                        <button
                          onClick={() => removeVariant(i)}
                          className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Variant fields */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <Field label="Price (₹)" required>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(i, "price", e.target.value)
                          }
                          placeholder="8999"
                          min="0"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Original Price (₹)">
                        <input
                          type="number"
                          value={v.originalPrice}
                          onChange={(e) =>
                            updateVariant(i, "originalPrice", e.target.value)
                          }
                          placeholder="—"
                          min="0"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Stock" hint="Blank = unlimited">
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(i, "stock", e.target.value)
                          }
                          placeholder="—"
                          min="0"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Weight (g)">
                        <input
                          type="number"
                          value={v.weightGrams}
                          onChange={(e) =>
                            updateVariant(i, "weightGrams", e.target.value)
                          }
                          placeholder="8"
                          min="0"
                          step="0.1"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="SKU">
                        <input
                          value={v.sku}
                          onChange={(e) =>
                            updateVariant(i, "sku", e.target.value)
                          }
                          placeholder="RJ-CH-001-18"
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </Field>
                      <Field label="Barcode">
                        <input
                          value={v.barcode}
                          onChange={(e) =>
                            updateVariant(i, "barcode", e.target.value)
                          }
                          placeholder="123456789"
                          className={`${inputCls} font-mono text-xs`}
                        />
                      </Field>
                    </div>

                    {/* Variant images */}
                    <div className="px-4 pb-4">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Variant Images
                      </p>
                      <ImageUploadSection
                        slots={v.images}
                        onChange={(slots) => updateVariant(i, "images", slots)}
                        maxImages={5}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Content ──────────────────────────────────────────────────── */}
          <SectionCard id="content" icon="≡" title="Content">
            <div className="space-y-4">
              <Field label="Short Description" hint="Max 300 characters">
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => set("shortDescription", e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Brief product summary…"
                  className={`${inputCls} resize-none`}
                />
                <p className="text-right text-[10px] text-gray-300">
                  {form.shortDescription.length}/300
                </p>
              </Field>
              <Field label="Long Description">
                <textarea
                  value={form.longDescription}
                  onChange={(e) => set("longDescription", e.target.value)}
                  rows={4}
                  placeholder="Detailed product description…"
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <Field label="Our Promise" required>
                <textarea
                  value={form.ourPromise}
                  onChange={(e) => set("ourPromise", e.target.value)}
                  rows={3}
                  placeholder="e.g. We stand behind every piece we sell. 30-day returns, no questions asked."
                  className={`${inputCls} resize-none border-amber-200 bg-amber-50/40 focus:border-amber-400 focus:ring-amber-100`}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── Specifications ───────────────────────────────────────────── */}
          <SectionCard
            id="specs"
            icon="⊕"
            title="Specifications"
            action={
              <button
                onClick={() =>
                  setSpecs((s) => [...s, { key: "", value: "", icon: "" }])
                }
                className="text-xs text-amber-600 border border-amber-200 hover:border-amber-300 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                + Add row
              </button>
            }
          >
            <div className="space-y-2">
              {specs.map((spec, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_2fr_48px_auto] gap-2 items-center"
                >
                  <input
                    value={spec.key}
                    onChange={(e) => {
                      const n = [...specs];
                      n[i] = { ...n[i], key: e.target.value };
                      setSpecs(n);
                    }}
                    placeholder="Metal"
                    className={inputCls}
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => {
                      const n = [...specs];
                      n[i] = { ...n[i], value: e.target.value };
                      setSpecs(n);
                    }}
                    placeholder="22kt Yellow Gold"
                    className={inputCls}
                  />
                  <input
                    value={spec.icon}
                    onChange={(e) => {
                      const n = [...specs];
                      n[i] = { ...n[i], icon: e.target.value };
                      setSpecs(n);
                    }}
                    placeholder="🥇"
                    className={`${inputCls} text-center px-2`}
                  />
                  {specs.length > 1 && (
                    <button
                      onClick={() =>
                        setSpecs((s) => s.filter((_, j) => j !== i))
                      }
                      className="w-8 h-9 flex items-center justify-center text-gray-300 hover:text-red-400 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── SEO & Settings ───────────────────────────────────────────── */}
          <SectionCard id="seo" icon="◉" title="SEO & Settings">
            <div className="space-y-4">
              <Field label="SEO Title">
                <input
                  value={form.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder="Nawabi Chain | Rehnoor Jewels"
                  className={inputCls}
                />
              </Field>
              <Field label="SEO Description">
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  rows={2}
                  placeholder="Hand-crafted 22kt gold…"
                  className={`${inputCls} resize-none`}
                />
              </Field>
              <Field label="SEO Keywords" hint="Separate with commas">
                <input
                  value={form.seoKeywords}
                  onChange={(e) => set("seoKeywords", e.target.value)}
                  placeholder="gold ring, 22kt jewellery, wedding ring"
                  className={inputCls}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pb-10">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2.5 px-7 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-200"
              style={{
                background: loading
                  ? "#fbbf24"
                  : "linear-gradient(135deg,#f59e0b,#d97706)",
              }}
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
    </>
  );
}
