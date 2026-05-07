# Decimal Careers

A modern career site with AI-powered resume matching, built with Next.js 16, Groq (LLaMA 3.3), and TypeScript.

## Features

### AI Resume Matching
Upload a PDF, DOCX, or TXT resume and the app parses it using Groq's LLaMA 3.3 model to extract your title, seniority level, skills, years of experience, and domain. Every open role is then scored 0–100 against your profile and re-ranked in real time — no page reload.

### Smart Filtering
Hard mismatches are automatically hidden from results:
- Domain exclusion — a technical resume (engineering, data, product, design) will never be shown clinical/healthcare roles, and vice versa
- Seniority exclusion — VP-level candidates are not shown junior roles (Intern, Associate, Mid, Senior); student/club leadership titles are ignored when determining seniority

### AI Resume Tailoring
Inside any job drawer, click **Get AI-powered resume suggestions**. Groq analyzes the gap between your resume and the role and returns 5–7 specific, actionable bullet-point rewrites and keyword additions. Powered by Groq (LLaMA 3.3).

### Resume Persistence via Login
Sign in with your name and email at `/login`. Your uploaded resume and match scores are saved to `localStorage` keyed to your email. Every time you return and log in, your resume is restored automatically — no re-upload needed.

### Job Browsing & Filtering
- Department sidebar filter with live counts
- Full-text search across title, blurb, skills, and team
- Pagination (20 roles per page)
- Matched roles ranked by score; unmatched roles hidden below the fold
- Hard-mismatch roles (score = 0) fully removed from all views including the featured section on the home page

### Job Drawer
Click any role to open a slide-in drawer with:
- Full role description, required skills, salary range
- AI match score ring with reasons (when resume is uploaded)
- Skill gap chips showing what the role needs that isn't on your resume
- Resume tailoring suggestions (AI-generated)
- One-click apply form

### Hiring History
View the history of applications submitted through the site, with status tracking (Applied → Under Review → Interview Scheduled → Offer Extended / Rejected).

### Life at Decimal
A culture page covering team pillars, benefits, and what working at Decimal looks like day-to-day.

### Sample Profiles
No resume to hand? Pick from six built-in sample profiles (Senior SWE, Director of Product, Designer, Lifecycle Marketer, Enterprise AE, Recent Grad) to preview how matching works.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| AI / LLM | Groq — `llama-3.3-70b-versatile` |
| Styling | Plain CSS (design tokens, no framework) |
| Fonts | Instrument Serif, Inter, Geist Mono (Google Fonts) |
| Persistence | Browser `localStorage` |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create a `.env.local` file:

```
GROQ_API_KEY=your_groq_api_key
```

Get a free key at [console.groq.com](https://console.groq.com).

---

## Project Structure

```
app/
  page.tsx              # Home — hero + featured roles
  jobs/                 # Job listing with filters and search
  login/                # Login page (email + name, no password)
  history/              # Hiring history
  life/                 # Life at Decimal culture page
  process/              # Hiring process page
  teams/                # Teams overview
  api/
    upload-resume/      # Parses resume file → CandidateProfile (Groq)
    match-jobs/         # Scores all jobs against a profile (Groq)
    tailor-resume/      # Generates resume suggestions for a role (Groq)

components/
  AppContext.tsx         # Global state — resume, user, scored jobs, persistence
  Header.tsx            # Sticky nav with upload button and login/logout
  JobDrawer.tsx         # Slide-in job detail panel
  ResumeModal.tsx       # Upload flow and sample profile picker
  FeaturedJobCard.tsx   # Home page role cards
  JobRow.tsx            # Jobs page list row
  ScoreRing.tsx         # Circular match score indicator

lib/
  jobs-data.ts          # Static job seeds, scoring logic (scoreJob)
  claude.ts             # Groq API calls — parseResume, matchJobsToProfile
  types.ts              # Shared TypeScript types
```
