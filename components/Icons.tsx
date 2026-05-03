import type { SVGProps } from "react"

type P = SVGProps<SVGSVGElement>

export const Icons = {
  search: (p: P) => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="7" cy="7" r="4.5"/><path d="m13.5 13.5-3-3"/></svg>,
  arrow: (p: P) => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M3 8h10m0 0-3.5-3.5M13 8l-3.5 3.5"/></svg>,
  upload: (p: P) => <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M8 10V2m0 0L5 5m3-3 3 3"/><path d="M2 10v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3"/></svg>,
  pin: (p: P) => <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M8 14s5-4.5 5-8.5A5 5 0 0 0 3 5.5C3 9.5 8 14 8 14Z"/><circle cx="8" cy="6" r="1.5"/></svg>,
  briefcase: (p: P) => <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="2" y="5" width="12" height="9" rx="1"/><path d="M6 5V3.5A.5.5 0 0 1 6.5 3h3a.5.5 0 0 1 .5.5V5"/></svg>,
  remote: (p: P) => <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></svg>,
  spark: (p: P) => <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" {...p}><path d="M8 1.5 9.4 6 14 7.4 9.4 8.8 8 13.5 6.6 8.8 2 7.4 6.6 6Z"/></svg>,
  check: (p: P) => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="m3 8 3.5 3.5L13 5"/></svg>,
  close: (p: P) => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="m3.5 3.5 9 9m0-9-9 9"/></svg>,
  doc: (p: P) => <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 1.5h6L13 5.5V14a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 3 14V1.5Z"/><path d="M9 1.5V5.5h4"/></svg>,
  filter: (p: P) => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M2 4h12M4 8h8M6 12h4"/></svg>,
  reset: (p: P) => <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 3v3.5h3.5"/><path d="M3 6.5A5.5 5.5 0 1 1 4.5 12"/></svg>,
  chevron: (p: P) => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="m6 4 4 4-4 4"/></svg>,
}
