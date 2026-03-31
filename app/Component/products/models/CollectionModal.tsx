"use client";

import { useState, useEffect } from "react";

interface Collection {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface CollectionModalProps {
  open: boolean;
  productName: string;
  currentCollectionId?: string;
  onAssign: (collectionId: string) => Promise<void>;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CollectionModal({
  open,
  productName,
  currentCollectionId,
  onAssign,
  onClose,
}: CollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState(currentCollectionId || "");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(currentCollectionId || "");
    setFetching(true);
    const token = localStorage.getItem("admin_token") || "";
    fetch(`${API_BASE}/api/collections/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCollections(d.data || []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [open, currentCollectionId]);

  if (!open) return null;

  const handleAssign = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await onAssign(selected);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ animation: "fadeUp 0.2s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">
              Assign to collection
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">
              {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Collections list */}
        <div className="p-4 max-h-72 overflow-y-auto">
          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin w-5 h-5 text-amber-500"
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
          ) : collections.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No collections found
            </p>
          ) : (
            <div className="space-y-2">
              {collections.map((col) => (
                <label
                  key={col._id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected === col._id
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="collection"
                    value={col._id}
                    checked={selected === col._id}
                    onChange={() => setSelected(col._id)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {col.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {col.productCount} products · /{col.slug}
                    </p>
                  </div>
                  {col._id === currentCollectionId && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-all disabled:opacity-40 cursor-pointer"
          >
            {loading ? "Saving…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
