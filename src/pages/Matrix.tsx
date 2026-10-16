import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { candidates, criteria, evaluations } from '../data'
import { ROLE_LABEL, ROLES, type Role } from '../data/types'
import { computeIndex, SCORE_LABEL, scoreLookup } from '../lib/score'
import { PageHeader, Section } from '../components/ui'

const KEY = 'oeu-weights'

function loadWeights(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export default function Matrix() {
  const [role, setRole] = useState<Role>('rector')
  const [weights, setWeights] = useState<Record<string, number>>(loadWeights)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(weights))
    } catch {
      /* sin almacenamiento: los pesos se pierden al recargar */
    }
  }, [weights])

  const crit = criteria.filter((c) => c.role === role)
  const pool = candidates.filter((c) => c.role === role)
  const totalW = crit.reduce((s, c) => s + (weights[c.id] ?? c.weight), 0)

  return (
    <div>
      <PageHeader kicker="Matriz de evaluación" title="Pesos a la vista">
        Una puntuación editorial no es una verdad sobre nadie: es un juicio explícito, con criterios, pesos y evidencia que
        cualquiera puede revisar y cambiar. Mueve los pesos y mira cómo cambia el índice.
      </PageHeader>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Cargo">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={role === r}
            onClick={() => setRole(r)}
            className={`rounded border-2 px-3 py-1.5 text-sm font-semibold ${role === r ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section aria-labelledby="w-title" className="card p-4">
          <div className="flex items-center justify-between">
            <h2 id="w-title" className="font-semibold">Criterios y pesos</h2>
            <button type="button" className="link text-xs" onClick={() => setWeights({})}>Restablecer</button>
          </div>
          <ul className="mt-3 space-y-3">
            {crit.map((c) => {
              const w = weights[c.id] ?? c.weight
              return (
                <li key={c.id}>
                  <label className="block text-sm">
                    <span className="flex justify-between gap-2">
                      <span className="font-medium">{c.name}</span>
                      <span className="font-mono text-xs">peso {w} · {totalW ? Math.round((w / totalW) * 100) : 0}%</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={w}
                      onChange={(e) => setWeights({ ...weights, [c.id]: Number(e.target.value) })}
                      className="mt-1 w-full accent-[rgb(var(--ink))]"
                      aria-describedby={`${c.id}-d`}
                    />
                    <span id={`${c.id}-d`} className="block text-xs text-muted">{c.description} Evidencia requerida: {c.evidenceRequired}.</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="r-title">
          <h2 id="r-title" className="font-semibold">Resultado por candidatura</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-ink text-left">
                  <th className="py-2 pr-2">Candidatura</th>
                  <th className="py-2 pr-2">Índice</th>
                  <th className="py-2">Cobertura de evidencia</th>
                </tr>
              </thead>
              <tbody>
                {pool.map((c) => {
                  const r = computeIndex(crit, scoreLookup(evaluations, c.id), weights)
                  return (
                    <tr key={c.id} className="border-b border-line">
                      <td className="py-2 pr-2">
                        <Link className="link" to={`/candidatos/${c.slug}`}>{c.name}</Link>
                        <span className="block text-xs text-muted">Lista {c.listId.split('-')[1]}</span>
                      </td>
                      <td className="py-2 pr-2">
                        {r.index == null ? <span className="italic text-muted">No evaluado</span> : <span className="font-mono font-semibold">{r.index.toFixed(0)}/100</span>}
                      </td>
                      <td className="py-2 font-mono text-xs">{r.scored}/{r.applicable} criterios · {(r.coverage * 100).toFixed(0)}% del peso</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Ninguna candidatura ha sido evaluada todavía: cada puntuación necesita evaluador, fecha, justificación y fuentes. Por eso el
            índice aparece como "No evaluado" y no como cero. No hay ranking automático ni predicción de resultados.
          </p>
        </section>
      </div>

      <Section title="Fórmula">
        <div className="card p-4 text-sm">
          <p className="font-mono">Índice = Σ (peso × puntuación) ÷ (5 × Σ peso de criterios puntuados) × 100</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            <li>Sólo entran los criterios con puntuación numérica (0–5). "No evaluado" e "Información insuficiente" se excluyen; no cuentan como 0.</li>
            <li>La <strong>cobertura</strong> informa qué parte del peso total tiene puntuación. Un índice con poca cobertura dice poco.</li>
            <li>"No aplica" se excluye también del cálculo de cobertura.</li>
          </ul>
          <p className="mt-3 font-semibold">Escala</p>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {Object.entries(SCORE_LABEL).map(([k, v]) => (
              <li key={k}><span className="font-mono">{k.replace('_', ' ')}</span>: {v}</li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  )
}
