import { NextResponse } from "next/server"
import { matchJobsToProfile } from "@/lib/claude"
import jobs from "@/data/jobs.json"
import type { CandidateProfile, Job } from "@/lib/types"
import { z } from "zod"

const RequestSchema = z.object({
  profile: z.object({
    name: z.string().optional().nullable(),
    currentTitle: z.string(),
    seniorityLevel: z.enum(["intern", "junior", "mid", "senior", "staff", "principal", "director", "vp", "c-suite"]),
    yearsOfExperience: z.number(),
    domain: z.enum(["engineering", "healthcare", "finance", "data", "operations", "design", "product", "legal", "marketing"]),
    skills: z.array(z.string()),
    industries: z.array(z.string()),
    summary: z.string(),
  }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { profile } = RequestSchema.parse(body)

    const matched = await matchJobsToProfile(profile as CandidateProfile, jobs as Job[])

    // Sort: recommended first, then by score descending
    matched.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1
      if (!a.isRecommended && b.isRecommended) return 1
      return b.matchScore - a.matchScore
    })

    return NextResponse.json({ jobs: matched, total: matched.length })
  } catch (error) {
    console.error("Match jobs error:", error)
    return NextResponse.json(
      { error: "Failed to match jobs. Please try again." },
      { status: 500 }
    )
  }
}
