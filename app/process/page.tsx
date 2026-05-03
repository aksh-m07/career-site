import Link from "next/link"

const STEPS = [
  {
    num: "01",
    title: "Application",
    time: "1–3 days",
    body: "Apply with your resume — or upload it to our AI matcher to see your fit before you apply. We review every application ourselves. You'll hear back within 3 business days.",
  },
  {
    num: "02",
    title: "Recruiter screen",
    time: "30 min",
    body: "A short conversation with the recruiter to understand your background, goals, and answer your questions about Decimal. This is a two-way interview — we expect you to interrogate us.",
  },
  {
    num: "03",
    title: "Hiring manager interview",
    time: "45–60 min",
    body: "A deeper conversation about your craft, past work, and how you think. For technical roles this may include a short take-home or live problem-solving session — always scoped to under 2 hours.",
  },
  {
    num: "04",
    title: "Loop interviews",
    time: "Half day",
    body: "3–4 conversations with the team you'd join, cross-functional partners, and a senior leader. We focus on your thinking and judgment, not trivia or gotchas.",
  },
  {
    num: "05",
    title: "Offer",
    time: "2–5 days",
    body: "We move quickly. Offers include base salary, equity, and a clear breakdown of the total package. We post real ranges and give real offers — no anchor-and-chisel negotiations.",
  },
]

const PROMISES = [
  { title: "We'll be direct", body: "No ghosting. No ambiguous feedback. If you're not moving forward, we'll tell you why — because you deserve that." },
  { title: "Real salary ranges", body: "We post what we pay. Every job listing has an honest salary range, set before we talk to a single candidate." },
  { title: "No gotcha interviews", body: "We don't do brain teasers. We test for the actual skills the job requires. We'll tell you exactly what to prepare." },
  { title: "Fast decisions", body: "The whole loop takes 2–3 weeks, not 3 months. Your time is valuable. We don't leave you waiting." },
]

export default function ProcessPage() {
  return (
    <main>
      <div className="page-header page-pad">
        <p className="kicker">Hiring process</p>
        <h1>Honest. Fast. Human.</h1>
        <p className="lede">
          We designed our hiring process the way we wish all hiring worked — clear expectations,
          fast timelines, and respect for your time from first contact to offer.
        </p>
      </div>

      <div className="page-pad">
        {/* Process steps */}
        <div className="process-list">
          {STEPS.map(step => (
            <div key={step.num} className="process-step-lg">
              <div className="psl-num">{step.num}</div>
              <div className="psl-body">
                <div className="psl-head">
                  <h3>{step.title}</h3>
                  <span className="psl-time">{step.time}</span>
                </div>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Promises */}
        <div style={{ marginBottom: "72px" }}>
          <p className="kicker">Our promises</p>
          <div className="promises-grid">
            {PROMISES.map(p => (
              <div key={p.title} className="promise">
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="bottom-cta page-pad">
        <h2>Find your role.</h2>
        <p>
          Browse open positions or upload your resume to see your match score across every role.
        </p>
        <div className="cta-buttons">
          <Link href="/jobs" className="btn-primary lg">Browse open roles →</Link>
          <Link href="/life" className="btn-ghost lg">Life at Decimal</Link>
        </div>
      </section>
    </main>
  )
}
