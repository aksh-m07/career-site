"use client"

import { useEffect, useState } from "react"
import type { ScoredJob } from "@/lib/types"
import { FAMILIES } from "@/lib/types"
import { ScoreRing } from "./ScoreRing"
import { Icons } from "./Icons"
import { useApp } from "./AppContext"

const fmtSalary = (min: number, max: number) =>
  `$${Math.round(min / 1000)}k – $${Math.round(max / 1000)}k`

type TailorState = "idle" | "loading" | "done" | "error"
type ApplyState = "idle" | "form" | "submitting" | "done"

export function JobDrawer({ item, onClose }: { item: ScoredJob; onClose: () => void }) {
  const { job, score, reasons } = item
  const { candidateProfile, resume, addApplication, user } = useApp()

  const [tailorState, setTailorState] = useState<TailorState>("idle")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [applyState, setApplyState] = useState<ApplyState>("idle")
  const [applyName, setApplyName] = useState("")
  const [applyEmail, setApplyEmail] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Reset tailor + apply state when job changes
  useEffect(() => {
    setTailorState("idle")
    setSuggestions([])
    setApplyState("idle")
    setApplyName("")
    setApplyEmail("")
  }, [job.id])

  async function submitApplication(e?: React.FormEvent) {
    e?.preventDefault()
    setApplyState("submitting")
    await new Promise(r => setTimeout(r, 900))
    const name = user?.name ?? applyName
    const email = user?.email ?? applyEmail
    setApplyName(name)
    setApplyEmail(email)
    addApplication({
      jobId: job.id,
      jobTitle: job.title,
      family: job.family,
      level: job.level,
      name,
      email,
    })
    setApplyState("done")
  }

  async function handleApplyClick() {
    if (user) {
      await submitApplication()
    } else {
      setApplyState("form")
    }
  }

  const isLowMatch = resume !== null && score !== null && score < 50
  const hasProfile = resume !== null

  async function getTailorSuggestions() {
    if (!candidateProfile && !resume) return
    setTailorState("loading")
    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: { id: job.id, title: job.title, family: job.family, level: job.level, skills: job.skills, blurb: job.blurb, team: job.team },
          profile: candidateProfile ?? {
            currentTitle: resume?.headline ?? "",
            skills: resume?.skills ?? [],
            summary: resume?.summary ?? "",
            seniorityLevel: "Mid",
            yearsOfExperience: resume?.yearsExp ?? 3,
            family: resume?.families?.[0] ?? "eng",
            industries: [],
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to generate suggestions")
      setSuggestions(data.suggestions ?? [])
      setTailorState("done")
    } catch {
      setTailorState("error")
    }
  }

  // Skill gap for client-side preview
  const missingSkills = resume
    ? job.skills.filter(s =>
        !(resume.skills ?? []).some(rs =>
          rs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rs.toLowerCase())
        )
      )
    : []

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-hd">
          <button className="icon-btn" onClick={onClose}><Icons.close /></button>
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
            <span><Icons.pin /> {job.location}</span>
            <span><Icons.briefcase /> {job.employmentType} · {job.level}</span>
            <span>{fmtSalary(job.salaryMin, job.salaryMax)}</span>
          </div>

          {/* Match score section */}
          {score !== null && hasProfile && (
            <div className={`drawer-match ${isLowMatch ? "drawer-match-low" : ""}`}>
              <ScoreRing score={score} size={56} />
              <div>
                <div className="dm-label">
                  {isLowMatch ? "Low match — but here's how to close the gap" : "Why we think this fits"}
                </div>
                {reasons.length > 0 ? (
                  <ul className="dm-reasons">
                    {reasons.map((r, i) => (
                      <li key={i}><Icons.check /> {r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="dm-meh">
                    {isLowMatch
                      ? "Your current profile doesn't closely align — open the tailoring section below to see what to change."
                      : "Light overlap — but you might be looking to stretch."}
                  </p>
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

          {/* Resume tailoring section — only when resume is loaded */}
          {hasProfile && (
            <section className="drawer-section tailor-section">
              <h3>Tailor your resume for this role</h3>

              {missingSkills.length > 0 && (
                <div className="tailor-gap">
                  <div className="tailor-gap-label">Skills this role needs that aren&apos;t on your resume</div>
                  <div className="tailor-chips">
                    {missingSkills.map(s => (
                      <span key={s} className="tailor-chip">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {tailorState === "idle" && (
                <button className="tailor-btn" onClick={getTailorSuggestions}>
                  <Icons.spark /> Get AI-powered resume suggestions for this role
                </button>
              )}

              {tailorState === "loading" && (
                <div className="tailor-loading">
                  <span className="tailor-spinner" />
                  Claude is analyzing the gap between your resume and this role…
                </div>
              )}

              {tailorState === "done" && (
                <div className="tailor-results">
                  {suggestions.length > 0 ? (
                    <>
                      <div className="tailor-results-label">Specific changes to make to your resume</div>
                      <ul className="tailor-list">
                        {suggestions.map((s, i) => (
                          <li key={i}><Icons.check /> {s}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="muted" style={{ marginTop: "8px" }}>No specific suggestions generated. Try regenerating.</p>
                  )}
                  <button className="link-btn sm" onClick={() => { setTailorState("idle"); setSuggestions([]) }}>
                    Regenerate suggestions
                  </button>
                </div>
              )}

              {tailorState === "error" && (
                <p className="muted" style={{ marginTop: "12px" }}>
                  Couldn&apos;t load suggestions right now.{" "}
                  <button className="link-btn sm" onClick={getTailorSuggestions}>Try again</button>
                </p>
              )}
            </section>
          )}

          {applyState === "done" ? (
            <div className="apply-confirm">
              <Icons.check />
              <div>
                <div className="apply-confirm-title">Application submitted!</div>
                <div className="apply-confirm-sub">We&apos;ll be in touch at {applyEmail}.</div>
              </div>
            </div>
          ) : !user && (applyState === "form" || applyState === "submitting") ? (
            <form className="apply-form" onSubmit={submitApplication}>
              <div className="apply-form-title">Apply for {job.title}</div>
              <div className="apply-fields">
                <label>
                  <span>Full name</span>
                  <input
                    type="text" required placeholder="Jane Smith"
                    value={applyName} onChange={e => setApplyName(e.target.value)}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email" required placeholder="jane@example.com"
                    value={applyEmail} onChange={e => setApplyEmail(e.target.value)}
                  />
                </label>
              </div>
              <div className="drawer-cta">
                <button className="btn-primary" type="submit" disabled={applyState === "submitting"}>
                  {applyState === "submitting" ? "Submitting…" : <>Submit application <Icons.arrow /></>}
                </button>
                <button className="btn-ghost" type="button" onClick={() => setApplyState("idle")}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="drawer-cta">
              <button className="btn-primary" onClick={handleApplyClick} disabled={applyState === "submitting"}>
                {applyState === "submitting" ? "Submitting…" : <>Apply for this role <Icons.arrow /></>}
              </button>
              <button className="btn-ghost">Save</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
