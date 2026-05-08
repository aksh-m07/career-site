import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { z } from "zod"

const getClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY })

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

    const message = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a professional resume coach helping a candidate reposition their resume for a role they don't perfectly match yet.

Your job is to give 5-7 SPECIFIC, ACTIONABLE changes they can make to their existing resume to maximize their chances. Even if the match is weak, give concrete, useful advice — not "this role isn't for you."

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

Instructions:
- Name specific skills, keywords, or phrases to add
- Suggest specific bullet point rewrites that highlight transferable experience
- Recommend what to emphasize, reorder, or reframe
- If the gap is large, focus on transferable skills and how to bridge them
- NEVER say the candidate isn't a fit — assume they want to apply and help them

Return ONLY a JSON array of strings, no other text:
["specific suggestion 1", "specific suggestion 2", ...]

Each item: one concrete action, max 25 words.`,
        },
      ],
    })

    const text = message.choices[0]?.message?.content ?? ""
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("No JSON array found in: " + text)

    const suggestions = JSON.parse(jsonMatch[0]) as string[]
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Tailor resume error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
