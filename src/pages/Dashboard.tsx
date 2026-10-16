import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { candidates, faculties, lists, plans, proposals, site, sources } from '../data'
import {
  CLAIM_SECTIONS,
  PROPOSAL_CATEGORIES,
  ROLE_LABEL,
  ROLES,
  SOURCE_TYPE_LABEL,
  type SourceType,
} from '../data/types'
import { hasAnyIn, hasVerifiedIn, isProfileVerified, pendingCount } from '../lib/stats'
import { ChartCard, EmptyState, Section, Stat } from '../components/ui'
import { DataTable, HBar, ROLE_COLOR, type Series } from '../components/charts'

const roleSeries: Series[] = ROLES.map((r, i) => ({ key: r, label: ROLE_LABEL[r], color: ROLE_COLOR[i] }))
const VERIFIED = ['verificado_primaria', 'corroborado']
const PARTIAL = ['parcialmente_verificado', 'declarado']
const tierSeries: Series[] = [
  { key: 'verificado', label: 'Verificado / corroborado', color: ROLE_COLOR[0] },
  { key: 'parcial', label: 'Parcial / declarado', color: ROLE_COLOR[1] },
  { key: 'pendiente', label: 'Pendiente / sin registro', color: ROLE_COLOR[2] },
]
const tier = (s: string) => (VERIFIED.includes(s) ? 'verificado' : PARTIAL.includes(s) ? 'parcial' : 'pendiente')

export default function Dashboard() {
  const plansFound = plans.filter((p) => p.status === 'publicado').length
  const verifiedProfiles = candidates.filter(isProfileVerified).length
  const leads = candidates.flatMap((c) => c.researchLeads)

  const byFaculty = faculties
    .map((f) => {
      const row: Record<string, string | number> = { name: f.id }
      for (const r of ROLES) row[r] = candidates.filter((c) => c.facultyId === f.id && c.role === r).length
      return row
    })
    .filter((r) => ROLES.some((k) => (r[k] as number) > 0))
    .sort((a, b) => ROLES.reduce((s, k) => s + (b[k] as number), 0) - ROLES.reduce((s, k) => s + (a[k] as number), 0))

  const byRole = ROLES.map((r) => ({ name: ROLE_LABEL[r], total: candidates.filter((c) => c.role === r).length }))

  const coverage = lists.map((l) => {
    const row: Record<string, string | number> = { name: `Lista ${l.number}`, verificado: 0, parcial: 0, pendiente: 0 }
    const members = candidates.filter((c) => c.listId === l.id)
    for (const c of members)
      for (const s of CLAIM_SECTIONS) for (const cl of c.claims[s]) row[tier(cl.status)] = (row[tier(cl.status)] as number) + 1
    return row
  })

  const sectionChart = (section: 'formacion' | 'gestion' | 'investigacion') =>
    ROLES.map((r) => {
      const cs = candidates.filter((c) => c.role === r)
      return {
        name: ROLE_LABEL[r].split(' ').slice(0, 2).join(' '),
        verificado: cs.filter((c) => hasVerifiedIn(c, section)).length,
        parcial: cs.filter((c) => !hasVerifiedIn(c, section) && hasAnyIn(c, section)).length,
        pendiente: cs.filter((c) => !hasAnyIn(c, section)).length,
      }
    })

  const prodData = ROLES.map((r) => {
    const cs = candidates.filter((c) => c.role === r)
    return {
      name: ROLE_LABEL[r].split(' ').slice(0, 2).join(' '),
      verificado: cs.filter((c) => hasVerifiedIn(c, 'investigacion')).length,
      parcial: cs.filter((c) => !hasVerifiedIn(c, 'investigacion') && c.researchLeads.some((l) => l.status === 'pendiente')).length,
      pendiente: cs.filter((c) => !hasVerifiedIn(c, 'investigacion') && !c.researchLeads.some((l) => l.status === 'pendiente')).length,
    }
  })
  const prodSeries: Series[] = [
    { key: 'verificado', label: 'Producción verificada', color: ROLE_COLOR[0] },
    { key: 'parcial', label: 'Pista sin confirmar', color: ROLE_COLOR[1] },
    { key: 'pendiente', label: 'Sin pista registrada', color: ROLE_COLOR[2] },
  ]

  const sourceTypes = Object.keys(SOURCE_TYPE_LABEL)
    .map((t) => {
      const ss = sources.filter((s) => s.type === t)
      return {
        name: SOURCE_TYPE_LABEL[t as SourceType],
        verificado: ss.filter((s) => tier(s.status) === 'verificado').length,
        parcial: ss.filter((s) => tier(s.status) === 'parcial').length,
        pendiente: ss.filter((s) => tier(s.status) === 'pendiente').length,
      }
    })
    .filter((r) => r.verificado + r.parcial + r.pendiente > 0)

  return (
    <div>
      {/* Hero */}
      <section className="border-b-4 border-ink pb-8">
        {site.electionDate === new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }) && (
          <p className="mb-4 inline-block bg-alert px-2 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-paper">Hoy se vota · {site.electionDate}</p>
        )}
        <p className="kicker">{site.university} · {site.period} · Infórmate antes de votar</p>
        <h1 className="h-display mt-3 text-[2.6rem] sm:text-7xl">
          Votar a ciegas<br />
          <span className="mark">no es opción.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg">
          {site.tagline} Aquí cada dato lleva su fuente, y <strong>lo que todavía no sabemos se dice en voz alta</strong>.
          Ni propaganda ni rumores: solo evidencia.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/listas" className="btn-solid">Ver las 9 listas <ArrowRight size={15} aria-hidden /></Link>
          <Link to="/comparar" className="btn">Comparar</Link>
          <Link to="/metodologia" className="btn">Cómo trabajamos</Link>
        </div>
        <dl className="mt-6 grid gap-x-6 gap-y-1 font-mono text-xs text-muted sm:grid-cols-3">
          <div><dt className="inline">Actualizado: </dt><dd className="inline text-ink">{site.updatedAt}</dd></div>
          <div><dt className="inline">Fecha de votación: </dt><dd className="inline text-ink" title={site.electionDateNote}>{site.electionDate ? `${site.electionDate} (según prensa)` : 'por confirmar'}</dd></div>
          <div><dt className="inline">Fuente base: </dt><dd className="inline"><Link className="link text-ink" to="/fuentes#src-ceuni-listas-definitivas">CEUNI, 30-09-2026</Link></dd></div>
        </dl>
      </section>

      {/* Lo que sabemos / lo que falta */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card border-ink p-5">
          <p className="kicker">Lo que está verificado</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Las <strong>9 listas</strong> y sus <strong>27 integrantes</strong>, con nombre y cargo, según la publicación definitiva del Comité Electoral (CEUNI).</li>
            <li>El orden en cada lista coincide con el cargo: 1 = rectorado, 2 = vicerrectorado académico, 3 = vicerrectorado de investigación.</li>
            <li>Los requisitos que exige el reglamento para postular (doctorado presencial; docente principal con 5 años o más en la categoría).</li>
          </ul>
        </div>
        <div className="card border-2 border-dashed border-alert p-5">
          <p className="kicker !text-alert">Lo que falta (y exigimos ver)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li><strong>{plans.length - plansFound} de {plans.length}</strong> planes de gobierno sin localizar en canales públicos.</li>
            <li>
              Sólo <strong>{candidates.filter((c) => hasVerifiedIn(c, 'gestion') || hasVerifiedIn(c, 'investigacion')).length} de {candidates.length}</strong> candidaturas
              tienen algún cargo o logro confirmado con documento; el resto es declaración o está pendiente.
            </li>
            <li>La votación de hoy: el CEUNI aún no publica resultados; la proclamación está prevista para el 04-11-2026.</li>
          </ul>
          <Link to="/planes" className="link mt-3 inline-block text-sm font-semibold">¿Tienes un plan publicado? Envíalo →</Link>
        </div>
      </section>

      {(site.results || site.calendar?.length) && (
        <Section id="resultados" title="Resultados y cronograma">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-4">
              <p className="kicker">Resultados</p>
              {!site.results || site.results.status === 'no_publicado' ? (
                <p className="mt-2 text-sm">
                  Aún no publicados por el CEUNI{site.results ? ` (revisado: ${site.results.asOf})` : ''}. No mostramos conteos extraoficiales.
                </p>
              ) : (
                <>
                  <p className={`mt-2 inline-block px-2 py-0.5 font-mono text-xs uppercase ${site.results.status === 'oficial' ? 'bg-ink text-paper' : 'border border-alert text-alert'}`}>
                    {site.results.status === 'oficial' ? 'Oficial' : 'Preliminar (prensa)'} · {site.results.asOf}
                  </p>
                  <table className="mt-3 w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink text-left"><th className="py-1">Lista</th><th className="py-1 text-right">% ponderado</th><th className="py-1 pl-3">Nota</th></tr>
                    </thead>
                    <tbody>
                      {site.results.lists.map((r) => (
                        <tr key={r.listId} className="border-b border-line">
                          <td className="py-1"><Link className="link" to={`/listas/${r.listId.split('-')[1]}`}>Lista {r.listId.split('-')[1]}</Link></td>
                          <td className="py-1 text-right font-mono">{r.weightedPct == null ? '—' : `${r.weightedPct}%`}</td>
                          <td className="py-1 pl-3 text-xs text-muted">{r.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {site.results.secondRound && <p className="mt-2 text-sm">Segunda vuelta: {site.results.secondRound.lists.map((l) => `Lista ${l.split('-')[1]}`).join(' vs. ')}{site.results.secondRound.date ? ` · ${site.results.secondRound.date}` : ''}</p>}
                  {site.results.proclaimed && <p className="mt-2 text-sm font-semibold">Proclamada: Lista {site.results.proclaimed.split('-')[1]}</p>}
                </>
              )}
              {site.results?.source && <Link className="link mt-2 inline-block text-xs" to={`/fuentes#${site.results.source}`}>Fuente</Link>}
            </div>
            {site.calendar?.length ? (
              <div className="card p-4">
                <p className="kicker">Cronograma</p>
                <ol className="mt-2 space-y-1 text-sm">
                  {site.calendar.map((e) => (
                    <li key={e.date + e.event} className="flex gap-3">
                      <span className="w-24 shrink-0 font-mono text-xs">{e.date}</span>
                      <span>{e.event} <Link className="text-xs text-muted underline" to={`/fuentes#${e.sourceId}`}>[fuente]</Link></span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </Section>
      )}

      <Section title="Indicadores">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Listas" value={lists.length} to="/listas" />
          <Stat label="Candidaturas" value={candidates.length} to="/candidatos" />
          {ROLES.map((r) => (
            <Stat key={r} label={ROLE_LABEL[r]} value={candidates.filter((c) => c.role === r).length} to={`/candidatos?cargo=${r}`} />
          ))}
          <Stat label="Perfiles verificados" value={verifiedProfiles} note="Con trayectoria propia confirmada" />
          <Stat label="Planes localizados" value={plansFound} note={`de ${plans.length}`} to="/planes" />
          <Stat label="Propuestas registradas" value={proposals.length} note={`${proposals.filter((p) => p.origin === 'plan').length} de planes · ${proposals.filter((p) => p.origin === 'debate').length} del debate`} to="/planes" />
          <Stat label="Fuentes registradas" value={sources.length} to="/fuentes" />
          <Stat label="Pendientes de revisión" value={pendingCount(candidates)} note="Perfiles con algún dato sin confirmar" />
        </div>
      </Section>

      <Section title="Los datos, en gráficos">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Candidaturas por facultad" measures="Número de candidatos según la facultad registrada en la tabla del CEUNI, separado por cargo.">
            <HBar data={byFaculty} series={roleSeries} />
            <DataTable data={byFaculty} series={roleSeries} caption="Candidaturas por facultad y cargo" />
          </ChartCard>
          <ChartCard title="Distribución por cargo" measures="Candidaturas inscritas por cargo. Cada lista presenta exactamente una por cargo.">
            <HBar data={byRole} series={[{ key: 'total', label: 'Candidaturas', color: 'var(--chart-ink)' }]} yWidth={150} />
          </ChartCard>
          <ChartCard title="Cobertura documental por lista" measures="Afirmaciones registradas sobre los 3 integrantes de cada lista, según nivel de verificación. Mide cuánto ha documentado el observatorio, no la calidad de la lista.">
            <HBar data={coverage} series={tierSeries} />
            <DataTable data={coverage} series={tierSeries} caption="Cobertura documental por lista" />
          </ChartCard>
          <ChartCard title="Formación académica documentada" measures="Candidatos con datos de formación, por nivel de evidencia. El doctorado se infiere del requisito reglamentario (parcial) hasta ver el registro de SUNEDU.">
            <HBar data={sectionChart('formacion')} series={tierSeries} yWidth={110} />
          </ChartCard>
          <ChartCard title="Experiencia en gestión documentada" measures="Candidatos con cargos de gestión respaldados por documentos. 'Sin registro' significa que no se ha documentado aún, NO que no exista experiencia.">
            <HBar data={sectionChart('gestion')} series={tierSeries} yWidth={110} />
          </ChartCard>
          <ChartCard title="Producción científica identificada" measures="Las 'pistas' son perfiles de OpenAlex que coinciden en nombre completo y afiliación UNI. No se atribuyen hasta que alguien los confirme; no se cuentan publicaciones.">
            <HBar data={prodData} series={prodSeries} yWidth={110} />
            <p className="mt-1 text-xs text-muted">Pistas registradas: {leads.length} ({leads.filter((l) => l.status === 'descartado').length} descartada por posible mezcla de homónimos).</p>
          </ChartCard>
          <ChartCard title="Propuestas por categoría" measures="Propuestas registradas por categoría. Hoy todas provienen de lo expuesto en el debate según la prensa: miden de qué se habló, no la calidad de la propuesta.">
            {proposals.length ? (
              <HBar
                data={PROPOSAL_CATEGORIES.map((c) => ({ name: c, total: proposals.filter((p) => p.category === c).length }))}
                series={[{ key: 'total', label: 'Propuestas', color: 'var(--chart-ink)' }]}
                yWidth={170}
              />
            ) : (
              <EmptyState title="Aún no hay propuestas que graficar">
                Ninguna lista tiene un plan de gobierno localizado. El gráfico aparecerá cuando se extraiga el primero. No mostramos datos de relleno.
              </EmptyState>
            )}
          </ChartCard>
          <ChartCard title="Nivel de concreción de los planes" measures="Cuántas propuestas registradas especifican indicador, meta, plazo y presupuesto. Una barra en cero significa que ninguna fuente lo precisa.">
            {proposals.length ? (
              <HBar
                data={['indicator', 'target', 'targetDate', 'budget'].map((k) => ({
                  name: { indicator: 'Indicador', target: 'Meta', targetDate: 'Plazo', budget: 'Presupuesto' }[k]!,
                  total: proposals.filter((p) => p[k as 'indicator'] != null).length,
                }))}
                series={[{ key: 'total', label: 'Propuestas que lo especifican', color: 'var(--chart-ink)' }]}
                yWidth={100}
              />
            ) : (
              <EmptyState title="Sin planes, no hay concreción que medir">Se calculará a partir de las propuestas extraídas.</EmptyState>
            )}
          </ChartCard>
          <ChartCard title="Fuentes por tipo y nivel de verificación" measures="Documentos registrados en el catálogo, por tipo y por estado de revisión.">
            <HBar data={sourceTypes} series={tierSeries} yWidth={140} />
            <DataTable data={sourceTypes} series={tierSeries} caption="Fuentes por tipo y nivel de verificación" />
          </ChartCard>
        </div>
      </Section>
    </div>
  )
}
