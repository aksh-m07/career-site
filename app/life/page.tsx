import Link from "next/link"

export default function LifePage() {
  return (
    <main>
      <div className="page-header page-pad">
        <p className="kicker">Life at Decimal</p>
        <h1>A place where your work matters</h1>
        <p className="lede">
          We believe great work happens when people feel trusted, well-compensated,
          and genuinely excited about what they&apos;re building together.
        </p>
      </div>

      <div className="page-pad">
        {/* Photo tiles */}
        <div className="life-photo-row">
          <div className="photo-tile p1" />
          <div className="photo-tile p2" />
          <div className="photo-tile p3" />
        </div>

        {/* Pillars */}
        <div className="life-pillars">
          <div className="pillar">
            <h3>Work & Flexibility</h3>
            <ul>
              <li><strong>Remote-first culture</strong> — work from anywhere, meet intentionally</li>
              <li><strong>Flexible hours</strong> — own your schedule, hit your goals</li>
              <li><strong>4 weeks PTO</strong> plus 10 company holidays</li>
              <li><strong>Annual offsite</strong> — the whole company, one week, somewhere new</li>
              <li><strong>No-meeting Fridays</strong> — protected time for deep work</li>
            </ul>
          </div>

          <div className="pillar">
            <h3>Compensation</h3>
            <ul>
              <li><strong>Top-of-market pay</strong> — we post real ranges and mean them</li>
              <li><strong>Meaningful equity</strong> — everyone gets options with a 4-year vest</li>
              <li><strong>Annual refresh grants</strong> for strong performers</li>
              <li><strong>401(k) with match</strong> — up to 4% of salary</li>
              <li><strong>Annual salary reviews</strong> benchmarked against the market</li>
            </ul>
          </div>

          <div className="pillar">
            <h3>Health & Growth</h3>
            <ul>
              <li><strong>Comprehensive medical, dental, vision</strong> — fully covered for you, 80% for family</li>
              <li><strong>$2,000 learning stipend</strong> — courses, books, conferences, anything</li>
              <li><strong>$1,000 home office budget</strong> when you join</li>
              <li><strong>$100/month</strong> for health & wellness, your way</li>
              <li><strong>Parental leave</strong> — 16 weeks fully paid, all parents</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pull quote */}
      <section className="pullquote page-pad" style={{ marginTop: "64px" }}>
        <blockquote>
          <span className="quote-mark">&ldquo;</span>
          The thing that surprised me most was how much my judgment is trusted.
          Nobody micromanages. You own your work and you feel it.
        </blockquote>
        <cite>— Rafi Oduya, Senior Engineer · joined 2023</cite>
      </section>

      {/* CTA */}
      <section className="bottom-cta page-pad">
        <h2>Sound like your kind of place?</h2>
        <p>Explore open roles and find where you fit.</p>
        <div className="cta-buttons">
          <Link href="/jobs" className="btn-primary lg">Browse open roles →</Link>
          <Link href="/process" className="btn-ghost lg">How we hire</Link>
        </div>
      </section>
    </main>
  )
}
