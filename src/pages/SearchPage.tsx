import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookOpen, FileText, GraduationCap, Lightbulb, ListChecks, User } from 'lucide-react'
import { candidateById, candidates, degrees, facultyById, proposals, sources } from '../data'
import { CLAIM_SECTIONS, ROLE_LABEL, SECTION_LABEL, SOURCE_TYPE_LABEL, type VerificationStatus } from '../data/types'
import { fold, matches } from '../lib/search'
import { PageHeader, StatusBadge } from '../components/ui'

type Kind = 'candidato' | 'dato' | 'propuesta' | 'grado' | 'fuente'

interface Doc {
  id: string
  kind: Kind
  title: string
  text: string
  meta: string
  to: string
  listId: string | null
  status?: VerificationStatus
}

const KIND_LABEL: Record<Kind, string> = { candidato: 'Candidaturas', dato: 'Trayectoria y datos', propuesta: 'Propuestas', grado: 'Grados', fuente: 'Fuentes' }
const KIND_ICON = { candidato: User, dato: ListChecks, propuesta: Lightbulb, grado: GraduationCap, fuente: FileText }

// Índice completo en el cliente: funciona sin servidor y sin conexión a las fuentes.
const INDEX: Doc[] = [
  ...candidates.map((c) => ({
    id: c.id,
    kind: 'candidato' as const,
    title: c.name,
    text: [c.officialName, ...c.nameVariants, c.facultyId, facultyById.get(c.facultyId)?.name, ROLE_LABEL[c.role]].join(' '),
    meta: `Lista ${c.listId.split('-')[1]} · ${ROLE_LABEL[c.role]} · ${c.facultyId}`,
    to: `/candidatos/${c.slug}`,
    listId: c.listId,
  })),
  ...candidates.flatMap((c) =>
    CLAIM_SECTIONS.flatMap((s) =>
      (c.claims[s] ?? []).map((cl, i) => ({
        id: `${c.id}-${s}-${i}`,
        kind: 'dato' as const,
        title: `${c.name} · ${SECTION_LABEL[s]}`,
        text: `${cl.text} ${c.name}`,
        meta: `Lista ${c.listId.split('-')[1]} · ${SECTION_LABEL[s]}`,
        to: `/candidatos/${c.slug}`,
        listId: c.listId,
        status: cl.status,
      })),
    ),
  ),
  ...proposals.map((p) => ({
    id: p.id,
    kind: 'propuesta' as const,
    title: p.title,
    text: [p.description, p.quote, p.problem, p.category, p.candidateId ? candidateById.get(p.candidateId)?.name : ''].join(' '),
    meta: `Lista ${p.listId.split('-')[1]} · ${p.category}`,
    to: '/planes',
    listId: p.listId,
    status: p.status,
  })),
  ...degrees.flatMap((d) => {
    const c = candidateById.get(d.candidateId)!
    return (['doctorado', 'maestria', 'titulo'] as const)
      .filter((k) => d[k]?.denominacion)
      .map((k) => ({
        id: `${d.candidateId}-${k}`,
        kind: 'grado' as const,
        title: `${d[k]!.denominacion}`,
        text: `${d[k]!.universidad} ${d[k]!.anio ?? ''} ${c.name}`,
        meta: `${c.name} · ${d[k]!.universidad}${d[k]!.anio ? ` · ${d[k]!.anio}` : ''}`,
        to: '/grados',
        listId: c.listId,
        status: d[k]!.status,
      }))
  }),
  ...sources.map((s) => ({
    id: s.id,
    kind: 'fuente' as const,
    title: s.title,
    text: `${s.author} ${s.notes} ${s.locator ?? ''} ${s.identifier ?? ''}`,
    meta: `${SOURCE_TYPE_LABEL[s.type]} · ${s.author}`,
    to: `/fuentes#${s.id}`,
    listId: null,
    status: s.status,
  })),
]

function Highlight({ text, q }: { text: string; q: string }) {
  const terms = fold(q).split(' ').filter((t) => t.length > 1)
  if (!terms.length) return <>{text}</>
  const f = fold(text)
  // Fragmento alrededor de la primera coincidencia.
  const hit = Math.min(...terms.map((t) => (f.indexOf(t) < 0 ? Infinity : f.indexOf(t))))
  const start = Number.isFinite(hit) ? Math.max(0, hit - 70) : 0
  const frag = text.slice(start, start + 220)
  const ff = fold(frag)
  const marks: [number, number][] = []
  for (const t of terms) {
    let i = ff.indexOf(t)
    while (i >= 0) {
      marks.push([i, i + t.length])
      i = ff.indexOf(t, i + t.length)
    }
  }
  marks.sort((a, b) => a[0] - b[0])
  const out: React.ReactNode[] = []
  let pos = 0
  for (const [a, b] of marks) {
    if (a < pos) continue
    out.push(frag.slice(pos, a), <mark key={a} className="bg-signal px-0.5 text-[#111]">{frag.slice(a, b)}</mark>)
    pos = b
  }
  out.push(frag.slice(pos))
  return <>{start > 0 && '… '}{out}{start + 220 < text.length && ' …'}</>
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const kind = (params.get('tipo') ?? '') as Kind | ''
  const list = params.get('lista') ?? ''
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  const results = useMemo(
    () => (q.trim().length < 2 ? [] : INDEX.filter((d) => (!kind || d.kind === kind) && (!list || d.listId === `lista-${list}`) && matches(`${d.title} ${d.text}`, q))),
    [q, kind, list],
  )
  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    if (q.trim().length >= 2) for (const d of INDEX) if ((!list || d.listId === `lista-${list}`) && matches(`${d.title} ${d.text}`, q)) m[d.kind] = (m[d.kind] ?? 0) + 1
    return m
  }, [q, list])

  return (
    <div>
      <PageHeader kicker="Buscador" title="Busca en todo">
        Candidaturas, cargos, grados, propuestas, informes y fuentes. Sin tildes ni mayúsculas: "ingemmet", "doctor fisica", "hidrogeno", "contraloria", "lista 5".
      </PageHeader>
      <div className="card sticky top-[7.5rem] z-10 p-4">
        <input
          autoFocus
          type="search"
          className="input text-base"
          placeholder="Escribe al menos 2 letras…"
          value={q}
          onChange={(e) => set('q', e.target.value)}
          aria-label="Buscar en todo el observatorio"
        />
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Tipo de resultado">
          {(['', 'candidato', 'dato', 'propuesta', 'grado', 'fuente'] as const).map((k) => (
            <button
              key={k || 'todo'}
              type="button"
              aria-pressed={kind === k}
              onClick={() => set('tipo', k)}
              className={`rounded-full border-2 px-3 py-1 text-xs font-semibold ${kind === k ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
            >
              {k ? KIND_LABEL[k] : 'Todo'}
              {q.trim().length >= 2 && <span className="ml-1 font-mono opacity-70">{k ? counts[k] ?? 0 : Object.values(counts).reduce((a, b) => a + b, 0)}</span>}
            </button>
          ))}
          <select className="input ml-auto w-auto py-1 text-xs" value={list} onChange={(e) => set('lista', e.target.value)} aria-label="Filtrar por lista">
            <option value="">Todas las listas</option>
            {Array.from({ length: 9 }, (_, i) => <option key={i} value={i + 1}>Lista {i + 1}</option>)}
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm" role="status">
        {q.trim().length < 2 ? `Índice: ${INDEX.length} elementos.` : `${results.length} resultado${results.length === 1 ? '' : 's'}`}
      </p>
      <ul className="mt-2 space-y-2">
        {results.slice(0, 150).map((d) => {
          const Icon = KIND_ICON[d.kind] ?? BookOpen
          return (
            <li key={`${d.kind}-${d.id}`}>
              <Link to={d.to} className="card flex gap-3 p-3 hover:border-ink">
                <Icon aria-hidden size={18} className="mt-0.5 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{d.title}</p>
                  <p className="kicker mt-0.5 !text-[10px]">{d.meta}</p>
                  <p className="mt-1 text-sm text-muted"><Highlight text={d.text} q={q} /></p>
                  {d.status && <div className="mt-1"><StatusBadge status={d.status} short /></div>}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      {results.length > 150 && <p className="mt-2 text-xs text-muted">Mostrando 150 de {results.length}. Afina la búsqueda o usa los filtros.</p>}
    </div>
  )
}
