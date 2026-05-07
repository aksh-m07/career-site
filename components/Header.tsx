"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useApp } from "./AppContext"
import { Icons } from "./Icons"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { resume, setModalOpen, user, logout } = useApp()

  const link = (href: string, label: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")
    return <Link href={href} className={isActive ? "on" : ""}>{label}</Link>
  }

  function handleLogout() {
    logout()
    router.push("/")
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
        {link("/history", "Hiring history")}
        {link("/life", "Life at Decimal")}
      </nav>
      <div className="header-actions">
        {resume ? (
          <button className="btn-ghost sm header-uploaded" onClick={() => setModalOpen(true)}>
            <Icons.check /> Resume uploaded
          </button>
        ) : (
          <button className="btn-ghost sm" onClick={() => setModalOpen(true)}>
            <Icons.upload /> Upload resume
          </button>
        )}
        {user ? (
          <div className="header-profile">
            <span>{user.name}</span>
            <button className="header-logout" onClick={handleLogout}>Log out</button>
          </div>
        ) : (
          <Link href="/login" className="btn-ghost sm">Log in</Link>
        )}
      </div>
    </header>
  )
}
