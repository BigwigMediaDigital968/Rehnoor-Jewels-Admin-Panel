"use client";

import { useEffect } from "react";

interface FeedbackModalProps {
  open: boolean;
  type: "success" | "error";
  message: string;
  onClose: () => void;
  autoClose?: number; // ms, default 2500
}

export default function FeedbackModal({
  open,
  type,
  message,
  onClose,
  autoClose = 2500,
}: FeedbackModalProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, autoClose);
    return () => clearTimeout(t);
  }, [open, autoClose, onClose]);

  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div
      className="fixed bottom-6 right-6 z-[60]"
      style={{ animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl min-w-[280px] ${
          isSuccess ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isSuccess ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          <span className="text-sm">{isSuccess ? "✓" : "✕"}</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">
            {isSuccess ? "Success" : "Error"}
          </p>
          <p className="text-xs opacity-80 mt-0.5">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-lg leading-none cursor-pointer ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}
