import { Suspense } from "react"
import { JobsContent } from "./JobsContent"

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  )
}
