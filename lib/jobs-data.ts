import type { Job, Family, Level, Resume } from "./types"
import { LEVEL_RANK } from "./types"

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h >>> 0
}

const SALARY_BANDS: Record<Level, [number, number]> = {
  Intern:    [40,  60],
  Associate: [85,  115],
  Mid:       [120, 165],
  Senior:    [175, 235],
  Staff:     [240, 310],
  Lead:      [220, 290],
  Manager:   [200, 270],
  Director:  [260, 360],
  VP:        [340, 480],
  Executive: [400, 600],
}

const LOCATIONS: { city: string; region: "Americas" | "EMEA" | "APAC"; remote: boolean }[] = [
  { city: "New York, NY",       region: "Americas", remote: false },
  { city: "San Francisco, CA",  region: "Americas", remote: false },
  { city: "Austin, TX",         region: "Americas", remote: false },
  { city: "Toronto, ON",        region: "Americas", remote: false },
  { city: "Remote — Americas",  region: "Americas", remote: true  },
  { city: "London, UK",         region: "EMEA",     remote: false },
  { city: "Berlin, DE",         region: "EMEA",     remote: false },
  { city: "Remote — EMEA",      region: "EMEA",     remote: true  },
  { city: "Singapore",          region: "APAC",     remote: false },
  { city: "Sydney, AU",         region: "APAC",     remote: false },
  { city: "Bengaluru, IN",      region: "APAC",     remote: false },
  { city: "Remote — APAC",      region: "APAC",     remote: true  },
]

const SEEDS: {
  family: Family; title: string; level: Level;
  skills: string[]; team: string; blurb: string
}[] = [
  { family:"eng", title:"Software Engineer, Platform", level:"Mid", skills:["Go","Kubernetes","Postgres","Distributed systems"], team:"Infrastructure", blurb:"Build the rails our products run on — from API gateways to data plane services handling billions of requests." },
  { family:"eng", title:"Senior Software Engineer, Frontend", level:"Senior", skills:["TypeScript","React","Design systems","Accessibility"], team:"Web Platform", blurb:"Lead the architecture of the customer-facing web app. Partner closely with design on a system used by millions." },
  { family:"eng", title:"Staff Engineer, Search", level:"Staff", skills:["Elasticsearch","Vector search","Relevance","Python"], team:"Discovery", blurb:"Own the relevance roadmap for our search stack. Define how 5M+ items get ranked, retrieved, and recommended." },
  { family:"eng", title:"Engineering Manager, Growth", level:"Manager", skills:["Leadership","A/B testing","Web","Hiring"], team:"Growth", blurb:"Lead a team of 7 engineers shipping experiments that move acquisition and activation metrics." },
  { family:"eng", title:"Backend Engineer, Payments", level:"Mid", skills:["Java","Stripe","Reliability","SQL"], team:"Money Movement", blurb:"Help build the systems that move money safely. Ledger design, idempotency, reconciliation." },
  { family:"eng", title:"Mobile Engineer, iOS", level:"Senior", skills:["Swift","SwiftUI","Performance","XCTest"], team:"Mobile", blurb:"Craft the iOS experience used daily by hundreds of thousands of customers." },
  { family:"eng", title:"VP of Engineering", level:"VP", skills:["Org design","Strategy","Scaling teams","Technical vision"], team:"Executive", blurb:"Lead a 200+ person engineering org. Set technical direction across platform, product, and ML." },
  { family:"eng", title:"Software Engineering Intern", level:"Intern", skills:["CS fundamentals","Python","Curiosity","Git"], team:"Various", blurb:"12-week summer internship. Ship real code on a real team with a real mentor." },
  { family:"eng", title:"Senior DevOps Engineer", level:"Senior", skills:["Terraform","AWS","Kubernetes","CI/CD"], team:"Platform", blurb:"Own the infrastructure that never sleeps. Design for 99.99% uptime across 40+ services." },
  { family:"data", title:"Machine Learning Engineer", level:"Senior", skills:["PyTorch","Transformers","MLOps","Python"], team:"AI", blurb:"Take models from notebook to production. Own training pipelines, evals, and serving infra." },
  { family:"data", title:"Applied Scientist, Recommendations", level:"Staff", skills:["Recsys","Embeddings","SQL","Python"], team:"Personalization", blurb:"Drive the science behind what every user sees. Two-tower models, candidate generation, ranking." },
  { family:"data", title:"Data Engineer", level:"Mid", skills:["Spark","dbt","Airflow","SQL"], team:"Data Platform", blurb:"Build the data foundations the whole company runs on. ETL, warehousing, lineage." },
  { family:"data", title:"Analytics Engineer", level:"Mid", skills:["dbt","SQL","Looker","Python"], team:"Analytics", blurb:"Turn raw events into the trusted models analysts and PMs query every day." },
  { family:"data", title:"Director of Data Science", level:"Director", skills:["Leadership","Experimentation","Strategy","Hiring"], team:"Data", blurb:"Lead a team of 25 scientists and analysts. Shape how the company learns." },
  { family:"data", title:"AI Research Engineer", level:"Senior", skills:["LLMs","Evals","PyTorch","Research"], team:"Research", blurb:"Push the frontier on retrieval, reasoning, and agents. Publish welcome." },
  { family:"design", title:"Product Designer", level:"Mid", skills:["Figma","Prototyping","UX research","Design systems"], team:"Product", blurb:"Own end-to-end design for a product surface used by thousands daily." },
  { family:"design", title:"Senior Product Designer, Onboarding", level:"Senior", skills:["Figma","Systems thinking","Copywriting","Research"], team:"Activation", blurb:"Reimagine the first 10 minutes — the most important minutes a customer spends with us." },
  { family:"design", title:"Staff Brand Designer", level:"Staff", skills:["Brand","Typography","Art direction","Motion"], team:"Brand", blurb:"Evolve the visual identity. Shape how the world sees us across web, product, and print." },
  { family:"design", title:"Design Manager", level:"Manager", skills:["Leadership","Critique","Hiring","Strategy"], team:"Design", blurb:"Coach a team of 6 designers across two product pillars." },
  { family:"design", title:"Design Engineer", level:"Senior", skills:["React","CSS","Figma","Prototyping"], team:"Design Systems", blurb:"Live at the seam between design and engineering. Build the components everyone else uses." },
  { family:"product", title:"Product Manager, Core", level:"Senior", skills:["Strategy","Analytics","Specs","Cross-functional"], team:"Core Product", blurb:"Own a P&L-impacting product area. Set strategy, ship outcomes." },
  { family:"product", title:"Group Product Manager, Platform", level:"Lead", skills:["Platform PM","Strategy","API design","Leadership"], team:"Platform", blurb:"Lead a pod of 3 PMs shaping the platform thousands of internal teams build on." },
  { family:"product", title:"Associate Product Manager", level:"Associate", skills:["Curiosity","Data","Communication","User research"], team:"Various", blurb:"Two-year rotational program for early-career PMs. Three teams, one mentor, lifelong network." },
  { family:"product", title:"Director of Product, AI", level:"Director", skills:["AI products","Strategy","Leadership","Roadmapping"], team:"AI Product", blurb:"Define our AI product strategy. Lead a team of PMs across model and application layers." },
  { family:"product", title:"Technical Product Manager", level:"Senior", skills:["APIs","SQL","Specs","Engineering fluency"], team:"Developer Platform", blurb:"Build for developers. Own the API surface, SDKs, and developer experience." },
  { family:"marketing", title:"Content Marketing Manager", level:"Mid", skills:["Writing","SEO","Content strategy","Analytics"], team:"Marketing", blurb:"Own the content engine — long-form, newsletters, customer stories." },
  { family:"marketing", title:"Lifecycle Marketing Lead", level:"Lead", skills:["Email","Lifecycle","SQL","Braze"], team:"Growth", blurb:"Design and run the cross-channel journeys that retain and re-engage millions of users." },
  { family:"marketing", title:"Brand Marketing Director", level:"Director", skills:["Brand strategy","Campaigns","Leadership","Budget"], team:"Brand", blurb:"Lead brand at a category-defining moment. Own positioning, narrative, and big-ticket campaigns." },
  { family:"marketing", title:"Performance Marketing Manager", level:"Mid", skills:["Paid social","SQL","Attribution","Experimentation"], team:"Growth", blurb:"Own the paid acquisition program across Meta, Google, and emerging channels." },
  { family:"sales", title:"Account Executive, Mid-Market", level:"Mid", skills:["B2B sales","Discovery","Salesforce","Negotiation"], team:"Sales", blurb:"Own a quota in our fastest-growing segment. Close logos that become reference customers." },
  { family:"sales", title:"Enterprise Account Executive", level:"Senior", skills:["Enterprise sales","Complex deals","MEDDIC","C-suite selling"], team:"Enterprise", blurb:"Land and expand 7-figure relationships with Fortune 500 accounts." },
  { family:"sales", title:"Sales Development Representative", level:"Associate", skills:["Outbound","Cold outreach","Coachability","CRM"], team:"Sales", blurb:"The starting point for high-trajectory sales careers. Pipeline generation in our enterprise segment." },
  { family:"sales", title:"VP of Sales", level:"VP", skills:["Sales leadership","Forecasting","Hiring","GTM strategy"], team:"Executive", blurb:"Build the go-to-market machine. Lead a 60-person org across AE, SE, and SDR." },
  { family:"ops", title:"Operations Manager", level:"Manager", skills:["Process","Analytics","Vendor management","Hiring"], team:"Ops", blurb:"Make the trains run on time across vendor ops, fulfillment, and SLAs." },
  { family:"ops", title:"Chief of Staff to the CEO", level:"Lead", skills:["Strategy","Writing","Operating cadence","Exec comms"], team:"Executive", blurb:"The CEO's force multiplier. Strategic projects, board prep, operating cadence." },
  { family:"ops", title:"Business Operations Analyst", level:"Associate", skills:["SQL","Excel","Analysis","Presentation"], team:"BizOps", blurb:"Sit at the intersection of finance, strategy, and product. Solve the question of the week." },
  { family:"finance", title:"Senior Financial Analyst, FP&A", level:"Senior", skills:["FP&A","Modeling","Excel","SQL"], team:"Finance", blurb:"Build the model that drives our planning. Partner with leaders across the company." },
  { family:"finance", title:"Controller", level:"Director", skills:["Accounting","GAAP","Audit","Leadership"], team:"Finance", blurb:"Own the books. Lead a team of 8 across accounting, AP, and revenue." },
  { family:"people", title:"Recruiter, Engineering", level:"Mid", skills:["Tech recruiting","Sourcing","Closing","Candidate experience"], team:"Talent", blurb:"Bring in the engineers who'll define the next chapter. Full-cycle, deeply embedded." },
  { family:"people", title:"People Business Partner", level:"Senior", skills:["HRBP","Coaching","Org design","HR operations"], team:"People", blurb:"Trusted partner to senior leaders. Coach managers, shape orgs, raise the bar." },
  { family:"legal", title:"Commercial Counsel", level:"Senior", skills:["Contracts","Negotiation","SaaS","GDPR"], team:"Legal", blurb:"Front-line counsel for sales and partnerships. Move fast, protect well." },
  { family:"cs", title:"Customer Success Manager", level:"Mid", skills:["Account management","Retention","Communication","Onboarding"], team:"CS", blurb:"Own a book of growth-stage accounts. Drive adoption, expansion, and advocacy." },
  { family:"cs", title:"Implementation Consultant", level:"Senior", skills:["Project management","Technical onboarding","SQL","Customer empathy"], team:"Professional Services", blurb:"Lead enterprise rollouts end-to-end. Configure, integrate, train, launch." },
  { family:"health", title:"Registered Nurse, Telehealth", level:"Mid", skills:["Nursing","Patient care","EMR","ACLS"], team:"Clinical", blurb:"Provide compassionate care over video to patients across the country." },
  { family:"health", title:"Clinical Operations Manager", level:"Manager", skills:["Healthcare ops","Compliance","Leadership","Quality"], team:"Clinical", blurb:"Run the clinical operations that keep our virtual care service safe and excellent." },
  { family:"health", title:"Medical Director", level:"Director", skills:["MD","Clinical leadership","Quality","Strategy"], team:"Clinical", blurb:"Set clinical standards and lead a team of physicians across our care lines." },
]

function buildJobs(): Job[] {
  const jobs: Job[] = []
  let id = 1000
  for (const seed of SEEDS) {
    const loc = LOCATIONS[hashStr(seed.title) % LOCATIONS.length]
    jobs.push(makeJob(id++, seed, loc))
    const altCount = hashStr(seed.title) % 3
    for (let i = 0; i < altCount; i++) {
      const altLoc = LOCATIONS[hashStr(seed.title + i) % LOCATIONS.length]
      if (altLoc.city !== loc.city) {
        jobs.push(makeJob(id++, seed, altLoc))
      }
    }
  }
  return jobs
}

function makeJob(
  id: number,
  seed: typeof SEEDS[0],
  loc: typeof LOCATIONS[0]
): Job {
  const band = SALARY_BANDS[seed.level] ?? [120, 200]
  return {
    id: `JOB-${id}`,
    title: seed.title,
    family: seed.family,
    level: seed.level,
    location: loc.city,
    region: loc.region,
    remote: loc.remote,
    team: seed.team,
    skills: seed.skills,
    blurb: seed.blurb,
    salaryMin: band[0] * 1000,
    salaryMax: band[1] * 1000,
    postedDays: hashStr(String(id) + seed.title) % 30,
    employmentType: seed.level === "Intern" ? "Internship" : "Full-time",
  }
}

export const JOBS: Job[] = buildJobs()

export const RESUMES: Record<string, Resume> = {
  swe_senior: {
    key: "swe_senior",
    label: "Senior Software Engineer",
    name: "Maya Okafor",
    headline: "Senior Software Engineer · 8 years experience",
    summary: "Full-stack engineer with deep experience building consumer web products at scale.",
    skills: ["TypeScript", "React", "Node.js", "Postgres", "AWS", "Distributed systems", "GraphQL"],
    families: ["eng", "data"],
    levelRank: LEVEL_RANK["Senior"],
    yearsExp: 8,
    titleHints: ["software engineer","frontend","backend","full-stack","staff engineer"],
  },
  pm_director: {
    key: "pm_director",
    label: "Director of Product",
    name: "Daniel Reyes",
    headline: "Director of Product · 12 years experience",
    summary: "Product leader with 12 years scaling B2B and consumer products. Built and led PM teams of 20+.",
    skills: ["Product strategy", "AI products", "Leadership", "Hiring", "Roadmapping", "Analytics"],
    families: ["product", "data"],
    levelRank: LEVEL_RANK["Director"],
    yearsExp: 12,
    titleHints: ["product manager","group product manager","director of product","head of product"],
  },
  designer_mid: {
    key: "designer_mid",
    label: "Product Designer",
    name: "Sasha Lin",
    headline: "Product Designer · 4 years experience",
    summary: "Product designer focused on data-dense interfaces and onboarding.",
    skills: ["Figma", "Prototyping", "Design systems", "UX research", "Data viz"],
    families: ["design", "product"],
    levelRank: LEVEL_RANK["Mid"],
    yearsExp: 4,
    titleHints: ["product designer","ux designer","interaction designer"],
  },
  marketing_lead: {
    key: "marketing_lead",
    label: "Lifecycle Marketing Lead",
    name: "Priya Shah",
    headline: "Lifecycle Marketing Lead · 9 years experience",
    summary: "Lifecycle and growth marketer who has owned email and CRM programs reaching 10M+ users.",
    skills: ["Lifecycle", "Email", "Braze", "SQL", "Experimentation", "Copywriting"],
    families: ["marketing", "ops"],
    levelRank: LEVEL_RANK["Lead"],
    yearsExp: 9,
    titleHints: ["lifecycle","crm","growth marketing","email marketing"],
  },
  ae_senior: {
    key: "ae_senior",
    label: "Senior Account Executive",
    name: "Marcus Bell",
    headline: "Enterprise Account Executive · 10 years experience",
    summary: "Closed $40M+ in enterprise software. Specializes in complex multi-stakeholder sales.",
    skills: ["Enterprise sales", "MEDDIC", "Salesforce", "Negotiation", "C-suite selling"],
    families: ["sales", "cs"],
    levelRank: LEVEL_RANK["Senior"],
    yearsExp: 10,
    titleHints: ["account executive","enterprise sales","sales executive"],
  },
  recent_grad: {
    key: "recent_grad",
    label: "Recent Graduate",
    name: "Alex Chen",
    headline: "Recent CS Graduate · 2 internships",
    summary: "Computer science new grad with internship experience at two consumer tech companies.",
    skills: ["Python", "Java", "Algorithms", "Data structures"],
    families: ["eng", "data", "product"],
    levelRank: LEVEL_RANK["Intern"],
    yearsExp: 0,
    titleHints: ["intern","associate","junior","entry level"],
  },
}

export function scoreJob(job: Job, resume: Resume | null): { score: number | null; reasons: string[] } {
  if (!resume) return { score: null, reasons: [] }

  const levelGap = Math.abs(LEVEL_RANK[job.level] - resume.levelRank)
  if (levelGap > 3) return { score: 0, reasons: [] }

  // Clinical vs technical hard block
  const clinicalFamilies: string[] = ["health"]
  const technicalFamilies: string[] = ["eng", "data", "product", "design"]
  const isCandidateClinical = resume.families.some(f => clinicalFamilies.includes(f))
  const isJobClinical = clinicalFamilies.includes(job.family)
  if (isCandidateClinical !== isJobClinical) return { score: 2, reasons: [] }

  let score = 0
  const reasons: string[] = []

  // Family match (50 pts)
  if (resume.families.includes(job.family)) {
    score += 50
    reasons.push(`${job.family === "eng" ? "Engineering" : "Domain"} background aligns with this role`)
  } else {
    score += 10
  }

  // Level fit (30 pts)
  if (levelGap === 0) { score += 30; reasons.push("Seniority is a strong match") }
  else if (levelGap === 1) { score += 20; reasons.push("Seniority is close") }
  else if (levelGap === 2) { score += 8 }
  else { score += 0 }

  // Skills overlap (20 pts)
  const jobSkillsLower = job.skills.map(s => s.toLowerCase())
  const resumeSkillsLower = resume.skills.map(s => s.toLowerCase())
  const matches = resumeSkillsLower.filter(s => jobSkillsLower.some(js => js.includes(s) || s.includes(js)))
  const skillScore = Math.min(20, Math.round((matches.length / Math.max(job.skills.length, 1)) * 20))
  score += skillScore
  if (matches.length >= 2) {
    reasons.push(`${matches.length} skill${matches.length > 1 ? "s" : ""} overlap: ${matches.slice(0, 3).join(", ")}`)
  }

  // Title hint bonus
  const titleLower = job.title.toLowerCase()
  if (resume.titleHints.some(hint => titleLower.includes(hint))) {
    score = Math.min(100, score + 8)
    reasons.push("Title matches your background")
  }

  return { score: Math.min(100, Math.round(score)), reasons }
}
