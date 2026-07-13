import { useCallback, useRef, type TouchEvent } from 'react'

interface UsePanelSwipeOptions {
  side: 'left' | 'right'
  collapsed: boolean
  onToggle: () => void
  /** Minimum horizontal distance (px) to trigger. Default 56 */
  threshold?: number
}

/**
 * Horizontal swipe to collapse / expand a side panel.
 * Left: swipe left to collapse, right to expand.
 * Right: swipe right to collapse, left to expand.
 * Ignores mostly-vertical scrolls.
 */
export function usePanelSwipe({ side, collapsed, onToggle, threshold = 56 }: UsePanelSwipeOptions) {
  const startX = useRef(0)
  const startY = useRef(0)
  const tracking = useRef(false)

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    startX.current = t.clientX
    startY.current = t.clientY
    tracking.current = true
  }, [])

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current) return
      tracking.current = false
      const t = e.changedTouches[0]
      if (!t) return

      const dx = t.clientX - startX.current
      const dy = t.clientY - startY.current

      // Prefer horizontal gestures; ignore scroll
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.4) return

      if (side === 'left') {
        if (!collapsed && dx < 0) onToggle()
        else if (collapsed && dx > 0) onToggle()
      } else {
        if (!collapsed && dx > 0) onToggle()
        else if (collapsed && dx < 0) onToggle()
      }
    },
    [collapsed, onToggle, side, threshold],
  )

  const onTouchCancel = useCallback(() => {
    tracking.current = false
  }, [])

  return { onTouchStart, onTouchEnd, onTouchCancel }
}
