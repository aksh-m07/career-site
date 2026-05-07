import { NextResponse } from "next/server"
import { parseResume } from "@/lib/claude"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const name = file.name.toLowerCase()
    const isAccepted = name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc") || name.endsWith(".txt")
    if (!isAccepted) {
      return NextResponse.json({ error: "Please upload a PDF, DOCX, or TXT file" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let text = ""

    if (name.endsWith(".txt")) {
      text = buffer.toString("utf-8")
    } else if (name.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const result = await pdfParse(buffer)
      text = result.text
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Couldn't extract text from this file. Make sure it's not a scanned image PDF. Try copying your resume as a TXT file." },
        { status: 400 }
      )
    }

    console.log(`[upload-resume] Extracted ${text.length} chars from ${name}, parsing with Claude...`)

    const profile = await parseResume(text)

    console.log(`[upload-resume] Parsed: ${profile.name}, ${profile.currentTitle}, ${profile.skills.length} skills`)

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("[upload-resume] Error:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `Failed to process resume: ${msg.slice(0, 120)}` },
      { status: 500 }
    )
  }
}
