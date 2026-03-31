"use client";

interface ProductFiltersProps {
  search: string;
  status: string;
  tag: string;
  sort: string;
  onSearch: (v: string) => void;
  onStatus: (v: string) => void;
  onTag: (v: string) => void;
  onSort: (v: string) => void;
  onClear: () => void;
}

const TAGS = [
  "Bestseller",
  "New",
  "Popular",
  "Limited",
  "Exclusive",
  "Trending",
];
const STATUSES = [
  { value: "", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];
const SORTS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "price", label: "Price: Low → High" },
  { value: "-price", label: "Price: High → Low" },
  { value: "name", label: "Name A–Z" },
  { value: "-rating", label: "Top Rated" },
];

export default function ProductFilters({
  search,
  status,
  tag,
  sort,
  onSearch,
  onStatus,
  onTag,
  onSort,
  onClear,
}: ProductFiltersProps) {
  const hasFilters = search || status || tag || sort !== "-createdAt";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, SKU…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-gray-50"
          />
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-gray-50 cursor-pointer min-w-[120px]"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Tag filter */}
        <select
          value={tag}
          onChange={(e) => onTag(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-gray-50 cursor-pointer min-w-[130px]"
        >
          <option value="">All Tags</option>
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-gray-50 cursor-pointer min-w-[160px]"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            × Clear
          </button>
        )}
      </div>
    </div>
  );
}
