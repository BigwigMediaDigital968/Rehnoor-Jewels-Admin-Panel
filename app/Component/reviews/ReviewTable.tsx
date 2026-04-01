"use client";

import { useState } from "react";
import Image from "next/image";
import type { Review } from "./ReviewViewDrawer";

interface ReviewTableProps {
  reviews: Review[];
  loading: boolean;
  selectedIds: Set<string>;
  onSelectId: (id: string) => void;
  onSelectAll: () => void;
  onView: (r: Review) => void;
  onApprove: (r: Review) => void;
  onReject: (r: Review) => void;
  onDelete: (r: Review) => void;
  onToggleFeature: (r: Review) => void;
}

const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-400",
    label: "Rejected",
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3 h-3 ${
            s <= rating ? "text-amber-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}</span>
    </div>
  );
}

function Tip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
            {label}
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  );
}

export default function ReviewTable({
  reviews,
  loading,
  selectedIds,
  onSelectId,
  onSelectAll,
  onView,
  onApprove,
  onReject,
  onDelete,
  onToggleFeature,
}: ReviewTableProps) {
  const allSelected = reviews.length > 0 && selectedIds.size === reviews.length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
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
          <p className="text-sm text-gray-400">Loading reviews…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="pl-5 pr-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                  />
                </th>
                {[
                  { label: "Reviewer", hint: "Click to view full review" },
                  { label: "Product", hint: "Which product was reviewed" },
                  { label: "Rating", hint: "Star rating out of 5" },
                  { label: "Review", hint: "Title and preview" },
                  { label: "Status", hint: "Click to open quick actions" },
                  { label: "Date", hint: "Submission date" },
                  { label: "Actions", hint: "Approve · Reject · More" },
                ].map(({ label, hint }) => (
                  <th
                    key={label}
                    className="px-4 py-3.5 text-left whitespace-nowrap"
                  >
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-[9px] text-gray-300 font-normal mt-0.5 normal-case tracking-normal">
                      {hint}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">💬</span>
                      <p className="text-gray-400 text-sm">No reviews found</p>
                      <p className="text-gray-300 text-xs">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review, idx) => {
                  const sc = STATUS_CONFIG[review.status];
                  return (
                    <tr
                      key={review._id}
                      className={`border-b border-gray-50 transition-colors group ${
                        selectedIds.has(review._id)
                          ? "bg-amber-50/60"
                          : idx % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50/30"
                      } hover:bg-amber-50/30`}
                    >
                      {/* Checkbox */}
                      <td className="pl-5 pr-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(review._id)}
                          onChange={() => onSelectId(review._id)}
                          className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                        />
                      </td>

                      {/* Reviewer */}
                      <td className="px-4 py-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => onView(review)}
                        >
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                            {review.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[130px] group-hover:text-amber-700 transition-colors">
                              {review.username}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {review.userCity || "—"}
                              {review.sizePurchased
                                ? ` · ${review.sizePurchased}`
                                : ""}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {review.isFeatured && (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200">
                                  FEATURED
                                </span>
                              )}
                              {review.isVerifiedPurchase && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-200">
                                  VERIFIED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-4">
                        {review.product ? (
                          <div className="flex items-center gap-2">
                            {/* <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0 border border-gray-200">
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                ◆
                              </div>
                            </div> */}
                            <span className="text-xs text-gray-700 font-medium truncate max-w-[110px]">
                              {review.product.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">
                            Product deleted
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-4">
                        <StarRating rating={review.rating} />
                        {review.images?.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {review.images.length} photo
                            {review.images.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </td>

                      {/* Review title + preview */}
                      <td className="px-4 py-4" style={{ maxWidth: 220 }}>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {review.reviewTitle}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {review.reviewDescription}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-xs text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-0.5">
                          {/* Approve */}
                          {review.status !== "approved" && (
                            <Tip label="Approve review">
                              <button
                                onClick={() => onApprove(review)}
                                className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </button>
                            </Tip>
                          )}
                          {/* Reject */}
                          {review.status !== "rejected" && (
                            <Tip label="Reject review">
                              <button
                                onClick={() => onReject(review)}
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
                                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </button>
                            </Tip>
                          )}
                          {/* Feature */}
                          <Tip
                            label={
                              review.isFeatured
                                ? "Unfeature review"
                                : "Feature / pin review"
                            }
                          >
                            <button
                              onClick={() => onToggleFeature(review)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                review.isFeatured
                                  ? "text-amber-500 hover:bg-amber-50"
                                  : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                              }`}
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill={
                                  review.isFeatured ? "currentColor" : "none"
                                }
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </button>
                          </Tip>
                          {/* View */}
                          <Tip label="View full details">
                            <button
                              onClick={() => onView(review)}
                              className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                          </Tip>
                          {/* Delete */}
                          <Tip label="Delete review">
                            <button
                              onClick={() => onDelete(review)}
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
                          </Tip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {reviews.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[10px] text-gray-400">
              <span className="font-medium text-gray-500">Tip:</span> Click
              reviewer name to open full detail panel · ✓ approves · ✗ rejects ·
              ★ pins to top of product page
            </p>
          </div>
        )}
      </div>
    </>
  );
}
