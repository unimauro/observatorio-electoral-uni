import { Link } from 'react-router-dom'
import { candidateById, degrees } from '../data'
import { ROLE_LABEL, type DegreeEntry } from '../data/types'
import { PageHeader, StatusBadge } from '../components/ui'

function Deg({ g }: { g: DegreeEntry | null }) {
  if (!g || !g.denominacion) return <span className="italic text-muted">Sin fuente localizada</span>
  return (
    <span>
      {g.denominacion}
      <span className="block text-xs text-muted">
        {[g.universidad, g.anio].filter(Boolean).join(' · ') || 'Universidad o año no indicados'}{' '}
        {g.sourceId && <Link className="underline" to={`/fuentes#${g.sourceId}`}>[fuente]</Link>}
      </span>
    </span>
  )
}

export default function Degrees() {
  const rows = [...degrees].sort((a, b) => a.candidateId.localeCompare(b.candidateId, 'es', { numeric: true }))
  const withDoc = degrees.filter((d) => d.doctorado?.denominacion).length
  const primary = degrees.filter((d) => d.doctorado && ['verificado_primaria', 'corroborado'].includes(d.doctorado.status)).length
  return (
    <div>
      <PageHeader kicker="Formación" title="Grados académicos">
        El reglamento exige doctorado presencial para postular. Aquí ves qué doctorado, dónde y cuándo, con la fuente de cada dato. Doctorado identificado:{' '}
        <strong>{withDoc} de 27</strong>, de ellos <strong>{primary}</strong> con fuente primaria o corroborada. La consulta oficial de SUNEDU exige DNI y captcha,
        así que usamos tesis en repositorios (UNI, ALICIA-CONCYTEC, otras universidades), fichas CTI Vitae con datos de SUNEDU y ORCID. "Sin fuente localizada" no
        significa que no tenga el grado: el CEUNI lo verificó al inscribir la candidatura.
      </PageHeader>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="py-2 pr-3">Candidatura</th>
              <th className="py-2 pr-3">Doctorado</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2 pr-3">Maestría</th>
              <th className="py-2">Título profesional</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = candidateById.get(r.candidateId)!
              return (
                <tr key={r.candidateId} className="border-b border-line align-top">
                  <td className="py-2 pr-3">
                    <Link className="link font-semibold" to={`/candidatos/${c.slug}`}>{c.name}</Link>
                    <span className="block text-xs text-muted">Lista {c.listId.split('-')[1]} · {ROLE_LABEL[c.role]}</span>
                  </td>
                  <td className="py-2 pr-3"><Deg g={r.doctorado} /></td>
                  <td className="py-2 pr-3">{r.doctorado?.status ? <StatusBadge status={r.doctorado.status} short /> : '—'}</td>
                  <td className="py-2 pr-3"><Deg g={r.maestria} /></td>
                  <td className="py-2"><Deg g={r.titulo} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
