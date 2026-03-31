"use client";

import { useRef, useState } from "react";

export type SingleImageState =
  | { type: "none" }
  | { type: "existing"; url: string }
  | { type: "new"; file: File; preview: string }
  | { type: "cleared" };

interface SingleImageUploadProps {
  label: string;
  hint?: string;
  state: SingleImageState;
  onChange: (s: SingleImageState) => void;
  fieldName: string; // for the "remove" button tooltip
}

const MAX_MB = 5;

export default function SingleImageUpload({
  label,
  hint,
  state,
  onChange,
  fieldName,
}: SingleImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasImage = state.type === "existing" || state.type === "new";
  const previewUrl =
    state.type === "existing"
      ? state.url
      : state.type === "new"
      ? state.preview
      : null;

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(`"${file.name}" is not an image.`);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File exceeds ${MAX_MB} MB.`);
      return;
    }
    // Revoke previous preview blob
    if (state.type === "new") URL.revokeObjectURL(state.preview);
    onChange({ type: "new", file, preview: URL.createObjectURL(file) });
  };

  const handleRemove = () => {
    if (state.type === "new") URL.revokeObjectURL(state.preview);
    // "cleared" signals the controller to delete the Cloudinary asset
    onChange(
      state.type === "existing" ? { type: "cleared" } : { type: "none" },
    );
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}

      {hasImage && previewUrl ? (
        /* Preview card */
        <div
          className="relative group w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50"
          style={{ aspectRatio: "16/7" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-full object-cover"
          />

          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 rounded-xl text-sm font-medium text-white hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
            >
              <svg
                className="w-4 h-4"
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
              Remove
            </button>
          </div>

          {/* Badge */}
          {state.type === "new" && (
            <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              New — not saved yet
            </span>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-8 cursor-pointer transition-all ${
            dragOver
              ? "border-amber-400 bg-amber-50"
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">
            Drop image here or click to browse
          </p>
          <p className="text-xs text-gray-400">
            JPG, PNG, WebP · Max {MAX_MB} MB
          </p>

          {state.type === "cleared" && (
            <span className="text-xs text-red-500 mt-1">
              Image removed — will be deleted on save
            </span>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        onClick={(e) => ((e.target as HTMLInputElement).value = "")}
      />
    </div>
  );
}
