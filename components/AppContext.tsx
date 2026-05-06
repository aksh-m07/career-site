"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Resume, ScoredJob, Job, CandidateProfile } from "@/lib/types"
import { scoreJob } from "@/lib/jobs-data"

interface AppState {
  resume: Resume | null
  setResume: (r: Resume | null) => void
  setResumeRaw: (r: Resume | null) => void
  candidateProfile: CandidateProfile | null
  setCandidateProfile: (p: CandidateProfile | null) => void
  scoredJobs: ScoredJob[]
  setScoredJobs: (jobs: ScoredJob[]) => void
  isMatchingWithAI: boolean
  setIsMatchingWithAI: (v: boolean) => void
  modalOpen: boolean
  setModalOpen: (v: boolean) => void
  openJob: ScoredJob | null
  setOpenJob: (j: ScoredJob | null) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children, jobs }: { children: ReactNode; jobs: Job[] }) {
  const [resume, setResumeState] = useState<Resume | null>(null)
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null)
  const [scoredJobs, setScoredJobs] = useState<ScoredJob[]>(
    jobs.map(job => ({ job, score: null, reasons: [] }))
  )
  const [isMatchingWithAI, setIsMatchingWithAI] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [openJob, setOpenJob] = useState<ScoredJob | null>(null)

  // Used for sample profiles — auto-scores client-side
  function setResume(r: Resume | null) {
    setResumeState(r)
    setCandidateProfile(null)
    if (!r) {
      setScoredJobs(jobs.map(job => ({ job, score: null, reasons: [] })))
    } else {
      setScoredJobs(jobs.map(job => {
        const { score, reasons } = scoreJob(job, r)
        return { job, score, reasons }
      }))
    }
  }

  // Used after real upload — caller sets AI scores separately
  function setResumeRaw(r: Resume | null) {
    setResumeState(r)
    if (!r) setScoredJobs(jobs.map(job => ({ job, score: null, reasons: [] })))
  }

  return (
    <AppContext.Provider value={{
      resume, setResume, setResumeRaw,
      candidateProfile, setCandidateProfile,
      scoredJobs, setScoredJobs,
      isMatchingWithAI, setIsMatchingWithAI,
      modalOpen, setModalOpen,
      openJob, setOpenJob,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used inside AppProvider")
  return ctx
}
