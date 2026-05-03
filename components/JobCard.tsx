"use client"

import { MapPin, Clock, Wifi, DollarSign, Sparkles } from "lucide-react"
import type { Job, MatchedJob } from "@/lib/types"

interface JobCardProps {
  job: Job | MatchedJob
  isMatched?: boolean
}

const DOMAIN_COLORS: Record<string, string> = {
  engineering: "bg-blue-100 text-blue-700",
  healthcare: "bg-emerald-100 text-emerald-700",
  finance: "bg-amber-100 text-amber-700",
  data: "bg-violet-100 text-violet-700",
  operations: "bg-orange-100 text-orange-700",
  design: "bg-pink-100 text-pink-700",
  product: "bg-cyan-100 text-cyan-700",
  legal: "bg-slate-100 text-slate-700",
  marketing: "bg-rose-100 text-rose-700",
}

const SENIORITY_LABELS: Record<string, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
  staff: "Staff",
  principal: "Principal",
  director: "Director",
  vp: "VP",
  "c-suite": "C-Suite",
}

function CompanyAvatar({ company }: { company: string }) {
  const initials = company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ]
  const colorIndex = company.charCodeAt(0) % colors.length

  return (
    <div className={`w-10 h-10 rounded-xl ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
      {initials}
    </div>
  )
}

function MatchScore({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : score >= 65
        ? "bg-blue-50 border-blue-200 text-blue-700"
        : "bg-gray-50 border-gray-200 text-gray-500"

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${color}`}>
      <Sparkles className="w-3 h-3" />
      {score}% match
    </div>
  )
}

function formatSalary(salary: { min: number; max: number; currency: string }) {
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
  return `${fmt(salary.min)}–${fmt(salary.max)}`
}

export function JobCard({ job, isMatched }: JobCardProps) {
  const matched = job as MatchedJob
  const hasScore = isMatched && typeof matched.matchScore === "number"

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <CompanyAvatar company={job.company} />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors truncate">
              {job.title}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">{job.company}</p>
          </div>
        </div>
        {hasScore && <MatchScore score={matched.matchScore} />}
      </div>

      <p className="text-gray-600 text-xs leading-relaxed mb-3 line-clamp-2">{job.description}</p>

      {hasScore && matched.matchReason && (
        <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 font-medium">{matched.matchReason}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
            {tag}
          </span>
        ))}
        {job.tags.length > 4 && (
          <span className="px-2 py-0.5 text-gray-400 text-xs">+{job.tags.length - 4} more</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {job.location}
        </span>
        {job.remote && (
          <span className="flex items-center gap-1 text-emerald-600">
            <Wifi className="w-3 h-3" />
            Remote
          </span>
        )}
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          {formatSalary(job.salary)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {job.type}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${DOMAIN_COLORS[job.domain] ?? "bg-gray-100 text-gray-600"}`}>
          {job.domain}
        </span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
          {SENIORITY_LABELS[job.seniority] ?? job.seniority}
        </span>
      </div>
    </div>
  )
}
