import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { candidates, faculties, facultyById, listById, lists, planById } from '../data'
import { ROLE_LABEL, ROLES, STATUS_LABEL, VERIFICATION_STATUSES, type Candidate } from '../data/types'
import { matches } from '../lib/search'
import { hasAnyIn, hasVerifiedIn } from '../lib/stats'
import { Avatar, EmptyState, PageHeader, StatusBadge } from '../components/ui'

const areas = [...new Set(faculties.map((f) => f.area))].sort()

type Filter = { key: string; label: string; options: [string, string][]; test: (c: Candidate, v: string) => boolean }

const FILTERS: Filter[] = [
  { key: 'lista', label: 'Lista', options: lists.map((l) => [String(l.number), `Lista ${l.number}`]), test: (c, v) => c.listId === `lista-${v}` },
  { key: 'cargo', label: 'Cargo', options: ROLES.map((r) => [r, ROLE_LABEL[r]]), test: (c, v) => c.role === v },
  { key: 'facultad', label: 'Facultad', options: faculties.map((f) => [f.id, f.id]), test: (c, v) => c.facultyId === v },
  { key: 'area', label: 'Área académica', options: areas.map((a) => [a, a]), test: (c, v) => facultyById.get(c.facultyId)?.area === v },
  {
    key: 'gestion',
    label: 'Experiencia documentada',
    options: [['si', 'Con registro'], ['no', 'Sin registro aún']],
    test: (c, v) => (hasAnyIn(c, 'gestion') || hasAnyIn(c, 'docencia')) === (v === 'si'),
  },
  {
    key: 'produccion',
    label: 'Producción científica',
    options: [['verificada', 'Verificada'], ['pista', 'Pista sin confirmar'], ['ninguna', 'Sin registro']],
    test: (c, v) => {
      const ver = hasVerifiedIn(c, 'investigacion')
      const lead = c.researchLeads.some((l) => l.status === 'pendiente')
      return v === 'verificada' ? ver : v === 'pista' ? !ver && lead : !ver && !lead
    },
  },
  {
    key: 'estado',
    label: 'Verificación de identidad',
    options: VERIFICATION_STATUSES.map((s) => [s, STATUS_LABEL[s]]),
    test: (c, v) => c.verification.name.status === v,
  },
  {
    key: 'plan',
    label: 'Plan de gobierno',
    options: [['si', 'Localizado'], ['no', 'No localizado']],
    test: (c, v) => (planById.get(listById.get(c.listId)!.planId)?.status === 'publicado') === (v === 'si'),
  },
]

export default function Directory() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }

  const results = useMemo(
    () =>
      candidates.filter((c) => {
        const hay = [c.name, c.officialName, ...c.nameVariants, c.facultyId, facultyById.get(c.facultyId)?.name, ROLE_LABEL[c.role]].join(' ')
        if (!matches(hay, q)) return false
        return FILTERS.every((f) => !params.get(f.key) || f.test(c, params.get(f.key)!))
      }),
    [params, q],
  )
  const active = FILTERS.filter((f) => params.get(f.key)).length + (q ? 1 : 0)

  return (
    <div>
      <PageHeader kicker="Directorio" title="27 candidaturas">
        Filtra y busca. La búsqueda ignora tildes ("pauyac" encuentra "Páuyac"), pero nunca fusiona personas: cada registro es una candidatura.
      </PageHeader>

      <div className="card p-4">
        <label className="block">
          <span className="kicker">Buscar por nombre, facultad o cargo</span>
          <input className="input mt-1" type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Ej.: montoya, FIEE, investigación…" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {FILTERS.map((f) => (
            <label key={f.key} className="block">
              <span className="kicker">{f.label}</span>
              <select className="input mt-1" value={params.get(f.key) ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">Todos</option>
                {f.options.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm" role="status">
          <span><strong>{results.length}</strong> resultado{results.length === 1 ? '' : 's'}</span>
          {active > 0 && (
            <button type="button" className="link text-sm" onClick={() => setParams({}, { replace: true })}>Limpiar filtros</button>
          )}
        </div>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((c) => (
          <li key={c.id}>
            <Link to={`/candidatos/${c.slug}`} className="card flex h-full gap-3 p-3 hover:border-ink">
              <Avatar name={c.name} size={44} />
              <div className="min-w-0">
                <p className="kicker !text-[10px]">Lista {c.listId.split('-')[1]} · {ROLE_LABEL[c.role]}</p>
                <p className="font-semibold leading-tight">{c.name}</p>
                <p className="text-xs text-muted">{facultyById.get(c.facultyId)?.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <StatusBadge status={c.verification.name.status} short />
                  {c.researchLeads.some((l) => l.status === 'pendiente') && <span className="chip">pista de investigación</span>}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {results.length === 0 && (
        <div className="mt-4">
          <EmptyState title="Ninguna candidatura coincide">Prueba con menos filtros o con otra forma de escribir el nombre.</EmptyState>
        </div>
      )}
    </div>
  )
}
