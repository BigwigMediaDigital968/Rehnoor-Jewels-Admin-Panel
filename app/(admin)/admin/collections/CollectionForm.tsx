"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ProductPicker,
  ProductDetailModal,
  API_BASE,
  authHeaders,
  authOnlyHeaders,
  EMPTY_FORM,
  TAGS,
  PURITIES,
  btnPrimary,
  btnOutline,
  type Collection,
  type ProductSummary,
} from "./CollectionManagement";

import SortSelect from "./SortSelect";

const LIST_URL = "/admin/collections";

// ─── Collection Form (full page) ──────────────────────────────────────────────

function CollectionFormInner({
  mode,
  initial,
}: {
  mode: "add" | "edit";
  initial?: Collection;
}) {
  const router = useRouter();
  const [productPopup, setProductPopup] = useState<ProductSummary | null>(null);
  const onClose = () => router.push(LIST_URL);
  const onViewProduct = (p: ProductSummary) => setProductPopup(p);
  const onSuccess = (msg: string) => {
    sessionStorage.setItem("cm_flash", msg);
    router.push(LIST_URL);
  };

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial
      ? {
          name: initial.name,
          slug: initial.slug,
          label: initial.label,
          tagline: initial.tagline,
          description: initial.description,
          heroImage: initial.heroImage,
          accentColor: initial.accentColor,
          tag: initial.tag,
          purity: initial.purity,
          breadcrumb: initial.breadcrumb?.join(", ") || "",
          seoTitle: initial.seoTitle,
          seoDescription: initial.seoDescription,
          seoKeywords: initial.seoKeywords?.join(", ") || "",
          isActive: initial.isActive,
          sortOrder: String(initial.sortOrder ?? 0),
          productSort: initial.productSort ?? "manual",
        }
      : {}),
  });
  // ✅ FIXED
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initial?.products?.map((p) => (typeof p === "string" ? p : p._id)) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState(initial?.heroImage || "");
  const heroInputRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<
    "identity" | "display" | "products" | "seo" | "settings"
  >("identity");


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
  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.label.trim()) {
      setError("Name, slug and label are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      (
        [
          "name",
          "slug",
          "label",
          "tagline",
          "description",
          "accentColor",
          "tag",
          "purity",
          "seoTitle",
          "seoDescription",
          "sortOrder",
          "productSort",
        ] as const
      ).forEach((k) => fd.append(k, String(form[k])));
      fd.append("isActive", String(form.isActive));
      // fd.append(
      //   "breadcrumb",
      //   JSON.stringify(
      //     form.breadcrumb
      //       .split(",")
      //       .map((s) => s.trim())
      //       .filter(Boolean),
      //   ),
      // );
      fd.append(
        "seoKeywords",
        JSON.stringify(
          form.seoKeywords
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      );
      fd.append("products", JSON.stringify(selectedProductIds));
      if (heroFile) fd.append("heroImage", heroFile);
      const url =
        mode === "edit"
          ? `${API_BASE}/api/collections/admin/${initial!._id}`
          : `${API_BASE}/api/collections/admin/create`;
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: authOnlyHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSuccess(
        mode === "edit" ? `"${form.name}" updated.` : `"${form.name}" created.`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inp =
    "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white";
  const lbl =
    "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider";
  const TABS = [
    { id: "identity" as const, label: "Identity" },
    { id: "display" as const, label: "Display" },
    {
      id: "products" as const,
      label: `Products${
        selectedProductIds.length ? ` (${selectedProductIds.length})` : ""
      }`,
    },
    { id: "seo" as const, label: "SEO" },
    { id: "settings" as const, label: "Settings" },
  ];

  return (
    <div style={{ padding: "24px 28px", width: "100%" }}>
      {productPopup && (
        <ProductDetailModal
          product={productPopup}
          onClose={() => setProductPopup(null)}
        />
      )}

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "#8B7355",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          &#8592; Back to collections
        </button>
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
          Admin / Collections / {mode === "add" ? "New" : "Edit"}
        </p>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1a1a1a",
            margin: "3px 0 0",
          }}
        >
          {mode === "add" ? "Create Collection" : `Editing "${initial?.name}"`}
        </h1>
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
        <div
          style={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            padding: "0 24px",
            borderBottom: "1px solid #F0EBE0",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 12,
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? "#D4A017" : "#888",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: `2px solid ${
                  tab === t.id ? "#D4A017" : "transparent"
                }`,
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "24px" }}>
          {error && (
            <div
              style={{
                background: "#FFF0F0",
                border: "1px solid #FFCDD2",
                color: "#c0392b",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
                  fontSize: 16,
                }}
              >
                &#10005;
              </button>
            </div>
          )}

          {tab === "identity" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}>Collection Name *</label>
                <input
                  className={inp}
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Bridal Gold"
                />
              </div>
              <div>
                <label className={lbl}>Slug *</label>
                <input
                  className={`${inp} font-mono text-xs`}
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="bridal-gold"
                />
              </div>
              <div>
                <label className={lbl}>
                  Label *{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                      color: "#aaa",
                    }}
                  >
                    (display name)
                  </span>
                </label>
                <input
                  className={inp}
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                  placeholder="Bridal Collection"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Tagline</label>
                <input
                  className={inp}
                  value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="Crafted for your most precious moments"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Description</label>
                <textarea
                  className={inp}
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Collection description..."
                  style={{ resize: "none" }}
                />
              </div>
            </div>
          )}

          {tab === "display" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}>Hero Image</label>
                <div
                  onClick={() => heroInputRef.current?.click()}
                  style={{
                    border: "2px dashed #E5E0D4",
                    borderRadius: 12,
                    padding: 16,
                    cursor: "pointer",
                    textAlign: "center",
                    background: "#FDFAF5",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#D4A017")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#E5E0D4")
                  }
                >
                  {heroPreview ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroPreview}
                        alt="Hero preview"
                        style={{
                          width: "100%",
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                      <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
                        {heroFile
                          ? heroFile.name
                          : "Current image · click to replace"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 22, margin: "0 0 4px" }}>
                        &#128444;
                      </p>
                      <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
                        Click to upload hero image
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#bbb",
                          margin: "4px 0 0",
                        }}
                      >
                        JPG, PNG, WebP · max 5 MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleHeroChange}
                  onClick={(e) => ((e.target as HTMLInputElement).value = "")}
                />
              </div>
              <div>
                <label className={lbl}>Accent Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div
                    onClick={() => colorRef.current?.click()}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: form.accentColor,
                      border: "1px solid #E5E0D4",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  />
                  <input
                    className={`${inp} font-mono text-xs flex-1`}
                    value={form.accentColor}
                    onChange={(e) => set("accentColor", e.target.value)}
                    placeholder="rgba(0,36,16,0.88)"
                  />
                  <input
                    ref={colorRef}
                    type="color"
                    style={{
                      width: 0,
                      height: 0,
                      opacity: 0,
                      position: "absolute",
                    }}
                    onChange={(e) => set("accentColor", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Tag</label>
                <select
                  className={inp}
                  value={form.tag}
                  onChange={(e) => set("tag", e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  {TAGS.map((t) => (
                    <option key={t} value={t}>
                      {t || "None"}
                    </option>
                  ))}
                </select>
              </div>
              {/* <div>
                <label className={lbl}>Purity</label>
                <select
                  className={inp}
                  value={form.purity}
                  onChange={(e) => set("purity", e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  {PURITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div> */}
              {/* <div>
                <label className={lbl}>
                  Breadcrumb{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                      color: "#aaa",
                    }}
                  >
                    (comma-separated)
                  </span>
                </label>
                <input
                  className={inp}
                  value={form.breadcrumb}
                  onChange={(e) => set("breadcrumb", e.target.value)}
                  placeholder="Home, Collections, Bridal"
                />
              </div> */}
            </div>
          )}

          {tab === "products" && (
            <div>
              <p
                style={{
                  fontSize: 13,
                  color: "#777",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                Search and select products to assign to this collection.
                Selected products will be linked when you save.
              </p>
              <ProductPicker
                sort={form.productSort}
                sortControl={
                  <SortSelect
                    value={form.productSort}
                    onChange={(v) => set("productSort", v)}
                  />
                }
                selected={selectedProductIds}
                onChange={setSelectedProductIds}
                onViewProduct={onViewProduct}
                initialProducts={(initial?.products ?? []).filter(
                  (p): p is ProductSummary => typeof p !== "string",
                )}
              />
            </div>
          )}

          {tab === "seo" && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={lbl}>SEO Title</label>
                <input
                  className={inp}
                  value={form.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder="Bridal Gold | Rehnoor Jewels"
                />
              </div>
              <div>
                <label className={lbl}>SEO Description</label>
                <textarea
                  className={inp}
                  rows={2}
                  value={form.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  placeholder="Exquisite bridal gold jewellery..."
                  style={{ resize: "none" }}
                />
              </div>
              <div>
                <label className={lbl}>
                  SEO Keywords{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                      color: "#aaa",
                    }}
                  >
                    (comma-separated)
                  </span>
                </label>
                <input
                  className={inp}
                  value={form.seoKeywords}
                  onChange={(e) => set("seoKeywords", e.target.value)}
                  placeholder="bridal gold, wedding jewellery"
                />
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Sort Order</label>
                <input
                  type="number"
                  className={inp}
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  paddingBottom: 2,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => set("isActive", e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: "#10b981",
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#444" }}>
                    Active (visible to customers)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #F0EBE0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#FDFAF5",
          }}
        >
          <span style={{ fontSize: 12, color: "#aaa" }}>
            {selectedProductIds.length > 0
              ? `${selectedProductIds.length} product${
                  selectedProductIds.length !== 1 ? "s" : ""
                } selected`
              : "No products assigned yet"}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{ ...btnOutline, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...btnPrimary,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading
                ? "Saving..."
                : mode === "add"
                ? "Create Collection"
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page entry: loads the collection when editing ────────────────────────────

export default function CollectionForm({
  mode,
  collectionId,
}: {
  mode: "add" | "edit";
  collectionId?: string;
}) {
  const [initial, setInitial] = useState<Collection | undefined>();
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !collectionId) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/collections/admin/${collectionId}`,
          { headers: authHeaders() },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load collection");
        setInitial(data.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load collection");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, collectionId]);

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: "#999", fontSize: 14 }}>
        Loading collection...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: "24px 28px", color: "#c0392b", fontSize: 14 }}>
        &#9888; {error}
      </div>
    );
  }
  return <CollectionFormInner mode={mode} initial={initial} />;
}
