import { Link } from 'react-router-dom'
import { candidates, degrees, facultyById, membersOf, planById, listById, proposals, site, sourceById } from '../data'
import incomesJson from '../data/incomes.json'
import { timelines } from '../components/Timeline'
import { RadarCompare, ytLink } from '../components/ProposalRadar'
import { PageHeader, Section, StatusBadge } from '../components/ui'
import { ROLE_LABEL, ROLES, type Candidate } from '../data/types'

const incomes = incomesJson as { candidateId: string; role: string; period: string; monthlyAmount: number }[]
const money = (n: number) => `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
const none = <span className="italic text-muted">Sin registro</span>

/** Mismas preguntas, en el mismo orden, para cada integrante de las dos fórmulas. */
const FACTS: [string, (c: Candidate) => React.ReactNode][] = [
  ['Facultad', (c) => facultyById.get(c.facultyId)?.name ?? c.facultyId],
  ['Doctorado', (c) => {
    const d = degrees.find((x) => x.candidateId === c.id)?.doctorado
    return d?.denominacion ? <>{d.denominacion} <span className="text-muted">· {[d.universidad, d.anio].filter(Boolean).join(' · ')}</span></> : none
  }],
  ['Cargos de gestión (últimos)', (c) => {
    const ev = (timelines.find((t) => t.candidateId === c.id)?.events ?? []).filter((e) => e.kind === 'gestion_uni' || e.kind === 'cargo_publico')
    return ev.length ? (
      <ul className="space-y-0.5">{ev.slice(-3).map((e, i) => <li key={i}>{e.title} <span className="text-muted">({String(e.from).slice(0, 4)}{e.to && e.to !== 'ongoing' ? `–${String(e.to).slice(0, 4)}` : ''})</span></li>)}</ul>
    ) : none
  }],
  ['Tesis asesoradas (Repositorio UNI)', (c) => {
    const t = c.claims.docencia.find((x) => x.text.includes('asesor(a) de'))
    return t ? t.text.replace(/^Figura como asesor\(a\) de /, '').replace(/; principalmente.*$/, '.') : none
  }],
  ['Proyectos con financiamiento', (c) => {
    const n = c.claims.proyectos.length
    return n ? `${n} registro(s) con fuente — ver perfil` : none
  }],
  ['Ingreso público más reciente', (c) => {
    const r = incomes.filter((x) => x.candidateId === c.id).sort((a, b) => b.period.localeCompare(a.period))
    return r.length ? `${money(r[0].monthlyAmount)} · ${r[0].role.split(' – ')[0]} · ${r[0].period}` : none
  }],
  ['Informes de control (presunta resp.)', (c) => (c.claims.control?.length ? `${c.claims.control.length} registro(s) — ver perfil` : <span className="italic text-muted">Ninguno localizado</span>)],
]

export default function SecondRound() {
  const sr = site.results?.secondRound
  // Orden por número de lista, no por votos: la página no sugiere preferencia.
  const ids = [...(sr?.lists ?? ['lista-1', 'lista-8'])].sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
  const pair = ids.map((id) => listById.get(id)!)
  const first = (id: string) => site.results?.lists.find((r) => r.listId === id)

  return (
    <div>
      <PageHeader kicker={`Segunda vuelta${sr?.date ? ` · ${sr.date}` : ''}`} title={<>Lista {pair[0].number} <span className="mark">vs.</span> Lista {pair[1].number}</>}>
        Las dos fórmulas lado a lado, con las mismas preguntas y sólo con datos que tienen fuente. Se ordenan por número de lista, no por votos.{' '}
        {site.results?.status !== 'oficial' && <strong>Los resultados de primera vuelta son preliminares hasta su publicación oficial por el CEUNI.</strong>}
      </PageHeader>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {pair.map((l) => {
          const r = first(l.id)
          return (
            <div key={l.id} className="card p-3 sm:p-4">
              <Link to={`/listas/${l.number}`} className="font-display text-xl uppercase hover:underline sm:text-2xl">Lista {l.number}</Link>
              {r?.weightedPct != null && (
                <>
                  <p className="mt-1 font-mono text-2xl font-bold sm:text-3xl">{r.weightedPct.toFixed(2)}%</p>
                  <p className="text-[11px] text-muted">1.ª vuelta, ponderado · docentes {r.votesDocentes} · estudiantes {r.votesEstudiantes?.toLocaleString('es-PE')}</p>
                </>
              )}
              <p className="mt-2 text-xs">Plan de gobierno: <strong className={planById.get(l.planId)?.status === 'publicado' ? '' : 'text-alert'}>{planById.get(l.planId)?.status === 'publicado' ? 'publicado' : 'no localizado'}</strong></p>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        {sr?.note} <Link className="link" to="/#resultados">Ver resultados completos</Link>
      </p>

      {ROLES.map((role) => {
        const people = pair.map((l) => membersOf(l.id).find((m) => m.role === role)!)
        return (
          <Section key={role} title={ROLE_LABEL[role]}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[340px] table-fixed border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-ink align-bottom">
                    <th className="w-24 py-2 pr-2 text-left sm:w-48"><span className="sr-only">Dato</span></th>
                    {people.map((c) => (
                      <th key={c.id} className="px-2 py-2 text-left">
                        <Link className="link" to={`/candidatos/${c.slug}`}>{c.name}</Link>
                        <span className="block font-normal text-muted">Lista {c.listId.split('-')[1]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FACTS.map(([label, fn]) => (
                    <tr key={label} className="border-b border-line align-top">
                      <th scope="row" className="py-2 pr-2 text-left font-normal text-muted">{label}</th>
                      {people.map((c) => <td key={c.id} className="px-2 py-2">{fn(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )
      })}

      <Section title="¿De qué hablan? Propuestas por eje">
        <RadarCompare initial={ids} fixed />
        <p className="mt-2 text-xs text-muted">Cuenta propuestas registradas (debate y fuentes públicas); no mide calidad ni viabilidad.</p>
      </Section>

      <Section title="Sus propuestas, una al lado de la otra">
        <div className="grid gap-4 md:grid-cols-2">
          {pair.map((l) => {
            const ps = proposals.filter((p) => p.listId === l.id)
            return (
              <div key={l.id}>
                <p className="kicker">Lista {l.number} · {ps.length} propuestas</p>
                <ul className="mt-2 space-y-2">
                  {ps.map((p) => {
                    const c = p.candidateId ? candidates.find((x) => x.id === p.candidateId) : null
                    const src = sourceById.get(p.sourceId)
                    return (
                      <li key={p.id} className={`card p-3 text-sm ${p.quote ? 'border-l-4 border-l-signal' : ''}`}>
                        <p className="font-semibold">{p.title}</p>
                        {p.quote ? <p className="mt-1 leading-relaxed">“{p.quote}”</p> : <p className="mt-1 text-muted">{p.description}</p>}
                        <p className="mt-1 text-[11px] text-muted">
                          {p.category}{c ? ` · ${c.name}` : ''}
                          {src?.url && <> · <a className="link" href={ytLink(src.url, p.t)} target="_blank" rel="noreferrer">{p.t ? `▶ ${p.t}` : 'fuente'}</a></>}
                          {' '}<StatusBadge status={p.status} short />
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          Meta: {p.target ?? 'no especificada'} · Plazo: {p.targetDate ?? 'no especificado'} · Presupuesto: {p.budget ?? 'no especificado'}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </Section>

      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link className="btn" to={`/comparar?modo=listas&ids=${pair.map((l) => l.number).join(',')}`}>Comparador de listas</Link>
        <Link className="btn" to="/matriz">Haz tu propia evaluación</Link>
        <Link className="btn" to="/planes?vista=palabras">Todas las citas del debate</Link>
      </div>
    </div>
  )
}
