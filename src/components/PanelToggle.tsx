interface PanelToggleProps {
  collapsed: boolean
  onToggle: () => void
  side: 'left' | 'right'
  label: string
}

export function PanelToggle({ collapsed, onToggle, side, label }: PanelToggleProps) {
  const icon = side === 'left' ? (collapsed ? '▶' : '◀') : collapsed ? '◀' : '▶'

  return (
    <button
      type="button"
      onClick={onToggle}
      className="shrink-0 rounded p-1.5 text-xs text-ink-muted transition-colors hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-stone-200"
      title={collapsed ? `展开${label}` : `折叠${label}`}
      aria-label={collapsed ? `展开${label}` : `折叠${label}`}
      aria-expanded={!collapsed}
    >
      {icon}
    </button>
  )
}
