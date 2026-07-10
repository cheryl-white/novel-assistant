import { useEffect, useState } from 'react'

const STORAGE_KEY = 'novel-assistant-layout'

interface LayoutPrefs {
  sidebarCollapsed: boolean
  aiPanelCollapsed: boolean
}

function loadLayoutPrefs(): LayoutPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sidebarCollapsed: false, aiPanelCollapsed: true }
    return JSON.parse(raw) as LayoutPrefs
  } catch {
    return { sidebarCollapsed: false, aiPanelCollapsed: true }
  }
}

export function useLayoutPrefs() {
  const [prefs, setPrefs] = useState<LayoutPrefs>(loadLayoutPrefs)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  const toggleSidebar = () => setPrefs((p) => ({ ...p, sidebarCollapsed: !p.sidebarCollapsed }))

  const toggleAiPanel = () => setPrefs((p) => ({ ...p, aiPanelCollapsed: !p.aiPanelCollapsed }))

  return {
    sidebarCollapsed: prefs.sidebarCollapsed,
    aiPanelCollapsed: prefs.aiPanelCollapsed,
    toggleSidebar,
    toggleAiPanel,
  }
}
