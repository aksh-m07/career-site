"use client"

import { useState, useEffect } from "react"
import { useApp } from "./AppContext"
import { RESUMES } from "@/lib/jobs-data"
import { Icons } from "./Icons"
import type { CandidateProfile } from "@/lib/types"
import { LEVEL_RANK } from "@/lib/types"

type Stage = "idle" | "uploading" | "analyzing" | "done"

export function ResumeModal() {
  const { modalOpen, setModalOpen, resume, setResumeRaw, setScoredJobs, setCandidateProfile } = useApp()
  const [stage, setStage] = useState<Stage>("idle")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!modalOpen) { setStage("idle"); setProgress(0) }
  }, [modalOpen])

  if (!modalOpen) return null

  async function handleFileUpload(file: File) {
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
        setResumeRaw(syntheticResume as typeof RESUMES[string])
        setCandidateProfile(profile)
        if (matchData.jobs) {
          setScoredJobs(matchData.jobs.map((j: { matchScore: number; matchReason: string } & Record<string, unknown>) => ({
            job: j,
            score: j.matchScore,
            reasons: j.matchReason ? [j.matchReason] : [],
          })))
        }
        setModalOpen(false)
      }, 500)
    } catch {
      clearInterval(t)
      setStage("idle")
    }
  }

  return (
    <div className="modal-scrim" onClick={() => setModalOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={() => setModalOpen(false)}><Icons.close /></button>

        {stage === "idle" && (
          <>
            <div className="modal-eyebrow">AI-powered matching</div>
            <h2 className="modal-title">Upload your resume</h2>
            <p className="modal-lede">
              Claude will extract your skills, experience, and seniority — then re-rank every
              open role around your profile. Takes about 30 seconds.
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
                <span>PDF, DOCX, or TXT · up to 10 MB · powered by Claude AI</span>
              </div>
            </label>
            <p className="modal-fineprint">
              Your resume is never stored. It is parsed once, in memory, and discarded after matching.
            </p>
          </>
        )}

        {(stage === "uploading" || stage === "analyzing") && (
          <div className="processing">
            <div className="processing-icon"><Icons.doc /></div>
            <h3>{stage === "uploading" ? "Reading your resume…" : "Matching against open roles…"}</h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${stage === "analyzing" ? 100 : progress}%` }} />
            </div>
            <ul className="processing-steps">
              <li className={progress > 20 ? "ok" : ""}><Icons.check /> Parsed contact, education, work history</li>
              <li className={progress > 50 ? "ok" : ""}><Icons.check /> Extracted skills & seniority signals</li>
              <li className={stage === "analyzing" ? "ok" : ""}><Icons.check /> Scored against job corpus</li>
              <li><Icons.check /> Re-ranked for relevance</li>
            </ul>
          </div>
        )}

        {stage === "done" && (
          <div className="processing">
            <div className="processing-icon ok"><Icons.check /></div>
            <h3>Resume uploaded.</h3>
            <p>All roles are now ranked for your profile.</p>
          </div>
        )}
      </div>
    </div>
  )
}
