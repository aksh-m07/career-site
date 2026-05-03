"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react"
import type { CandidateProfile } from "@/lib/types"

interface ResumeUploaderProps {
  onProfileReady: (profile: CandidateProfile) => void
  onClear: () => void
  isMatching: boolean
  profile: CandidateProfile | null
}

type UploadState = "idle" | "dragging" | "uploading" | "parsing" | "done" | "error"

const STEP_LABELS = ["Reading file…", "Extracting profile…", "Almost done…"]

export function ResumeUploader({ onProfileReady, onClear, isMatching, profile }: ResumeUploaderProps) {
  const [state, setState] = useState<UploadState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setState("uploading")
    setError(null)
    setStep(0)

    const stepInterval = setInterval(() => {
      setStep((s) => (s < STEP_LABELS.length - 1 ? s + 1 : s))
    }, 1200)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload-resume", { method: "POST", body: formData })
      clearInterval(stepInterval)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Upload failed")
      }

      const data = await res.json()
      setState("done")
      onProfileReady(data.profile)
    } catch (err) {
      clearInterval(stepInterval)
      setState("error")
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setState("idle")
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleClear() {
    setState("idle")
    setError(null)
    setStep(0)
    if (inputRef.current) inputRef.current.value = ""
    onClear()
  }

  const isLoading = state === "uploading" || state === "parsing" || isMatching

  if (state === "done" && profile) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">Profile Detected</span>
            </div>
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {profile.name && (
            <p className="text-base font-semibold text-gray-900 mb-1">{profile.name}</p>
          )}
          <p className="text-sm text-gray-700 font-medium">{profile.currentTitle}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {profile.yearsOfExperience} years · {profile.seniorityLevel} · {profile.domain}
          </p>

          <p className="text-xs text-gray-600 mt-3 leading-relaxed border-t border-gray-50 pt-3">
            {profile.summary}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 8).map((skill) => (
              <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs">
                {skill}
              </span>
            ))}
            {profile.skills.length > 8 && (
              <span className="text-xs text-gray-400 py-0.5">+{profile.skills.length - 8} more</span>
            )}
          </div>
        </div>

        {isMatching && (
          <div className="flex items-center gap-2 text-sm text-blue-600 px-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ranking jobs for you…
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setState("dragging") }}
      onDragLeave={() => setState("idle")}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
      className={`
        relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer
        ${state === "dragging" ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"}
        ${isLoading ? "pointer-events-none" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleInputChange}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-medium text-blue-600">{STEP_LABELS[step]}</p>
          <div className="flex gap-1.5 mt-1">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-colors duration-300 ${i <= step ? "bg-blue-400" : "bg-gray-200"}`}
              />
            ))}
          </div>
        </div>
      ) : state === "error" ? (
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-medium text-red-600">Upload failed</p>
          <p className="text-xs text-red-500">{error}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setState("idle") }}
            className="mt-1 text-xs text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            {state === "dragging" ? (
              <FileText className="w-5 h-5 text-blue-600" />
            ) : (
              <Upload className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {state === "dragging" ? "Drop to upload" : "Upload your resume"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, or TXT · drag & drop or click</p>
          </div>
        </div>
      )}
    </div>
  )
}
