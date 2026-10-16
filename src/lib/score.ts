import type { Criterion, Evaluation, ScoreValue } from '../data/types'

export const SCORE_LABEL: Record<string, string> = {
  '0': 'Evidencia evaluada insuficiente para acreditar el criterio',
  '1': 'Desarrollo muy limitado',
  '2': 'Desarrollo parcial',
  '3': 'Desarrollo adecuado',
  '4': 'Desarrollo sólido',
  '5': 'Desarrollo muy sólido',
  no_evaluado: 'No evaluado',
  insuficiente: 'Información insuficiente',
  no_aplica: 'No aplica',
}

export interface IndexResult {
  /** 0–100, o null si ningún criterio tiene puntuación numérica. */
  index: number | null
  /** Proporción (0–1) del peso aplicable que cuenta con puntuación numérica. */
  coverage: number
  scored: number
  applicable: number
}

/**
 * Índice = Σ(peso·puntuación) / (5·Σ peso puntuado) × 100.
 * Los criterios sin puntuación numérica NO cuentan como cero: se excluyen y se informan como cobertura.
 * "No aplica" sale también del denominador de cobertura.
 */
export function computeIndex(
  criteria: Criterion[],
  scoreOf: (criterionId: string) => ScoreValue,
  weights: Record<string, number> = {},
): IndexResult {
  let num = 0
  let den = 0
  let applicableW = 0
  let scored = 0
  let applicable = 0
  for (const c of criteria) {
    const w = weights[c.id] ?? c.weight
    const s = scoreOf(c.id)
    if (s === 'no_aplica') continue
    applicable++
    applicableW += w
    if (typeof s === 'number') {
      scored++
      num += w * s
      den += w * 5
    }
  }
  return {
    index: den > 0 ? (num / den) * 100 : null,
    coverage: applicableW > 0 ? (den / 5) / applicableW : 0,
    scored,
    applicable,
  }
}

export function scoreLookup(evaluations: Evaluation[], candidateId: string) {
  const m = new Map(evaluations.filter((e) => e.candidateId === candidateId).map((e) => [e.criterionId, e]))
  return (criterionId: string): ScoreValue => m.get(criterionId)?.score ?? 'no_evaluado'
}
