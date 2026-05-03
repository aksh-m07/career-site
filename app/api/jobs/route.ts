import { NextResponse } from "next/server"
import { JOBS } from "@/lib/jobs-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const family = searchParams.get("family")
  const region = searchParams.get("region")
  const search = searchParams.get("search")?.toLowerCase()
  const remote = searchParams.get("remote")

  let filtered = JOBS

  if (family && family !== "all") filtered = filtered.filter(j => j.family === family)
  if (region && region !== "all") filtered = filtered.filter(j => j.region === region)
  if (remote === "true") filtered = filtered.filter(j => j.remote)
  if (search) {
    filtered = filtered.filter(j =>
      j.title.toLowerCase().includes(search) ||
      j.blurb.toLowerCase().includes(search) ||
      j.skills.some(s => s.toLowerCase().includes(search)) ||
      j.team.toLowerCase().includes(search)
    )
  }

  return NextResponse.json({ jobs: filtered, total: filtered.length })
}
