import { useEffect, useState } from 'react'

const STORAGE_KEY = 'novel-assistant-guide-seen'

export function useOnboarding() {
  const [guideOpen, setGuideOpen] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setGuideOpen(true)
    } catch {
      setGuideOpen(true)
    }
  }, [])

  const closeGuide = () => {
    setGuideOpen(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  const openGuide = () => setGuideOpen(true)

  return { guideOpen, closeGuide, openGuide }
}
