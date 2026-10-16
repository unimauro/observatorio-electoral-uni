import { describe, expect, it } from 'vitest'
import { fold, matches } from './search'
import { computeIndex } from './score'
import type { Criterion, ScoreValue } from '../data/types'

describe('búsqueda', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(fold('Páuyac HUAMÁN')).toBe('pauyac huaman')
    expect(matches('José Aníbal Páuyac Huamán', 'pauyac')).toBe(true)
    expect(matches('Héctor Carlos Guimaray Huerta', 'hector guimaray')).toBe(true)
  })
  it('exige todos los términos', () => {
    expect(matches('Fernando Huamán Pérez', 'huaman sanchez')).toBe(false)
  })
})

const crit = (id: string, weight = 1): Criterion => ({ id, role: 'rector', name: id, description: '', weight, scale: '0-5', evidenceRequired: '' })

describe('índice', () => {
  const cs = [crit('a'), crit('b'), crit('c')]
  it('sin puntuaciones es null, no cero', () => {
    const r = computeIndex(cs, () => 'no_evaluado')
    expect(r.index).toBeNull()
    expect(r.coverage).toBe(0)
  })
  it('lo desconocido no cuenta como cero', () => {
    const s: Record<string, ScoreValue> = { a: 5, b: 'insuficiente', c: 'no_evaluado' }
    const r = computeIndex(cs, (id) => s[id])
    expect(r.index).toBe(100)
    expect(r.coverage).toBeCloseTo(1 / 3)
  })
  it('respeta los pesos y "no aplica"', () => {
    const s: Record<string, ScoreValue> = { a: 5, b: 0, c: 'no_aplica' }
    expect(computeIndex(cs, (id) => s[id], { a: 3, b: 1 }).index).toBe(75)
    expect(computeIndex(cs, (id) => s[id], { a: 3, b: 1 }).applicable).toBe(2)
  })
})

describe('evidencia por criterio', () => {
  it('cada criterio de la matriz tiene un selector de evidencia que no falla', async () => {
    const { EVIDENCE } = await import('./evidence')
    const { criteria, candidates } = await import('../data')
    for (const k of criteria) {
      expect(EVIDENCE[k.id]).toBeTypeOf('function')
      for (const c of candidates.filter((x) => x.role === k.role)) expect(Array.isArray(EVIDENCE[k.id](c))).toBe(true)
    }
  })
})
