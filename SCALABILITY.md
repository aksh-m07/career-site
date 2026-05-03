# Scalability Analysis

This document explains how the matching architecture would evolve across different scale tiers.

## Current Architecture (Demo)

- **Job data**: Static JSON file (42 jobs), loaded at API request time
- **Resume parsing**: Claude Haiku — fast, cheap, 1-3 second latency
- **Job matching**: Two-stage pipeline:
  1. In-process pre-filter: hard rules remove domain/seniority mismatches (O(n), no API cost)
  2. Claude Sonnet scores the remaining eligible jobs in a single API call
- **Deployment**: Vercel serverless functions, no database

This works well up to a few hundred jobs. The bottleneck is the Claude API call, not compute.

---

## Tier 1: 500 Jobs

**What breaks:** Nothing yet. The current approach handles 500 jobs comfortably.

**What to watch:** Claude has a context window limit. If job descriptions are long, 500 jobs might overflow a single prompt. Fix: send only the fields Claude needs (title, seniority, domain, requirements, tags) — not full descriptions.

**Changes:**
- Slim the Claude payload to essential fields only (already done in the codebase)
- Add response caching: `hash(profileJson + jobIds[])` → cached scores in Vercel KV. Same candidate re-uploading gets instant results.

**Latency target:** < 5 seconds end-to-end.

---

## Tier 2: 5,000 Jobs

**What breaks:** You can't send 5,000 jobs to Claude in one call. Token cost becomes material. In-process pre-filtering is still fast (O(n) in memory), but you need a database to persist and query jobs.

**Architecture changes:**

1. **Add a database**: Postgres (via Neon or Supabase) with indexed columns on `domain`, `seniority`, `location`, `remote`. Jobs are stored there instead of a JSON file.

2. **Server-side pre-filter via SQL**: Before touching Claude, run:
   ```sql
   SELECT * FROM jobs
   WHERE domain = ANY($1)          -- candidate's domain + adjacent domains
     AND seniority_level BETWEEN $2 AND $3  -- ± 2 levels from candidate
   LIMIT 100
   ```
   This brings the candidate set from 5,000 → ~100 before Claude sees it.

3. **Async processing with polling**: Resume upload returns immediately with a `jobId`. Client polls `/api/status/:jobId` (or uses SSE) for match results. This decouples upload latency from matching latency.

4. **Caching**: Cache match results by `SHA256(resume_text)` in Redis/Vercel KV with a 1-hour TTL. Identical resumes don't re-invoke Claude.

**Latency target:** Upload instant, results in < 8 seconds.

---

## Tier 3: 500,000 Jobs

**What breaks:** SQL filters alone aren't sufficient for semantic relevance. "Senior Python Engineer" and "Senior Backend Developer" may be a great match but share no keyword overlap. SQL can't catch this.

**Architecture changes:**

1. **Embedding-based retrieval**: Generate a vector embedding for each job description using `text-embedding-3-small` (cheap, ~$0.02/1M tokens). Store in `pgvector` extension on Postgres (or a dedicated vector DB like Pinecone).

   When a candidate uploads their resume, Claude Haiku extracts the profile → we embed the `summary` field → run cosine similarity search across 500K job embeddings → retrieve top 200 semantically relevant jobs.

2. **Two-stage pipeline**:
   - Stage 1 (vector search): 500K jobs → top 200 by embedding similarity (~50ms)
   - Stage 2 (Claude re-ranking): 200 jobs → scored and explained by Claude Sonnet (~3-4s)

3. **Job embedding pipeline**: A background worker regenerates embeddings when job descriptions are updated. New jobs are embedded on creation and written to the vector index.

4. **CDN caching**: The job list itself is mostly static. Cache the base job grid at the CDN edge, invalidated on job data changes. Most users see the same uncustomized list — only the personalization layer is dynamic.

**Trade-off**: Embeddings capture semantic similarity but not seniority logic ("VP-level candidate → junior role is bad") as precisely as a rule. The pre-filter hard rules remain important; embeddings handle the semantic layer.

**Latency target:** Upload instant, results in < 6 seconds (embedding search is fast).

---

## Tier 4: 5,000,000 Jobs

**What breaks:** `pgvector` with exact cosine search doesn't scale to 5M vectors with low latency. ANN (approximate nearest neighbor) search becomes necessary. Claude API cost per match is now a significant line item.

**Architecture changes:**

1. **Dedicated vector database**: Migrate from `pgvector` to Pinecone, Weaviate, or Qdrant. ANN search retrieves top-K across 5M vectors in < 100ms with p99 SLAs.

2. **Horizontal microservices**:
   - **Resume parsing service**: Stateless. Takes raw text, returns `CandidateProfile`. Scales to zero, handles spikes during peak job fair seasons.
   - **Job indexing service**: Processes new/updated jobs, generates embeddings, enriches metadata (Claude batch API for bulk enrichment at off-peak hours), writes to vector DB and primary DB.
   - **Matching service**: `(profile_embedding, hard_filters) → vector_search → rerank → return`. Scales independently.

3. **Cost optimization for Claude**:
   - At 5M jobs, Claude API is expensive at scale. Use Claude only for the final **re-ranking of top-50** (not all 5M).
   - Consider distilling Claude's scoring logic into a smaller fine-tuned cross-encoder (e.g., a DistilBERT model fine-tuned on Claude's labeled pairs). Run locally, zero marginal cost.
   - Use **Claude Batch API** for offline job enrichment (generating tags, normalizing seniority labels) at 50% cost reduction vs. real-time.

4. **Feedback loop**: Log every user click (did they apply to a recommended job? did they skip it?). Use this signal to evaluate and improve model quality offline. This is how you know whether the 87% match score is actually a good prediction.

5. **Observability**: Every Claude call is logged with latency, token usage, job ID, and candidate profile hash. Dashboards track p50/p95 matching latency, Claude cost per match, and click-through rate on recommended jobs.

**Latency target:** Upload instant, results in < 4 seconds (ANN search is fast; Claude only sees 50 jobs).

---

## Trade-off Summary

| Scale | Storage | Pre-filter | AI Matching | Latency | Cost/match |
|-------|---------|------------|-------------|---------|------------|
| 500 | JSON file | In-process rules | Claude Sonnet (all jobs) | ~4s | ~$0.01 |
| 5K | Postgres | SQL query | Claude Sonnet (top 100) | ~6s | ~$0.005 |
| 500K | Postgres + pgvector | ANN search (top 200) | Claude Sonnet (top 200) | ~5s | ~$0.004 |
| 5M | Pinecone + Postgres | ANN search (top 50) | Claude Sonnet (top 50) + fine-tuned model | ~4s | ~$0.001 |

The core insight: **AI is expensive per call, so the goal at every scale tier is to reduce what the AI sees, not remove it**. The pre-filtering layers (hard rules → SQL → vector search) converge on a small candidate set that Claude can evaluate with full reasoning.
