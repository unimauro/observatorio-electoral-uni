import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, HelpCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import retosJson from '../data/retos.json'
import { candidateById, lists, proposals, sourceById } from '../data'
import type { Proposal } from '../data/types'
import { fold } from '../lib/search'
import { PageHeader, Section } from '../components/ui'
import { HBar } from '../components/charts'

interface Reto {
  id: string
  title: string
  summary: string
  figures: { label: string; value: string; year: string; sourceId: string }[]
  nationalGoals: { doc: string; goal: string; url: string; sourceId: string }[]
  uniRole: string
  categories: string[]
  /** Categoría que por sí sola vincula una propuesta al reto (null = sólo palabras clave). */
  primaryCategory: string | null
  keywords: string[]
  questions: string[]
}
interface UniFigure {
  id: string
  title: string
  summary: string
  series?: { label: string; unit: string; points: { x: string; y: number }[] }[]
  figures: { label: string; value: string; year: string; sourceId: string }[]
  questions: string[]
}
const data = retosJson as { retos: Reto[]; notConfirmed: string[]; uniFigures: UniFigure[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Propuestas relacionadas: categoría principal del reto o palabra clave completa en el texto. */
function related(r: Reto): Proposal[] {
  const kws = r.keywords.map(fold).filter((k) => k.length > 2).map((k) => new RegExp(`(^|[^a-z0-9])${esc(k)}([^a-z0-9]|$)`))
  return proposals.filter((p) => {
    if (r.primaryCategory && p.category === r.primaryCategory) return true
    const t = fold(`${p.title} ${p.description} ${p.quote ?? ''}`)
    return kws.some((re) => re.test(t))
  })
}

const SrcLink = ({ id }: { id: string }) =>
  sourceById.has(id) ? <Link to={`/fuentes#${id}`} className="ml-1 text-[11px] text-muted underline decoration-dotted">fuente</Link> : null

function RetoCard({ r }: { r: Reto }) {
  const rel = related(r)
  return (
    <article id={r.id} className="scroll-mt-28 border-t-4 border-ink pt-5">
      <h2 className="h-display text-2xl sm:text-3xl">{r.title}</h2>
      <p className="mt-2 max-w-3xl">{r.summary}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {r.figures.map((f) => (
          <div key={f.label} className="card p-3">
            <p className="font-display text-3xl">{f.value}</p>
            <p className="mt-1 text-xs text-muted">{f.label} · {f.year}<SrcLink id={f.sourceId} /></p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="kicker mb-2">Metas nacionales y globales</p>
          <ul className="space-y-2 text-sm">
            {r.nationalGoals.map((g) => (
              <li key={g.doc + g.goal} className="border-l-4 border-signal pl-3">
                <strong>{g.doc}</strong>: {g.goal}
                <a href={g.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-muted hover:text-ink"><ExternalLink size={12} aria-label="Documento" /></a>
              </li>
            ))}
          </ul>
          <p className="kicker mb-1 mt-4">Por qué importa para la UNI</p>
          <p className="text-sm">{r.uniRole}</p>
        </div>
        <div>
          <p className="kicker mb-2">¿Qué proponen las listas? ({rel.length})</p>
          <ul className="space-y-1.5 text-sm">
            {lists.map((l) => {
              const ps = rel.filter((p) => p.listId === l.id)
              return (
                <li key={l.id} className="flex gap-2">
                  <span className="w-14 shrink-0 font-mono text-xs leading-5">L{l.number}</span>
                  {ps.length ? (
                    <span>
                      {ps.map((p, i) => (
                        <span key={p.id}>
                          {i > 0 && ' · '}
                          <span title={p.description}>{p.title}</span>
                          {p.planId === null && p.candidateId && <span className="text-xs text-muted"> ({candidateById.get(p.candidateId)?.name.split(' ')[0]}, personal)</span>}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="italic text-muted">Sin propuestas registradas sobre este reto</span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="kicker mb-2 mt-4">Preguntas para las listas</p>
          <ul className="space-y-1 text-sm">
            {r.questions.map((q) => (
              <li key={q} className="flex gap-2"><HelpCircle size={14} className="mt-0.5 shrink-0" aria-hidden /> {q}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function UniFigureCard({ u }: { u: UniFigure }) {
  return (
    <article className="card p-4">
      <h3 className="font-display uppercase">{u.title}</h3>
      <p className="mt-1 text-sm text-muted">{u.summary}</p>
      {u.series?.map((s) => (
        <figure key={s.label} className="mt-3">
          <figcaption className="text-xs font-semibold">{s.label} ({s.unit})</figcaption>
          <div className={`mt-1 text-muted ${/^\d{4}/.test(s.points[0]?.x ?? '') ? 'h-44' : ''}`}>
            {!/^\d{4}/.test(s.points[0]?.x ?? '') ? (
              <HBar data={s.points.map((p) => ({ name: p.x, y: p.y }))} series={[{ key: 'y', label: s.unit, color: 'var(--chart-ink)' }]} yWidth={150} />
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              {s.points.length > 6 ? (
                <LineChart data={s.points} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="x" tick={{ fontSize: 10, fill: 'currentColor' }} stroke="var(--chart-grid)" />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} stroke="var(--chart-grid)" width={44} />
                  <Tooltip contentStyle={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--ink))', fontSize: 12, color: 'rgb(var(--ink))' }} />
                  <Line dataKey="y" name={s.label} stroke="var(--chart-ink)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              ) : (
                <BarChart data={s.points} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="x" tick={{ fontSize: 10, fill: 'currentColor' }} stroke="var(--chart-grid)" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} stroke="var(--chart-grid)" width={44} />
                  <Tooltip contentStyle={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--ink))', fontSize: 12, color: 'rgb(var(--ink))' }} />
                  <Bar dataKey="y" name={s.label} fill="var(--chart-ink)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              )}
            </ResponsiveContainer>
            )}
          </div>
        </figure>
      ))}
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {u.figures.map((f) => (
          <li key={f.label} className="text-sm"><strong className="font-display text-xl">{f.value}</strong> <span className="text-xs text-muted">{f.label} · {f.year}<SrcLink id={f.sourceId} /></span></li>
        ))}
      </ul>
      {u.questions.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {u.questions.map((q) => <li key={q} className="flex gap-2"><HelpCircle size={14} className="mt-0.5 shrink-0" aria-hidden /> {q}</li>)}
        </ul>
      )}
    </article>
  )
}

export default function Retos() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <PageHeader kicker="Contexto" title="Retos del país y de la UNI">
        La próxima gestión gobernará la principal universidad pública de ingeniería del Perú frente a desafíos que el propio Estado ya fijó como objetivos
        nacionales al 2030 y 2050 (PEDN 2050 de CEPLAN, políticas sectoriales, ODS de la ONU). Aquí los resumimos con cifras oficiales y cruzamos lo que cada
        lista ha propuesto sobre cada uno. El cruce es automático (categoría principal del reto o palabra clave en la propuesta) y depende de las propuestas registradas: puede omitir propuestas formuladas con otras palabras.
      </PageHeader>
      <nav aria-label="Retos" className="mb-8 flex flex-wrap gap-1.5">
        {data.retos.map((r) => (
          <a key={r.id} href={`#/retos#${r.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(r.id)?.scrollIntoView({ behavior: 'smooth' }) }} className="chip hover:border-ink">{r.title}</a>
        ))}
        {data.uniFigures.length > 0 && <a href="#/retos#uni-cifras" onClick={(e) => { e.preventDefault(); document.getElementById('uni-cifras')?.scrollIntoView({ behavior: 'smooth' }) }} className="chip border-ink bg-signal text-[#111]">La UNI en cifras</a>}
      </nav>
      {data.uniFigures.length > 0 && (
        <Section id="uni-cifras" title="La UNI en cifras">
          <div className="grid gap-4 lg:grid-cols-2">{data.uniFigures.map((u) => <UniFigureCard key={u.id} u={u} />)}</div>
          <p className="mt-2 text-xs text-muted">Más series en el <a className="link" href="https://unimauro.github.io/observatorio-uni/" target="_blank" rel="noreferrer">Observatorio UNI</a>.</p>
        </Section>
      )}
      <div className="mt-10 space-y-12">{data.retos.map((r) => <RetoCard key={r.id} r={r} />)}</div>
      <section className="mt-12 text-sm">
        <button type="button" className="link" onClick={() => setOpen(!open)} aria-expanded={open}>Lo que no pudimos confirmar</button>
        {open && <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">{data.notConfirmed.map((n) => <li key={n}>{n}</li>)}</ul>}
      </section>
    </div>
  )
}
