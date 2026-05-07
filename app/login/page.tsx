"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/components/AppContext"

export default function LoginPage() {
  const { user, login } = useApp()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) router.replace("/")
  }, [user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    login(name.trim(), email.trim().toLowerCase())
    router.push("/jobs")
  }

  return (
    <main className="login-page page-pad">
      <div className="login-card">
        <div className="login-eyebrow">Welcome back</div>
        <h1 className="login-title">Sign in to your account</h1>
        <p className="login-sub">
          Your uploaded resume and match results will be restored automatically.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Full name</span>
            <input
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            <span>Email address</span>
            <input
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Continue →"}
          </button>
        </form>

        <p className="login-note">
          No password needed — we identify you by email. Your resume is stored locally in your browser.
        </p>
      </div>
    </main>
  )
}
