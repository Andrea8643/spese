import { useRef, useState } from 'react'
import { fmt, fmt0, parseISO, WEEKDAYS_SHORT } from './utils'

/** Colonne impilate per giorno: Necessità (blu) + Personale (arancio). */
export function DailyBars({ data, weekly }: { data: { date: string; necessita: number; personale: number }[]; weekly?: boolean }) {
  const [hover, setHover] = useState<number | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const W = 640
  const H = 190
  const padL = 34
  const padB = 22
  const padT = 8
  const max = Math.max(10, ...data.map((d) => d.necessita + d.personale))
  const nice = niceMax(max)
  const innerW = W - padL - 4
  const innerH = H - padB - padT
  const slot = innerW / data.length
  const bw = Math.max(4, Math.min(weekly ? 44 : 16, slot - 3))
  const y = (v: number) => padT + innerH - (v / nice) * innerH
  const ticks = [0, nice / 2, nice]
  const hd = hover != null ? data[hover] : null

  return (
    <div ref={wrap} style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Spese giornaliere">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#383835' : 'var(--grid)'} strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end">{fmt0(t).replace(/\s?€/, '')}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - bw) / 2
          const nH = (d.necessita / nice) * innerH
          const pH = (d.personale / nice) * innerH
          const gap = nH > 0 && pH > 0 ? 2 : 0
          const day = parseISO(d.date)
          const showLabel = weekly || data.length <= 10 || day.getDate() === 1 || day.getDate() % 5 === 0
          return (
            <g key={d.date} opacity={hover == null || hover === i ? 1 : 0.45}>
              {nH > 0 && <path d={barPath(x, y(d.necessita), bw, nH, pH === 0)} fill="var(--needs)" />}
              {pH > 0 && <path d={barPath(x, y(d.necessita) - pH - gap, bw, pH, true)} fill="var(--personal)" />}
              {showLabel && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle">
                  {weekly ? WEEKDAYS_SHORT[(day.getDay() + 6) % 7] : day.getDate()}
                </text>
              )}
              <rect
                x={padL + i * slot} y={padT} width={slot} height={innerH} fill="transparent"
                onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}
              />
            </g>
          )
        })}
      </svg>
      {hd && (
        <div className="tooltip" style={{ left: `${((padL + (hover! + 0.5) * slot) / W) * 100}%`, top: `${(y(hd.necessita + hd.personale) / H) * 100}%` }}>
          <div className="bold" style={{ marginBottom: 4 }}>{parseISO(hd.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
          <div className="row gap-s"><span className="dot" style={{ background: 'var(--needs)' }} /> Necessità <b className="tnum" style={{ marginLeft: 'auto' }}>{fmt(hd.necessita)}</b></div>
          <div className="row gap-s"><span className="dot" style={{ background: 'var(--personal)' }} /> Personale <b className="tnum" style={{ marginLeft: 'auto' }}>{fmt(hd.personale)}</b></div>
        </div>
      )}
      <div className="legend" style={{ marginTop: 8 }}>
        <span><i className="dot" style={{ background: 'var(--needs)' }} /> Necessità</span>
        <span><i className="dot" style={{ background: 'var(--personal)' }} /> Personale</span>
      </div>
    </div>
  )
}

function barPath(x: number, top: number, w: number, h: number, roundTop: boolean) {
  const r = Math.min(4, w / 2, h)
  if (!roundTop || h < 1) return `M${x},${top}h${w}v${h}h${-w}z`
  return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${top + h}z`
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return m * p
}

/** Barra di ripartizione dello stipendio. */
export function AllocationBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1
  return (
    <div>
      <div className="alloc-bar" aria-hidden="true">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(Math.max(0, p.value) / total) * 100}%`, background: p.color }} title={`${p.label}: ${fmt(p.value)}`} />
        ))}
      </div>
      <div className="legend" style={{ marginTop: 10 }}>
        {parts.map((p) => (
          <span key={p.label}>
            <i className="dot" style={{ background: p.color }} /> {p.label} <b className="tnum" style={{ color: 'var(--text)' }}>{fmt0(p.value)}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Andamento cumulativo dei risparmi (linea). */
export function SavingsLine({ points }: { points: { label: string; value: number; projected?: boolean }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) return null
  const W = 640
  const H = 170
  const padL = 44
  const padB = 22
  const padT = 10
  const max = niceMax(Math.max(10, ...points.map((p) => p.value)))
  const min = Math.min(0, ...points.map((p) => p.value))
  const innerW = W - padL - 10
  const innerH = H - padB - padT
  const x = (i: number) => padL + (i / (points.length - 1)) * innerW
  const y = (v: number) => padT + innerH - ((v - min) / (max - min)) * innerH
  const solid = points.filter((p) => !p.projected)
  const line = (arr: typeof points, offset = 0) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(i + offset)},${y(p.value)}`).join('')
  const proj = points.findIndex((p) => p.projected)
  const h = hover != null ? points[hover] : null
  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Andamento dei risparmi">
        {[min, (max + min) / 2, max].map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 10} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end">{fmt0(t).replace(/\s?€/, '')}</text>
          </g>
        ))}
        <path d={`${line(solid)}L${x(solid.length - 1)},${y(min)}L${x(0)},${y(min)}z`} fill="var(--savings)" opacity={0.12} />
        <path d={line(solid)} fill="none" stroke="var(--savings)" strokeWidth={2} />
        {proj > 0 && (
          <path d={`M${x(proj - 1)},${y(points[proj - 1].value)}L${x(proj)},${y(points[proj].value)}`} fill="none" stroke="var(--savings)" strokeWidth={2} strokeDasharray="4 4" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r={hover === i ? 5 : 4} fill={p.projected ? 'var(--surface)' : 'var(--savings)'} stroke="var(--savings)" strokeWidth={2} />
            {(points.length <= 8 || i % Math.ceil(points.length / 8) === 0 || i === points.length - 1) && (
              <text x={x(i)} y={H - 6} textAnchor="middle">{p.label}</text>
            )}
            <rect x={x(i) - innerW / points.length / 2} y={padT} width={innerW / points.length} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
          </g>
        ))}
      </svg>
      {h && (
        <div className="tooltip" style={{ left: `${(x(hover!) / W) * 100}%`, top: `${(y(h.value) / H) * 100}%` }}>
          <b>{h.label}</b> · <span className="tnum">{fmt(h.value)}</span> {h.projected && <span className="muted">(previsto)</span>}
        </div>
      )}
    </div>
  )
}
