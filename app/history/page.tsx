"use client"

import Link from "next/link"
import { useApp } from "@/components/AppContext"
import { FAMILIES } from "@/lib/types"
import type { ApplicationStatus } from "@/lib/types"

const STATUS_META: Record<ApplicationStatus, { label: string; color: string }> = {
  "Applied":              { label: "Applied",              color: "var(--ink-3)" },
  "Under Review":         { label: "Under Review",         color: "#b45309" },
  "Interview Scheduled":  { label: "Interview Scheduled",  color: "#7c3aed" },
  "Offer Extended":       { label: "Offer Extended",       color: "#16a34a" },
  "Rejected":             { label: "Rejected",             color: "#dc2626" },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function HistoryPage() {
  const { applications, user, hydrated } = useApp()

  if (!hydrated) return null

  if (!user) {
    return (
      <main className="page-pad">
        <div className="page-header">
          <h1>Hiring history</h1>
          <p className="lede">Sign in to see your application history.</p>
        </div>
        <div className="empty" style={{ marginTop: "48px" }}>
          <h3>You&apos;re not signed in</h3>
          <p>Log in to track the roles you&apos;ve applied to and check their status.</p>
          <Link href="/login" className="btn-ghost">Log in</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-pad">
      <div className="page-header">
        <h1>Hiring history</h1>
        <p className="lede">
          {applications.length > 0
            ? `You've submitted ${applications.length} application${applications.length !== 1 ? "s" : ""}. We review every one personally.`
            : "Your application history will appear here after you apply to a role."}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="empty" style={{ marginTop: "48px" }}>
          <h3>No applications yet</h3>
          <p>Browse open roles and hit Apply — everything you submit shows up here.</p>
          <Link href="/jobs" className="btn-ghost">Browse open roles</Link>
        </div>
      ) : (
        <div className="history-list">
          {[...applications].reverse().map(app => {
            const meta = STATUS_META[app.status]
            return (
              <div key={`${app.jobId}-${app.appliedAt}`} className="history-row">
                <div className="history-main">
                  <div className="history-title">{app.jobTitle}</div>
                  <div className="history-meta">
                    <span>{FAMILIES[app.family].label}</span>
                    <span>·</span>
                    <span>{app.level}</span>
                    <span>·</span>
                    <span>Applied {fmtDate(app.appliedAt)}</span>
                  </div>
                  <div className="history-applicant">{app.name} · {app.email}</div>
                </div>
                <div className="history-status" style={{ color: meta.color }}>
                  <span className="history-badge" style={{ background: `${meta.color}18`, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="history-footer">
        <p className="muted" style={{ fontSize: "13px" }}>
          We review every application ourselves and respond within 3 business days.
          Status updates are reflected here.
        </p>
      </div>
    </main>
  )
}
