import { useState } from 'react'
import { Link } from 'react-router-dom'
import { candidateById, lists, proposals, sourceById } from '../data'
import { ORIGIN_LABEL, PROPOSAL_CATEGORIES, type Proposal, type ProposalOrigin } from '../data/types'
import { EmptyState, StatusBadge } from './ui'

const FIELDS: [keyof Proposal, string][] = [
  ['problem', 'Problema'],
  ['objective', 'Objetivo'],
  ['beneficiaries', 'Beneficiarios'],
  ['indicator', 'Indicador'],
  ['baseline', 'Línea base'],
  ['target', 'Meta'],
  ['targetDate', 'Fecha objetivo'],
  ['budget', 'Presupuesto declarado'],
  ['responsibleUnit', 'Unidad responsable'],
]

type Mode = 'lista' | 'tema' | 'origen'
const MODES: [Mode, string][] = [['lista', 'Por lista'], ['tema', 'Por tema'], ['origen', 'Por origen']]

function groupsFor(mode: Mode): { key: string; label: string; items: Proposal[] }[] {
  if (mode === 'lista')
    return lists.map((l) => ({ key: l.id, label: `Lista ${l.number}`, items: proposals.filter((p) => p.listId === l.id) }))
  if (mode === 'tema')
    return PROPOSAL_CATEGORIES.map((c) => ({ key: c, label: c, items: proposals.filter((p) => p.category === c) })).filter((g) => g.items.length)
  return (Object.keys(ORIGIN_LABEL) as ProposalOrigin[])
    .map((o) => ({ key: o, label: ORIGIN_LABEL[o], items: proposals.filter((p) => p.origin === o) }))
    .filter((g) => g.items.length)
}

function Card({ p, mode }: { p: Proposal; mode: Mode }) {
  const specified = FIELDS.filter(([k]) => p[k]).length
  return (
    <article className="card p-4 text-sm">
      <p className="kicker">
        {mode !== 'lista' && `Lista ${p.listId.split('-')[1]} · `}
        {mode !== 'tema' && `${p.category} · `}
        {mode !== 'origen' && ORIGIN_LABEL[p.origin]}
      </p>
      {p.planId === null && p.candidateId && (
        <span className="chip mt-1">Propuesta personal de {candidateById.get(p.candidateId)?.name}, no presentada como plan de la lista</span>
      )}
      <h4 className="mt-1 font-semibold">{p.title}</h4>
      <p className="mt-1">{p.description}</p>
      {p.quote && (
        <blockquote className="mt-2 border-l-4 border-signal pl-3 italic">
          “{p.quote}”{p.t && <span className="not-italic text-xs text-muted"> · {p.t}</span>}
        </blockquote>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-muted hover:text-ink">
          Concreción: {specified} de {FIELDS.length} campos especificados · ver detalle
        </summary>
        <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-3">
          {FIELDS.map(([k, label]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className={p[k] ? '' : 'italic text-muted'}>{(p[k] as string | null) ?? 'No especificado'}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="mt-2 text-xs">
        Fuente: <Link className="link" to={`/fuentes#${p.sourceId}`}>{sourceById.get(p.sourceId)?.title}</Link>{' '}
        <StatusBadge status={p.status} short />
      </p>
    </article>
  )
}

export default function ProposalExplorer() {
  const [mode, setMode] = useState<Mode>('lista')
  const [active, setActive] = useState<string>('')
  const groups = groupsFor(mode)
  const shown = active ? groups.filter((g) => g.key === active) : groups

  if (!proposals.length) return <EmptyState title="Todavía no hay propuestas registradas" />

  return (
    <div>
      <div role="tablist" aria-label="Agrupar propuestas" className="flex gap-0 border-b-2 border-ink">
        {MODES.map(([m, label]) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setActive('') }}
            className={`-mb-0.5 border-2 border-b-0 px-4 py-2 text-sm font-semibold ${mode === m ? 'border-ink bg-ink text-paper' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Grupo">
        <button
          type="button"
          aria-pressed={!active}
          onClick={() => setActive('')}
          className={`rounded-full border-2 px-3 py-1 text-xs font-semibold ${!active ? 'border-ink bg-signal text-[#111]' : 'border-line hover:border-ink'}`}
        >
          Todo <span className="font-mono opacity-70">{proposals.length}</span>
        </button>
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            aria-pressed={active === g.key}
            onClick={() => setActive(g.key)}
            disabled={!g.items.length}
            className={`rounded-full border-2 px-3 py-1 text-xs font-semibold disabled:opacity-40 ${active === g.key ? 'border-ink bg-signal text-[#111]' : 'border-line hover:border-ink'}`}
          >
            {g.label} <span className="font-mono opacity-70">{g.items.length}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-8" role="tabpanel">
        {shown.map((g) => (
          <section key={g.key} aria-labelledby={`g-${g.key}`}>
            <h3 id={`g-${g.key}`} className="mb-3 flex items-baseline justify-between border-b border-line pb-1">
              <span className="font-display uppercase">{g.label}</span>
              <span className="font-mono text-xs text-muted">{g.items.length} propuesta{g.items.length === 1 ? '' : 's'}</span>
            </h3>
            {g.items.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((p) => <Card key={p.id} p={p} mode={mode} />)}
              </div>
            ) : (
              <EmptyState title="Sin propuestas registradas en las fuentes revisadas" />
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
