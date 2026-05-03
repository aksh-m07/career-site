import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import type { CandidateProfile, Domain, MatchedJob, Seniority, Job } from "./types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SENIORITY_RANK: Record<Seniority, number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  staff: 4,
  principal: 5,
  director: 6,
  vp: 7,
  "c-suite": 8,
}

const CandidateProfileSchema = z.object({
  name: z.string().optional().nullable(),
  currentTitle: z.string(),
  seniorityLevel: z.enum(["intern", "junior", "mid", "senior", "staff", "principal", "director", "vp", "c-suite"]),
  yearsOfExperience: z.number(),
  domain: z.enum(["engineering", "healthcare", "finance", "data", "operations", "design", "product", "legal", "marketing"]),
  skills: z.array(z.string()),
  industries: z.array(z.string()),
  summary: z.string(),
})

const MatchResultSchema = z.array(
  z.object({
    jobId: z.string(),
    score: z.number().min(0).max(100),
    reason: z.string(),
  })
)

export async function parseResume(resumeText: string): Promise<CandidateProfile> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a resume parser. Extract structured information from the following resume text.

Return ONLY valid JSON matching this exact schema, with no additional text:
{
  "name": string or null,
  "currentTitle": string (most recent job title),
  "seniorityLevel": one of: "intern" | "junior" | "mid" | "senior" | "staff" | "principal" | "director" | "vp" | "c-suite",
  "yearsOfExperience": number (total years of professional experience),
  "domain": one of: "engineering" | "healthcare" | "finance" | "data" | "operations" | "design" | "product" | "legal" | "marketing",
  "skills": array of strings (technical and soft skills found in the resume),
  "industries": array of strings (industries the candidate has worked in),
  "summary": string (2-sentence summary of candidate profile)
}

Seniority guidelines:
- intern: student or <1 year experience
- junior: 1-3 years
- mid: 3-6 years
- senior: 6-10 years
- staff: 8-12 years with broad scope/impact
- principal: 10+ years with org-wide influence
- director: manages managers or large teams
- vp: VP-level or above, strategic leadership
- c-suite: CEO, CTO, CFO, CMO, COO, etc.

Resume text:
${resumeText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") throw new Error("Unexpected response type from Claude")

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("No JSON found in Claude response")

  const parsed = JSON.parse(jsonMatch[0])
  const validated = CandidateProfileSchema.parse(parsed)
  return validated as CandidateProfile
}

export async function matchJobsToProfile(
  profile: CandidateProfile,
  allJobs: Job[]
): Promise<MatchedJob[]> {
  const candidateSeniorityRank = SENIORITY_RANK[profile.seniorityLevel]

  // Pre-filter: remove hard mismatches before sending to Claude.
  // This is critical at scale — we never want to send 500K jobs to an LLM.
  // Hard rules: seniority cliff (>2 levels apart) and extreme domain mismatch.
  const DOMAIN_GROUPS: Record<string, string[]> = {
    technical: ["engineering", "data", "product"],
    clinical: ["healthcare"],
    business: ["finance", "operations", "legal", "marketing"],
    creative: ["design", "product"],
  }

  function getDomainGroup(domain: Domain): string {
    for (const [group, domains] of Object.entries(DOMAIN_GROUPS)) {
      if (domains.includes(domain)) return group
    }
    return "other"
  }

  const candidateGroup = getDomainGroup(profile.domain)

  const eligibleJobs = allJobs.filter((job) => {
    const jobSeniorityRank = SENIORITY_RANK[job.seniority]
    const seniorityGap = Math.abs(candidateSeniorityRank - jobSeniorityRank)

    // Hard seniority cliff: more than 3 levels apart is almost never a good match
    if (seniorityGap > 3) return false

    // Hard domain mismatch: clinical roles (nursing, medicine) vs. purely technical
    const jobGroup = getDomainGroup(job.domain)
    if (candidateGroup === "clinical" && jobGroup === "technical") return false
    if (candidateGroup === "technical" && jobGroup === "clinical") return false

    return true
  })

  if (eligibleJobs.length === 0) {
    return allJobs.map((job) => ({ ...job, matchScore: 0, matchReason: "Domain and seniority mismatch", isRecommended: false }))
  }

  // Send eligible jobs to Claude Sonnet for nuanced scoring
  const jobsForClaude = eligibleJobs.map((j) => ({
    id: j.id,
    title: j.title,
    domain: j.domain,
    seniority: j.seniority,
    requirements: j.requirements,
    tags: j.tags,
    description: j.description,
  }))

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an expert recruiter AI. Score each job's fit for this candidate from 0-100.

Scoring criteria:
- Domain alignment (50 pts): How well does the candidate's domain match the job's domain?
- Seniority fit (30 pts): Is the seniority level appropriate? A VP resume should score low on junior roles even in the right domain.
- Skills overlap (20 pts): How many required skills does the candidate have?

Be strict. A score of 80+ means "excellent match, apply now". A score below 50 means significant mismatches.

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Jobs to evaluate:
${JSON.stringify(jobsForClaude, null, 2)}

Return ONLY a JSON array with no other text:
[{ "jobId": string, "score": number, "reason": string (max 12 words, specific to why they match or don't) }]`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") throw new Error("Unexpected response type")

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error("No JSON array in Claude response")

  const matchResults = MatchResultSchema.parse(JSON.parse(jsonMatch[0]))

  const scoreMap = new Map(matchResults.map((r) => [r.jobId, r]))

  return allJobs.map((job) => {
    const result = scoreMap.get(job.id)
    if (!result) {
      return { ...job, matchScore: 0, matchReason: "Not evaluated (pre-filtered as mismatch)", isRecommended: false }
    }
    return {
      ...job,
      matchScore: result.score,
      matchReason: result.reason,
      isRecommended: result.score >= 65,
    }
  })
}
