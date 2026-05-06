import type { Metadata } from "next"
import { Instrument_Serif, Inter, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/components/AppContext"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ResumeModal } from "@/components/ResumeModal"
import { JobDrawerWrapper } from "@/components/JobDrawerWrapper"
import { JOBS } from "@/lib/jobs-data"

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Decimal Careers — Build the future of finance",
  description: "Explore open roles at Decimal AI. Upload your resume for personalized job matching powered by Claude.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontClasses = `${instrumentSerif.variable} ${inter.variable} ${geistMono.variable}`
  return (
    <html lang="en" className={fontClasses}>
      <body>
        <AppProvider jobs={JOBS}>
          <Header />
          {children}
          <Footer />
          <ResumeModal />
          <JobDrawerWrapper />
        </AppProvider>
      </body>
    </html>
  )
}
