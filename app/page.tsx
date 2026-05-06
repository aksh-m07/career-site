"use client"

import Link from "next/link"
import { useApp } from "@/components/AppContext"
import { FeaturedJobCard } from "@/components/FeaturedJobCard"
import { Icons } from "@/components/Icons"

export default function Home() {
  const { scoredJobs, resume, setOpenJob, setModalOpen } = useApp()

  const featured = [...scoredJobs]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 6)

  const isMatch = resume !== null

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="dot" />
            {scoredJobs.length} open roles · Hiring globally
          </div>
          <h1 className="hero-title">
            Do the work<br />
            that <em>matters.</em>
          </h1>
          <p className="hero-sub">
            Decimal is building the intelligence layer for modern finance.
            We're hiring builders, thinkers, and people who care deeply about craft.
          </p>
          <div className="hero-cta">
            <Link href="/jobs" className="btn-primary lg">
              Browse open roles <Icons.arrow />
            </Link>
            <button className="btn-ghost lg" onClick={() => setModalOpen(true)}>
              {resume ? "Change resume" : "Upload resume"}
            </button>
          </div>
          <div className="hero-foot">
            <span>Remote-friendly</span>
            <span>·</span>
            <span>Americas · EMEA · APAC</span>
            <span>·</span>
            <span>Real salary ranges</span>
          </div>
        </div>
        <div className="hero-frame">
          <svg className="hero-illustration" viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="480" height="360" fill="#F2EDE3"/>
            <rect x="32" y="40" width="416" height="280" rx="12" fill="#FAF7F2" stroke="#E8DECC" strokeWidth="1"/>
            <rect x="56" y="72" width="160" height="8" rx="4" fill="#C2410C" opacity=".3"/>
            <rect x="56" y="88" width="240" height="24" rx="6" fill="#1C1A17" opacity=".08"/>
            <rect x="56" y="120" width="180" height="8" rx="4" fill="#1C1A17" opacity=".06"/>
            <rect x="56" y="136" width="200" height="8" rx="4" fill="#1C1A17" opacity=".04"/>
            <rect x="56" y="160" width="100" height="20" rx="10" fill="#C2410C" opacity=".1"/>
            <rect x="164" y="160" width="80" height="20" rx="10" fill="#1C1A17" opacity=".05"/>
            <rect x="56" y="196" width="368" height="1" fill="#1C1A17" opacity=".06"/>
            <rect x="56" y="212" width="160" height="8" rx="4" fill="#1C1A17" opacity=".08"/>
            <rect x="56" y="228" width="220" height="8" rx="4" fill="#1C1A17" opacity=".06"/>
            <rect x="56" y="244" width="140" height="8" rx="4" fill="#1C1A17" opacity=".04"/>
            <circle cx="400" cy="220" r="36" fill="none" stroke="#C2410C" strokeWidth="4" opacity=".2"/>
            <circle cx="400" cy="220" r="36" fill="none" stroke="#C2410C" strokeWidth="4"
              strokeDasharray="226" strokeDashoffset="56" strokeLinecap="round" opacity=".8"/>
            <text x="400" y="225" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1C1A17" opacity=".7">75</text>
          </svg>
          <div className="hero-frame-caption">Matched for you</div>
        </div>
      </section>

      {/* Featured roles */}
      <section className="featured page-pad">
        <div className="section-hd">
          <div>
            <p className="kicker">Featured roles</p>
            <h2>{isMatch ? "Top picks for you" : "Where we're hiring"}</h2>
          </div>
          <Link href="/jobs" className="link-btn lg">
            All open roles <Icons.arrow />
          </Link>
        </div>
        <div className="feat-grid">
          {featured.map(item => (
            <FeaturedJobCard
              key={item.job.id}
              item={item}
              isMatch={isMatch}
              onClick={() => setOpenJob(item)}
            />
          ))}
        </div>
      </section>

      {/* Pull quote */}
      <section className="pullquote page-pad">
        <blockquote>
          <span className="quote-mark">&ldquo;</span>
          We don&apos;t hire for roles. We hire for the next ten years.
          The people here are the kind you learn from every single day.
        </blockquote>
        <cite>— Camille Fontaine, VP Engineering · joined 2021</cite>
      </section>

      {/* Bottom CTA */}
      <section className="bottom-cta page-pad">
        <h2>Ready to do your best work?</h2>
        <p>
          Upload your resume and we&apos;ll show you every role ranked for your background.
          It takes 30 seconds.
        </p>
        <div className="cta-buttons">
          <button className="btn-primary lg" onClick={() => setModalOpen(true)}>
            {resume ? "Change resume" : "Upload your resume"} <Icons.upload />
          </button>
          <Link href="/jobs" className="btn-ghost lg">
            Browse all roles
          </Link>
        </div>
      </section>
    </main>
  )
}
