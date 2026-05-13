import Groq from "groq-sdk"
import { z } from "zod"
import type { CandidateProfile, Family, Job, Level } from "./types"
import { LEVEL_RANK } from "./types"

const getClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY })

// Minimum full-time years required before a seniority level is plausible
const LEVEL_MINIMUMS: Partial<Record<string, number>> = {
  Senior: 5,
  Staff: 7,
  Lead: 7,
  Manager: 3,
  Director: 8,
  VP: 10,
  Executive: 12,
}

function clampSeniority(level: string, years: number): string {
  const min = LEVEL_MINIMUMS[level]
  if (min !== undefined && years < min) {
    if (years < 1) return "Intern"
    if (years < 3) return "Associate"
    if (years < 6) return "Mid"
    return "Senior"
  }
  return level
}

function cleanJson(text: string): string {
  // Strip markdown fences
  text = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
  // Extract outermost { } block
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1) return ""
  let json = text.slice(start, end + 1)
  // Remove trailing commas before } or ]
  json = json.replace(/,(\s*[}\]])/g, "$1")
  return json
}

function cleanJsonArray(text: string): string {
  text = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
  const start = text.indexOf("[")
  const end = text.lastIndexOf("]")
  if (start === -1 || end === -1) return ""
  let json = text.slice(start, end + 1)
  json = json.replace(/,(\s*[}\]])/g, "$1")
  return json
}

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
  currentTitle: z.string().nullable().transform(v => v ?? ""),
  seniorityLevel: z.enum(["Intern", "Associate", "Mid", "Senior", "Staff", "Lead", "Manager", "Director", "VP", "Executive"]),
  yearsOfExperience: z.number(),
  family: z.enum(["eng", "design", "product", "data", "marketing", "sales", "ops", "finance", "people", "legal", "cs", "health"]),
  specialization: z.string().default(""),
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
  const message = await getClient().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a resume parser. Output ONLY a single valid JSON object. No prose, no markdown, no explanations before or after the JSON.",
      },
      {
        role: "user",
        content: `Parse this resume into JSON. Rules for classification:

STEP 1 — mentally list every role: title, company, duration, type (full-time / internship / contract / volunteer / student-org / club).
STEP 2 — use ONLY full-time roles for seniority and yearsOfExperience.
STEP 3 — for currentTitle, use: full-time title → internship title → "[Major] Student". NEVER use club, student org, or volunteer titles as the currentTitle.

Output this exact JSON structure:
{
  "name": string or null,
  "currentTitle": string,
  "seniorityLevel": "Intern" | "Associate" | "Mid" | "Senior" | "Staff" | "Lead" | "Manager" | "Director" | "VP" | "Executive",
  "yearsOfExperience": number,
  "family": "eng" | "design" | "product" | "data" | "marketing" | "sales" | "ops" | "finance" | "people" | "legal" | "cs" | "health",
  "specialization": string,
  "skills": [string],
  "industries": [string],
  "summary": string
}

Field rules:
- currentTitle: most recent full-time job title. If no full-time experience, use most recent internship title. If no internship either, use "[Major] Student" (e.g. "Computer Science Student"). NEVER use student org, club, or volunteer titles as currentTitle — those are not jobs.
- yearsOfExperience: sum of full-time months only, divided by 12, rounded to 1 decimal. Exclude internships, student-org, volunteer.
- seniorityLevel: based ONLY on full-time years. Student org titles are IGNORED (a "VP of a university club" = student = Intern). Intern=<1yr full-time, Associate=1-3yr, Mid=3-6yr, Senior=6-10yr, Staff/Lead=8-12yr broad scope, Manager=manages people, Director=manages managers, VP=senior corporate leader, Executive=C-suite.
- family: eng=software/devops/infra, data=ML/data science/analytics, product=product management, design=UX/brand/visual, marketing=marketing/comms/growth, sales=sales/BD, ops=operations/biz ops/strategy, finance=finance/accounting, people=HR/recruiting, legal=legal/compliance, cs=customer success/support/implementation, health=clinical/medical/nursing.
- specialization: specific focus within the family. eng: "backend", "frontend", "fullstack", "mobile (iOS)", "mobile (Android)", "DevOps/infrastructure", "security". data: "ML/AI", "data engineering", "analytics". product: "consumer", "B2B SaaS", "platform". Keep it short and plain.
- skills: technologies, languages, frameworks, tools only. No company names, project names, or soft skills.
- summary: 2-3 sentences, third person, career arc and core value.

Resume:
${resumeText}`,
      },
    ],
  })

  const text = message.choices[0]?.message?.content ?? ""
  console.log("[parseResume] raw response:", text.slice(0, 300))
  if (!text) throw new Error("Empty response from Groq")

  const parsed = JSON.parse(text)
  const profile = CandidateProfileSchema.parse(parsed) as CandidateProfile
  profile.seniorityLevel = clampSeniority(profile.seniorityLevel, profile.yearsOfExperience) as CandidateProfile["seniorityLevel"]
  return profile
}

export async function matchJobsToProfile(
  profile: CandidateProfile,
  allJobs: Job[]
): Promise<(Job & { matchScore: number; matchReason: string })[]> {
  const candidateRank = LEVEL_RANK[profile.seniorityLevel as Level]
  const candidateGroup = getFamilyGroup(profile.family)

  // Pre-filter: exclude hard mismatches before sending to Groq
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

  const jobsForGroq = eligible.map(j => ({
    id: j.id,
    title: j.title,
    family: j.family,
    level: j.level,
    skills: j.skills,
    blurb: j.blurb,
  }))

  const message = await getClient().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a recruiter scoring tool. Output ONLY a valid JSON object with a single key 'results' containing an array. No prose, no markdown.",
      },
      {
        role: "user",
        content: `You are an expert technical recruiter. Score each job's fit for this candidate 0-100.

Scoring breakdown (total = 100):
- Specialization match (40pts): Does the job match the candidate's specific focus within their domain? Same specialization = 40. Adjacent/transferable = 20-35. Opposite (e.g. backend engineer vs frontend role) = 0-10.
- Skills overlap (30pts): How many of the job's required skills does the candidate have? All/most = 25-30. Several = 15-20. Few = 5-10. None = 0.
- Seniority fit (20pts): Exact match = 20. ±1 level = 15. ±2 levels = 8. ±3 levels = 0.
- Industry/context fit (10pts): Relevant background = 10. Somewhat relevant = 5. Unrelated = 0.

80+ = excellent. 50-79 = good fit. Below 50 = weak.

Candidate:
${JSON.stringify(profile, null, 2)}

Jobs:
${JSON.stringify(jobsForGroq, null, 2)}

Return a JSON object with a single key "results" containing an array:
{"results": [{ "jobId": string, "matchScore": number, "matchReason": string (max 15 words, specific about why it matches or doesn't) }]}`,
      },
    ],
  })

  const text = message.choices[0]?.message?.content ?? ""
  console.log("[matchJobs] raw response:", text.slice(0, 200))
  const parsed = JSON.parse(text)
  const rawResults = parsed.results ?? parsed

  const results = MatchResultSchema.parse(rawResults)
  const scoreMap = new Map(results.map(r => [r.jobId, r]))

  return eligible.map(job => {
    const r = scoreMap.get(job.id)
    if (!r) return { ...job, matchScore: 0, matchReason: "Not evaluated" }
    return { ...job, matchScore: r.matchScore, matchReason: r.matchReason }
  })
}
