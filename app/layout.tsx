import type { Metadata } from "next"
import "./globals.css"
import { AppProvider } from "@/components/AppContext"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ResumeModal } from "@/components/ResumeModal"
import { JobDrawerWrapper } from "@/components/JobDrawerWrapper"
import { JOBS } from "@/lib/jobs-data"

export const metadata: Metadata = {
  title: "Decimal Careers — Build the future of finance",
  description: "Explore open roles at Decimal AI. Upload your resume for personalized job matching powered by Claude.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
