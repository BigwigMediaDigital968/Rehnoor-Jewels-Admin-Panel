"use client";

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ReviewStatsBarProps {
  stats: ReviewStats;
  activeFilter: string;
  onFilter: (status: string) => void;
}

const ITEMS = [
  {
    key: "",
    label: "Total Reviews",
    statKey: "total" as keyof ReviewStats,
    bg: "bg-gray-50",
    border: "border-gray-200",
    activeBg: "bg-gray-900",
    activeText: "text-white",
    textColor: "text-gray-800",
    dot: "",
  },
  {
    key: "pending",
    label: "Pending Approval",
    statKey: "pending" as keyof ReviewStats,
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    textColor: "text-amber-800",
    dot: "bg-amber-400",
  },
  {
    key: "approved",
    label: "Approved",
    statKey: "approved" as keyof ReviewStats,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-600",
    activeText: "text-white",
    textColor: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  {
    key: "rejected",
    label: "Rejected",
    statKey: "rejected" as keyof ReviewStats,
    bg: "bg-red-50",
    border: "border-red-200",
    activeBg: "bg-red-500",
    activeText: "text-white",
    textColor: "text-red-700",
    dot: "bg-red-400",
  },
];

export default function ReviewStatsBar({
  stats,
  activeFilter,
  onFilter,
}: ReviewStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {ITEMS.map((item) => {
        const isActive = activeFilter === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onFilter(item.key)}
            className={`relative text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
              isActive
                ? `${item.activeBg} ${item.activeText} border-transparent shadow-sm`
                : `${item.bg} ${item.border} hover:shadow-sm`
            }`}
          >
            {/* Pending pulse dot */}
            {item.key === "pending" && stats.pending > 0 && !isActive && (
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
            <p
              className={`text-xs mb-1 ${
                isActive ? "opacity-80" : "text-gray-500"
              }`}
            >
              {item.label}
            </p>
            <div className="flex items-end gap-2">
              <p
                className={`text-2xl font-semibold leading-none ${
                  isActive ? "text-white" : item.textColor
                }`}
              >
                {stats[item.statKey]}
              </p>
              {item.dot && !isActive && (
                <span
                  className={`w-2 h-2 rounded-full mb-0.5 flex-shrink-0 ${item.dot}`}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
