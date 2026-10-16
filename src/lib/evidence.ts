import { degrees, plans, proposals } from '../data'
import type { Candidate, Claim, ClaimSection, Proposal } from '../data/types'
import { fold } from './search'
import { timelines } from '../components/Timeline'

export interface EvidenceItem {
  text: string
  status: string
  sourceIds: string[]
}

const VERIFIED = ['verificado_primaria', 'corroborado', 'parcialmente_verificado', 'declarado']
const fromClaims = (c: Candidate, sections: ClaimSection[], kw?: RegExp): EvidenceItem[] =>
  sections
    .flatMap((s) => (c.claims[s] ?? []) as Claim[])
    .filter((cl) => VERIFIED.includes(cl.status))
    .filter((cl) => !cl.sourceIds.every((id) => id === 'src-reglamento-elecciones' || id === 'src-ceuni-listas-definitivas'))
    .filter((cl) => !kw || kw.test(fold(cl.text)))
    .map((cl) => ({ text: cl.text, status: cl.status, sourceIds: cl.sourceIds }))

const events = (c: Candidate, kinds: string[]): EvidenceItem[] =>
  (timelines.find((t) => t.candidateId === c.id)?.events ?? [])
    .filter((e) => kinds.includes(e.kind))
    .map((e) => ({ text: `${e.title} · ${e.org} (${e.from.slice(0, 4)}${e.to && e.to !== 'ongoing' ? `–${e.to.slice(0, 4)}` : ''})`, status: e.status, sourceIds: e.sourceIds }))

const listProps = (c: Candidate, pred: (p: Proposal) => boolean = () => true): EvidenceItem[] =>
  proposals
    .filter((p) => (p.listId === c.listId && p.planId !== null) || p.candidateId === c.id)
    .filter(pred)
    .map((p) => ({ text: `Propuesta: ${p.title}`, status: p.status, sourceIds: [p.sourceId] }))

const hasMeasure = (p: Proposal) => Boolean(p.indicator || p.target || p.targetDate || p.budget)
const cat = (...cs: string[]) => (p: Proposal) => cs.includes(p.category)
const kw = (...ws: string[]) => new RegExp(ws.map(fold).join('|'))

/**
 * Evidencia registrada que corresponde a cada criterio. NO es un puntaje:
 * sólo reúne datos con fuente para que quien evalúa decida con hechos a la vista.
 */
export const EVIDENCE: Record<string, (c: Candidate) => EvidenceItem[]> = {
  'r-1': (c) => events(c, ['gestion_uni']).filter((e) => /rector|vicerrector|decan|director/i.test(e.text)),
  'r-2': (c) => {
    const d = degrees.find((x) => x.candidateId === c.id)
    return (['doctorado', 'maestria', 'titulo'] as const)
      .filter((k) => d?.[k]?.denominacion)
      .map((k) => ({ text: `${d![k]!.denominacion} · ${d![k]!.universidad}${d![k]!.anio ? ` (${d![k]!.anio})` : ''}`, status: d![k]!.status, sourceIds: [d![k]!.sourceId] }))
  },
  'r-3': (c) => events(c, ['gestion_uni', 'cargo_publico']),
  'r-4': (c) => fromClaims(c, ['proyectos', 'gestion'], kw('proyecto', 'convenio', 'implement', 'comision')),
  'r-5': (c) => fromClaims(c, ['investigacion']),
  'r-6': (c) => {
    const plan = plans.find((p) => p.listId === c.listId)
    const base = plan?.status === 'publicado' ? [{ text: `Plan publicado: ${plan.title}`, status: 'verificado_primaria', sourceIds: [] }] : []
    return [...base, ...listProps(c)]
  },
  'r-7': (c) => listProps(c, (p) => Boolean(p.budget || p.responsibleUnit)),
  'r-8': (c) => listProps(c, hasMeasure),
  'r-9': (c) => listProps(c, cat('Presupuesto y gestión institucional')),
  'r-10': (c) => listProps(c, cat('Transparencia')),
  'va-1': (c) => [...fromClaims(c, ['docencia']), ...events(c, ['docencia'])],
  'va-2': (c) => events(c, ['gestion_uni']).filter((e) => /academ|decan|escuela|admision|posgrado|cepre|vicerrector/i.test(fold(e.text))),
  'va-3': (c) => [...listProps(c, cat('Modernización curricular')), ...fromClaims(c, ['proyectos'], kw('curricul', 'plan de estudios'))],
  'va-4': (c) => listProps(c, cat('Calidad educativa')),
  'va-5': (c) => fromClaims(c, ['gestion', 'proyectos'], kw('acredit', 'abet', 'icacit', 'licenciamiento')),
  'va-6': (c) => listProps(c, cat('Formación docente')),
  'va-7': (c) => listProps(c, cat('Bienestar estudiantil', 'Inclusión y accesibilidad', 'Empleabilidad')),
  'va-8': (c) => listProps(c, (p) => hasMeasure(p) && ['Calidad educativa', 'Modernización curricular', 'Formación docente'].includes(p.category)),
  'va-9': (c) => listProps(c, cat('Calidad educativa', 'Modernización curricular', 'Formación docente', 'Bienestar estudiantil')),
  'vi-1': (c) => fromClaims(c, ['investigacion']),
  'vi-2': (c) => events(c, ['gestion_uni', 'cargo_publico']).filter((e) => /investig|prociencia|concytec|ipen|ingemmet|instituto/i.test(fold(e.text))),
  'vi-3': (c) => fromClaims(c, ['investigacion', 'proyectos'], kw('proyecto', 'investigador principal', 'concurso')),
  'vi-4': (c) => fromClaims(c, ['docencia'], kw('asesor', 'tesis', 'jurado')),
  'vi-5': (c) => fromClaims(c, ['investigacion', 'proyectos'], kw('s/ ', 'fondo', 'financ', 'subvencion', 'otorgad')),
  'vi-6': (c) => listProps(c, cat('Infraestructura y laboratorios')),
  'vi-7': (c) => [...listProps(c, cat('Innovación y transferencia tecnológica')), ...fromClaims(c, ['investigacion', 'proyectos'], kw('patente', 'transferencia'))],
  'vi-8': (c) => fromClaims(c, ['investigacion', 'formacion'], kw('alemania', 'francia', 'espana', 'brasil', 'mexico', 'rusia', 'ee. uu', 'invitado', 'internacional')),
  'vi-9': (c) => listProps(c, (p) => hasMeasure(p) && ['Investigación científica', 'Innovación y transferencia tecnológica'].includes(p.category)),
  'vi-10': (c) => listProps(c, (p) => /integridad|etica/.test(fold(`${p.title} ${p.description}`))),
}
