import { describe, expect, it } from 'vitest'
import * as d from './index'
import { validateDataset } from './validate'
import { ROLE_BY_ORDER, ROLES } from './types'

const dataset = {
  candidates: d.candidates,
  lists: d.lists,
  faculties: d.faculties,
  sources: d.sources,
  plans: d.plans,
  proposals: d.proposals,
  criteria: d.criteria,
  evaluations: d.evaluations,
}

describe('integridad de datos', () => {
  it('el validador no encuentra problemas', () => {
    expect(validateDataset(dataset)).toEqual([])
  })

  it('hay exactamente 9 listas y 27 candidaturas', () => {
    expect(d.lists).toHaveLength(9)
    expect(d.candidates).toHaveLength(27)
  })

  it('cada lista tiene un integrante por cargo y el orden determina el cargo', () => {
    for (const l of d.lists) {
      const m = d.membersOf(l.id)
      expect(m.map((c) => c.role)).toEqual(ROLES)
      for (const c of m) expect(c.role).toBe(ROLE_BY_ORDER[c.order])
    }
  })

  it('el cargo coincide con el texto oficial del CEUNI', () => {
    for (const c of d.candidates) {
      const t = c.verification.role.officialText!
      const expected = { rector: /^RECTOR$/, vicerrector_academico: /^VICERRECTOR(A ACADÉMICA| ACADÉMICO)$/, vicerrector_investigacion: /^VICERRECTOR INVESTIGACIÓN$/ }[c.role]
      expect(t).toMatch(expected)
    }
  })

  it('conserva tildes y Unicode normalizado', () => {
    const names = d.candidates.map((c) => c.name)
    expect(names).toContain('José Aníbal Páuyac Huamán')
    expect(names).toContain('Jimmy Aurelio Rosales Huamaní')
    for (const n of names) expect(n).toBe(n.normalize('NFC'))
  })

  it('registra las correcciones de transcripción detectadas', () => {
    const chirif = d.candidates.find((c) => c.slug === 'luis-humberto-chirif-rivera')!
    expect(chirif.corrections[0].before).toBe('Luis Humberto Chirich Rivera')
    const arnao = d.candidates.find((c) => c.listId === 'lista-9' && c.order === 1)!
    expect(arnao.verification.name.status).toBe('pendiente_revision')
  })

  it('no hay datos personales innecesarios en los JSON', () => {
    const raw = JSON.stringify(dataset)
    expect(raw).not.toMatch(/\b19\d{6}[A-K]\b/) // códigos de docente del CEUNI
    expect(raw).not.toMatch(/\b\d{8}\b(?!-)/) // posibles DNI
  })

  it('el validador detecta un cargo que no corresponde al orden', () => {
    const broken = structuredClone(dataset)
    broken.candidates[0].role = 'vicerrector_academico'
    expect(validateDataset(broken).join('\n')).toMatch(/no corresponde al cargo/)
  })

  it('el validador detecta duplicados', () => {
    const broken = structuredClone(dataset)
    broken.candidates.push({ ...broken.candidates[0] })
    expect(validateDataset(broken).join('\n')).toMatch(/duplicado/)
  })
})
