"use client"

import type { ScoredJob } from "@/lib/types"
import { FAMILIES } from "@/lib/types"
import { Icons } from "./Icons"

export function FeaturedJobCard({ item, isMatch, onClick }: {
  item: ScoredJob
  isMatch: boolean
  onClick: () => void
}) {
  const { job, score } = item
  return (
    <button className="feat-card" onClick={onClick}>
      <div className="feat-eyebrow">
        <span>{FAMILIES[job.family].label}</span>
        {isMatch && score !== null && score >= 70 && (
          <span className="feat-match"><Icons.spark/> {score}</span>
        )}
      </div>
      <h3 className="feat-title">{job.title}</h3>
      <p className="feat-blurb">{job.blurb}</p>
      <div className="feat-foot">
        <span>{job.remote ? "Remote" : job.location}</span>
        <span>·</span>
        <span>{job.level}</span>
        <span className="feat-arrow"><Icons.arrow/></span>
      </div>
    </button>
  )
}
