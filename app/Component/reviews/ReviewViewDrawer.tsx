"use client";

import Image from "next/image";

export interface Review {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    images: { src: string; alt: string }[];
    price: number;
  } | null;
  rating: number;
  reviewTitle: string;
  reviewDescription: string;
  username: string;
  userCity?: string;
  sizePurchased?: string;
  images: { src: string; alt: string }[];
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  isFeatured: boolean;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
}

interface ReviewViewDrawerProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
  onApprove: (r: Review) => void;
  onReject: (r: Review) => void;
  onDelete: (r: Review) => void;
  onToggleFeature: (r: Review) => void;
}

const STATUS_CONFIG = {
  pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
  approved: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    label: "Approved",
  },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${
            s <= rating ? "text-amber-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm font-semibold text-gray-700 ml-1">
        {rating}/5
      </span>
    </div>
  );
}

export default function ReviewViewDrawer({
  review,
  open,
  onClose,
  onApprove,
  onReject,
  onDelete,
  onToggleFeature,
}: ReviewViewDrawerProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full z-100 w-full max-w-lg bg-white shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {!review ? null : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900 text-base">
                  Review detail
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submitted{" "}
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-5 space-y-5 overflow-y-auto">
              {/* Status + rating */}
              <div className="flex items-center justify-between">
                <StarRow rating={review.rating} />
                <div className="flex items-center gap-2">
                  {review.isFeatured && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full border border-amber-200">
                      FEATURED
                    </span>
                  )}
                  {review.isVerifiedPurchase && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                      VERIFIED
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      STATUS_CONFIG[review.status].bg
                    } ${STATUS_CONFIG[review.status].text}`}
                  >
                    {STATUS_CONFIG[review.status].label}
                  </span>
                </div>
              </div>

              {/* Reviewer info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                  {review.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {review.username}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[
                      review.userCity,
                      review.sizePurchased
                        ? `Size: ${review.sizePurchased}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-400">Helpful votes</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {review.helpfulVotes}
                  </p>
                </div>
              </div>

              {/* Product link */}
              {review.product && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                    {review.product.images?.[0]?.src ? (
                      <Image
                        src={review.product.images[0].src}
                        alt={review.product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        ◆
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-purple-800 truncate">
                      {review.product.name}
                    </p>
                    <p className="text-xs text-purple-500">
                      ₹{review.product.price?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {/* Review content */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                    Title
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    "{review.reviewTitle}"
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {review.reviewDescription}
                  </p>
                </div>
              </div>

              {/* Review images */}
              {review.images?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
                    Customer photos ({review.images.length})
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {review.images.map((img, i) => (
                      <div
                        key={i}
                        className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 relative border border-gray-200"
                      >
                        <Image
                          src={img.src}
                          alt={img.alt || `Review image ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin note */}
              {review.adminNote && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                    Admin note
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    "{review.adminNote}"
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3">
                {review.approvedAt && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-0.5">
                      Approved
                    </p>
                    <p className="text-xs font-medium text-emerald-800">
                      {new Date(review.approvedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {review.rejectedAt && (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                    <p className="text-[10px] text-red-500 uppercase tracking-wider mb-0.5">
                      Rejected
                    </p>
                    <p className="text-xs font-medium text-red-700">
                      {new Date(review.rejectedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-white space-y-2">
              {/* Approve / Reject row */}
              <div className="flex gap-2">
                {review.status !== "approved" && (
                  <button
                    onClick={() => onApprove(review)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors cursor-pointer"
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Approve
                  </button>
                )}
                {review.status !== "rejected" && (
                  <button
                    onClick={() => onReject(review)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors cursor-pointer"
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
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Reject
                  </button>
                )}
              </div>
              {/* Feature + Delete row */}
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleFeature(review)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border ${
                    review.isFeatured
                      ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill={review.isFeatured ? "currentColor" : "none"}
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
                  {review.isFeatured ? "Unfeature" : "Feature"}
                </button>
                <button
                  onClick={() => onDelete(review)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors cursor-pointer"
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
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
