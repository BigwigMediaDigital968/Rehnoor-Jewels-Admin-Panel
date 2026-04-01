"use client";

interface ReviewFiltersProps {
  search: string;
  sort: string;
  onSearch: (v: string) => void;
  onSort: (v: string) => void;
  onClear: () => void;
}

const SORTS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-rating", label: "Rating: High → Low" },
  { value: "rating", label: "Rating: Low → High" },
];

export default function ReviewFilters({
  search,
  sort,
  onSearch,
  onSort,
  onClear,
}: ReviewFiltersProps) {
  const hasFilters = search || sort !== "-createdAt";

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
            placeholder="Search reviewer, title, description…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-gray-50"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-gray-50 cursor-pointer min-w-[170px]"
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
