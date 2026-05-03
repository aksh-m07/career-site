"use client"

import { useApp } from "./AppContext"
import { JobDrawer } from "./JobDrawer"

export function JobDrawerWrapper() {
  const { openJob, setOpenJob } = useApp()
  if (!openJob) return null
  return <JobDrawer item={openJob} onClose={() => setOpenJob(null)} />
}
