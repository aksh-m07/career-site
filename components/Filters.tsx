"use client"

import { Search, X } from "lucide-react"

export interface FilterState {
  search: string
  domain: string
  seniority: string
}

interface FiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  totalJobs: number
  isMatched: boolean
}

const DOMAINS = [
  { value: "all", label: "All Domains" },
  { value: "engineering", label: "Engineering" },
  { value: "data", label: "Data & AI" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "operations", label: "Operations" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
  { value: "marketing", label: "Marketing" },
  { value: "legal", label: "Legal" },
]

const SENIORITIES = [
  { value: "all", label: "All Levels" },
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "staff", label: "Staff" },
  { value: "principal", label: "Principal" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c-suite", label: "C-Suite" },
]

export function Filters({ filters, onChange, totalJobs, isMatched }: FiltersProps) {
  const hasActiveFilters =
    filters.domain !== "all" || filters.seniority !== "all" || filters.search

  function reset() {
    onChange({ search: "", domain: "all", seniority: "all" })
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search jobs, skills, companies…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Domain</label>
        <select
          value={filters.domain}
          onChange={(e) => onChange({ ...filters, domain: e.target.value })}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
        >
          {DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Seniority</label>
        <select
          value={filters.seniority}
          onChange={(e) => onChange({ ...filters, seniority: e.target.value })}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
        >
          {SENIORITIES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Removed Remote only filter */}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-500">
          {isMatched ? "Sorted by match" : `${totalJobs} jobs`}
        </p>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
