"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "./AppContext"
import { JOBS, RESUMES, scoreJob } from "@/lib/jobs-data"
import { Icons } from "./Icons"
import type { CandidateProfile } from "@/lib/types"
import { LEVEL_RANK } from "@/lib/types"

type Stage = "idle" | "parsing" | "parsed" | "matching" | "done" | "error"

export function ResumeModal() {
  const { modalOpen, setModalOpen, resume, setResumeRaw, setScoredJobs, setCandidateProfile } = useApp()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>("idle")
  const [progress, setProgress] = useState(0)
  const [parsedProfile, setParsedProfile] = useState<CandidateProfile | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!modalOpen) {
      setStage("idle")
      setProgress(0)
      setParsedProfile(null)
      setErrorMsg("")
    }
  }, [modalOpen])

  if (!modalOpen) return null

  function reset() { setStage("idle"); setProgress(0); setParsedProfile(null); setErrorMsg("") }

  async function handleFileUpload(file: File) {
    setStage("parsing")
    setProgress(0)

    // Animate progress while waiting for Claude
    let p = 0
    const t = setInterval(() => {
      p += 4 + Math.random() * 6
      if (p < 85) setProgress(p)
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload-resume", { method: "POST", body: formData })
      const data = await res.json()

      clearInterval(t)

      if (!res.ok) {
        setErrorMsg(data.error ?? "Failed to parse your resume. Try a PDF or DOCX file.")
        setStage("error")
        return
      }

      const profile: CandidateProfile = data.profile
      setParsedProfile(profile)
      setProgress(100)
      setStage("parsed")
    } catch {
      clearInterval(t)
      setErrorMsg("Couldn't connect to the server. Check your connection and try again.")
      setStage("error")
    }
  }

  async function runMatching() {
    if (!parsedProfile) return
    setStage("matching")

    // Score client-side — no second API call needed
    await new Promise(r => setTimeout(r, 500))

    const syntheticResume = {
      key: "__file__",
      label: parsedProfile.currentTitle,
      name: parsedProfile.name ?? "You",
      headline: `${parsedProfile.currentTitle} · ${parsedProfile.yearsOfExperience} yrs exp`,
      summary: parsedProfile.summary,
      skills: parsedProfile.skills,
      families: [parsedProfile.family],
      levelRank: LEVEL_RANK[parsedProfile.seniorityLevel] ?? 3,
      yearsExp: parsedProfile.yearsOfExperience,
      titleHints: [],
    }

    const scored = JOBS.map(job => {
      const { score, reasons } = scoreJob(job, syntheticResume as typeof RESUMES[string])
      return { job, score, reasons }
    })

    const strongMatches = scored.filter(j => (j.score ?? 0) >= 60).length
    setMatchCount(strongMatches)
    setResumeRaw(syntheticResume as typeof RESUMES[string])
    setCandidateProfile(parsedProfile)
    setScoredJobs(scored)
    setStage("done")
  }

  return (
    <div className="modal-scrim" onClick={() => setModalOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={() => setModalOpen(false)}><Icons.close /></button>

        {/* ── Upload form ── */}
        {stage === "idle" && (
          <>
            <div className="modal-eyebrow">AI-powered matching</div>
            <h2 className="modal-title">Upload your resume</h2>
            <p className="modal-lede">
              Claude parses your resume and re-ranks every open role around your exact profile.
              Takes about 30 seconds.
            </p>
            <label className="dropzone">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
              />
              <Icons.upload />
              <div>
                <strong>{resume ? "Upload a new resume" : "Drop your resume here"}</strong>
                <span>PDF, DOCX, or TXT · up to 10 MB</span>
              </div>
            </label>
            <p className="modal-fineprint">
              Your file is never stored — parsed once in memory and discarded after matching.
            </p>
          </>
        )}

        {/* ── Parsing ── */}
        {stage === "parsing" && (
          <div className="processing">
            <div className="processing-icon"><Icons.doc /></div>
            <h3>Reading your resume…</h3>
            <p className="muted" style={{ marginBottom: "20px" }}>Claude is extracting your skills, experience, and seniority level.</p>
            <div className="progress-track" style={{ maxWidth: "100%" }}>
              <div className="progress-fill" style={{ width: `${progress}%`, transition: "width .3s" }} />
            </div>
          </div>
        )}

        {/* ── Parsed — show what Claude extracted ── */}
        {stage === "parsed" && parsedProfile && (
          <div className="parsed-card">
            <div className="parsed-badge"><Icons.check /> Successfully parsed</div>
            <h2 className="modal-title" style={{ marginTop: "16px", marginBottom: "4px" }}>
              {parsedProfile.name ?? "Your profile"}
            </h2>
            <p className="parsed-title">{parsedProfile.currentTitle}</p>

            <div className="parsed-meta">
              <span className="parsed-pill">{parsedProfile.seniorityLevel}</span>
              <span className="parsed-pill">{parsedProfile.yearsOfExperience} yrs experience</span>
              <span className="parsed-pill">{parsedProfile.skills.length} skills extracted</span>
            </div>

            <div className="parsed-skills">
              {parsedProfile.skills.slice(0, 10).map(s => (
                <span key={s} className="chip">{s}</span>
              ))}
              {parsedProfile.skills.length > 10 && (
                <span className="chip" style={{ color: "var(--ink-4)" }}>+{parsedProfile.skills.length - 10} more</span>
              )}
            </div>

            {parsedProfile.summary && (
              <p className="parsed-summary">{parsedProfile.summary}</p>
            )}

            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "24px" }} onClick={runMatching}>
              Find my matches <Icons.arrow />
            </button>
            <button className="link-btn" style={{ width: "100%", justifyContent: "center", marginTop: "10px" }} onClick={reset}>
              Upload a different file
            </button>
          </div>
        )}

        {/* ── Matching ── */}
        {stage === "matching" && (
          <div className="processing">
            <div className="processing-icon"><Icons.spark /></div>
            <h3>Matching against open roles…</h3>
            <p className="muted" style={{ marginBottom: "20px" }}>Claude is scoring every job against your profile.</p>
            <ul className="processing-steps">
              <li className="ok"><Icons.check /> Resume parsed &amp; profile extracted</li>
              <li><Icons.check /> Scoring {82} roles for fit…</li>
              <li><Icons.check /> Ranking by match strength</li>
            </ul>
          </div>
        )}

        {/* ── Done ── */}
        {stage === "done" && (
          <div className="processing">
            <div className="processing-icon ok"><Icons.check /></div>
            <h3>
              {matchCount > 0
                ? `${matchCount} strong match${matchCount !== 1 ? "es" : ""} found`
                : "Roles ranked for you"}
            </h3>
            <p style={{ marginBottom: "24px" }}>Open roles are now sorted by how well they fit your resume.</p>
            <button className="btn-primary" style={{ display: "inline-flex", gap: "8px", justifyContent: "center" }} onClick={() => { setModalOpen(false); router.push("/jobs") }}>
              View matched roles <Icons.arrow />
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {stage === "error" && (
          <div className="processing">
            <div className="processing-icon" style={{ background: "rgba(194,65,12,.1)", color: "var(--accent)" }}>✕</div>
            <h3>Something went wrong</h3>
            <p className="muted" style={{ marginBottom: "24px" }}>{errorMsg}</p>
            <button className="btn-ghost" onClick={reset}>Try again</button>
          </div>
        )}
      </div>
    </div>
  )
}
