import { Link, useParams } from 'react-router-dom'
import { ArrowRight, FileX2 } from 'lucide-react'
import { facultyById, listById, lists, membersOf, planById, proposalsOf, sources } from '../data'
import { ROLE_LABEL, SOURCE_TYPE_LABEL } from '../data/types'
import { sourcesForList } from '../lib/stats'
import { Avatar, EmptyState, PageHeader, Section, StatusBadge } from '../components/ui'
import NotFound from './NotFound'

const PLAN_LABEL = { publicado: 'Plan publicado', no_localizado: 'Plan no localizado', en_revision: 'Plan en revisión' }

export function ListCard({ listId }: { listId: string }) {
  const l = listById.get(listId)!
  const plan = planById.get(l.planId)!
  const members = membersOf(l.id)
  return (
    <article className="card flex flex-col p-4" aria-labelledby={`${l.id}-t`}>
      <div className="flex items-baseline justify-between">
        <h2 id={`${l.id}-t`} className="h-display text-2xl">Lista {l.number}</h2>
        <StatusBadge status={l.verification.status} short />
      </div>
      <ol className="mt-3 flex-1 space-y-3">
        {members.map((c) => (
          <li key={c.id} className="flex items-start gap-3">
            <Avatar name={c.name} size={40} />
            <div className="min-w-0">
              <p className="kicker !text-[10px]">{ROLE_LABEL[c.role]}</p>
              <Link to={`/candidatos/${c.slug}`} className="block font-semibold leading-tight hover:underline">{c.name}</Link>
              <p className="text-xs text-muted" title={facultyById.get(c.facultyId)?.name}>{c.facultyId}</p>
            </div>
          </li>
        ))}
      </ol>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs">
        <div>
          <dt className="text-muted">Plan de gobierno</dt>
          <dd className={`font-semibold ${plan.status === 'no_localizado' ? 'text-alert' : ''}`}>{PLAN_LABEL[plan.status]}</dd>
        </div>
        <div>
          <dt className="text-muted">Propuestas</dt>
          <dd className="font-semibold">{proposalsOf(l.id).length}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Actualizado</dt>
          <dd className="font-mono">{l.meta.lastReviewed}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={`/listas/${l.number}`} className="btn !px-2 !py-1 text-xs">Equipo completo <ArrowRight size={13} aria-hidden /></Link>
        <Link to={`/comparar?modo=listas&ids=${l.number}`} className="btn !px-2 !py-1 text-xs">Comparar</Link>
      </div>
    </article>
  )
}

export default function Lists() {
  return (
    <div>
      <PageHeader kicker="Rector y vicerrectores" title="Las 9 listas">
        Presentadas en orden numérico, con el mismo formato para todas. El orden no implica preferencia ni resultado.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => (
          <ListCard key={l.id} listId={l.id} />
        ))}
      </div>
    </div>
  )
}

export function ListDetail() {
  const { n } = useParams()
  const l = listById.get(`lista-${n}`)
  if (!l) return <NotFound />
  const plan = planById.get(l.planId)!
  const members = membersOf(l.id)
  const srcs = sourcesForList(sources, l.members)
  const props = proposalsOf(l.id)
  return (
    <div>
      <PageHeader kicker="Equipo electoral" title={`Lista ${l.number}`}>
        <Link className="link" to="/listas">← Todas las listas</Link>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-3">
        {members.map((c) => (
          <Link key={c.id} to={`/candidatos/${c.slug}`} className="card flex gap-3 p-4 hover:border-ink">
            <Avatar name={c.name} />
            <div>
              <p className="kicker">{c.verification.role.officialText}</p>
              <p className="font-semibold leading-tight">{c.name}</p>
              <p className="text-xs text-muted">{facultyById.get(c.facultyId)?.name} ({c.facultyId})</p>
            </div>
          </Link>
        ))}
      </div>

      <Section title="Plan de gobierno">
        {plan.status === 'publicado' ? (
          <p>
            <a className="link" href={plan.url!} target="_blank" rel="noreferrer">{plan.title}</a> ({plan.publishedAt})
          </p>
        ) : (
          <div className="card flex gap-3 border-dashed p-4">
            <FileX2 className="shrink-0 text-alert" aria-hidden />
            <div className="text-sm">
              <p className="font-semibold">No localizado</p>
              <p className="mt-1 text-muted">{plan.note}</p>
              <p className="mt-2 font-semibold">Búsquedas realizadas</p>
              <ul className="list-disc pl-5 text-muted">
                {plan.searched.map((s) => (
                  <li key={s.where}>{s.where} ({s.at}): {s.result}</li>
                ))}
              </ul>
              <p className="mt-2 font-semibold">Próximos pasos</p>
              <ul className="list-disc pl-5 text-muted">{plan.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        )}
        {props.length === 0 && <p className="mt-3 text-sm text-muted">Propuestas extraídas: 0.</p>}
      </Section>

      <Section title="Fuentes que respaldan esta lista">
        {srcs.length ? (
          <ul className="space-y-2 text-sm">
            {srcs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2">
                <Link to={`/fuentes#${s.id}`} className="link">{s.title}</Link>
                <span className="chip">{SOURCE_TYPE_LABEL[s.type]}</span>
                <StatusBadge status={s.status} short />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Sin fuentes registradas" />
        )}
      </Section>
    </div>
  )
}
