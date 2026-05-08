import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import type { CandidateProfile, Family, Job, Level } from "./types"
import { LEVEL_RANK } from "./types"

const getClient = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FAMILY_GROUPS: Record<string, Family[]> = {
  technical: ["eng", "data", "product", "design"],
  clinical:  ["health"],
  business:  ["finance", "ops", "legal", "marketing", "sales", "people", "cs"],
}

function getFamilyGroup(f: Family): string {
  for (const [group, fams] of Object.entries(FAMILY_GROUPS)) {
    if (fams.includes(f)) return group
  }
  return "other"
}

const CandidateProfileSchema = z.object({
  name: z.string().optional().nullable(),
  currentTitle: z.string(),
  seniorityLevel: z.enum(["Intern", "Associate", "Mid", "Senior", "Staff", "Lead", "Manager", "Director", "VP", "Executive"]),
  yearsOfExperience: z.number(),
  family: z.enum(["eng", "design", "product", "data", "marketing", "sales", "ops", "finance", "people", "legal", "cs", "health"]),
  skills: z.array(z.string()),
  industries: z.array(z.string()),
  summary: z.string(),
})

const MatchResultSchema = z.array(
  z.object({
    jobId: z.string(),
    matchScore: z.number().min(0).max(100),
    matchReason: z.string(),
  })
)

export async function parseResume(resumeText: string): Promise<CandidateProfile> {
  const message = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Parse this resume and return ONLY valid JSON — no other text.

Schema:
{
  "name": string | null,
  "currentTitle": string,
  "seniorityLevel": "Intern" | "Associate" | "Mid" | "Senior" | "Staff" | "Lead" | "Manager" | "Director" | "VP" | "Executive",
  "yearsOfExperience": number,
  "family": "eng" | "design" | "product" | "data" | "marketing" | "sales" | "ops" | "finance" | "people" | "legal" | "cs" | "health",
  "skills": string[],
  "industries": string[],
  "summary": string
}

Rules:
- skills: ONLY standalone technologies, languages, frameworks, tools, methodologies (e.g. "TypeScript", "React", "SQL"). Do NOT include project names, company names, or descriptions.
- summary: 2-3 sentences describing the candidate's career trajectory and core value. Write in third person. Do NOT list projects or responsibilities — describe who they are professionally.
- yearsOfExperience: count ONLY full-time professional employment. Exclude internships, student projects, and academic experience. If the person's entire experience is internships, set to 0.
- seniorityLevel: base this on the candidate's CURRENT or MOST RECENT full-time professional role and their overall career arc. IGNORE titles held in university clubs, student organizations, volunteer groups, or extracurricular activities — a "VP of a university club" is a student, not a corporate VP. A person currently working full-time as an engineer is NOT an Intern even if they had internships in the past. Intern=student or <1yr full-time, Associate=1-3yr, Mid=3-6yr, Senior=6-10yr, Staff/Lead=broad scope 8-12yr, Manager=manages people at a company, Director=manages managers at a company, VP=senior corporate leader, Executive=C-suite.
- family: eng=software/devops/infra, data=ML/data science/analytics, product=product management, design=UX/brand/visual, marketing=marketing/comms/growth, sales=sales/BD, ops=operations/biz ops/strategy, finance=finance/accounting, people=HR/recruiting, legal=legal/compliance, cs=customer success/support/implementation, health=clinical/medical/nursing.

Resume:
${resumeText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") throw new Error("Unexpected response type from Claude")
  const text = content.text

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("No JSON found in Claude response")

  const parsed = JSON.parse(jsonMatch[0])
  return CandidateProfileSchema.parse(parsed) as CandidateProfile
}

export async function matchJobsToProfile(
  profile: CandidateProfile,
  allJobs: Job[]
): Promise<(Job & { matchScore: number; matchReason: string })[]> {
  const candidateRank = LEVEL_RANK[profile.seniorityLevel as Level]
  const candidateGroup = getFamilyGroup(profile.family)

  // Pre-filter: hard mismatches before calling Claude
  const eligible = allJobs.filter(job => {
    const jobRank = LEVEL_RANK[job.level]
    if (Math.abs(candidateRank - jobRank) > 3) return false
    const jobGroup = getFamilyGroup(job.family)
    if (candidateGroup === "clinical" && jobGroup === "technical") return false
    if (candidateGroup === "technical" && jobGroup === "clinical") return false
    return true
  })

  if (eligible.length === 0) {
    return allJobs.map(j => ({ ...j, matchScore: 0, matchReason: "Domain and seniority mismatch" }))
  }

  const jobsForClaude = eligible.map(j => ({
    id: j.id,
    title: j.title,
    family: j.family,
    level: j.level,
    skills: j.skills,
    blurb: j.blurb,
  }))

  const message = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert recruiter. Score each job's fit for this candidate 0-100.

Scoring: domain alignment (50pts) + seniority fit (30pts) + skills overlap (20pts).
80+ = excellent. 50-79 = good. Below 50 = weak.

Candidate:
${JSON.stringify(profile, null, 2)}

Jobs:
${JSON.stringify(jobsForClaude, null, 2)}

Return ONLY a JSON array, no other text:
[{ "jobId": string, "matchScore": number, "matchReason": string (max 15 words, specific) }]`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") throw new Error("Unexpected response type from Claude")
  const text = content.text

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error("No JSON array in Claude response")

  const results = MatchResultSchema.parse(JSON.parse(jsonMatch[0]))
  const scoreMap = new Map(results.map(r => [r.jobId, r]))

  return eligible.map(job => {
    const r = scoreMap.get(job.id)
    if (!r) return { ...job, matchScore: 0, matchReason: "Not evaluated" }
    return { ...job, matchScore: r.matchScore, matchReason: r.matchReason }
  })
}
