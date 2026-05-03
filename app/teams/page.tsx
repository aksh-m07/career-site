import Link from "next/link"
import { FAMILIES, type Family } from "@/lib/types"
import { JOBS } from "@/lib/jobs-data"

const TEAM_DESCRIPTIONS: Record<Family, { desc: string; sample: string[] }> = {
  eng:       { desc: "Infrastructure, backend, frontend, mobile, and platform teams building at scale.", sample: ["Platform Engineering", "Web Platform", "Mobile", "Infrastructure", "Growth"] },
  data:      { desc: "ML engineers, scientists, and data engineers powering our AI layer.", sample: ["AI Research", "Personalization", "Data Platform", "Analytics"] },
  product:   { desc: "PMs who ship outcomes, not features. Embedded in every product squad.", sample: ["Core Product", "Developer Platform", "AI Product", "Platform"] },
  design:    { desc: "Product designers, brand, and design systems across the full spectrum.", sample: ["Product Design", "Brand", "Design Systems", "Activation"] },
  marketing: { desc: "Brand, growth, content, and lifecycle teams driving awareness and retention.", sample: ["Brand", "Growth", "Content", "Lifecycle"] },
  sales:     { desc: "AEs, SEs, and SDRs closing the deals that define our GTM.", sample: ["Enterprise Sales", "Mid-Market", "Sales Development"] },
  ops:       { desc: "BizOps, strategy, and chief of staff — making the whole company run.", sample: ["BizOps", "Strategy", "Executive Operations"] },
  finance:   { desc: "FP&A, accounting, and corporate finance building the financial engine.", sample: ["FP&A", "Accounting", "Corporate Finance"] },
  people:    { desc: "Recruiting, HRBPs, and L&D investing in the people behind the product.", sample: ["Talent Acquisition", "People Business Partners", "L&D"] },
  legal:     { desc: "Commercial and corporate counsel partnering with every function.", sample: ["Commercial Legal", "Corporate", "Privacy"] },
  cs:        { desc: "Customer success managers and implementation consultants making customers win.", sample: ["Customer Success", "Professional Services", "Support"] },
  health:    { desc: "Clinicians and clinical ops delivering telehealth with care and compliance.", sample: ["Virtual Care", "Clinical Operations", "Medical Affairs"] },
}

const FAMILY_ORDER: Family[] = [
  "eng", "data", "product", "design",
  "marketing", "sales", "ops", "finance",
  "people", "legal", "cs", "health",
]

export default function TeamsPage() {
  const countByFamily = Object.fromEntries(
    FAMILY_ORDER.map(f => [f, JOBS.filter(j => j.family === f).length])
  )

  return (
    <main>
      <div className="page-header page-pad">
        <p className="kicker">Our teams</p>
        <h1>Many teams, one company</h1>
        <p className="lede">
          We hire across every discipline — from engineering and AI research to brand, finance, and clinical care.
          Every team shares the same obsession with craft and customer impact.
        </p>
      </div>

      <div className="page-pad">
        <div className="team-grid-lg">
          {FAMILY_ORDER.map((f, i) => {
            const count = countByFamily[f] ?? 0
            const info = TEAM_DESCRIPTIONS[f]
            return (
              <div key={f} className="team-card-lg">
                <div className="team-card-num">0{(i + 1).toString().padStart(2, "0")}</div>
                <h3>{FAMILIES[f].label}</h3>
                <p className="muted">{info.desc}</p>
                <ul className="team-sample">
                  {info.sample.slice(0, 3).map(s => (
                    <li key={s}>{s}</li>
                  ))}
                  {info.sample.length > 3 && (
                    <li className="more">+{info.sample.length - 3} more</li>
                  )}
                </ul>
                <Link href={`/jobs?family=${f}`} className="link-btn">
                  {count} open role{count !== 1 ? "s" : ""} →
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
