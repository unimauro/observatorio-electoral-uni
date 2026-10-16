import { Link } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, CircleDashed, CircleHelp, FileQuestion, MessageSquareQuote, ShieldHalf } from 'lucide-react'
import type { ReactNode } from 'react'
import { STATUS_LABEL, type VerificationStatus } from '../data/types'
import { sourceById } from '../data'

const STATUS_ICON: Record<VerificationStatus, typeof BadgeCheck> = {
  verificado_primaria: BadgeCheck,
  corroborado: BadgeCheck,
  declarado: MessageSquareQuote,
  parcialmente_verificado: ShieldHalf,
  pendiente_revision: CircleDashed,
  controvertido: AlertTriangle,
  no_encontrado: FileQuestion,
}

const STATUS_STYLE: Record<VerificationStatus, string> = {
  verificado_primaria: 'border-ink bg-ink text-paper',
  corroborado: 'border-ink bg-ink text-paper',
  declarado: 'border-ink',
  parcialmente_verificado: 'border-ink border-dashed',
  pendiente_revision: 'border-line text-muted border-dashed',
  controvertido: 'border-alert text-alert',
  no_encontrado: 'border-line text-muted',
}

/** Estado de verificación: siempre ícono + texto, nunca sólo color. */
export function StatusBadge({ status, short = false }: { status: VerificationStatus; short?: boolean }) {
  const Icon = STATUS_ICON[status] ?? CircleHelp
  const label = STATUS_LABEL[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status]}`}
      title={label}
    >
      <Icon aria-hidden size={12} />
      {short ? label.split(' ').slice(0, 2).join(' ') : label}
    </span>
  )
}

export function SourceRefs({ ids }: { ids: string[] }) {
  if (!ids.length) return null
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {ids.map((id, i) => {
        const s = sourceById.get(id)
        return (
          <Link
            key={id}
            to={`/fuentes#${id}`}
            className="font-mono text-[11px] text-muted underline decoration-dotted hover:text-ink"
            title={s?.title ?? id}
          >
            [{i + 1}: {s ? s.author.split('–')[0].split('(')[0].trim().slice(0, 18) : id}]
          </Link>
        )
      })}
    </span>
  )
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const parts = name.split(' ')
  const initials = (parts[0][0] + (parts.length > 2 ? parts[parts.length - 2][0] : parts[1]?.[0] ?? '')).toUpperCase()
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center rounded-sm border-2 border-ink bg-paper font-display text-ink"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}

export function PageHeader({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 border-b-4 border-ink pb-4">
      <p className="kicker">{kicker}</p>
      <h1 className="h-display mt-1 text-3xl sm:text-5xl">{title}</h1>
      {children && <div className="mt-3 max-w-3xl text-[15px] text-muted">{children}</div>}
    </header>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border-2 border-dashed border-line p-5 text-sm">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, note, to }: { label: string; value: ReactNode; note?: string; to?: string }) {
  const body = (
    <>
      <p className="kicker">{label}</p>
      <p className="mt-1 font-display text-4xl">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </>
  )
  return to ? (
    <Link to={to} className="card block p-4 transition-colors hover:border-ink">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  )
}

export function ChartCard({ title, measures, children }: { title: string; measures: string; children: ReactNode }) {
  return (
    <figure className="card flex flex-col p-4">
      <figcaption>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted">{measures}</p>
      </figcaption>
      <div className="mt-3 flex-1">{children}</div>
    </figure>
  )
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="h-display mb-4 text-2xl">{title}</h2>
      {children}
    </section>
  )
}
