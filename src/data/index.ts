import candidatesJson from './candidates.json'
import listsJson from './electoral-lists.json'
import facultiesJson from './faculties.json'
import sourcesJson from './sources.json'
import plansJson from './government-plans.json'
import proposalsJson from './proposals.json'
import criteriaJson from './evaluation-criteria.json'
import evaluationsJson from './evaluations.json'
import siteJson from './site.json'
import type {
  Candidate,
  Criterion,
  ElectoralList,
  Evaluation,
  Faculty,
  GovernmentPlan,
  Proposal,
  SiteConfig,
  Source,
} from './types'

// Los JSON viajan dentro del bundle: el sitio funciona aunque falle cualquier fuente externa.
export const candidates = candidatesJson as Candidate[]
export const lists = listsJson as ElectoralList[]
export const faculties = facultiesJson as Faculty[]
export const sources = sourcesJson as Source[]
export const plans = plansJson as GovernmentPlan[]
export const proposals = proposalsJson as Proposal[]
export const criteria = criteriaJson as Criterion[]
export const evaluations = evaluationsJson as Evaluation[]
export const site = siteJson as SiteConfig

const byId = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]))
export const candidateById = byId(candidates)
export const listById = byId(lists)
export const facultyById = byId(faculties)
export const sourceById = byId(sources)
export const planById = byId(plans)

export const candidateBySlug = new Map(candidates.map((c) => [c.slug, c]))

export function membersOf(listId: string): Candidate[] {
  return (listById.get(listId)?.members ?? []).map((id) => candidateById.get(id)!).sort((a, b) => a.order - b.order)
}

/** Propuestas atribuidas a la lista (plan o exposición del candidato a rector). Excluye las personales de integrantes. */
export function proposalsOf(listId: string): Proposal[] {
  return proposals.filter((p) => p.listId === listId && p.planId !== null)
}

export const listProposals = proposals.filter((p) => p.planId !== null)
export const personalProposals = proposals.filter((p) => p.planId === null)
