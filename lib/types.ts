export type Family =
  | "eng" | "design" | "product" | "data"
  | "marketing" | "sales" | "ops" | "finance"
  | "people" | "legal" | "cs" | "health"

export type Level =
  | "Intern" | "Associate" | "Mid" | "Senior"
  | "Staff" | "Lead" | "Manager" | "Director" | "VP" | "Executive"

export const FAMILIES: Record<Family, { label: string }> = {
  eng:       { label: "Engineering" },
  design:    { label: "Design" },
  product:   { label: "Product" },
  data:      { label: "Data & AI" },
  marketing: { label: "Marketing" },
  sales:     { label: "Sales" },
  ops:       { label: "Operations" },
  finance:   { label: "Finance" },
  people:    { label: "People" },
  legal:     { label: "Legal" },
  cs:        { label: "Customer Success" },
  health:    { label: "Healthcare" },
}

export const LEVELS: Level[] = [
  "Intern", "Associate", "Mid", "Senior",
  "Staff", "Lead", "Manager", "Director", "VP", "Executive"
]

export const LEVEL_RANK: Record<Level, number> = Object.fromEntries(
  LEVELS.map((l, i) => [l, i])
) as Record<Level, number>

export interface Job {
  id: string
  title: string
  family: Family
  level: Level
  location: string
  region: "Americas" | "EMEA" | "APAC"
  remote: boolean
  team: string
  skills: string[]
  blurb: string
  salaryMin: number
  salaryMax: number
  postedDays: number
  employmentType: string
}

export interface Resume {
  key: string
  label: string
  name: string
  headline: string
  summary: string
  skills: string[]
  families: Family[]
  levelRank: number
  yearsExp: number
  titleHints: string[]
}

export interface ScoredJob {
  job: Job
  score: number | null
  reasons: string[]
}

export interface CandidateProfile {
  name?: string | null
  currentTitle: string
  seniorityLevel: Level
  yearsOfExperience: number
  family: Family
  skills: string[]
  industries: string[]
  summary: string
}
