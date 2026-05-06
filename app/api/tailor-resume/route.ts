import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RequestSchema = z.object({
  job: z.object({
    id: z.string(),
    title: z.string(),
    family: z.string(),
    level: z.string(),
    skills: z.array(z.string()),
    blurb: z.string(),
    team: z.string(),
  }),
  profile: z.object({
    currentTitle: z.string(),
    skills: z.array(z.string()),
    summary: z.string(),
    seniorityLevel: z.string(),
    yearsOfExperience: z.number(),
    family: z.string(),
    industries: z.array(z.string()),
  }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { job, profile } = RequestSchema.parse(body)

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a professional resume coach. A candidate wants to apply for a specific job but their resume doesn't perfectly match.

Give them 5-7 SPECIFIC, ACTIONABLE changes they can make to their resume to better target this role. Be concrete — name specific skills, phrases, and bullet point ideas they should add. Do NOT give generic advice.

Candidate profile:
- Current title: ${profile.currentTitle}
- Experience: ${profile.yearsOfExperience} years
- Skills: ${profile.skills.join(", ")}
- Summary: ${profile.summary}

Target role:
- Title: ${job.title} (${job.level})
- Team: ${job.team}
- Required skills: ${job.skills.join(", ")}
- Role description: ${job.blurb}

Return ONLY a JSON array of strings, no other text:
["specific suggestion 1", "specific suggestion 2", ...]

Each suggestion should be one concrete action, max 20 words. Examples of good suggestions:
- "Add 'Kubernetes' and 'container orchestration' to your skills section"
- "Rewrite your most recent bullet to emphasize system scalability impact"
- "Include a quantified example of working with distributed systems"`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== "text") throw new Error("Unexpected response")

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("No JSON array found")

    const suggestions = JSON.parse(jsonMatch[0]) as string[]

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Tailor resume error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
