"use client"

import type { ScoredJob } from "@/lib/types"
import { FAMILIES } from "@/lib/types"
import { ScoreRing } from "./ScoreRing"
import { Icons } from "./Icons"

const fmtSalary = (min: number, max: number) =>
  `$${Math.round(min / 1000)}k – $${Math.round(max / 1000)}k`

const fmtPosted = (d: number) =>
  d === 0 ? "Today" : d === 1 ? "1 day ago" : d < 7 ? `${d} days ago` : d < 14 ? "Last week" : `${Math.floor(d / 7)} weeks ago`

export function JobRow({ item, isMatch, onClick }: {
  item: ScoredJob
  isMatch: boolean
  onClick: () => void
}) {
  const { job, score, reasons } = item
  return (
    <article
      className={`job-row ${isMatch ? "is-match" : ""}`}
      onClick={onClick}
    >
      <div>
        <div className="job-row-head">
          <h3 className="job-title">{job.title}</h3>
          {isMatch && score !== null && score >= 70 && (
            <span className="badge badge-strong"><Icons.spark/> Strong match</span>
          )}
          {isMatch && score !== null && score >= 50 && score < 70 && (
            <span className="badge badge-good">Good match</span>
          )}
        </div>
        <p className="job-blurb">{job.blurb}</p>
        <div className="job-meta">
          <span className="meta-pill"><Icons.briefcase/> {FAMILIES[job.family].label}</span>
          <span className="meta-pill">{job.level}</span>
          <span className="meta-pill">
            {job.remote ? <Icons.remote/> : <Icons.pin/>} {job.location}
          </span>
          <span className="meta-pill subtle">{fmtSalary(job.salaryMin, job.salaryMax)}</span>
          <span className="meta-pill subtle">{fmtPosted(job.postedDays)}</span>
        </div>
      </div>
      <div className="job-row-aside">
        {score !== null
          ? <ScoreRing score={score}/>
          : <div className="apply-cue"><span>View role</span> <Icons.arrow/></div>
        }
      </div>
    </article>
  )
}
