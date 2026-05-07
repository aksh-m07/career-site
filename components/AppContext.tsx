"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { Resume, ScoredJob, Job, CandidateProfile, Application } from "@/lib/types"
import { scoreJob } from "@/lib/jobs-data"

export interface User { name: string; email: string }

interface AppState {
  hydrated: boolean
  user: User | null
  login: (name: string, email: string) => void
  logout: () => void
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
  applications: Application[]
  addApplication: (app: Omit<Application, "appliedAt" | "status">) => void
}

const AppContext = createContext<AppState | null>(null)

const USER_KEY = "decimal_user"
const resumeKey = (email: string) => `decimal_resume_${email}`

export function AppProvider({ children, jobs }: { children: ReactNode; jobs: Job[] }) {
  const [hydrated, setHydrated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [resume, setResumeState] = useState<Resume | null>(null)
  const [candidateProfile, setCandidateProfileState] = useState<CandidateProfile | null>(null)
  const [scoredJobs, setScoredJobs] = useState<ScoredJob[]>(
    jobs.map(job => ({ job, score: null, reasons: [] }))
  )
  const [isMatchingWithAI, setIsMatchingWithAI] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [openJob, setOpenJob] = useState<ScoredJob | null>(null)
  const [applications, setApplications] = useState<Application[]>([])

  const resumeRef = useRef(resume)
  const profileRef = useRef(candidateProfile)

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY)
    if (!savedUser) { setHydrated(true); return }
    const u: User = JSON.parse(savedUser)
    setUser(u)

    const savedResume = localStorage.getItem(resumeKey(u.email))
    if (savedResume) {
      const { resume: r, candidateProfile: cp } = JSON.parse(savedResume) as {
        resume: Resume; candidateProfile: CandidateProfile | null
      }
      setResumeState(r)
      resumeRef.current = r
      setCandidateProfileState(cp)
      profileRef.current = cp
      setScoredJobs(jobs.map(job => {
        const { score, reasons } = scoreJob(job, r)
        return { job, score, reasons }
      }))
    }

    setHydrated(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function persistResume(u: User, r: Resume | null, cp: CandidateProfile | null) {
    if (!u || !r) return
    localStorage.setItem(resumeKey(u.email), JSON.stringify({ resume: r, candidateProfile: cp }))
  }

  function login(name: string, email: string) {
    const u = { name, email }
    setUser(u)
    localStorage.setItem(USER_KEY, JSON.stringify(u))

    // Restore saved resume for this account
    const saved = localStorage.getItem(resumeKey(email))
    if (saved) {
      const { resume: r, candidateProfile: cp } = JSON.parse(saved) as {
        resume: Resume; candidateProfile: CandidateProfile | null
      }
      setResumeState(r)
      resumeRef.current = r
      setCandidateProfileState(cp)
      profileRef.current = cp
      setScoredJobs(jobs.map(job => {
        const { score, reasons } = scoreJob(job, r)
        return { job, score, reasons }
      }))
    } else if (resumeRef.current) {
      // Save whatever is already uploaded under this new account
      persistResume(u, resumeRef.current, profileRef.current)
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(USER_KEY)
    setResumeState(null)
    resumeRef.current = null
    setCandidateProfileState(null)
    profileRef.current = null
    setScoredJobs(jobs.map(job => ({ job, score: null, reasons: [] })))
  }

  function setCandidateProfile(p: CandidateProfile | null) {
    setCandidateProfileState(p)
    profileRef.current = p
    if (user && resumeRef.current) persistResume(user, resumeRef.current, p)
  }

  function setResume(r: Resume | null) {
    setResumeState(r)
    resumeRef.current = r
    setCandidateProfileState(null)
    profileRef.current = null
    if (!r) {
      setScoredJobs(jobs.map(job => ({ job, score: null, reasons: [] })))
    } else {
      setScoredJobs(jobs.map(job => {
        const { score, reasons } = scoreJob(job, r)
        return { job, score, reasons }
      }))
      if (user) persistResume(user, r, null)
    }
  }

  function setResumeRaw(r: Resume | null) {
    setResumeState(r)
    resumeRef.current = r
    if (!r) setScoredJobs(jobs.map(job => ({ job, score: null, reasons: [] })))
    if (user && r) persistResume(user, r, profileRef.current)
  }

  function addApplication(app: Omit<Application, "appliedAt" | "status">) {
    setApplications(prev => [
      ...prev.filter(a => a.jobId !== app.jobId),
      { ...app, appliedAt: new Date().toISOString(), status: "Applied" },
    ])
  }

  return (
    <AppContext.Provider value={{
      hydrated,
      user, login, logout,
      resume, setResume, setResumeRaw,
      candidateProfile, setCandidateProfile,
      scoredJobs, setScoredJobs,
      isMatchingWithAI, setIsMatchingWithAI,
      modalOpen, setModalOpen,
      openJob, setOpenJob,
      applications, addApplication,
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
