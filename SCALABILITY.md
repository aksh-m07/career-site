# Scalability Analysis

How the matching architecture evolves across scale tiers.

---

## Current Architecture (Demo)

- **Job data**: Static TypeScript seed file (82 jobs across 12 departments), loaded at build time
- **Resume parsing**: Groq `llama-3.3-70b-versatile` — parses raw text into a structured `CandidateProfile` (title, seniority, domain, skills, years of experience). Ignores student/club titles when inferring seniority.
- **Matching**: Two-stage pipeline:
  1. **In-process hard filter** (O(n), zero API cost): removes domain mismatches (clinical vs. technical) and seniority mismatches (VP candidate never sees Intern/Associate/Mid/Senior roles). Score 0 = hidden.
  2. **Client-side scoring** (`scoreJob`): family overlap (50 pts) + level fit (30 pts) + skills overlap (20 pts). Runs in the browser, no server call.
- **AI tailoring**: Groq generates 5–7 resume suggestions per job on demand, only when the user clicks the button.
- **Persistence**: `localStorage` keyed by email — resume and `CandidateProfile` survive page reloads. No database.
- **Auth**: Name + email stored in `localStorage`. No password, no server session.
- **Deployment**: Next.js on Vercel, serverless API routes, no database.

**Bottleneck at this scale**: The Groq API call for resume parsing (< 1 second). Everything else runs in-process.

---

## Tier 1: 500 Jobs

**What still works**: Everything. The hard-filter + client-side scoring approach handles 500 jobs in under 5ms in the browser.

**What to watch**:
- Sending 500 full job records to the browser on page load is ~200KB of JSON — acceptable, but worth noting.
- The AI tailoring call is per-job and already lazy (only fires on user click), so it scales independently.

**Changes to make**:
- Slim the job payload: send only fields needed for display (`id`, `title`, `family`, `level`, `skills`, `blurb`, `location`). Fetch full details only when a job drawer opens.
- Add response caching for resume parsing: `SHA256(resumeText)` → cached `CandidateProfile` in Vercel KV. Same resume re-uploaded gets instant results.

**Trade-off**: Lazy-loading job details on drawer open adds a small latency (~100ms) but reduces initial payload by ~60%.

**Latency target**: < 3 seconds end-to-end including parse.

---

## Tier 2: 5,000 Jobs

**What breaks**:
- Sending 5,000 jobs to the browser is ~2MB — too slow on mobile.
- Client-side scoring of 5,000 jobs is still fast (~10ms) but the data transfer is the problem.
- `localStorage` is limited to ~5MB. At 5,000 jobs, caching scored results becomes risky.

**Architecture changes**:

1. **Add a database**: Postgres (Neon or Supabase) with indexed columns on `family`, `level`, `region`, `remote`. Jobs live in the DB, not a static file.

2. **Paginated API with server-side pre-filter**: The jobs endpoint accepts `family`, `levelMin`, `levelMax`, `search` query params and runs:
   ```sql
   SELECT * FROM jobs
   WHERE family = ANY($1)
     AND level_rank BETWEEN $2 AND $3
     AND (search_vector @@ plainto_tsquery($4) OR $4 IS NULL)
   ORDER BY posted_at DESC
   LIMIT 20 OFFSET $5
   ```
   The browser only receives 20 jobs at a time.

3. **Server-side scoring**: Move `scoreJob` logic to the API. Return pre-scored, pre-sorted results. Client renders what it receives — no scoring in the browser.

4. **Resume persistence moves to DB**: `localStorage` is replaced by a user record in Postgres. The `CandidateProfile` and scores are stored server-side, fetched on login via a session token.

**Trade-off**: Pagination means the user can't instantly filter client-side — every filter change triggers an API call. Mitigate with debounce (300ms) and optimistic UI.

**Latency target**: < 200ms per page load, < 3 seconds for resume parse + match.

---

## Tier 3: 500,000 Jobs

**What breaks**:
- SQL keyword filters can't find semantic matches. "Senior Python Engineer" and "Senior Backend Developer" share no SQL overlap but are a great fit.
- Scoring 500K jobs server-side per candidate is too slow and too expensive to run on demand.

**Architecture changes**:

1. **Embedding-based retrieval**: Each job description is embedded offline using a small, cheap model (e.g., `text-embedding-3-small`). Embeddings stored in `pgvector` (Postgres extension) or a dedicated vector DB.

   On resume upload: parse profile → embed the candidate `summary` → cosine similarity search → retrieve top 200 semantically similar jobs → score those 200 with the existing rule-based logic + Groq re-ranking.

2. **Two-stage pipeline**:
   - Stage 1 (vector search): 500K jobs → top 200 by embedding similarity, filtered by hard domain/seniority rules (~50ms)
   - Stage 2 (LLM re-ranking): top 200 → Groq scores and explains each (~2–3s)

3. **Offline job enrichment**: A background worker embeds new/updated job descriptions, normalizes seniority labels, and writes to the vector index. Jobs are never re-embedded at query time.

4. **CDN caching for the base job grid**: The unauthenticated job list (sorted by recency, no personalization) is cached at the CDN edge. Only the personalization layer (scores, ordering) is dynamic.

**Trade-off**: Embeddings capture semantic similarity but not the hard business rules (VP shouldn't see Intern roles). The domain/seniority hard filters must remain as a pre-gate before embedding search — they're cheap and exact. Embeddings handle the fuzzy relevance layer on top.

**Latency target**: Upload instant (async processing), results in < 5 seconds.

---

## Tier 4: 5,000,000 Jobs

**What breaks**:
- `pgvector` with exact cosine search doesn't scale past ~1M vectors with sub-100ms p99 latency. Approximate nearest neighbor (ANN) search is required.
- Groq API cost at scale: if 100K candidates match per day against top-200 jobs each, that's 20M LLM-scored pairs/day. At current pricing this is significant.

**Architecture changes**:

1. **Dedicated vector database**: Migrate from `pgvector` to Pinecone, Weaviate, or Qdrant. ANN search retrieves top-K across 5M vectors in < 100ms with production SLAs.

2. **Horizontal microservices**:
   - **Resume parsing service**: Stateless. Accepts raw text, returns `CandidateProfile`. Scales to zero between spikes.
   - **Job indexing service**: Embeds new/updated jobs, normalizes metadata via Groq batch API (50% cheaper than real-time), writes to vector DB and Postgres.
   - **Matching service**: `(profile_embedding, hard_filters) → ANN search → rule-based filter → Groq re-rank top 50 → return`. Scales independently.

3. **Cost optimization for LLM calls**:
   - Groq/LLM only sees the **top 50** candidates from ANN search, not all 5M.
   - Pre-compute match scores for the most common candidate archetypes (e.g., "Senior SWE, eng family, 8 years") and cache them. Many candidates share similar profiles.
   - Consider distilling the Groq scoring logic into a fine-tuned cross-encoder (small BERT variant) trained on Groq-labeled pairs. Zero marginal cost at inference time.

4. **Feedback loop**: Log every click, application, and skip. Use this signal to evaluate whether high match scores actually predict applications. Retrain/fine-tune the scoring model offline using this data.

5. **Observability**: Every Groq call logged with latency, token usage, job IDs, candidate profile hash, and match score distribution. Dashboards track p50/p95 latency, cost per match, and click-through rate by score bucket.

**Latency target**: Upload instant, results in < 4 seconds (ANN is fast; Groq sees ≤ 50 jobs).

---

## Trade-off Summary

| Scale | Storage | Pre-filter | Scoring | Persistence | Latency | Relative cost/match |
|---|---|---|---|---|---|---|
| 82 (now) | Static TS file | In-process rules | Client-side rule engine | localStorage | ~1s parse | ~$0.001 |
| 500 | Static file + KV cache | In-process rules | Client-side rule engine | localStorage | ~1s | ~$0.0005 |
| 5K | Postgres | SQL (domain + level) | Server-side rules + Groq top-100 | Postgres (server session) | ~4s | ~$0.003 |
| 500K | Postgres + pgvector | ANN search top-200 | Rules + Groq top-200 | Postgres | ~5s | ~$0.002 |
| 5M | Pinecone + Postgres | ANN search top-50 | Rules + Groq top-50 + fine-tuned model | Postgres + Redis | ~4s | ~$0.0003 |

**Core insight**: The LLM is expensive per call. Every scale tier's goal is to shrink what the LLM sees — not replace it. The hard rule pre-filter (domain/seniority exclusion) does the heaviest lifting for free at every tier, because most mismatches are obvious and don't need AI to detect.
