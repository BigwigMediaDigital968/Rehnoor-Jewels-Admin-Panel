// app/(admin)/admin/category-management/page.tsx
// Full Category Management Admin Panel for Rehnoor Jewels
// Features: Create/Edit/Delete Category, SubCategory CRUD,
//           Status toggle (active/inactive), Product assignment,
//           Search, Sort, Pagination

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Image as ImageIcon,
  Tag,
  Layers,
  Package,
  AlertTriangle,
  Loader2,
  FolderOpen,
  RefreshCw,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: { url: string; publicId: string };
  status: "active" | "inactive";
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  products: {
    _id: string;
    name: string;
    price: string;
    images: { src: string }[];
  }[];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: { url: string; publicId: string };
  bannerImage: { url: string; publicId: string };
  status: "active" | "inactive";
  sortOrder: number;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  subCategories: SubCategory[];
  products: {
    _id: string;
    name: string;
    price: string;
    images: { src: string }[];
  }[];
  totalProductCount: number;
}

interface Product {
  _id: string;
  name: string;
  price: string;
  images: { src: string }[];
  slug: string;
}

// ─── Auth Token ───────────────────────────────────────────────────────────────
function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("admin_token") || ""
    : "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl"
      style={{
        background: type === "success" ? "#003720" : "#fef2f2",
        border: `1px solid ${
          type === "success" ? "rgba(252,193,81,0.3)" : "#fca5a5"
        }`,
        color: type === "success" ? "#FCC151" : "#ef4444",
        minWidth: 260,
        animation: "slideUp 0.25s ease",
      }}
    >
      {type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span className="font-cinzel text-[11px] tracking-wider">{msg}</span>
      <button
        onClick={onClose}
        className="ml-auto"
        style={{ cursor: "pointer" }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full mx-4"
        style={{ background: "#fff", border: "1px solid #e8e0d5" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={20} style={{ color: "#ef4444" }} />
          <p
            className="font-cinzel text-sm font-bold"
            style={{ color: "#1a1a1a" }}
          >
            Confirm Delete
          </p>
        </div>
        <p
          className="text-sm mb-6"
          style={{
            color: "#6b6b6b",
            fontFamily: "var(--font-body,'DM Sans'),sans-serif",
          }}
        >
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase"
            style={{
              border: "1.5px solid #e8e0d5",
              color: "#6b6b6b",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase font-bold"
            style={{ background: "#ef4444", color: "#fff", cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Category / SubCategory Form Modal ───────────────────────────────────────
function CategoryFormModal({
  mode,
  type,
  initial,
  categoryId,
  onClose,
  onSaved,
  showToast,
}: {
  mode: "create" | "edit";
  type: "category" | "subcategory";
  initial?: Partial<Category & SubCategory>;
  categoryId?: string;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, t: "success" | "error") => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState<"active" | "inactive">(
    initial?.status || "active",
  );
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isFeatured, setIsFeatured] = useState(
    (initial as Category)?.isFeatured || false,
  );
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription || "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initial?.image?.url || "");
  const [bannerPreview, setBannerPreview] = useState(
    (initial as Category)?.bannerImage?.url || "",
  );
  const [saving, setSaving] = useState(false);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    which: "image" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === "image") {
      setImageFile(file);
      setImagePreview(url);
    } else {
      setBannerFile(file);
      setBannerPreview(url);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    setSaving(true);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("description", description);
    fd.append("status", status);
    fd.append("sortOrder", sortOrder);
    fd.append("metaTitle", metaTitle);
    fd.append("metaDescription", metaDescription);
    if (type === "category") fd.append("isFeatured", String(isFeatured));
    if (imageFile) fd.append("image", imageFile);
    if (bannerFile && type === "category") fd.append("bannerImage", bannerFile);

    try {
      let url = "";
      let method = "POST";

      if (type === "category") {
        url =
          mode === "create"
            ? `${API}/api/admin/categories`
            : `${API}/api/admin/categories/${initial?._id}`;
        method = mode === "create" ? "POST" : "PUT";
      } else {
        url =
          mode === "create"
            ? `${API}/api/admin/categories/${categoryId}/subcategories`
            : `${API}/api/admin/categories/${categoryId}/subcategories/${initial?._id}`;
        method = mode === "create" ? "POST" : "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed");

      showToast(data.message || "Saved successfully", "success");
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.9rem",
    border: "1px solid #e8e0d5",
    borderRadius: 10,
    fontFamily: "var(--font-body,'DM Sans'),sans-serif",
    fontSize: "0.875rem",
    color: "#1a1a1a",
    outline: "none",
    background: "#fdfaf6",
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#fff", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: "#003720",
            borderBottom: "1px solid rgba(252,193,81,0.2)",
          }}
        >
          <div>
            <p
              className="font-cinzel text-[9px] tracking-widest uppercase"
              style={{ color: "rgba(252,193,81,0.6)" }}
            >
              {mode === "create" ? "New" : "Edit"}{" "}
              {type === "category" ? "Category" : "Sub-Category"}
            </p>
            <h2 className="font-cormorant text-xl font-light text-white">
              {mode === "create"
                ? `Add ${type === "category" ? "Category" : "Sub-Category"}`
                : `Edit: ${initial?.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          {/* Name + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5 block"
                style={{ color: "#003720" }}
              >
                Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chains"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5 block"
                style={{ color: "#003720" }}
              >
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "active" | "inactive")
                }
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5 block"
              style={{ color: "#003720" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Sort Order + Featured (category only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5 block"
                style={{ color: "#003720" }}
              >
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={inputStyle}
              />
            </div>
            {type === "category" && (
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    style={{
                      accentColor: "#003720",
                      width: 16,
                      height: 16,
                      cursor: "pointer",
                    }}
                  />
                  <span
                    className="font-cinzel text-[10px] tracking-wider"
                    style={{ color: "#1a1a1a" }}
                  >
                    Featured on Homepage
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div
            className={`grid gap-4 ${
              type === "category" ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div>
              <label
                className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5 block"
                style={{ color: "#003720" }}
              >
                Image
              </label>
              <label
                className="flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all"
                style={{
                  border: "2px dashed #e8e0d5",
                  background: "#fdfaf6",
                  minHeight: 100,
                  padding: "1rem",
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <ImageIcon size={24} style={{ color: "#c8b89a" }} />
                    <span
                      className="font-cinzel text-[9px] tracking-wider mt-2"
                      style={{ color: "#c8b89a" }}
                    >
                      Click to upload
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, "image")}
                />
              </label>
            </div>
            {type === "category" && (
              <div>
                <label
                  className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5 block"
                  style={{ color: "#003720" }}
                >
                  Banner Image
                </label>
                <label
                  className="flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all"
                  style={{
                    border: "2px dashed #e8e0d5",
                    background: "#fdfaf6",
                    minHeight: 100,
                    padding: "1rem",
                  }}
                >
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="banner"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <ImageIcon size={24} style={{ color: "#c8b89a" }} />
                      <span
                        className="font-cinzel text-[9px] tracking-wider mt-2"
                        style={{ color: "#c8b89a" }}
                      >
                        Click to upload banner
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "banner")}
                  />
                </label>
              </div>
            )}
          </div>

          {/* SEO */}
          <div style={{ borderTop: "1px solid #f0ebe3", paddingTop: "1rem" }}>
            <p
              className="font-cinzel text-[9px] tracking-widest uppercase mb-3"
              style={{ color: "#003720" }}
            >
              SEO (Optional)
            </p>
            <div className="flex flex-col gap-3">
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Meta Title"
                style={inputStyle}
              />
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder="Meta Description"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{ borderTop: "1px solid #f0ebe3" }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase"
            style={{
              border: "1.5px solid #e8e0d5",
              color: "#6b6b6b",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase font-bold flex items-center justify-center gap-2"
            style={{
              background: "#003720",
              color: "#FCC151",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            ) : (
              `Save ${type === "category" ? "Category" : "Sub-Category"}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Assign Modal ─────────────────────────────────────────────────────
function AssignProductsModal({
  categoryId,
  subCategoryId,
  assigned,
  onClose,
  onSaved,
  showToast,
}: {
  categoryId: string;
  subCategoryId?: string;
  assigned: string[];
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, t: "success" | "error") => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([...assigned]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/products/admin/all?limit=200`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setProducts(d.data || d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toAdd = selected.filter((id) => !assigned.includes(id));
      const toRemove = assigned.filter((id) => !selected.includes(id));

      const base = subCategoryId
        ? `${API}/api/admin/categories/${categoryId}/subcategories/${subCategoryId}/products`
        : `${API}/api/admin/categories/${categoryId}/products`;

      if (toAdd.length > 0) {
        await fetch(base, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: toAdd }),
        });
      }
      for (const id of toRemove) {
        await fetch(`${base}/${id}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
      }

      showToast("Products updated successfully", "success");
      onSaved();
      onClose();
    } catch {
      showToast("Failed to update products", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#fff", maxHeight: "85vh" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: "#003720" }}
        >
          <h2 className="font-cormorant text-xl font-light text-white">
            Assign Products
          </h2>
          <button
            onClick={onClose}
            style={{ color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4" style={{ borderBottom: "1px solid #f0ebe3" }}>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#c8b89a" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid #e8e0d5",
                background: "#fdfaf6",
                fontFamily: "var(--font-body,'DM Sans'),sans-serif",
              }}
            />
          </div>
          <p
            className="font-cinzel text-[9px] tracking-wider mt-2"
            style={{ color: "#a0856e" }}
          >
            {selected.length} selected
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2
                size={20}
                className="animate-spin"
                style={{ color: "#003720" }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((p) => (
                <label
                  key={p._id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: `1px solid ${
                      selected.includes(p._id) ? "#003720" : "#e8e0d5"
                    }`,
                    background: selected.includes(p._id)
                      ? "rgba(0,55,32,0.04)"
                      : "#fff",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p._id)}
                    onChange={() => toggle(p._id)}
                    style={{
                      accentColor: "#003720",
                      width: 15,
                      height: 15,
                      cursor: "pointer",
                    }}
                  />
                  {p.images?.[0]?.src && (
                    <img
                      src={p.images[0].src}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-cinzel text-[10px] font-bold truncate"
                      style={{ color: "#1a1a1a" }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="font-cinzel text-[9px]"
                      style={{ color: "#003720" }}
                    >
                      {p.price}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div
          className="flex gap-3 p-4"
          style={{ borderTop: "1px solid #f0ebe3" }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase"
            style={{
              border: "1.5px solid #e8e0d5",
              color: "#6b6b6b",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase font-bold flex items-center justify-center gap-2"
            style={{
              background: "#003720",
              color: "#FCC151",
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Saving…
              </>
            ) : (
              "Save Assignment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Category Row ─────────────────────────────────────────────────────────
function SubCategoryRow({
  sub,
  categoryId,
  onEdit,
  onDelete,
  onToggleStatus,
  onAssignProducts,
}: {
  sub: SubCategory;
  categoryId: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onAssignProducts: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "rgba(0,55,32,0.03)",
        border: "1px solid rgba(0,55,32,0.08)",
      }}
    >
      {sub.image?.url ? (
        <img
          src={sub.image.url}
          alt={sub.name}
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,55,32,0.06)" }}
        >
          <Tag size={14} style={{ color: "#003720" }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className="font-cinzel text-[10px] font-bold truncate"
          style={{ color: "#1a1a1a" }}
        >
          {sub.name}
        </p>
        <p
          className="font-cinzel text-[8px] tracking-wider"
          style={{ color: "#a0856e" }}
        >
          {sub.products?.length || 0} products · /{sub.slug}
        </p>
      </div>

      {/* Status Badge */}
      <span
        className="font-cinzel text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background:
            sub.status === "active"
              ? "rgba(0,55,32,0.1)"
              : "rgba(239,68,68,0.08)",
          color: sub.status === "active" ? "#003720" : "#ef4444",
        }}
      >
        {sub.status}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onToggleStatus}
          title={`Mark as ${sub.status === "active" ? "inactive" : "active"}`}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "rgba(0,55,32,0.06)", cursor: "pointer" }}
        >
          {sub.status === "active" ? (
            <ToggleRight size={13} style={{ color: "#003720" }} />
          ) : (
            <ToggleLeft size={13} style={{ color: "#ef4444" }} />
          )}
        </button>
        <button
          onClick={onAssignProducts}
          title="Assign Products"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "rgba(252,193,81,0.1)", cursor: "pointer" }}
        >
          <Package size={13} style={{ color: "#a07800" }} />
        </button>
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "rgba(0,55,32,0.06)", cursor: "pointer" }}
        >
          <Pencil size={12} style={{ color: "#003720" }} />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "rgba(239,68,68,0.06)", cursor: "pointer" }}
        >
          <Trash2 size={12} style={{ color: "#ef4444" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddSubCat,
  onEditSubCat,
  onDeleteSubCat,
  onToggleSubCatStatus,
  onAssignProductsCat,
  onAssignProductsSubCat,
}: {
  cat: Category;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onAddSubCat: () => void;
  onEditSubCat: (sub: SubCategory) => void;
  onDeleteSubCat: (sub: SubCategory) => void;
  onToggleSubCatStatus: (sub: SubCategory) => void;
  onAssignProductsCat: () => void;
  onAssignProductsSubCat: (sub: SubCategory) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  console.log(cat);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        border: "1px solid #e8e0d5",
        background: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      {/* Category Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Thumbnail */}
        {cat.image?.url ? (
          <img
            src={cat.image.url}
            alt={cat.name}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,55,32,0.08)" }}
          >
            <Layers size={20} style={{ color: "#003720" }} />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-cinzel text-sm font-bold"
              style={{ color: "#1a1a1a" }}
            >
              {cat.name}
            </h3>
            {cat.isFeatured && (
              <span
                className="font-cinzel text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(252,193,81,0.15)",
                  color: "#a07800",
                }}
              >
                Featured
              </span>
            )}
            <span
              className="font-cinzel text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{
                background:
                  cat.status === "active"
                    ? "rgba(0,55,32,0.08)"
                    : "rgba(239,68,68,0.08)",
                color: cat.status === "active" ? "#003720" : "#ef4444",
              }}
            >
              {cat.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span
              className="font-cinzel text-[9px] tracking-wider"
              style={{ color: "#a0856e" }}
            >
              /{cat.slug}
            </span>
            <span
              className="font-cinzel text-[9px] tracking-wider"
              style={{ color: "#a0856e" }}
            >
              {cat.subCategories?.length || 0} sub-cats
            </span>
            <span
              className="font-cinzel text-[9px] tracking-wider"
              style={{ color: "#a0856e" }}
            >
              {cat.totalProductCount || 0} products
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleStatus}
            title="Toggle Status"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: "rgba(0,55,32,0.06)", cursor: "pointer" }}
          >
            {cat.status === "active" ? (
              <ToggleRight size={16} style={{ color: "#003720" }} />
            ) : (
              <ToggleLeft size={16} style={{ color: "#ef4444" }} />
            )}
          </button>
          <button
            onClick={onAssignProductsCat}
            title="Assign Products"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: "rgba(252,193,81,0.1)", cursor: "pointer" }}
          >
            <Package size={14} style={{ color: "#a07800" }} />
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: "rgba(0,55,32,0.06)", cursor: "pointer" }}
          >
            <Pencil size={14} style={{ color: "#003720" }} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: "rgba(239,68,68,0.06)", cursor: "pointer" }}
          >
            <Trash2 size={14} style={{ color: "#ef4444" }} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(0,55,32,0.06)", cursor: "pointer" }}
          >
            <ChevronDown
              size={14}
              style={{
                color: "#003720",
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>
        </div>
      </div>

      {/* Sub-Categories Panel */}
      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid #f0ebe3" }}>
          <div className="flex items-center justify-between py-3">
            <p
              className="font-cinzel text-[9px] tracking-widest uppercase font-bold"
              style={{ color: "#003720" }}
            >
              Sub-Categories ({cat.subCategories?.length || 0})
            </p>
            <button
              onClick={onAddSubCat}
              className="flex items-center gap-1.5 font-cinzel text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{
                background: "#003720",
                color: "#FCC151",
                cursor: "pointer",
              }}
            >
              <Plus size={11} /> Add Sub-Category
            </button>
          </div>

          {cat.subCategories?.length === 0 ? (
            <div
              className="flex flex-col items-center py-6 rounded-xl"
              style={{
                background: "rgba(0,55,32,0.03)",
                border: "1px dashed rgba(0,55,32,0.12)",
              }}
            >
              <FolderOpen size={24} style={{ color: "#c8b89a" }} />
              <p
                className="font-cinzel text-[9px] tracking-wider mt-2"
                style={{ color: "#c8b89a" }}
              >
                No sub-categories yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cat.subCategories.map((sub) => (
                <SubCategoryRow
                  key={sub._id}
                  sub={sub}
                  categoryId={cat._id}
                  onEdit={() => onEditSubCat(sub)}
                  onDelete={() => onDeleteSubCat(sub)}
                  onToggleStatus={() => onToggleSubCatStatus(sub)}
                  onAssignProducts={() => onAssignProductsSubCat(sub)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Modals
  const [catFormModal, setCatFormModal] = useState<{
    mode: "create" | "edit";
    initial?: Category;
  } | null>(null);

  const [subCatFormModal, setSubCatFormModal] = useState<{
    mode: "create" | "edit";
    categoryId: string;
    initial?: SubCategory;
  } | null>(null);

  const [assignModal, setAssignModal] = useState<{
    categoryId: string;
    subCategoryId?: string;
    assigned: string[];
  } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${API}/api/admin/categories?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setCategories(data.data || []);
    } catch {
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  console.log(categories);

  // ── Toggle Status ──
  const toggleCategoryStatus = async (cat: Category) => {
    try {
      const res = await fetch(`${API}/api/admin/categories/${cat._id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message, "success");
      fetchCategories();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const toggleSubCategoryStatus = async (catId: string, sub: SubCategory) => {
    try {
      const res = await fetch(
        `${API}/api/admin/categories/${catId}/subcategories/${sub._id}/status`,
        {
          method: "PATCH",
          headers: authHeaders(),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message, "success");
      fetchCategories();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // ── Delete ──
  const deleteCategory = (cat: Category) => {
    setConfirm({
      message: `Delete category "${cat.name}"? This will also delete all its sub-categories and cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(`${API}/api/admin/categories/${cat._id}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          showToast(data.message, "success");
          fetchCategories();
        } catch (err: any) {
          showToast(err.message, "error");
        }
      },
    });
  };

  const deleteSubCategory = (catId: string, sub: SubCategory) => {
    setConfirm({
      message: `Delete sub-category "${sub.name}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          const res = await fetch(
            `${API}/api/admin/categories/${catId}/subcategories/${sub._id}`,
            {
              method: "DELETE",
              headers: authHeaders(),
            },
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          showToast(data.message, "success");
          fetchCategories();
        } catch (err: any) {
          showToast(err.message, "error");
        }
      },
    });
  };

  // ── Stats ──
  const totalActive = categories.filter((c) => c.status === "active").length;
  const totalProducts = categories.reduce(
    (a, c) => a + (c.totalProductCount || 0),
    0,
  );
  const totalSubCats = categories.reduce(
    (a, c) => a + (c.subCategories?.length || 0),
    0,
  );

  return (
    <div style={{ background: "#fdfaf6", minHeight: "100vh" }}>
      {/* ── Page Header ── */}
      <div
        className="px-6 py-6"
        style={{ background: "#fff", borderBottom: "1px solid #f0ebe3" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p
              className="font-cinzel text-[9px] tracking-widest uppercase"
              style={{ color: "rgba(0,55,32,0.5)" }}
            >
              Admin Panel
            </p>
            <h1
              className="font-cormorant text-2xl font-light"
              style={{ color: "#1a1a1a", letterSpacing: "-0.01em" }}
            >
              Category Management
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchCategories}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
              style={{ background: "rgba(0,55,32,0.06)", cursor: "pointer" }}
            >
              <RefreshCw size={14} style={{ color: "#003720" }} />
            </button>
            <button
              onClick={() => setCatFormModal({ mode: "create" })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase font-bold transition-all hover:opacity-90"
              style={{
                background: "#003720",
                color: "#FCC151",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> New Category
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Categories",
              value: categories.length,
              color: "#003720",
            },
            { label: "Active", value: totalActive, color: "#003720" },
            { label: "Sub-Categories", value: totalSubCats, color: "#a07800" },
            { label: "Total Products", value: totalProducts, color: "#a07800" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{ background: "#fff", border: "1px solid #f0ebe3" }}
            >
              <p
                className="font-cinzel text-[8px] tracking-widest uppercase mb-1"
                style={{ color: "#a0856e" }}
              >
                {s.label}
              </p>
              <p
                className="font-cormorant text-3xl font-light"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#c8b89a" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                border: "1px solid #e8e0d5",
                background: "#fff",
                fontFamily: "var(--font-body,'DM Sans'),sans-serif",
                color: "#1a1a1a",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl font-cinzel text-[10px] tracking-wider outline-none"
            style={{
              border: "1px solid #e8e0d5",
              background: "#fff",
              color: "#1a1a1a",
              cursor: "pointer",
              minWidth: 140,
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* ── Category List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={28}
                className="animate-spin"
                style={{ color: "#003720" }}
              />
              <p
                className="font-cinzel text-[10px] tracking-widest"
                style={{ color: "#a0856e" }}
              >
                Loading categories…
              </p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div
            className="flex flex-col items-center py-20 rounded-2xl"
            style={{ background: "#fff", border: "1px dashed #e8e0d5" }}
          >
            <Layers size={40} style={{ color: "#e8e0d5" }} />
            <p
              className="font-cormorant text-2xl font-light mt-4"
              style={{ color: "#c8b89a" }}
            >
              No categories found
            </p>
            <p
              className="font-cinzel text-[9px] tracking-wider mt-1"
              style={{ color: "#c8b89a" }}
            >
              {search || statusFilter
                ? "Try adjusting your filters"
                : "Create your first category to get started"}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => setCatFormModal({ mode: "create" })}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-full font-cinzel text-[10px] tracking-widest uppercase font-bold"
                style={{
                  background: "#003720",
                  color: "#FCC151",
                  cursor: "pointer",
                }}
              >
                <Plus size={13} /> Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {categories.map((cat) => (
              <CategoryCard
                key={cat._id}
                cat={cat}
                onEdit={() => setCatFormModal({ mode: "edit", initial: cat })}
                onDelete={() => deleteCategory(cat)}
                onToggleStatus={() => toggleCategoryStatus(cat)}
                onAddSubCat={() =>
                  setSubCatFormModal({ mode: "create", categoryId: cat._id })
                }
                onEditSubCat={(sub) =>
                  setSubCatFormModal({
                    mode: "edit",
                    categoryId: cat._id,
                    initial: sub,
                  })
                }
                onDeleteSubCat={(sub) => deleteSubCategory(cat._id, sub)}
                onToggleSubCatStatus={(sub) =>
                  toggleSubCategoryStatus(cat._id, sub)
                }
                onAssignProductsCat={() =>
                  setAssignModal({
                    categoryId: cat._id,
                    assigned: cat.products?.map((p) => p._id) || [],
                  })
                }
                onAssignProductsSubCat={(sub) =>
                  setAssignModal({
                    categoryId: cat._id,
                    subCategoryId: sub._id,
                    assigned: sub.products?.map((p) => p._id) || [],
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {catFormModal && (
        <CategoryFormModal
          mode={catFormModal.mode}
          type="category"
          initial={catFormModal.initial}
          onClose={() => setCatFormModal(null)}
          onSaved={fetchCategories}
          showToast={showToast}
        />
      )}

      {subCatFormModal && (
        <CategoryFormModal
          mode={subCatFormModal.mode}
          type="subcategory"
          initial={subCatFormModal.initial}
          categoryId={subCatFormModal.categoryId}
          onClose={() => setSubCatFormModal(null)}
          onSaved={fetchCategories}
          showToast={showToast}
        />
      )}

      {assignModal && (
        <AssignProductsModal
          categoryId={assignModal.categoryId}
          subCategoryId={assignModal.subCategoryId}
          assigned={assignModal.assigned}
          onClose={() => setAssignModal(null)}
          onSaved={fetchCategories}
          showToast={showToast}
        />
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
