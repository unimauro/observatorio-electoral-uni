import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listById, press } from '../data'
import { PRESS_KIND_LABEL, PRESS_TOPIC_LABEL, PRESS_TOPICS, type PressTopic } from '../data/types'

const fmt = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

/**
 * Lista desplazable de notas de prensa y comunicados verificados (press.json).
 * `limit` recorta la lista (p. ej. en el panel); `compact` oculta el filtro por tema.
 */
export default function PressFeed({ limit, compact = false, topic: initial = null }: { limit?: number; compact?: boolean; topic?: PressTopic | null }) {
  const [topic, setTopic] = useState<PressTopic | null>(initial)
  const items = useMemo(() => {
    const filtered = topic ? press.filter((p) => p.topics.includes(topic)) : press
    return limit ? filtered.slice(0, limit) : filtered
  }, [topic, limit])
  const topicsInUse = PRESS_TOPICS.filter((t) => press.some((p) => p.topics.includes(t)))

  return (
    <div>
      {!compact && (
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tema">
          <button type="button" onClick={() => setTopic(null)} className={`btn !py-1 !text-xs ${topic === null ? '!bg-ink !text-paper' : ''}`} aria-pressed={topic === null}>
            Todos ({press.length})
          </button>
          {topicsInUse.map((t) => (
            <button key={t} type="button" onClick={() => setTopic(t)} className={`btn !py-1 !text-xs ${topic === t ? '!bg-ink !text-paper' : ''}`} aria-pressed={topic === t}>
              {PRESS_TOPIC_LABEL[t]} ({press.filter((p) => p.topics.includes(t)).length})
            </button>
          ))}
        </div>
      )}
      <ol className={`card divide-y divide-line ${compact ? 'max-h-80' : 'max-h-[32rem]'} overflow-y-auto`} aria-label="En los medios" role="list">
        {items.length === 0 && <li className="p-4 text-sm text-muted">No hay notas registradas para este tema.</li>}
        {items.map((p) => (
          <li key={p.id} className="p-3 sm:p-4">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-muted">
              <time dateTime={p.date}>{fmt(p.date)}</time>
              <span aria-hidden>·</span>
              <span className="text-ink">{p.outlet}</span>
              <span className="border border-line px-1">{PRESS_KIND_LABEL[p.kind]}</span>
            </p>
            <a href={p.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-start gap-1 font-semibold leading-snug hover:underline">
              {p.title} <ExternalLink size={13} aria-hidden className="mt-1 shrink-0" />
            </a>
            <p className="mt-1 text-sm text-muted">{p.summary}</p>
            {(p.listIds.length > 0 || !compact) && (
              <p className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                {!compact && p.topics.map((t) => <span key={t} className="border border-line px-1 text-muted">{PRESS_TOPIC_LABEL[t]}</span>)}
                {p.listIds.map((id) => (
                  <Link key={id} to={`/listas/${listById.get(id)?.number ?? ''}`} className="border border-ink px-1 hover:bg-ink hover:text-paper">Lista {listById.get(id)?.number}</Link>
                ))}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
