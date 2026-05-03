"use client"

import { useEffect } from "react"
import type { ScoredJob } from "@/lib/types"
import { FAMILIES } from "@/lib/types"
import { ScoreRing } from "./ScoreRing"
import { Icons } from "./Icons"

const fmtSalary = (min: number, max: number) =>
  `$${Math.round(min / 1000)}k – $${Math.round(max / 1000)}k`

export function JobDrawer({ item, onClose }: { item: ScoredJob; onClose: () => void }) {
  const { job, score, reasons } = item

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-hd">
          <button className="icon-btn" onClick={onClose}><Icons.close/></button>
          <span className="drawer-id">{job.id}</span>
        </div>
        <div className="drawer-body">
          <div className="drawer-eyebrow">
            <span>{FAMILIES[job.family].label}</span>
            <span>·</span>
            <span>{job.team}</span>
          </div>
          <h2 className="drawer-title">{job.title}</h2>
          <div className="drawer-meta">
            <span><Icons.pin/> {job.location}</span>
            <span><Icons.briefcase/> {job.employmentType} · {job.level}</span>
            <span>{fmtSalary(job.salaryMin, job.salaryMax)}</span>
          </div>

          {score !== null && (
            <div className="drawer-match">
              <ScoreRing score={score} size={56}/>
              <div>
                <div className="dm-label">Why we think this fits</div>
                {reasons.length > 0 ? (
                  <ul className="dm-reasons">
                    {reasons.map((r, i) => (
                      <li key={i}><Icons.check/> {r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="dm-meh">Light overlap — but you might be looking to stretch.</p>
                )}
              </div>
            </div>
          )}

          <section className="drawer-section">
            <h3>About the role</h3>
            <p>{job.blurb}</p>
            <p>You&apos;ll partner closely with cross-functional teammates across product, design, and engineering. Decimal is a place where your judgment is trusted and your impact is visible.</p>
          </section>

          <section className="drawer-section">
            <h3>What you&apos;ll bring</h3>
            <ul className="drawer-list">
              {job.skills.map((s, i) => <li key={i}>{s}</li>)}
              <li>A bias toward shipping and learning</li>
              <li>Care for the people you work with</li>
            </ul>
          </section>

          <section className="drawer-section">
            <h3>Compensation & benefits</h3>
            <p className="comp">{fmtSalary(job.salaryMin, job.salaryMax)} <span className="comp-sub">base · plus equity & benefits</span></p>
            <p className="muted">Final offers reflect experience, location, and internal equity. We post real ranges because you deserve to know.</p>
          </section>

          <div className="drawer-cta">
            <button className="btn-primary">Apply for this role <Icons.arrow/></button>
            <button className="btn-ghost">Save</button>
          </div>
        </div>
      </aside>
    </div>
  )
}
