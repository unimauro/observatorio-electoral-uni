import { Link } from 'react-router-dom'
import incomesJson from '../data/incomes.json'
import { candidateById, candidates } from '../data'
import { ROLE_LABEL } from '../data/types'
import { PageHeader } from '../components/ui'

interface Row {
  candidateId: string
  entity: string
  role: string
  regime: string
  period: string
  monthlyAmount: number
  concept: string
  sourceId: string
}
const rows = incomesJson as Row[]
const money = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const max = Math.max(...rows.map((r) => r.monthlyAmount))

export default function Incomes() {
  const ordered = [...candidates].sort((a, b) => a.id.localeCompare(b.id, 'es', { numeric: true }))
  return (
    <div>
      <PageHeader kicker="Transparencia" title="Ingresos públicos">
        Remuneraciones que las propias entidades publican en el Portal de Transparencia Estándar (Ley 27806), consultadas el 16-10-2026. Es información pública
        de servidores del Estado. El "total" que publica el PTE suma remuneración y "otros ingresos" sin detallar su concepto; no incluye meses con gratificación.
        Un monto distinto entre docentes refleja categoría, dedicación y cargos, no mérito.
      </PageHeader>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="py-2 pr-3">Candidatura</th>
              <th className="py-2 pr-3">Entidad y cargo</th>
              <th className="py-2 pr-3">Periodo</th>
              <th className="py-2 pr-3 text-right">Total mensual</th>
              <th className="w-40 py-2" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {ordered.map((c) => {
              const rs = rows.filter((r) => r.candidateId === c.id).sort((a, b) => b.period.localeCompare(a.period))
              return rs.length ? (
                rs.map((r, i) => (
                  <tr key={`${c.id}-${i}`} className={`align-top ${i === rs.length - 1 ? 'border-b border-line' : ''}`}>
                    <td className="py-1.5 pr-3">
                      {i === 0 && (
                        <>
                          <Link className="link font-semibold" to={`/candidatos/${c.slug}`}>{c.name}</Link>
                          <span className="block text-xs text-muted">Lista {c.listId.split('-')[1]} · {ROLE_LABEL[c.role]}</span>
                        </>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-xs">
                      <span className="font-medium">{r.role}</span>
                      <span className="block text-muted">{r.entity} · {r.regime}</span>
                    </td>
                    <td className="py-1.5 pr-3 font-mono text-xs">{r.period}</td>
                    <td className="py-1.5 pr-3 text-right font-mono">
                      {money(r.monthlyAmount)}{' '}
                      <Link to={`/fuentes#${r.sourceId}`} className="text-[11px] text-muted underline decoration-dotted">fuente</Link>
                    </td>
                    <td className="py-2.5"><span className="block h-2 rounded-r bg-[var(--chart-ink)]" style={{ width: `${(r.monthlyAmount / max) * 100}%` }} /></td>
                  </tr>
                ))
              ) : (
                <tr key={c.id} className="border-b border-line">
                  <td className="py-1.5 pr-3">
                    <Link className="link font-semibold" to={`/candidatos/${c.slug}`}>{candidateById.get(c.id)?.name}</Link>
                    <span className="block text-xs text-muted">Lista {c.listId.split('-')[1]} · {ROLE_LABEL[c.role]}</span>
                  </td>
                  <td colSpan={4} className="py-1.5 text-xs italic text-muted">Sin registro localizado en el PTE consultado (no implica que no perciba ingresos).</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        En septiembre de 2026 quienes renunciaron a un vicerrectorado aparecen con dos filas (cargo y docencia); agosto muestra el monto completo del cargo. Las
        declaraciones juradas de ingresos de la Contraloría no estuvieron accesibles en esta consulta.
      </p>
    </div>
  )
}
