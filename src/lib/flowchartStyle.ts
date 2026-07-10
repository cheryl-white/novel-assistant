/** 中等饱和度果冻色板：fill 背景 / stroke 描边 / text 深色字 / light 高光 / deep 底部 */
const PROCESS_PALETTE = [
  { fill: '#6BA3E8', stroke: '#4A88D0', text: '#0F2847', light: '#A8CFF5', deep: '#3D72B0' },
  { fill: '#62C082', stroke: '#45A868', text: '#0F3320', light: '#9ADDB0', deep: '#358050' },
  { fill: '#E8A055', stroke: '#D08840', text: '#4A2808', light: '#F5CC90', deep: '#B87030' },
  { fill: '#B088E0', stroke: '#9668CC', text: '#2E1048', light: '#D4B8F0', deep: '#7850A8' },
  { fill: '#55C4C4', stroke: '#38AAAA', text: '#0A3333', light: '#90E0E0', deep: '#288888' },
  { fill: '#E878A8', stroke: '#D06090', text: '#4A1028', light: '#F5B0C8', deep: '#B04878' },
  { fill: '#8898E0', stroke: '#6878C8', text: '#1A2048', light: '#B8C4F0', deep: '#5058A0' },
  { fill: '#D4B850', stroke: '#BFA038', text: '#3D3008', light: '#F0E090', deep: '#987828' },
]

const DECISION_PALETTE = [
  { fill: '#E8C060', stroke: '#D0A040', text: '#4A3808', light: '#F5E0A0', deep: '#B08828' },
  { fill: '#E87070', stroke: '#D05050', text: '#4A1010', light: '#F5A8A8', deep: '#B03838' },
  { fill: '#70D0A0', stroke: '#50B880', text: '#0F4028', light: '#A8F0C8', deep: '#389068' },
]

const NODE_PATTERN =
  /\b([A-Za-z][A-Za-z0-9_]*)\s*(\[\[[^\]]+\]\]|\[[^\]]+\]|\{[^}]+\}|\(\[[^\]]+\]\)|\([^)]*\))/g

function collectNodes(code: string): { id: string; isDecision: boolean }[] {
  const seen = new Set<string>()
  const nodes: { id: string; isDecision: boolean }[] = []

  for (const match of code.matchAll(NODE_PATTERN)) {
    const id = match[1]
    const shape = match[2]
    if (seen.has(id)) continue
    seen.add(id)
    nodes.push({ id, isDecision: shape.startsWith('{') })
  }

  return nodes
}

/** 将方括号节点转为圆角节点，并注入多彩 classDef */
export function enhanceFlowchartVisuals(code: string): string {
  const trimmed = code.trim()
  if (!/^(flowchart|graph)\s/im.test(trimmed)) return code

  const lines = trimmed
    .split('\n')
    .filter((l) => !/^\s*classDef\s/.test(l) && !/^\s*class\s/.test(l))

  const roundedLines = lines.map((line) => {
    if (/^\s*(flowchart|graph|subgraph|end|style|linkStyle)\s/i.test(line.trim())) {
      return line
    }
    return line
      .replace(/\b([A-Za-z][A-Za-z0-9_]*)\s*\[([^\]]+)\]/g, '$1($2)')
      .replace(/\b([A-Za-z][A-Za-z0-9_]*)\s*\(\[([^\]]+)\]\)/g, '$1($2)')
  })

  const nodes = collectNodes(roundedLines.join('\n'))
  if (nodes.length === 0) return roundedLines.join('\n')

  const classDefs: string[] = []
  const classLines: string[] = []
  let processIdx = 0
  let decisionIdx = 0

  for (const { id, isDecision } of nodes) {
    if (isDecision) {
      const c = DECISION_PALETTE[decisionIdx % DECISION_PALETTE.length]
      const cls = `decision${decisionIdx}`
      classDefs.push(
        `classDef ${cls} fill:${c.fill},stroke:${c.stroke},color:${c.text},stroke-width:2px`,
      )
      classLines.push(`class ${id} ${cls}`)
      decisionIdx++
    } else {
      const c = PROCESS_PALETTE[processIdx % PROCESS_PALETTE.length]
      const cls = `block${processIdx}`
      classDefs.push(
        `classDef ${cls} fill:${c.fill},stroke:${c.stroke},color:${c.text},stroke-width:2px`,
      )
      classLines.push(`class ${id} ${cls}`)
      processIdx++
    }
  }

  return [...roundedLines, ...classDefs, ...classLines].join('\n')
}

/** 渲染后美化 SVG：果冻渐变、圆角、深色文字、阴影高光 */
export function beautifyFlowchartSvg(svg: string, uid = '0'): string {
  const filterId = `jelly-shadow-${uid}`

  const hexFills = [
    ...svg.matchAll(/fill="(#[0-9A-Fa-f]{6})"/gi),
    ...svg.matchAll(/fill:(#[0-9A-Fa-f]{6})/gi),
  ].map((m) => m[1].toLowerCase())
  const uniqueFills = [...new Set(hexFills)]

  let result = svg.replace(/id="jelly-shadow"/g, `id="${filterId}"`)
  result = result.replace(/url\(#jelly-shadow\)/g, `url(#${filterId})`)

  if (!result.includes('<defs>')) {
    result = result.replace(/(<svg[^>]*>)/, `$1${buildGradientDefs(uniqueFills, uid)}`)
  }

  uniqueFills.forEach((fill, i) => {
    const gradId = `jelly-grad-${uid}-${i}`
    const re = new RegExp(`(<rect[^>]*\\sfill=")${fill}(")`, 'gi')
    result = result.replace(re, `$1url(#${gradId})$2`)
    const polyRe = new RegExp(`(<polygon[^>]*\\sfill=")${fill}(")`, 'gi')
    result = result.replace(polyRe, `$1url(#${gradId})$2`)
    const styleRe = new RegExp(`(fill:)${fill}([^;"!]*)(!important)?`, 'gi')
    result = result.replace(styleRe, `fill:url(#${gradId})$2`)
  })

  result = result.replace(/<rect(\s[^>]*?)>/g, (_m, attrs) => {
    let a = attrs
    if (!/rx\s*=/.test(a)) a += ' rx="20" ry="20"'
    else a = a.replace(/rx="[^"]*"/, 'rx="20"').replace(/ry="[^"]*"/, 'ry="20"')
    return `<rect${a}>`
  })

  result = result.replace(/<polygon(\s[^>]*?)>/g, (_m, attrs) => {
    let a = attrs
    if (!/stroke-width/.test(a)) a += ' stroke-width="2"'
    return `<polygon${a}>`
  })

  result = result.replace(/<g class="(node[^"]*)"([^>]*)>/g, (full, cls, attrs) => {
    if (/filter\s*=/.test(attrs)) return full
    return `<g class="${cls} flow-node"${attrs} filter="url(#${filterId})">`
  })

  result = result.replace(/<text([^>]*)>/g, (full, attrs) => {
    if (/fill=/.test(attrs)) return full.replace(/fill="[^"]*"/, 'fill="#1a2332"')
    return `<text${attrs} fill="#1a2332">`
  })

  result = result.replace(/<tspan([^>]*)>/g, (full, attrs) => {
    if (/fill=/.test(attrs)) return full.replace(/fill="[^"]*"/, 'fill="#1a2332"')
    return `<tspan${attrs} fill="#1a2332">`
  })

  return result
}

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + amount)
  const g = Math.min(255, ((n >> 8) & 0xff) + amount)
  const b = Math.min(255, (n & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((n >> 16) & 0xff) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function buildGradientDefs(fills: string[], uid: string): string {
  const allColors = [...PROCESS_PALETTE, ...DECISION_PALETTE]
  const jellyFilter = `
<filter id="jelly-shadow-${uid}" x="-40%" y="-40%" width="180%" height="180%">
  <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="rgba(0,0,0,0.22)" flood-opacity="1"/>
  <feDropShadow dx="0" dy="-2" stdDeviation="3" flood-color="rgba(255,255,255,0.55)" flood-opacity="1"/>
</filter>`
  const gradients: string[] = [jellyFilter]

  fills.forEach((fill, i) => {
    const matched = allColors.find((c) => c.fill.toLowerCase() === fill.toLowerCase()) ?? {
      fill,
      light: lighten(fill, 30),
      deep: darken(fill, 15),
    }

    gradients.push(`<linearGradient id="jelly-grad-${uid}-${i}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${matched.light}" stop-opacity="0.95"/>
      <stop offset="18%" stop-color="#FFFFFF" stop-opacity="0.28"/>
      <stop offset="50%" stop-color="${matched.fill}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${matched.deep}" stop-opacity="1"/>
    </linearGradient>`)
  })

  return `<defs>${gradients.join('')}</defs>`
}

export const FLOWCHART_PREVIEW_CSS = `
.mermaid-flowchart-preview svg {
  max-width: 100%;
  height: auto;
}
.mermaid-flowchart-preview svg .node rect,
.mermaid-flowchart-preview svg .node polygon {
  stroke-linejoin: round;
}
.mermaid-flowchart-preview svg .node .label,
.mermaid-flowchart-preview svg .nodeLabel,
.mermaid-flowchart-preview svg .node text,
.mermaid-flowchart-preview svg .node tspan,
.mermaid-flowchart-preview svg foreignObject,
.mermaid-flowchart-preview svg foreignObject div,
.mermaid-flowchart-preview svg foreignObject span,
.mermaid-flowchart-preview svg foreignObject p {
  color: #1a2332 !important;
  fill: #1a2332 !important;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif !important;
  font-size: 13px !important;
  font-weight: 600 !important;
}
.mermaid-flowchart-preview svg .edgePath .path {
  stroke: #8899aa !important;
  stroke-width: 2px !important;
}
.mermaid-flowchart-preview svg .arrowheadPath {
  fill: #8899aa !important;
  stroke: #8899aa !important;
}
`
