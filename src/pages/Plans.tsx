import { useState } from 'react'
import { Link } from 'react-router-dom'
import { lists, plans, proposals, site, sourceById } from '../data'
import { ORIGIN_LABEL, PROPOSAL_CATEGORIES, type Proposal } from '../data/types'
import { EmptyState, PageHeader, Section, StatusBadge } from '../components/ui'

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

export default function Plans() {
  const [cat, setCat] = useState('')
  const [list, setList] = useState('')
  const shown = proposals.filter((p) => (!cat || p.category === cat) && (!list || p.listId === list))

  return (
    <div>
      <PageHeader kicker="Planes de gobierno" title="¿Qué proponen?">
        Registramos propuestas de planes de gobierno publicados y, mientras no aparezcan, las expuestas por los candidatos en el debate según la prensa,
        rotuladas como tales. Si la fuente no especifica meta, plazo, presupuesto o responsable, lo decimos: <strong>no lo completamos</strong>.
      </PageHeader>

      <Section title="Estado de los planes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left">
                <th className="py-2 pr-3">Lista</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Propuestas</th>
                <th className="py-2">Documento</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const l = lists.find((x) => x.id === p.listId)!
                return (
                  <tr key={p.id} className="border-b border-line">
                    <td className="py-2 pr-3"><Link className="link" to={`/listas/${l.number}`}>Lista {l.number}</Link></td>
                    <td className={`py-2 pr-3 font-semibold ${p.status === 'no_localizado' ? 'text-alert' : ''}`}>
                      {p.status === 'publicado' ? 'Publicado' : p.status === 'en_revision' ? 'En revisión' : 'No localizado'}
                    </td>
                    <td className="py-2 pr-3 font-mono">{proposals.filter((x) => x.listId === p.listId).length}</td>
                    <td className="py-2">{p.url ? <a className="link" href={p.url} target="_blank" rel="noreferrer">{p.title}</a> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-md border-2 border-ink bg-signal p-4 text-sm text-[#111]">
          <p className="font-display uppercase">¿Eres parte de una lista o tienes el plan?</p>
          <p className="mt-1">
            Envíalo como <a className="underline" href={site.correctionsUrl} target="_blank" rel="noreferrer">issue en el repositorio</a> con el enlace público.
            Lo revisamos y publicamos con el mismo formato para las 9 listas. Este sitio no tiene formularios que guarden datos.
          </p>
        </div>
      </Section>

      <Section title="Matriz: categorías × listas">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="py-2 pr-2 text-left">Categoría</th>
                {lists.map((l) => (
                  <th key={l.id} className="px-1 py-2 text-center">L{l.number}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROPOSAL_CATEGORIES.map((c) => (
                <tr key={c} className="border-b border-line">
                  <th scope="row" className="py-1.5 pr-2 text-left font-normal">{c}</th>
                  {lists.map((l) => {
                    const n = proposals.filter((p) => p.listId === l.id && p.category === c).length
                    const any = proposals.some((p) => p.listId === l.id)
                    return (
                      <td key={l.id} className={`px-1 py-1.5 text-center font-mono ${n ? 'bg-signal font-bold text-[#111]' : ''}`} title={any ? `${n} propuestas` : 'Sin plan ni propuestas registradas'}>
                        {any ? n : <span className="text-muted">s/d</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">"s/d" = sin plan ni propuestas registradas para la lista. Un 0 indica que la lista tiene propuestas registradas, pero ninguna en esa categoría (lo que no prueba que no la aborde). Hoy todas las propuestas vienen del debate según la prensa; ninguna de un plan de gobierno.</p>
      </Section>

      <Section title="Explorador de propuestas">
        <div className="grid max-w-xl grid-cols-2 gap-3">
        <label className="block">
          <span className="kicker">Lista</span>
          <select className="input mt-1" value={list} onChange={(e) => setList(e.target.value)}>
            <option value="">Todas</option>
            {lists.map((l) => <option key={l.id} value={l.id}>Lista {l.number}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="kicker">Categoría</span>
          <select className="input mt-1" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Todas</option>
            {PROPOSAL_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        </div>
        <p className="mt-2 text-sm" role="status"><strong>{shown.length}</strong> propuesta{shown.length === 1 ? '' : 's'}</p>
        <div className="mt-4 space-y-3">
          {shown.map((p) => (
            <article key={p.id} className="card p-4 text-sm">
              <p className="kicker">Lista {p.listId.split('-')[1]} · {p.category}</p>
              <span className="chip mt-1">{ORIGIN_LABEL[p.origin]}</span>
              <h3 className="mt-1 font-semibold">{p.title}</h3>
              <p className="mt-1">{p.description}</p>
              <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-3">
                {FIELDS.map(([k, label]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className={p[k] ? '' : 'italic text-muted'}>{(p[k] as string | null) ?? 'No especificado'}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs">
                Fuente: <Link className="link" to={`/fuentes#${p.sourceId}`}>{sourceById.get(p.sourceId)?.title}</Link>
                {p.locator && ` · ${p.locator}`} <StatusBadge status={p.status} short />
              </p>
            </article>
          ))}
          {shown.length === 0 && (
            <EmptyState title="Todavía no hay propuestas registradas">
              Cuando una lista publique su plan, sus propuestas se extraerán aquí con los 13 campos y la página del documento donde aparecen.
            </EmptyState>
          )}
        </div>
      </Section>
    </div>
  )
}
