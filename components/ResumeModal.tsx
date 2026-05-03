"use client"

import { useState, useEffect } from "react"
import { useApp } from "./AppContext"
import { RESUMES } from "@/lib/jobs-data"
import { Icons } from "./Icons"
import type { CandidateProfile } from "@/lib/types"
import { LEVEL_RANK } from "@/lib/types"

type Stage = "idle" | "uploading" | "analyzing" | "done"

export function ResumeModal() {
  const { modalOpen, setModalOpen, resume, setResume, setScoredJobs } = useApp()
  const [stage, setStage] = useState<Stage>("idle")

  const [picked, setPicked] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!modalOpen) { setStage("idle"); setPicked(null); setProgress(0) }
  }, [modalOpen])

  if (!modalOpen) return null

  function chooseSample(key: string) {
    setPicked(key)
    setStage("uploading")
    let p = 0
    const t = setInterval(() => {
      p += 8 + Math.random() * 10
      if (p >= 100) {
        clearInterval(t)
        setProgress(100)
        setStage("analyzing")
        setTimeout(() => {
          setStage("done")
          setTimeout(() => {
            setResume(RESUMES[key])
            setModalOpen(false)
          }, 600)
        }, 1000)
      } else {
        setProgress(p)
      }
    }, 110)
  }

  async function handleFileUpload(file: File) {
    setPicked("__file__")
    setStage("uploading")
    let p = 0
    const t = setInterval(() => {
      p += 5
      if (p < 70) setProgress(p)
    }, 150)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload-resume", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      const profile: CandidateProfile = data.profile

      clearInterval(t)
      setProgress(100)
      setStage("analyzing")

      const matchRes = await fetch("/api/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      })
      const matchData = await matchRes.json()

      setStage("done")
      setTimeout(() => {
        // Build synthetic Resume from profile for display
        const syntheticResume = {
          key: "__file__",
          label: profile.currentTitle,
          name: profile.name ?? "You",
          headline: `${profile.currentTitle} · ${profile.yearsOfExperience} years`,
          summary: profile.summary,
          skills: profile.skills,
          families: [profile.family],
          levelRank: LEVEL_RANK[profile.seniorityLevel] ?? 3,
          yearsExp: profile.yearsOfExperience,
          titleHints: [],
        }
        // Use AI-scored jobs
        if (matchData.jobs) {
          setScoredJobs(matchData.jobs.map((j: { matchScore: number; matchReason: string } & Record<string, unknown>) => ({
            job: j,
            score: j.matchScore,
            reasons: j.matchReason ? [j.matchReason] : [],
          })))
        }
        setResume(syntheticResume as typeof RESUMES[string])
        setModalOpen(false)
      }, 500)
    } catch {
      clearInterval(t)
      setStage("idle")
    }
  }

  const sampleList = Object.values(RESUMES)
  const currentKey = resume?.key ?? null

  return (
    <div className="modal-scrim" onClick={() => setModalOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={() => setModalOpen(false)}><Icons.close/></button>

        {stage === "idle" && (
          <>
            <div className="modal-eyebrow">Personalize your view</div>
            <h2 className="modal-title">Upload your resume</h2>
            <p className="modal-lede">
              We&apos;ll extract your skills and re-rank all open roles around your profile.
              Your resume is processed securely — not stored until you apply.
            </p>
            <label className="dropzone">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
              />
              <Icons.upload/>
              <div>
                <strong>Drop your resume here</strong>
                <span>PDF, DOCX, or TXT · up to 10 MB · powered by Claude AI</span>
              </div>
            </label>
            <div className="modal-or"><span>or try a sample profile</span></div>
            <div className="sample-grid">
              {sampleList.map(r => (
                <button
                  key={r.key}
                  className={`sample-card ${currentKey === r.key ? "is-current" : ""}`}
                  onClick={() => chooseSample(r.key)}
                >
                  <div className="sample-name">{r.name}</div>
                  <div className="sample-headline">{r.headline}</div>
                  <div className="sample-skills">
                    {r.skills.slice(0, 4).map((s, i) => <span key={i} className="chip">{s}</span>)}
                  </div>
                </button>
              ))}
            </div>
            <p className="modal-fineprint">
              Sample profiles use client-side scoring. Real resume uploads use Claude AI for full parsing and matching.
            </p>
          </>
        )}

        {(stage === "uploading" || stage === "analyzing") && (
          <div className="processing">
            <div className="processing-icon"><Icons.doc/></div>
            <h3>{stage === "uploading" ? "Reading your resume…" : "Matching against open roles…"}</h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stage === "analyzing" ? 100 : progress}%` }}/>
            </div>
            <ul className="processing-steps">
              <li className={progress > 20 ? "ok" : ""}><Icons.check/> Parsed contact, education, work history</li>
              <li className={progress > 50 ? "ok" : ""}><Icons.check/> Extracted skills & seniority signals</li>
              <li className={stage === "analyzing" ? "ok" : ""}><Icons.check/> Scored against job corpus</li>
              <li className=""><Icons.check/> Re-ranked for relevance</li>
            </ul>
          </div>
        )}

        {stage === "done" && (
          <div className="processing">
            <div className="processing-icon ok"><Icons.check/></div>
            <h3>You&apos;re all set.</h3>
            <p>Showing all roles, re-ranked for you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
