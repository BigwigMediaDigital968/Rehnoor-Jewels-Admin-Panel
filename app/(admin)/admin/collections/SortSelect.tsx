"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  Check,
  GripVertical,
  CalendarArrowDown,
  CalendarArrowUp,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProductSort } from "./CollectionManagement";

// ─── Options ──────────────────────────────────────────────────────────────────

interface SortOption {
  value: ProductSort;
  label: string; // shown in the list
  short: string; // shown on the trigger
  icon: LucideIcon;
  group: string;
}

export const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { value: "manual", label: "Manually (drag & drop)", short: "Manual", icon: GripVertical, group: "Custom" },
  { value: "created-desc", label: "Newest first", short: "Newest first", icon: CalendarArrowDown, group: "Date added" },
  { value: "created-asc", label: "Oldest first", short: "Oldest first", icon: CalendarArrowUp, group: "Date added" },
  { value: "name-asc", label: "Name: A–Z", short: "Name A–Z", icon: ArrowDownAZ, group: "Name" },
  { value: "name-desc", label: "Name: Z–A", short: "Name Z–A", icon: ArrowDownZA, group: "Name" },
  { value: "price-asc", label: "Price: low to high", short: "Price ↑", icon: ArrowUpNarrowWide, group: "Price" },
  { value: "price-desc", label: "Price: high to low", short: "Price ↓", icon: ArrowDownWideNarrow, group: "Price" },
];

const GOLD = "#D4A017";
const GOLD_DARK = "#a06800";
const BORDER = "#E5E0D4";
const MENU_W = 248;
const MENU_MAX_H = 360;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SortSelect({
  value,
  onChange,
}: {
  value: ProductSort;
  onChange: (v: ProductSort) => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedIdx = Math.max(
    0,
    PRODUCT_SORT_OPTIONS.findIndex((o) => o.value === value),
  );
  const current = PRODUCT_SORT_OPTIONS[selectedIdx];
  const optId = (i: number) => `${uid}-opt-${i}`;

  const openMenu = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    // Right-align to the trigger, clamp to the viewport, flip up if no room.
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    const below = window.innerHeight - r.bottom;
    const top =
      below < MENU_MAX_H + 12 && r.top > below
        ? Math.max(8, r.top - MENU_MAX_H - 6)
        : r.bottom + 6;
    setPos({ top, left });
    setActive(selectedIdx);
    setOpen(true);
  }, [selectedIdx]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const choose = (i: number) => {
    onChange(PRODUCT_SORT_OPTIONS[i].value);
    close();
  };

  // Move focus into the list when it opens
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  // Keep the active option scrolled into view
  useEffect(() => {
    if (open)
      document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  // Outside click / scroll / resize close the menu
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!listRef.current?.contains(t) && !triggerRef.current?.contains(t))
        close(false);
    };
    const onMove = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return; // scrolling the list itself
      close(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, close]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const n = PRODUCT_SORT_OPTIONS.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => (a + 1) % n);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => (a - 1 + n) % n);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(n - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <>
      <style>{`
        @keyframes ssPop { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .ss-trigger:hover{border-color:${GOLD}!important;background:#FFFBF0!important}
        .ss-trigger:focus-visible,.ss-list:focus-visible{outline:2px solid ${GOLD};outline-offset:2px}
        @media (prefers-reduced-motion: reduce){ .ss-menu{animation:none!important} .ss-chevron{transition:none!important} }
      `}</style>

      <button
        ref={triggerRef}
        type="button"
        className="ss-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-label={`Sort products by: ${current.label}`}
        title="Sort products by"
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          height: 36,
          padding: "0 10px 0 11px",
          borderRadius: 9,
          border: `1.5px solid ${open ? GOLD : BORDER}`,
          background: open ? "#FFFBF0" : "#fff",
          color: "#3a3a3a",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "border-color .15s, background .15s",
        }}
      >
        <ArrowDownUp size={14} color={GOLD_DARK} aria-hidden="true" />
        <span style={{ color: "#8B7355", fontWeight: 500 }}>Sort:</span>
        <span>{current.short}</span>
        <ChevronDown
          className="ss-chevron"
          size={14}
          color="#999"
          aria-hidden="true"
          style={{
            transition: "transform .18s ease",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {open && pos && (
        <div
          ref={listRef}
          id={`${uid}-list`}
          className="ss-menu ss-list"
          role="listbox"
          tabIndex={-1}
          aria-label="Sort products by"
          aria-activedescendant={optId(active)}
          onKeyDown={onListKey}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: MENU_W,
            maxHeight: MENU_MAX_H,
            overflowY: "auto",
            zIndex: 1300,
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            boxShadow: "0 14px 40px rgba(40,30,10,0.16), 0 2px 6px rgba(40,30,10,0.06)",
            padding: 6,
            animation: "ssPop .14s ease-out",
          }}
        >
          {PRODUCT_SORT_OPTIONS.map((o, i) => {
            const Icon = o.icon;
            const isSel = o.value === value;
            const isAct = i === active;
            const newGroup = i === 0 || PRODUCT_SORT_OPTIONS[i - 1].group !== o.group;
            return (
              <div key={o.value} role="presentation">
                {newGroup && (
                  <div
                    role="presentation"
                    style={{
                      padding: i === 0 ? "4px 10px 4px" : "10px 10px 4px",
                      marginTop: i === 0 ? 0 : 4,
                      borderTop: i === 0 ? "none" : "1px solid #F5F2EA",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#B8AFA0",
                    }}
                  >
                    {o.group}
                  </div>
                )}
                <div
                  id={optId(i)}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 38,
                    padding: "0 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: isAct ? "#FFF8E6" : "transparent",
                    color: isSel ? GOLD_DARK : "#333",
                    fontSize: 13,
                    fontWeight: isSel ? 700 : 500,
                  }}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                    color={isSel ? GOLD : "#9a9283"}
                    style={{ flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>{o.label}</span>
                  {isSel && <Check size={15} color={GOLD} aria-hidden="true" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
