"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect root to /files
    router.replace("/files")
  }, [router])

  return null
}
