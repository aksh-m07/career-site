import { NextResponse } from "next/server"
import jobs from "@/data/jobs.json"
import type { Job } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("domain")
  const seniority = searchParams.get("seniority")
  const search = searchParams.get("search")?.toLowerCase()
  const remote = searchParams.get("remote")

  let filtered = jobs as Job[]

  if (domain && domain !== "all") {
    filtered = filtered.filter((j) => j.domain === domain)
  }
  if (seniority && seniority !== "all") {
    filtered = filtered.filter((j) => j.seniority === seniority)
  }
  if (remote === "true") {
    filtered = filtered.filter((j) => j.remote)
  }
  if (search) {
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(search) ||
        j.company.toLowerCase().includes(search) ||
        j.tags.some((t) => t.toLowerCase().includes(search)) ||
        j.description.toLowerCase().includes(search)
    )
  }

  return NextResponse.json({ jobs: filtered, total: filtered.length })
}
