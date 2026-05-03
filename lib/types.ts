export type Domain =
  | "engineering"
  | "healthcare"
  | "finance"
  | "data"
  | "operations"
  | "design"
  | "product"
  | "legal"
  | "marketing"

export type Seniority =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "director"
  | "vp"
  | "c-suite"

export type JobType = "full-time" | "part-time" | "contract"

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: JobType
  domain: Domain
  seniority: Seniority
  salary: { min: number; max: number; currency: string }
  description: string
  responsibilities: string[]
  requirements: string[]
  tags: string[]
  postedAt: string
  remote: boolean
}

export interface CandidateProfile {
  name?: string
  currentTitle: string
  seniorityLevel: Seniority
  yearsOfExperience: number
  domain: Domain
  skills: string[]
  industries: string[]
  summary: string
}

export interface MatchedJob extends Job {
  matchScore: number
  matchReason: string
  isRecommended: boolean
}
