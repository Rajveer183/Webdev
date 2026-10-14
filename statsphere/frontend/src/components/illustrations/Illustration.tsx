/**
 * Brand illustrations drawn in code: abstract, data-flavoured motifs per subject.
 * Colours come from theme tokens through `currentColor`, so they follow light/dark mode.
 * All geometry is deterministic (no randomness), so prerendered HTML hydrates cleanly.
 */
import type { ReactNode } from 'react'

export type Motif = 'statistics' | 'regression' | 'network' | 'neural' | 'analytics' | 'matrix' | 'research' | 'timeseries' | 'code'

const CATEGORY_MOTIF: Record<string, Motif> = {
  Statistics: 'statistics',
  Mathematics: 'matrix',
  'Data Science': 'network',
  'Machine Learning': 'neural',
  Analytics: 'analytics',
  Programming: 'code',
  Research: 'research',
}

export function motifFor(category?: string | null, slug?: string): Motif {
  if (slug?.includes('time-series') || slug?.includes('forecast')) return 'timeseries'
  if (slug?.includes('regression')) return 'regression'
  return CATEGORY_MOTIF[category ?? ''] ?? 'statistics'
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** Fixed pseudo-noise so shapes look organic but render identically everywhere. */
const NOISE = [0.12, -0.35, 0.48, -0.08, 0.27, -0.42, 0.05, 0.38, -0.22, 0.16, -0.5, 0.31, -0.12, 0.44, -0.3, 0.09, 0.22, -0.18, 0.36, -0.05]

function Bell({ cx, base, w, h, className }: { cx: number; base: number; w: number; h: number; className?: string }) {
  const pts: string[] = []
  for (let i = 0; i <= 60; i++) {
    const x = -3 + (6 * i) / 60
    pts.push(`${r2(cx + (x / 3) * w)},${r2(base - Math.exp(-(x * x) / 2) * h)}`)
  }
  return <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} />
}

function Motifs({ motif }: { motif: Motif }) {
  switch (motif) {
    case 'statistics': {
      const bars = [18, 34, 62, 96, 118, 102, 70, 40, 20]
      return (
        <>
          <g className="text-brand/15">
            {bars.map((h, i) => (
              <rect key={i} x={82 + i * 26} y={232 - h} width={20} height={h} rx={4} fill="currentColor" />
            ))}
          </g>
          <Bell cx={186} base={232} w={130} h={128} className="text-accent" />
          <line x1={186} y1={232} x2={186} y2={96} stroke="currentColor" strokeDasharray="4 6" className="text-brand/40" strokeWidth={2} />
          <g className="text-accent">
            <circle cx={186} cy={104} r={7} fill="currentColor" />
          </g>
          <g className="text-brand/60" fontFamily="inherit" fontSize={14} fill="currentColor">
            <text x={176} y={256}>μ</text>
            <text x={290} y={92}>σ²</text>
          </g>
        </>
      )
    }
    case 'regression': {
      const pts = Array.from({ length: 18 }, (_, i) => [70 + i * 15, 220 - i * 8.2 + NOISE[i] * 46])
      return (
        <>
          <path d="M70 232 L340 92 L340 128 L70 250 Z" fill="currentColor" className="text-accent/10" />
          <line x1={62} y1={236} x2={346} y2={94} stroke="currentColor" strokeWidth={3} strokeLinecap="round" className="text-accent" />
          <g className="text-brand">
            {pts.map(([x, y], i) => (
              <circle key={i} cx={r2(x)} cy={r2(y)} r={6} fill="currentColor" stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
          <text x={230} y={250} fontSize={15} fill="currentColor" className="text-brand/60">
            ŷ = a + bx
          </text>
        </>
      )
    }
    case 'timeseries': {
      const pts: string[] = []
      const fc: string[] = []
      for (let i = 0; i <= 36; i++) {
        const x = 50 + i * 8.2
        const y = 205 - i * 2.2 - Math.sin((i / 12) * Math.PI * 2) * 26 + NOISE[i % 20] * 10
        ;(i <= 26 ? pts : fc).push(`${r2(x)},${r2(y)}`)
      }
      return (
        <>
          <rect x={263} y={70} width={92} height={170} rx={10} fill="currentColor" className="text-accent/10" />
          <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" className="text-brand" />
          <polyline points={[pts[pts.length - 1], ...fc].join(' ')} fill="none" stroke="currentColor" strokeWidth={3} strokeDasharray="7 6" className="text-accent" />
          <text x={276} y={92} fontSize={13} fill="currentColor" className="text-accent">
            forecast
          </text>
        </>
      )
    }
    case 'network': {
      const nodes = [
        [100, 90], [190, 70], [280, 105], [330, 190], [250, 220], [150, 230], [80, 170], [200, 150],
      ]
      const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [7, 0], [7, 2], [7, 4], [7, 6], [1, 7], [5, 7]]
      return (
        <>
          <g className="text-brand/30" stroke="currentColor" strokeWidth={2}>
            {edges.map(([a, b], i) => (
              <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
            ))}
          </g>
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 7 ? 18 : 11} fill="currentColor" stroke="var(--surface)" strokeWidth={3} className={i === 7 ? 'text-accent' : 'text-brand'} />
          ))}
        </>
      )
    }
    case 'neural': {
      const layers = [3, 5, 5, 2]
      const pos = layers.map((n, li) => Array.from({ length: n }, (_, i) => [80 + li * 85, 150 + (i - (n - 1) / 2) * 42]))
      return (
        <>
          <g className="text-brand/20" stroke="currentColor" strokeWidth={1.5}>
            {pos.slice(0, -1).flatMap((layer, li) =>
              layer.flatMap(([x1, y1], a) => pos[li + 1].map(([x2, y2], b) => <line key={`${li}-${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} />)),
            )}
          </g>
          {pos.flatMap((layer, li) =>
            layer.map(([x, y], i) => (
              <circle key={`${li}-${i}`} cx={x} cy={y} r={12} fill="currentColor" stroke="var(--surface)" strokeWidth={3} className={li === pos.length - 1 ? 'text-accent' : 'text-brand'} />
            )),
          )}
        </>
      )
    }
    case 'analytics': {
      const bars = [70, 110, 90, 140, 125, 170]
      return (
        <>
          <rect x={58} y={58} width={130} height={70} rx={12} fill="currentColor" className="text-brand/10" />
          <text x={74} y={88} fontSize={13} fill="currentColor" className="text-brand/60">
            Revenue index
          </text>
          <text x={74} y={114} fontSize={24} fontWeight={600} fill="currentColor" className="text-brand">
            1.16×
          </text>
          <g className="text-brand/70">
            {bars.map((h, i) => (
              <rect key={i} x={210 + i * 24} y={240 - h} width={16} height={h} rx={4} fill="currentColor" />
            ))}
          </g>
          <polyline points="70,230 105,205 140,214 175,180" fill="none" stroke="currentColor" strokeWidth={3} className="text-accent" strokeLinecap="round" />
          <circle cx={175} cy={180} r={6} fill="currentColor" className="text-accent" />
        </>
      )
    }
    case 'matrix': {
      const vals = ['1', '0', '2', '−1', '3', '1', '0', '2', '4']
      return (
        <>
          <g className="text-brand" stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
            <path d="M70 80 h-12 v150 h12" />
            <path d="M210 80 h12 v150 h-12" />
          </g>
          {vals.map((v, i) => (
            <text key={i} x={84 + (i % 3) * 46} y={115 + Math.floor(i / 3) * 48} fontSize={22} fill="currentColor" className={i % 4 === 0 ? 'text-accent' : 'text-brand/70'}>
              {v}
            </text>
          ))}
          <path d="M250 200 C 275 200, 285 110, 310 110 S 340 200, 360 200" fill="none" stroke="currentColor" strokeWidth={3} className="text-accent" />
          <text x={255} y={92} fontSize={18} fill="currentColor" className="text-brand/60">
            ∫ f(x) dx
          </text>
        </>
      )
    }
    case 'research': {
      const cells = Array.from({ length: 16 }, (_, i) => i)
      return (
        <>
          {cells.map((i) => (
            <rect
              key={i}
              x={70 + (i % 4) * 42}
              y={70 + Math.floor(i / 4) * 42}
              width={34}
              height={34}
              rx={7}
              fill="currentColor"
              className={(i * 7) % 5 === 0 ? 'text-accent' : (i * 3) % 4 === 0 ? 'text-brand/60' : 'text-brand/15'}
            />
          ))}
          <g className="text-brand" stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round">
            <path d="M268 230 v-60" />
            <path d="M305 230 v-110" />
            <path d="M342 230 v-85" />
          </g>
          <g className="text-accent" fill="currentColor">
            <circle cx={268} cy={170} r={7} />
            <circle cx={305} cy={120} r={7} />
            <circle cx={342} cy={145} r={7} />
          </g>
        </>
      )
    }
    case 'code':
      return (
        <>
          <rect x={60} y={64} width={200} height={170} rx={14} fill="currentColor" className="text-brand/10" />
          <g fontFamily="ui-monospace, monospace" fontSize={13} fill="currentColor">
            <text x={78} y={98} className="text-brand/40"># reproducible analysis</text>
            <text x={78} y={124} className="text-brand/70">d &lt;- read.csv(f)</text>
            <text x={78} y={150} className="text-accent">fit</text>
            <text x={104} y={150} className="text-brand/70">&lt;- lm(y ~ x, d)</text>
            <text x={78} y={176} className="text-brand/70">summary(fit)</text>
            <text x={78} y={202} className="text-brand/70">plot(fit)</text>
          </g>
          <Bell cx={318} base={220} w={58} h={100} className="text-accent" />
        </>
      )
  }
}

export function Illustration({ motif, className = '', label }: { motif: Motif; className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <pattern id={`grid-${motif}`} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
        <radialGradient id={`glow-${motif}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--accent-soft)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--surface)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="10" y="10" width="380" height="280" rx="16" fill="var(--bg-card)" stroke="var(--border)" />
      <rect x="10" y="10" width="380" height="280" rx="16" fill={`url(#grid-${motif})`} className="text-primary/10" />
      <rect x="10" y="10" width="380" height="280" rx="16" fill={`url(#glow-${motif})`} />
      <Motifs motif={motif} />
    </svg>
  )
}

/** Small square accent used on cards. */
export function MotifBadge({ motif, children }: { motif: Motif; children?: ReactNode }) {
  return (
    <span className="relative block h-28 overflow-hidden rounded-xl bg-surface-2">
      <Illustration motif={motif} className="absolute -right-6 -bottom-8 h-40 w-auto opacity-90" />
      {children}
    </span>
  )
}
