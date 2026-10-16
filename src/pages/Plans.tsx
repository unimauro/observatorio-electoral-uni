import { Link, useSearchParams } from 'react-router-dom'
import { FileText, Grid3x3, MessageSquareQuote, Radar as RadarIcon, Search, SplitSquareHorizontal } from 'lucide-react'
import { listProposals, lists, personalProposals, plans, proposals, site } from '../data'
import { PROPOSAL_CATEGORIES } from '../data/types'
import { PageHeader } from '../components/ui'
import { DebateQuotes, RadarCompare, RadarGrid } from '../components/ProposalRadar'
import ProposalExplorer from '../components/ProposalExplorer'

const TABS = [
  { id: 'radar', label: 'De qué habla cada lista', icon: RadarIcon },
  { id: 'comparar', label: 'Compara hasta 3 listas', icon: SplitSquareHorizontal },
  { id: 'palabras', label: 'En sus palabras', icon: MessageSquareQuote },
  { id: 'explorador', label: 'Explorador', icon: Search },
  { id: 'matriz', label: 'Matriz temas × listas', icon: Grid3x3 },
  { id: 'estado', label: 'Estado de los planes', icon: FileText },
] as const
type TabId = (typeof TABS)[number]['id']

function PlanStatus() {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="py-2 pr-3">Lista</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Propuestas de la lista</th>
              <th className="py-2 pr-3">Personales de integrantes</th>
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
                  <td className="py-2 pr-3 font-mono">{listProposals.filter((x) => x.listId === p.listId).length}</td>
                  <td className="py-2 pr-3 font-mono text-muted">{personalProposals.filter((x) => x.listId === p.listId).length || '—'}</td>
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
    </>
  )
}

function TopicMatrix() {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="py-2 pr-2 text-left">Categoría</th>
              {lists.map((l) => <th key={l.id} className="px-1 py-2 text-center">L{l.number}</th>)}
            </tr>
          </thead>
          <tbody>
            {PROPOSAL_CATEGORIES.map((c) => (
              <tr key={c} className="border-b border-line">
                <th scope="row" className="py-1.5 pr-2 text-left font-normal">{c}</th>
                {lists.map((l) => {
                  const n = listProposals.filter((p) => p.listId === l.id && p.category === c).length
                  const any = listProposals.some((p) => p.listId === l.id)
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
      <p className="mt-2 text-xs text-muted">
        "s/d" = sin plan ni propuestas registradas para la lista. Un 0 indica que la lista tiene propuestas registradas, pero ninguna en esa categoría (lo que no
        prueba que no la aborde). Cuenta sólo propuestas de la lista (planes o exposición del candidato a rector); las publicaciones personales de otros
        integrantes se muestran aparte. La cantidad refleja las fuentes disponibles, no la calidad de una lista.
      </p>
    </>
  )
}

export default function Plans() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some((t) => t.id === params.get('vista')) ? params.get('vista') : 'radar') as TabId
  const setTab = (id: TabId) => setParams({ vista: id }, { replace: true })
  const quoted = proposals.filter((p) => p.quote).length
  const counts: Partial<Record<TabId, number>> = { explorador: proposals.length, palabras: quoted }

  return (
    <div>
      <PageHeader kicker="Planes de gobierno" title="¿Qué proponen?">
        Registramos propuestas de planes de gobierno publicados y, mientras no aparezcan, las expuestas por los candidatos en el debate, rotuladas como tales.
        Si la fuente no especifica meta, plazo, presupuesto o responsable, lo decimos: <strong>no lo completamos</strong>.
      </PageHeader>

      <div role="tablist" aria-label="Vistas de propuestas" className="-mx-4 flex gap-1 overflow-x-auto border-b-2 border-ink px-4">
        {TABS.map((t) => {
          const Icon = t.icon
          const on = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-0.5 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t border-2 border-b-0 px-3 py-2 text-sm font-semibold ${
                on ? 'border-ink bg-ink text-paper' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              <Icon size={15} aria-hidden /> {t.label}
              {counts[t.id] !== undefined && <span className={`font-mono text-[11px] ${on ? 'opacity-80' : 'opacity-60'}`}>{counts[t.id]}</span>}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-6">
        {tab === 'radar' && <RadarGrid />}
        {tab === 'comparar' && <RadarCompare />}
        {tab === 'palabras' && <DebateQuotes />}
        {tab === 'explorador' && <ProposalExplorer />}
        {tab === 'matriz' && <TopicMatrix />}
        {tab === 'estado' && <PlanStatus />}
      </div>
    </div>
  )
}
