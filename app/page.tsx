"use client"

import { useState, useEffect, useMemo } from "react"
import { Briefcase, GitFork, Sparkles, ChevronDown } from "lucide-react"
import { JobCard } from "@/components/JobCard"
import { ResumeUploader } from "@/components/ResumeUploader"
import { Filters, type FilterState } from "@/components/Filters"
import type { Job, MatchedJob, CandidateProfile } from "@/lib/types"

type DisplayJob = Job | MatchedJob

export default function Home() {
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [matchedJobs, setMatchedJobs] = useState<MatchedJob[] | null>(null)
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    domain: "all",
    seniority: "all",
    remote: false,
  })

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        setAllJobs(data.jobs)
        setLoading(false)
      })
  }, [])

  async function handleProfileReady(candidateProfile: CandidateProfile) {
    setProfile(candidateProfile)
    setIsMatching(true)
    setShowAll(false)

    try {
      const res = await fetch("/api/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: candidateProfile }),
      })
      const data = await res.json()
      if (res.ok) {
        setMatchedJobs(data.jobs)
      }
    } catch (e) {
      console.error("Matching failed:", e)
    } finally {
      setIsMatching(false)
    }
  }

  function handleClear() {
    setProfile(null)
    setMatchedJobs(null)
    setIsMatching(false)
    setShowAll(false)
  }

  // Apply filters on top of matched or all jobs
  const displayJobs: DisplayJob[] = useMemo(() => {
    const base = matchedJobs ?? allJobs

    return base.filter((job) => {
      if (filters.domain !== "all" && job.domain !== filters.domain) return false
      if (filters.seniority !== "all" && job.seniority !== filters.seniority) return false
      if (filters.remote && !job.remote) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !job.title.toLowerCase().includes(q) &&
          !job.company.toLowerCase().includes(q) &&
          !job.description.toLowerCase().includes(q) &&
          !job.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false
      }
      return true
    })
  }, [allJobs, matchedJobs, filters])

  const recommendedJobs = displayJobs.filter((j) => "isRecommended" in j && j.isRecommended)
  const otherJobs = displayJobs.filter((j) => !("isRecommended" in j) || !j.isRecommended)
  const isMatched = matchedJobs !== null
  const visibleOtherJobs = isMatched && !showAll ? [] : otherJobs

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">JobMatch</span>
            <span className="hidden sm:block text-xs text-gray-400 ml-1">AI-powered career discovery</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <GitFork className="w-4 h-4" />
            <span className="hidden sm:block">View source</span>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">
            {isMatched
              ? `${recommendedJobs.length} roles match your profile`
              : "Find your next role"}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {isMatched
              ? "Upload ranked by AI based on your resume. Jobs you'd likely be filtered out of are moved down."
              : "Browse open positions or upload your resume for personalized AI-powered recommendations."}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
            <ResumeUploader
              onProfileReady={handleProfileReady}
              onClear={handleClear}
              isMatching={isMatching}
              profile={profile}
            />
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Filters</p>
              <Filters
                filters={filters}
                onChange={setFilters}
                totalJobs={displayJobs.length}
                isMatched={isMatched}
              />
            </div>

            {/* How it works — collapsed on mobile */}
            {!isMatched && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium text-blue-900">How it works</p>
                </div>
                <ol className="space-y-2.5">
                  {[
                    "Upload your resume (PDF, DOCX, or TXT)",
                    "AI extracts your skills, seniority, and domain",
                    "Jobs are scored and ranked just for you",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-xs text-blue-800 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>

          {/* Job list */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="h-2.5 bg-gray-100 rounded" />
                      <div className="h-2.5 bg-gray-100 rounded w-5/6" />
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-5 w-14 bg-gray-100 rounded-md" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : isMatched ? (
              <div className="space-y-6">
                {recommendedJobs.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <h2 className="text-sm font-semibold text-gray-900">
                        Recommended for you
                        <span className="ml-2 text-gray-400 font-normal">({recommendedJobs.length})</span>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendedJobs.map((job) => (
                        <JobCard key={job.id} job={job} isMatched />
                      ))}
                    </div>
                  </section>
                )}

                {otherJobs.length > 0 && (
                  <section>
                    {!showAll ? (
                      <button
                        onClick={() => setShowAll(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Show {otherJobs.length} other jobs (lower match)
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <h2 className="text-sm font-semibold text-gray-500">
                            Other jobs
                            <span className="ml-2 font-normal">({otherJobs.length})</span>
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {otherJobs.map((job) => (
                            <JobCard key={job.id} job={job} isMatched />
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                )}

                {recommendedJobs.length === 0 && otherJobs.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <p className="text-lg">No jobs match your filters.</p>
                    <p className="text-sm mt-1">Try clearing some filters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {displayJobs.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <p className="text-lg">No jobs match your filters.</p>
                    <p className="text-sm mt-1">Try adjusting or clearing them.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
