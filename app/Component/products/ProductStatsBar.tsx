"use client";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
}

export default function ProductStatsBar({ stats }: { stats: Stats }) {
  const items = [
    {
      label: "Total Products",
      value: stats.total,
      color: "text-gray-800",
      bg: "bg-gray-50",
      border: "border-gray-200",
    },
    {
      label: "Active",
      value: stats.active,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    {
      label: "Featured",
      value: stats.featured,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={`${item.bg} border ${item.border} rounded-xl px-4 py-3`}
        >
          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
          <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
