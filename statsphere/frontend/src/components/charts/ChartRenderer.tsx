import { Table2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartSeries, ChartSpec } from '../../types/content'

/** Chart tokens are CSS variables; SVG attributes need concrete colours, so read them and follow theme changes. */
function useChartTokens() {
  const read = () => {
    if (typeof window === 'undefined') {
      // Prerendering: the browser re-reads the theme's colours after hydration.
      return { series: ['#2a78d6', '#eb6834', '#1baf7a'], grid: '#e6e9ef', axis: '#52514e', surface: '#ffffff', ref: '#6b7280', text: '#0b1324', muted: '#475569', border: '#e2e8f0' }
    }
    const cs = getComputedStyle(document.documentElement)
    const v = (n: string) => cs.getPropertyValue(n).trim()
    return {
      series: [v('--series-1'), v('--series-2'), v('--series-3')],
      grid: v('--chart-grid'),
      axis: v('--chart-axis'),
      surface: v('--chart-surface'),
      ref: v('--chart-ref'),
      text: v('--text'),
      muted: v('--text-muted'),
      border: v('--border'),
    }
  }
  const [tokens, setTokens] = useState(read)
  useEffect(() => {
    setTokens(read())
    const obs = new MutationObserver(() => setTokens(read()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return tokens
}

/** Round tick values (1, 2, 2.5 or 5 × 10^k steps) for an explicit axis domain. */
function niceTicks([min, max]: [number, number], target = 5): number[] {
  const raw = (max - min) / target
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => st >= raw) ?? 10 * mag
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Number(v.toFixed(10)))
  return ticks
}

const fmt = (v: unknown) => {
  if (typeof v !== 'number') return String(v ?? '')
  const abs = Math.abs(v)
  if (abs >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (abs >= 100) return v.toLocaleString(undefined, { maximumFractionDigits: 1 })
  return v.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

function ChartTooltip({
  active,
  payload,
  label,
  xKey,
  xLabel,
  series,
  colors,
}: {
  active?: boolean
  payload?: { dataKey?: string | number; value?: unknown; payload?: Record<string, unknown> }[]
  label?: unknown
  xKey: string
  xLabel: string
  series: ChartSeries[]
  colors: string[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload ?? {}
  const shown = series.filter((s) => row[s.key] !== undefined && row[s.key] !== null)
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink">
        {xLabel}: {fmt(row[xKey] ?? label)}
      </p>
      {shown.map((s) => (
        <p key={s.key} className="flex items-center gap-2 text-muted">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: colors[s.color - 1] }} />
          {s.label}: <span className="font-medium text-ink">{fmt(row[s.key])}</span>
          {s.error_key && row[s.error_key] !== undefined ? <span> (± {fmt(row[s.error_key])})</span> : null}
        </p>
      ))}
    </div>
  )
}

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  const t = useChartTokens()
  const [showTable, setShowTable] = useState(false)
  const titleId = useId()
  const colors = t.series
  const multi = spec.series.length > 1
  const horizontal = spec.layout === 'horizontal'
  const height = horizontal ? Math.max(260, spec.data.length * 56) : 320

  const axisProps = {
    stroke: t.grid,
    tick: { fill: t.axis, fontSize: 12 },
    tickLine: false,
  }
  const yDomain = (spec.y_domain as [number, number] | undefined) ?? ['auto', 'auto']
  const yTicks = spec.y_domain ? niceTicks(spec.y_domain as [number, number]) : undefined

  const refLines = spec.reference_lines.map((r) =>
    r.axis === 'y' ? (
      <ReferenceLine
        key={`y${r.value}${r.label}`}
        {...(horizontal ? { x: r.value } : { y: r.value })}
        stroke={t.ref}
        strokeWidth={1}
        label={{ value: r.label, position: horizontal ? 'top' : 'insideTopRight', fill: t.muted, fontSize: 11 }}
        ifOverflow="extendDomain"
      />
    ) : (
      <ReferenceLine
        key={`x${r.value}${r.label}`}
        x={r.value}
        stroke={t.ref}
        strokeWidth={1}
        label={{ value: r.label, position: 'insideTopRight', fill: t.muted, fontSize: 11 }}
      />
    ),
  )

  const tooltip = (
    <Tooltip
      cursor={{ stroke: t.border, strokeWidth: 1, fill: 'transparent' }}
      content={(props) => (
        <ChartTooltip
          {...(props as object)}
          xKey={spec.x_key}
          xLabel={spec.x_label}
          series={spec.series}
          colors={colors}
        />
      )}
    />
  )


  let chart
  if (spec.kind === 'scatter') {
    // ScatterChart reads coordinates from the axes' dataKeys, so normalise every series to {x, y}.
    const toXY = (rows: Record<string, number | string | null>[], key: string) =>
      rows.filter((d) => d[key] !== null && d[key] !== undefined).map((d) => ({ ...d, __x: d[spec.x_key], __y: d[key] }))
    chart = (
      <ScatterChart margin={{ top: 8, right: 16, bottom: 28, left: 8 }}>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis type="number" dataKey="__x" name={spec.x_label} domain={['auto', 'auto']} {...axisProps} label={{ value: spec.x_label, position: 'bottom', offset: 8, fill: t.muted, fontSize: 12 }} />
        <YAxis type="number" dataKey="__y" width={56} domain={yDomain} ticks={yTicks} {...axisProps} label={{ value: spec.y_label, angle: -90, position: 'insideLeft', fill: t.muted, fontSize: 12, style: { textAnchor: 'middle' } }} />
        {tooltip}
        {refLines}
        {spec.series.map((s) =>
          s.style === 'points' ? (
            <Scatter
              key={s.key}
              name={s.label}
              data={toXY(spec.data, s.key)}
              fill={colors[s.color - 1]}
              stroke={t.surface}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ) : (
            <Scatter
              key={s.key}
              name={s.label}
              data={toXY(spec.overlay ?? spec.data, s.key)}
              fill={colors[s.color - 1]}
              line={{ stroke: colors[s.color - 1], strokeWidth: 2 }}
              shape={() => <g />}
              legendType="plainline"
              isAnimationActive={false}
            />
          ),
        )}
      </ScatterChart>
    )
  } else {
    chart = (
      <ComposedChart
        data={spec.data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 16, bottom: 28, left: horizontal ? 24 : 8 }}
        barCategoryGap="24%"
      >
        <CartesianGrid stroke={t.grid} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" domain={yDomain} ticks={yTicks} {...axisProps} label={{ value: spec.x_label, position: 'bottom', offset: 8, fill: t.muted, fontSize: 12 }} />
            <YAxis type="category" dataKey={spec.x_key} width={130} {...axisProps} />
          </>
        ) : (
          <>
            <XAxis
              dataKey={spec.x_key}
              type={spec.x_type === 'number' ? 'number' : 'category'}
              domain={spec.x_type === 'number' ? ['dataMin', 'dataMax'] : undefined}
              {...axisProps}
              label={{ value: spec.x_label, position: 'bottom', offset: 8, fill: t.muted, fontSize: 12 }}
            />
            <YAxis
              width={56}
              domain={yDomain}
              ticks={yTicks}
              allowDataOverflow={false}
              {...axisProps}
              label={{ value: spec.y_label, angle: -90, position: 'insideLeft', fill: t.muted, fontSize: 12, style: { textAnchor: 'middle' } }}
            />
          </>
        )}
        {tooltip}
        {refLines}
        {spec.series.map((s) => {
          const color = colors[s.color - 1]
          if (s.style === 'bar') {
            return (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={color} maxBarSize={24} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false}>
                {s.error_key && <ErrorBar dataKey={s.error_key} width={8} strokeWidth={1.5} stroke={t.text} direction={horizontal ? 'x' : 'y'} />}
              </Bar>
            )
          }
          return (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type={s.style === 'step' ? 'stepAfter' : 'linear'}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={s.style === 'dashed' ? '6 4' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={s.style === 'line-points' ? { r: 4, fill: color, stroke: t.surface, strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: color, stroke: t.surface, strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          )
        })}
      </ComposedChart>
    )
  }

  const columns = [spec.x_key, ...spec.series.filter((s) => spec.data.some((d) => d[s.key] !== undefined)).map((s) => s.key)]
  const labelFor = (k: string) => (k === spec.x_key ? spec.x_label : spec.series.find((s) => s.key === k)?.label ?? k)

  return (
    <figure className="card p-4 sm:p-6" aria-labelledby={titleId}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <figcaption id={titleId}>
          <p className="font-semibold text-ink">{spec.title}</p>
          {spec.subtitle && <p className="text-xs text-subtle">{spec.subtitle}</p>}
        </figcaption>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"
        >
          <Table2 className="h-3.5 w-3.5" aria-hidden /> {showTable ? 'Hide data table' : 'Show data table'}
        </button>
      </div>
      {/* Legend as HTML: series order preserved; colour on the swatch only, text stays in text tokens. */}
      {multi && (
        <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label="Legend">
          {spec.series.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              {s.style === 'points' ? (
                <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[s.color - 1] }} />
              ) : (
                <span
                  aria-hidden
                  className="inline-block w-5 border-t-2"
                  style={{ borderColor: colors[s.color - 1], borderStyle: s.style === 'dashed' ? 'dashed' : 'solid' }}
                />
              )}
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div style={{ height }} role="img" aria-label={`${spec.title}. ${spec.subtitle ?? ''} Use “Show data table” for the values.`}>
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
      {showTable && (
        <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{spec.title}: data values</caption>
            <thead className="sticky top-0 bg-surface-2 text-ink">
              <tr>
                {columns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2 font-semibold">
                    {labelFor(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums text-muted">
              {spec.data.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-1.5">
                      {row[c] === null || row[c] === undefined ? '—' : fmt(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  )
}

export default ChartRenderer
