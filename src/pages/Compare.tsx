import { Link, useSearchParams } from 'react-router-dom'
import { candidates, criteria, degrees, evaluations, facultyById, lists, membersOf, planById, proposals, proposalsOf, sources } from '../data'
import incomesJson from '../data/incomes.json'
import { timelines } from '../components/Timeline'
import { PROPOSAL_CATEGORIES, ROLE_LABEL, ROLES, STATUS_LABEL, type Candidate, type Role } from '../data/types'
import { SCORE_LABEL, scoreLookup } from '../lib/score'
import { sourcesForList } from '../lib/stats'
import { EmptyState, PageHeader } from '../components/ui'


const money = (n: number) => `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
const incomes = incomesJson as { candidateId: string; role: string; period: string; monthlyAmount: number }[]
const none = <span className="italic text-muted">Sin registro</span>

/** Filas con datos registrados (no evaluaciones): misma pregunta para todas las candidaturas. */
const FACT_ROWS: [string, (c: Candidate) => React.ReactNode][] = [
  ['Doctorado', (c) => {
    const d = degrees.find((x) => x.candidateId === c.id)?.doctorado
    return d?.denominacion ? <>{d.denominacion}<span className="block text-muted">{[d.universidad, d.anio].filter(Boolean).join(' · ')} · {STATUS_LABEL[d.status]}</span></> : none
  }],
  ['Cargos de gestión (línea de tiempo)', (c) => {
    const ev = (timelines.find((t) => t.candidateId === c.id)?.events ?? []).filter((e) => e.kind === 'gestion_uni' || e.kind === 'cargo_publico')
    return ev.length ? <ul className="space-y-0.5">{ev.slice(-5).map((e, i) => <li key={i}>{e.title} <span className="text-muted">· {e.org} ({e.from.slice(0, 4)}{e.to ? `–${e.to.slice(0, 4)}` : ''})</span></li>)}</ul> : none
  }],
  ['Investigación (datos verificados)', (c) => {
    const v = c.claims.investigacion.filter((x) => ['verificado_primaria', 'corroborado'].includes(x.status)).length
    return v ? `${v} dato(s) verificado(s)` : none
  }],
  ['Ingreso público más reciente', (c) => {
    const r = incomes.filter((x) => x.candidateId === c.id).sort((a, b) => b.period.localeCompare(a.period))
    return r.length ? <ul>{r.filter((x) => x.period === r[0].period).map((x, i) => <li key={i}>{money(x.monthlyAmount)} <span className="text-muted">{x.role.split(' – ')[0]} · {x.period}</span></li>)}</ul> : none
  }],
  ['Informes de control (presunta resp.; sólo alcanzan a quienes tuvieron cargos de gestión)', (c) => (c.claims.control?.length ? `${c.claims.control.length} registro(s) — ver perfil` : <span className="italic text-muted">Ninguno localizado</span>)],
  ['Propuestas registradas', (c) => {
    const n = proposals.filter((p) => p.candidateId === c.id).length
    return n ? `${n}` : none
  }],
]

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded border-2 px-2.5 py-1 text-xs font-semibold ${on ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
    >
      {label}
    </button>
  )
}

function evidenceSummary(c: Candidate) {
  const sections = Object.values(c.claims).flat()
  return `${sections.length} afirmaciones · ${c.researchLeads.filter((l) => l.status === 'pendiente').length} pistas`
}

export default function Compare() {
  const [params, setParams] = useSearchParams()
  const mode = params.get('modo') === 'listas' ? 'listas' : 'candidatos'
  const role = (ROLES.includes(params.get('cargo') as Role) ? params.get('cargo') : 'rector') as Role
  const ids = (params.get('ids') ?? '').split(',').filter(Boolean)

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }
  const toggleId = (id: string) => update({ ids: ids.includes(id) ? ids.filter((x) => x !== id).join(',') : [...ids, id].join(',') })

  const pool = candidates.filter((c) => c.role === role)
  const selC = pool.filter((c) => ids.includes(c.slug))
  const selL = lists.filter((l) => ids.includes(String(l.number)))
  const roleCriteria = criteria.filter((c) => c.role === role)

  return (
    <div>
      <PageHeader kicker="Comparador" title="Lado a lado">
        Elige dos o más. Los criterios son preguntas que deberían responderse con evidencia, no afirmaciones sobre nadie.
        Donde falta información, lo verás escrito.
      </PageHeader>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Qué comparar">
          <Toggle on={mode === 'candidatos'} label="Candidatos" onClick={() => update({ modo: 'candidatos', ids: '' })} />
          <Toggle on={mode === 'listas'} label="Listas" onClick={() => update({ modo: 'listas', ids: '' })} />
        </div>
        {mode === 'candidatos' && (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Cargo">
            {ROLES.map((r) => (
              <Toggle key={r} on={role === r} label={ROLE_LABEL[r]} onClick={() => update({ cargo: r, ids: '' })} />
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Selección">
          {mode === 'candidatos'
            ? pool.map((c) => <Toggle key={c.id} on={ids.includes(c.slug)} label={`L${c.listId.split('-')[1]} · ${c.name}`} onClick={() => toggleId(c.slug)} />)
            : lists.map((l) => <Toggle key={l.id} on={ids.includes(String(l.number))} label={`Lista ${l.number}`} onClick={() => toggleId(String(l.number))} />)}
        </div>
        <div className="mt-3 flex gap-3 text-xs">
          <button type="button" className="link" onClick={() => update({ ids: mode === 'candidatos' ? pool.map((c) => c.slug).join(',') : lists.map((l) => l.number).join(',') })}>
            Seleccionar todos
          </button>
          <button type="button" className="link" onClick={() => update({ ids: '' })}>Limpiar</button>
        </div>
      </div>

      <div className="mt-6">
        {mode === 'candidatos' ? (
          selC.length < 2 ? (
            <EmptyState title="Selecciona al menos dos candidatos" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ minWidth: 220 + selC.length * 170 }}>
                <thead>
                  <tr className="border-b-2 border-ink align-bottom">
                    <th className="w-56 py-2 pr-3 text-left">Criterio · {ROLE_LABEL[role]}</th>
                    {selC.map((c) => (
                      <th key={c.id} className="px-2 py-2 text-left">
                        <Link className="link" to={`/candidatos/${c.slug}`}>{c.name}</Link>
                        <span className="block text-xs font-normal text-muted">Lista {c.listId.split('-')[1]} · {c.facultyId}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">Facultad</th>
                    {selC.map((c) => <td key={c.id} className="px-2 py-2">{facultyById.get(c.facultyId)?.name}</td>)}
                  </tr>
                  <tr className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">Evidencia registrada</th>
                    {selC.map((c) => <td key={c.id} className="px-2 py-2 font-mono text-xs">{evidenceSummary(c)}</td>)}
                  </tr>
                  {FACT_ROWS.map(([label, fn]) => (
                    <tr key={label} className="border-b border-line align-top">
                      <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">{label}</th>
                      {selC.map((c) => <td key={c.id} className="px-2 py-2 text-xs">{fn(c)}</td>)}
                    </tr>
                  ))}
                  <tr><td colSpan={selC.length + 1} className="pt-4 pb-1 kicker">Matriz de evaluación (criterios del cargo)</td></tr>
                  {roleCriteria.map((cr) => (
                    <tr key={cr.id} className="border-b border-line">
                      <th scope="row" className="py-2 pr-3 text-left font-normal">
                        {cr.name}
                        <span className="block text-xs text-muted">Evidencia: {cr.evidenceRequired}</span>
                      </th>
                      {selC.map((c) => {
                        const s = scoreLookup(evaluations, c.id)(cr.id)
                        return (
                          <td key={c.id} className={`px-2 py-2 text-xs ${typeof s === 'number' ? 'font-semibold' : 'italic text-muted'}`}>
                            {typeof s === 'number' ? `${s}/5 · ${SCORE_LABEL[String(s)]}` : SCORE_LABEL[s]}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : selL.length < 2 ? (
          <EmptyState title="Selecciona al menos dos listas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: 200 + selL.length * 150 }}>
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="w-44 py-2 pr-3 text-left">Aspecto</th>
                  {selL.map((l) => <th key={l.id} className="px-2 py-2 text-left"><Link className="link" to={`/listas/${l.number}`}>Lista {l.number}</Link></th>)}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r} className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">{ROLE_LABEL[r]}</th>
                    {selL.map((l) => {
                      const m = membersOf(l.id).find((x) => x.role === r)!
                      return <td key={l.id} className="px-2 py-2"><Link className="link" to={`/candidatos/${m.slug}`}>{m.name}</Link> <span className="text-xs text-muted">({m.facultyId})</span></td>
                    })}
                  </tr>
                ))}
                <tr className="border-b border-line">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">Plan de gobierno</th>
                  {selL.map((l) => {
                    const p = planById.get(l.planId)!
                    return <td key={l.id} className={`px-2 py-2 font-semibold ${p.status === 'no_localizado' ? 'text-alert' : ''}`}>{p.status === 'publicado' ? 'Publicado' : 'No localizado'}</td>
                  })}
                </tr>
                <tr className="border-b border-line">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">Propuestas extraídas</th>
                  {selL.map((l) => <td key={l.id} className="px-2 py-2 font-mono">{proposalsOf(l.id).length}</td>)}
                </tr>
                {PROPOSAL_CATEGORIES.filter((c) => selL.some((l) => proposalsOf(l.id).some((p) => p.category === c))).map((c) => (
                  <tr key={c} className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">· {c}</th>
                    {selL.map((l) => <td key={l.id} className="px-2 py-2 font-mono">{proposalsOf(l.id).filter((p) => p.category === c).length}</td>)}
                  </tr>
                ))}
                <tr className="border-b border-line">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-muted">Fuentes registradas</th>
                  {selL.map((l) => <td key={l.id} className="px-2 py-2 font-mono">{sourcesForList(sources, l.members).length}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">
        Nota: el número de publicaciones no se usa como medida única de capacidad investigadora. Las celdas "No evaluado" no equivalen a cero.
      </p>
    </div>
  )
}
