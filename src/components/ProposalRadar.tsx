import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { candidateById, listProposals, lists, site, sourceById } from '../data'
import type { Proposal, ProposalCategory } from '../data/types'
import { ROLE_COLOR } from './charts'
import { EmptyState } from './ui'

/** Agrupación de las 15 categorías en 6 ejes legibles en un radar. */
export const AXES: { key: string; label: string; cats: ProposalCategory[] }[] = [
  { key: 'academico', label: 'Académico', cats: ['Calidad educativa', 'Modernización curricular', 'Formación docente'] },
  { key: 'investigacion', label: 'Investigación e innovación', cats: ['Investigación científica', 'Innovación y transferencia tecnológica', 'Inteligencia artificial'] },
  { key: 'infra', label: 'Infraestructura y digital', cats: ['Infraestructura y laboratorios', 'Transformación digital'] },
  { key: 'estudiantes', label: 'Estudiantes y empleo', cats: ['Bienestar estudiantil', 'Empleabilidad', 'Inclusión y accesibilidad'] },
  { key: 'gestion', label: 'Gestión y transparencia', cats: ['Presupuesto y gestión institucional', 'Transparencia'] },
  { key: 'proyeccion', label: 'Proyección', cats: ['Internacionalización', 'Sostenibilidad'] },
]

const tooltipStyle = {
  contentStyle: { background: 'rgb(var(--card))', border: '1px solid rgb(var(--ink))', borderRadius: 4, fontSize: 12, color: 'rgb(var(--ink))' },
}

function axisCounts(props: Proposal[]) {
  return AXES.map((a) => ({ axis: a.label, n: props.filter((p) => a.cats.includes(p.category)).length }))
}

const maxAxis = Math.max(1, ...lists.flatMap((l) => axisCounts(listProposals.filter((p) => p.listId === l.id)).map((x) => x.n)))

function MiniRadar({ listId }: { listId: string }) {
  const props = listProposals.filter((p) => p.listId === listId)
  const data = axisCounts(props)
  const n = Number(listId.split('-')[1])
  return (
    <figure className="card p-3">
      <figcaption className="flex items-baseline justify-between">
        <Link to={`/listas/${n}`} className="font-display uppercase hover:underline">Lista {n}</Link>
        <span className="font-mono text-xs text-muted">{props.length} propuesta{props.length === 1 ? '' : 's'}</span>
      </figcaption>
      {props.length ? (
        <div className="h-48 text-muted">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid stroke="var(--chart-grid)" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: 'currentColor' }} />
              <PolarRadiusAxis domain={[0, maxAxis]} tick={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Radar name={`Lista ${n}`} dataKey="n" stroke="var(--chart-ink)" fill="var(--chart-ink)" fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="grid h-48 place-items-center text-center text-xs text-muted">Sin propuestas registradas<br />en las fuentes revisadas</p>
      )}
    </figure>
  )
}

export function RadarGrid() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => <MiniRadar key={l.id} listId={l.id} />)}
      </div>
      <p className="mt-2 text-xs text-muted">
        Misma escala en los 9 radares (máx. {maxAxis}). Cada eje agrupa categorías:{' '}
        {AXES.map((a) => `${a.label} = ${a.cats.join(', ')}`).join(' · ')}. El tamaño refleja cuántas propuestas registramos en las fuentes disponibles, no su calidad
        ni su viabilidad.
      </p>
    </>
  )
}

export function RadarCompare() {
  const [sel, setSel] = useState<string[]>(['lista-1', 'lista-2'])
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? [...s.slice(1), id] : [...s, id]))
  const data = AXES.map((a) => {
    const row: Record<string, string | number> = { axis: a.label }
    for (const id of sel) row[id] = listProposals.filter((p) => p.listId === id && a.cats.includes(p.category)).length
    return row
  })
  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Listas a superponer (máximo 3)">
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={sel.includes(l.id)}
            onClick={() => toggle(l.id)}
            className={`rounded border-2 px-2.5 py-1 text-xs font-semibold ${sel.includes(l.id) ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
          >
            Lista {l.number}
          </button>
        ))}
      </div>
      {sel.length ? (
        <div className="mt-3 h-80 text-muted">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="var(--chart-grid)" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: 'currentColor' }} />
              <PolarRadiusAxis domain={[0, maxAxis]} tick={{ fontSize: 10, fill: 'currentColor' }} angle={90} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'rgb(var(--ink))' }} />
              {sel.map((id, i) => (
                <Radar key={id} name={`Lista ${id.split('-')[1]}`} dataKey={id} stroke={ROLE_COLOR[i]} fill={ROLE_COLOR[i]} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-3"><EmptyState title="Elige hasta 3 listas para superponer" /></div>
      )}
      <p className="mt-1 text-xs text-muted">Los colores identifican la posición en la selección, no a una lista en particular.</p>
    </div>
  )
}

const ytLink = (url: string, t: string | null | undefined) => {
  if (!t || !/youtube\.com|youtu\.be/.test(url)) return url
  const [h, m, s] = t.split(':').map(Number)
  const secs = (h || 0) * 3600 + (m || 0) * 60 + (s || 0)
  return `${url}${url.includes('?') ? '&' : '?'}t=${secs}s`
}

function DebateBar() {
  const d = site.debate
  if (!d) return null
  return (
    <div className="card mb-4 flex flex-wrap items-center gap-3 p-4 text-sm">
      <div className="mr-auto">
        <p className="font-semibold">Debate de candidatos al Rectorado · {d.date}</p>
        <p className="text-xs text-muted">Organizado por el {d.organizer}. Transcripción automática revisada parcialmente: ante dudas, vale el video.</p>
      </div>
      <a className="btn text-xs" href={d.video} target="_blank" rel="noreferrer">▶ Ver video completo</a>
      {d.transcript ? (
        <a className="btn-solid text-xs" href={`${import.meta.env.BASE_URL}${d.transcript}`} download>⬇ Descargar transcripción</a>
      ) : (
        <span className="chip">Transcripción en preparación</span>
      )}
    </div>
  )
}

/** Citas textuales de lo dicho en el debate, con minuto y enlace al video. */
export function DebateQuotes() {
  return (
    <>
      <DebateBar />
      <DebateQuoteList />
    </>
  )
}

function DebateQuoteList() {
  const quoted = listProposals.filter((p) => p.origin === 'debate' && p.quote)
  if (!quoted.length) {
    return (
      <EmptyState title="Transcripción del debate en proceso">
        Estamos transcribiendo la grabación del debate del CEUNI (07-10-2026). Aquí aparecerán citas textuales de cada candidato con el minuto exacto y un enlace
        al video. Mientras tanto, las propuestas del debate provienen de la cobertura de prensa.
      </EmptyState>
    )
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {quoted.map((p) => {
        const c = p.candidateId ? candidateById.get(p.candidateId) : null
        const src = sourceById.get(p.sourceId)
        return (
          <blockquote key={p.id} className="card border-l-4 border-l-signal p-4">
            <p className="text-[15px] leading-relaxed">“{p.quote}”</p>
            <footer className="mt-2 text-xs text-muted">
              {c ? <Link className="link text-ink" to={`/candidatos/${c.slug}`}>{c.name}</Link> : 'Candidatura'} · Lista {p.listId.split('-')[1]} · {p.category}
              {src?.url && (
                <>
                  {' · '}
                  <a className="link" href={ytLink(src.url, p.t)} target="_blank" rel="noreferrer">▶ {p.t ?? 'video'}</a>
                </>
              )}
            </footer>
          </blockquote>
        )
      })}
    </div>
  )
}
