import { Link, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { candidateBySlug, facultyById, listById, membersOf, planById, sourceById } from '../data'
import { CLAIM_KIND_LABEL, CLAIM_SECTIONS, ROLE_LABEL, SECTION_LABEL, SOURCE_TYPE_LABEL } from '../data/types'
import { Avatar, EmptyState, Section, SourceRefs, StatusBadge } from '../components/ui'
import NotFound from './NotFound'

export default function Profile() {
  const { slug } = useParams()
  const c = slug ? candidateBySlug.get(slug) : undefined
  if (!c) return <NotFound />
  const list = listById.get(c.listId)!
  const plan = planById.get(list.planId)!
  const faculty = facultyById.get(c.facultyId)
  const teammates = membersOf(list.id).filter((m) => m.id !== c.id)
  const allSourceIds = [
    ...new Set([
      ...Object.values(c.verification).flatMap((v) => v.sourceIds),
      ...CLAIM_SECTIONS.flatMap((s) => c.claims[s].flatMap((cl) => cl.sourceIds)),
      ...c.corrections.flatMap((x) => x.sourceIds),
    ]),
  ]

  return (
    <article>
      <Link to="/candidatos" className="link text-sm">← Directorio</Link>
      <header className="mt-4 flex flex-col gap-4 border-b-4 border-ink pb-6 sm:flex-row sm:items-end">
        <Avatar name={c.name} size={96} />
        <div>
          <p className="kicker">
            <Link className="hover:underline" to={`/listas/${list.number}`}>Lista {list.number}</Link> · {ROLE_LABEL[c.role]}
          </p>
          <h1 className="h-display mt-1 text-3xl sm:text-5xl">{c.name}</h1>
          <p className="mt-2 text-sm">
            Cargo al que postula: <strong>{c.verification.role.officialText}</strong> <StatusBadge status={c.verification.role.status} short />
            <SourceRefs ids={c.verification.role.sourceIds} />
          </p>
          <p className="mt-1 text-sm">
            Facultad: <strong>{faculty?.name}</strong> ({c.facultyId}) <StatusBadge status={c.verification.faculty.status} short />
            <SourceRefs ids={c.verification.faculty.sourceIds} />
          </p>
          <p className="mt-1 text-xs text-muted">
            Nombre en la publicación oficial: <span className="font-mono">{c.officialName}</span>
            {c.nameVariants.length > 0 && <> · Variante en otro documento del CEUNI: <span className="font-mono">{c.nameVariants.join(', ')}</span></>}
          </p>
        </div>
      </header>

      <p className="mt-3 text-xs text-muted">
        Sin fotografía: el observatorio sólo publica retratos con fuente y autorización verificables. Última revisión: <span className="font-mono">{c.meta.lastReviewed}</span>.
      </p>

      <Section title="Resumen profesional">
        {c.summary ? (
          <p>{c.summary.text} <SourceRefs ids={c.summary.sourceIds} /></p>
        ) : (
          <EmptyState title="Aún no hay un resumen respaldado por fuentes">
            No escribimos biografías sin documentos que las sostengan. Este espacio se llena cuando haya evidencia verificable.
          </EmptyState>
        )}
      </Section>

      <div className="grid gap-x-8 md:grid-cols-2">
        {CLAIM_SECTIONS.map((s) => (
          <Section key={s} title={SECTION_LABEL[s]}>
            {c.claims[s].length ? (
              <ul className="space-y-3">
                {c.claims[s].map((cl, i) => (
                  <li key={i} className="card p-3 text-sm">
                    <div className="mb-1 flex flex-wrap gap-1">
                      <StatusBadge status={cl.status} />
                      <span className="chip">{CLAIM_KIND_LABEL[cl.kind]}</span>
                    </div>
                    {cl.text}
                    <SourceRefs ids={cl.sourceIds} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Sin registros verificados por ahora">
                {s === 'propuestas'
                  ? plan.status === 'publicado'
                    ? 'El plan existe, pero aún no se han extraído propuestas atribuibles a este cargo.'
                    : 'La lista no tiene un plan de gobierno localizado.'
                  : 'Que no esté aquí no significa que no exista: significa que todavía no se ha documentado.'}
              </EmptyState>
            )}
            {s === 'investigacion' && c.researchLeads.length > 0 && (
              <div className="mt-3 rounded-md border-2 border-dashed border-line p-3 text-sm">
                <p className="kicker">Pistas de investigación (NO atribuidas)</p>
                <ul className="mt-2 space-y-2">
                  {c.researchLeads.map((l) => (
                    <li key={l.profileId}>
                      <a className="link inline-flex items-center gap-1" href={l.profileId} target="_blank" rel="noreferrer">
                        {l.provider}: «{l.displayName}» <ExternalLink size={12} aria-hidden />
                      </a>
                      {l.orcid && (
                        <> · <a className="link" href={l.orcid} target="_blank" rel="noreferrer">ORCID</a></>
                      )}
                      <span className="ml-1 chip">{l.status === 'descartado' ? 'descartada' : 'pendiente de confirmar'}</span>
                      <p className="mt-0.5 text-xs text-muted">{l.note} Consultado: {l.consultedAt}.</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        ))}
      </div>

      <Section title="Fuentes documentales">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {allSourceIds.map((id) => {
            const s = sourceById.get(id)!
            return (
              <li key={id}>
                <Link to={`/fuentes#${id}`} className="link">{s.title}</Link>
                <span className="text-muted"> · {s.author} · {SOURCE_TYPE_LABEL[s.type]}{s.locator ? ` · ${s.locator}` : ''}</span>{' '}
                <StatusBadge status={s.status} short />
              </li>
            )
          })}
        </ol>
      </Section>

      <Section title="Información pendiente de verificar">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {c.pendingSources.map((p) => <li key={p}>{p}</li>)}
          {c.verification.faculty.note && <li>Facultad: {c.verification.faculty.note}</li>}
        </ul>
      </Section>

      <Section title="Historial de correcciones">
        {c.corrections.length ? (
          <ol className="space-y-3 text-sm">
            {c.corrections.map((x, i) => (
              <li key={i} className="card p-3">
                <p className="font-mono text-xs text-muted">{x.date} · campo: {x.field}</p>
                <p className="mt-1"><del className="text-muted">{x.before}</del> → <strong>{x.after}</strong></p>
                <p className="mt-1 text-muted">{x.reason} <SourceRefs ids={x.sourceIds} /></p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">Sin correcciones registradas desde la carga inicial ({c.meta.importedAt}).</p>
        )}
      </Section>

      <Section title="Su equipo">
        <div className="flex flex-wrap gap-2">
          {teammates.map((m) => (
            <Link key={m.id} to={`/candidatos/${m.slug}`} className="btn text-xs">{m.name} · {ROLE_LABEL[m.role]}</Link>
          ))}
          <Link to={`/comparar?modo=candidatos&cargo=${c.role}&ids=${c.slug}`} className="btn-solid text-xs">Comparar con otros candidatos al mismo cargo</Link>
        </div>
      </Section>
    </article>
  )
}
