"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useApp } from "./AppContext"

export function Header() {
  const pathname = usePathname()
  const { resume, setModalOpen } = useApp()

  const link = (href: string, label: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")
    return <Link href={href} className={isActive ? "on" : ""}>{label}</Link>
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark">◐</span>
        <span className="brand-name">Decimal</span>
        <span className="brand-sub">Careers</span>
      </Link>
      <nav className="site-nav">
        {link("/", "Home")}
        {link("/jobs", "Open roles")}
        {link("/teams", "Teams")}
        {link("/life", "Life at Decimal")}
        {link("/process", "Hiring process")}
      </nav>
      <div className="header-actions">
        {resume && (
          <div className="header-profile">
            <span className="profile-dot"/>
            <span>{resume.name}</span>
          </div>
        )}
        <button className="btn-ghost sm" onClick={() => setModalOpen(true)}>
          {resume ? "Change resume" : "Upload resume"}
        </button>
      </div>
    </header>
  )
}
