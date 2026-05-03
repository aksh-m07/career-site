"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Resume, ScoredJob, Job } from "@/lib/types"
import { scoreJob } from "@/lib/jobs-data"

interface AppState {
  resume: Resume | null
  setResume: (r: Resume | null) => void
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
  const [scoredJobs, setScoredJobs] = useState<ScoredJob[]>(
    jobs.map(job => ({ job, score: null, reasons: [] }))
  )
  const [isMatchingWithAI, setIsMatchingWithAI] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [openJob, setOpenJob] = useState<ScoredJob | null>(null)

  function setResume(r: Resume | null) {
    setResumeState(r)
    if (!r) {
      setScoredJobs(jobs.map(job => ({ job, score: null, reasons: [] })))
    } else {
      // Score all jobs client-side using the sample scoring logic
      setScoredJobs(
        jobs.map(job => {
          const { score, reasons } = scoreJob(job, r)
          return { job, score, reasons }
        })
      )
    }
  }

  return (
    <AppContext.Provider value={{
      resume, setResume,
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
