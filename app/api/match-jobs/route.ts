import { NextResponse } from "next/server"
import { matchJobsToProfile } from "@/lib/claude"
import { JOBS } from "@/lib/jobs-data"
import type { CandidateProfile } from "@/lib/types"
import { z } from "zod"

const FAMILIES = ["eng", "design", "product", "data", "marketing", "sales", "ops", "finance", "people", "legal", "cs", "health"] as const
const LEVELS = ["Intern", "Associate", "Mid", "Senior", "Staff", "Lead", "Manager", "Director", "VP", "Executive"] as const

const RequestSchema = z.object({
  profile: z.object({
    name: z.string().optional().nullable(),
    currentTitle: z.string(),
    seniorityLevel: z.enum(LEVELS),
    yearsOfExperience: z.number(),
    family: z.enum(FAMILIES),
    specialization: z.string().default(""),
    skills: z.array(z.string()),
    industries: z.array(z.string()),
    summary: z.string(),
  }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { profile } = RequestSchema.parse(body)

    const matched = await matchJobsToProfile(profile as CandidateProfile, JOBS)

    matched.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))

    return NextResponse.json({ jobs: matched, total: matched.length })
  } catch (error) {
    console.error("Match jobs error:", error)
    return NextResponse.json(
      { error: "Failed to match jobs. Please try again." },
      { status: 500 }
    )
  }
}
