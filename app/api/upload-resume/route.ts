import { NextResponse } from "next/server"
import { parseResume } from "@/lib/claude"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".docx") && !file.name.endsWith(".txt")) {
      return NextResponse.json({ error: "Please upload a PDF, DOCX, or TXT file" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let text = ""

    if (file.name.endsWith(".txt") || file.type === "text/plain") {
      text = buffer.toString("utf-8")
    } else if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const data = await pdfParse(buffer)
      text = data.text
    } else if (file.name.endsWith(".docx")) {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract text from file. Please try a different format." }, { status: 400 })
    }

    const profile = await parseResume(text)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Resume upload error:", error)
    return NextResponse.json(
      { error: "Failed to process resume. Please try again." },
      { status: 500 }
    )
  }
}
