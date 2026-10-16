import { Link } from 'react-router-dom'
import { AlertTriangle, Award, BookOpen, Briefcase, FlaskConical, GraduationCap, Landmark, Vote } from 'lucide-react'
import timelineJson from '../data/timeline.json'
import type { VerificationStatus } from '../data/types'
import { StatusBadge } from './ui'

export type EventKind = 'grado' | 'docencia' | 'gestion_uni' | 'cargo_publico' | 'investigacion' | 'candidatura' | 'control'

export interface TimelineEvent {
  from: string
  to: string | null
  kind: EventKind
  title: string
  org: string
  status: VerificationStatus
  sourceIds: string[]
  approx?: boolean
}

export const timelines = timelineJson as { candidateId: string; events: TimelineEvent[] }[]

const KIND: Record<EventKind, { label: string; icon: typeof Award; bar: string }> = {
  grado: { label: 'Grado', icon: GraduationCap, bar: 'bg-signal border-ink' },
  docencia: { label: 'Docencia', icon: BookOpen, bar: 'bg-muted/40 border-muted' },
  gestion_uni: { label: 'Gestión UNI', icon: Briefcase, bar: 'bg-ink border-ink' },
  cargo_publico: { label: 'Cargo público', icon: Landmark, bar: 'bg-ink/70 border-ink' },
  investigacion: { label: 'Investigación', icon: FlaskConical, bar: 'bg-muted/60 border-muted' },
  candidatura: { label: 'Candidatura', icon: Vote, bar: 'bg-transparent border-ink border-dashed' },
  control: { label: 'Informe de control', icon: AlertTriangle, bar: 'bg-transparent border-alert border-dashed' },
}

const NOW = 2026.8
const toYear = (d: string | null | undefined, fallback: number) => {
  if (!d) return fallback
  if (d === 'ongoing') return NOW
  const [y, m] = d.split('-').map(Number)
  return y + ((m || 1) - 1) / 12
}
const fmt = (d: string | null) => (!d ? '' : d === 'ongoing' ? 'a la fecha' : d.split('-').reverse().join('-'))

export default function Timeline({ candidateId }: { candidateId: string }) {
  const events = timelines.find((t) => t.candidateId === candidateId)?.events ?? []
  if (!events.length) return null
  const min = Math.floor(Math.min(...events.map((e) => toYear(e.from, NOW))) / 5) * 5
  const span = NOW - min
  const pct = (y: number) => ((y - min) / span) * 100
  const ticks: number[] = []
  for (let y = min; y <= 2026; y += span > 30 ? 10 : 5) ticks.push(y)

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        {(Object.keys(KIND) as EventKind[])
          .filter((k) => events.some((e) => e.kind === k))
          .map((k) => {
            const Icon = KIND[k].icon
            return (
              <span key={k} className="inline-flex items-center gap-1">
                <span className={`inline-block h-2.5 w-5 rounded-sm border ${KIND[k].bar}`} aria-hidden />
                <Icon size={12} aria-hidden /> {KIND[k].label}
              </span>
            )
          })}
      </div>
      <div className="relative ml-0 sm:ml-56">
        <div className="relative h-5 border-b border-line">
          {ticks.map((y) => (
            <span key={y} className="absolute -translate-x-1/2 font-mono text-[10px] text-muted" style={{ left: `${pct(y)}%` }}>{y}</span>
          ))}
        </div>
      </div>
      <ol className="mt-1 space-y-1.5">
        {events.map((e, i) => {
          const a = toYear(e.from, NOW)
          const single = !e.to && e.kind !== 'docencia' && e.kind !== 'investigacion' && e.from !== 'ongoing'
          const b = single ? a : toYear(e.to, e.to === null ? NOW : a)
          const Icon = KIND[e.kind].icon
          return (
            <li key={i} className="group grid items-center gap-x-3 sm:grid-cols-[14rem_1fr]">
              <div className="min-w-0 text-xs">
                <p className="flex items-center gap-1 truncate font-semibold" title={e.title}>
                  <Icon size={12} aria-hidden className="shrink-0" /> {e.title}
                </p>
                <p className="truncate text-muted">
                  {e.org} · {fmt(e.from)}{e.to || (!single && e.kind !== 'grado') ? ` → ${e.to ? fmt(e.to) : 'a la fecha / sin fin conocido'}` : ''}
                  {e.approx ? ' (aprox.)' : ''}
                </p>
              </div>
              <div className="relative h-4 rounded bg-paper" aria-hidden>
                {ticks.map((y) => <span key={y} className="absolute top-0 h-full border-l border-line/60" style={{ left: `${pct(y)}%` }} />)}
                {single ? (
                  <span className={`absolute top-0.5 h-3 w-3 -translate-x-1/2 rotate-45 border-2 ${KIND[e.kind].bar}`} style={{ left: `${pct(a)}%` }} />
                ) : (
                  <span
                    className={`absolute top-0.5 h-3 rounded-sm border-2 ${KIND[e.kind].bar}`}
                    style={{ left: `${pct(a)}%`, width: `${Math.max(0.8, pct(b) - pct(a))}%` }}
                  />
                )}
              </div>
              <div className="hidden text-[11px] group-hover:flex group-focus-within:flex sm:col-start-2">
                <StatusBadge status={e.status} short />
                {e.sourceIds.slice(0, 3).map((id) => (
                  <Link key={id} to={`/fuentes#${id}`} className="ml-2 underline decoration-dotted">fuente</Link>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-[11px] text-muted">
        Construida sólo con datos ya registrados en este perfil. Pasa el cursor sobre una fila para ver su estado de verificación y su fuente. Los informes de
        control indican presunta responsabilidad, no sanción.
      </p>
    </div>
  )
}
