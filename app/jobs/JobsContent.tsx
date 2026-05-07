"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useApp } from "@/components/AppContext"
import { JobRow } from "@/components/JobRow"
import { Icons } from "@/components/Icons"
import { FAMILIES, type Family } from "@/lib/types"

const PAGE_SIZE = 20
const FAMILY_KEYS = Object.keys(FAMILIES) as Family[]

export function JobsContent() {
  const { scoredJobs, resume, setOpenJob, setModalOpen } = useApp()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState("")
  const [family, setFamily] = useState<Family | "all">(
    (searchParams.get("family") as Family | null) ?? "all"
  )
  // Removed region and remoteOnly filters
  const [page, setPage] = useState(1)
  const [density, setDensity] = useState<"compact" | "default" | "comfy">("default")
  const prevResumeRef = useRef(resume)

  // When resume is first loaded, default to the candidate's primary field
  useEffect(() => {
    if (resume && !prevResumeRef.current && resume.families?.[0]) {
      setFamily(resume.families[0] as Family)
    }
    prevResumeRef.current = resume
  }, [resume])

  useEffect(() => { setPage(1) }, [search, family])

  const isMatch = resume !== null

  const filtered = useMemo(() => {
    let items = [...scoredJobs]
    if (family !== "all") items = items.filter(i => i.job.family === family)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        i.job.title.toLowerCase().includes(q) ||
        i.job.blurb.toLowerCase().includes(q) ||
        i.job.skills.some(s => s.toLowerCase().includes(q)) ||
        i.job.team.toLowerCase().includes(q)
      )
    }
    if (isMatch) {
      // Hide hard-mismatch jobs (domain or level incompatibility)
      items = items.filter(i => i.score === null || i.score > 0)
      items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    } else {
      items.sort((a, b) => a.job.postedDays - b.job.postedDays)
    }
    return items
  }, [scoredJobs, family, search, isMatch])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const relevantCount = useMemo(() =>
    isMatch ? scoredJobs.filter(i => (i.score ?? 0) >= 5).length : scoredJobs.length
  , [scoredJobs, isMatch])

  const familyCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const base = isMatch ? scoredJobs.filter(i => (i.score ?? 0) >= 5) : scoredJobs
    for (const f of FAMILY_KEYS) counts[f] = base.filter(i => i.job.family === f).length
    return counts
  }, [scoredJobs, isMatch])

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce<(number | "…")[]>((acc, n, i, arr) => {
      if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push("…")
      acc.push(n)
      return acc
    }, [])

  return (
    <main className="jobs-page page-pad">
      <div className="page-header">
        <h1>Open roles</h1>
        <p className="lede">
          {isMatch
            ? `Showing ${relevantCount} of ${scoredJobs.length} roles matched to your profile — irrelevant positions hidden, ranked by fit.`
            : `${scoredJobs.length} positions across engineering, design, product, and more. Upload your resume for personalized ranking.`}
        </p>
      </div>


      <div className="jobs-toolbar">
        <div className="jobs-search">
          <Icons.search />
          <input
            type="text"
            placeholder="Search roles, skills, teams…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="icon-btn" style={{ border: 0 }} onClick={() => setSearch("")}>
              <Icons.close />
            </button>
          )}
        </div>

        {/* Removed region filter buttons and remote only toggle */}

        {!isMatch && (
          <button className="btn-ghost sm" onClick={() => setModalOpen(true)}>
            <Icons.upload /> Upload resume
          </button>
        )}

        {/* Removed view toggle buttons */}
      </div>

      <div className="roles-layout">
        <aside>
          <nav className="filters">
            <div className="filter-hd">
              <h4><Icons.filter /> Filters</h4>
              {family !== "all" && (
                <button className="link-btn sm" onClick={() => { setFamily("all") }}>
                  <Icons.reset /> Reset
                </button>
              )}
            </div>

            <div className="filter-group">
              <div className="filter-label">Department</div>
              <ul className="filter-options">
                <li>
                  <button className={`filter-opt ${family === "all" ? "on" : ""}`} onClick={() => setFamily("all")}>
                    All departments
                    <span className="filter-count">{relevantCount}</span>
                  </button>
                </li>
                {FAMILY_KEYS.map(f => (
                  <li key={f}>
                    <button className={`filter-opt ${family === f ? "on" : ""}`} onClick={() => setFamily(family === f ? "all" : f)}>
                      {FAMILIES[f].label}
                      <span className="filter-count">{familyCounts[f] ?? 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-foot">
              <p className="tiny muted">
                {isMatch
                  ? "Roles ranked by AI match score for your profile."
                  : "Upload your resume for personalized match scoring."}
              </p>
            </div>
          </nav>
        </aside>

        <div>
          {isMatch && family !== "all" && (
            <div className="personalized-bar">
              <span>Showing roles in <strong>{FAMILIES[family as Family].label}</strong> — your matched field</span>
              <button className="link-btn sm" onClick={() => setFamily("all")}>
                Show all {relevantCount} matched roles
              </button>
            </div>
          )}
          <div className="results-bar">
            <span>
              Showing <strong>{filtered.length}</strong> role{filtered.length !== 1 ? "s" : ""}
              {family !== "all" ? ` in ${FAMILIES[family as Family].label}` : ""}
            </span>
            {isMatch && <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>Ranked by match score</span>}
          </div>

          {paged.length === 0 ? (
            <div className="empty">
              <h3>No roles found</h3>
              <p>Try adjusting your filters or search term.</p>
              <button className="btn-ghost" onClick={() => { setSearch(""); setFamily("all") }}>
                <Icons.reset /> Clear filters
              </button>
            </div>
          ) : isMatch ? (
            (() => {
              const matched = paged.filter(i => (i.score ?? 0) >= 50)
              const other = paged.filter(i => (i.score ?? 0) < 50)
              return (
                <>
                  {matched.length > 0 && (
                    <div className={`job-list density-${density}`}>
                      {matched.map(item => (
                        <JobRow key={item.job.id} item={item} isMatch={isMatch} onClick={() => setOpenJob(item)} />
                      ))}
                    </div>
                  )}
                  {other.length > 0 && (
                    <>
                      <div className="jobs-section-break">
                        <div className="jobs-section-break-label">
                          {matched.length === 0 ? "All roles" : "Other roles"} — lower match with your current resume
                        </div>
                        <p className="jobs-section-break-hint">
                          These roles don&apos;t closely match your profile, but tailoring your resume for a specific job can significantly improve your chances. Open any role to see exactly what to change.
                        </p>
                      </div>
                      <div className={`job-list density-${density}`}>
                        {other.map(item => (
                          <JobRow key={item.job.id} item={item} isMatch={isMatch} onClick={() => setOpenJob(item)} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )
            })()
          ) : (
            <div className={`job-list density-${density}`}>
              {paged.map(item => (
                <JobRow key={item.job.id} item={item} isMatch={isMatch} onClick={() => setOpenJob(item)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-arrow" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <Icons.chevron style={{ transform: "rotate(180deg)" }} /> Previous
              </button>
              <div className="page-nums">
                {pageNums.map((n, i) =>
                  n === "…" ? (
                    <span key={`e${i}`} className="page-ellipsis">…</span>
                  ) : (
                    <button key={n} className={`page-num ${n === page ? "on" : ""}`} onClick={() => setPage(n as number)}>
                      {n}
                    </button>
                  )
                )}
              </div>
              <button className="page-arrow" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next <Icons.chevron />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
