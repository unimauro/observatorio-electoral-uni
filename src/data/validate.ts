import {
  CLAIM_SECTIONS,
  PROPOSAL_CATEGORIES,
  ROLE_BY_ORDER,
  ROLES,
  SOURCE_TYPE_LABEL,
  VERIFICATION_STATUSES,
  type Candidate,
  type Criterion,
  type ElectoralList,
  type Evaluation,
  type Faculty,
  type GovernmentPlan,
  type Proposal,
  type Source,
} from './types'

export interface Dataset {
  candidates: Candidate[]
  lists: ElectoralList[]
  faculties: Faculty[]
  sources: Source[]
  plans: GovernmentPlan[]
  proposals: Proposal[]
  criteria: Criterion[]
  evaluations: Evaluation[]
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** Devuelve la lista de problemas encontrados; vacía = datos válidos. */
export function validateDataset(d: Dataset): string[] {
  const errors: string[] = []
  const err = (m: string) => errors.push(m)
  const dupes = (label: string, ids: string[]) => {
    const seen = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) err(`${label}: id duplicado "${id}"`)
      seen.add(id)
    }
  }
  dupes('candidates', d.candidates.map((c) => c.id))
  dupes('candidates.slug', d.candidates.map((c) => c.slug))
  dupes('lists', d.lists.map((l) => l.id))
  dupes('sources', d.sources.map((s) => s.id))
  dupes('plans', d.plans.map((p) => p.id))
  dupes('proposals', d.proposals.map((p) => p.id))
  dupes('criteria', d.criteria.map((c) => c.id))

  // Dos registros con el mismo nombre normalizado podrían ser la misma persona cargada dos veces.
  const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
  dupes('candidates.name', d.candidates.map((c) => norm(c.name)))

  const sourceIds = new Set(d.sources.map((s) => s.id))
  const listIds = new Set(d.lists.map((l) => l.id))
  const facultyIds = new Set(d.faculties.map((f) => f.id))
  const candidateIds = new Set(d.candidates.map((c) => c.id))
  const planIds = new Set(d.plans.map((p) => p.id))
  const statuses = new Set<string>(VERIFICATION_STATUSES)
  const checkSources = (where: string, ids: string[]) => {
    for (const id of ids) if (!sourceIds.has(id)) err(`${where}: fuente inexistente "${id}"`)
  }

  for (const c of d.candidates) {
    const w = `candidato ${c.id}`
    if (!listIds.has(c.listId)) err(`${w}: lista inexistente ${c.listId}`)
    if (!facultyIds.has(c.facultyId)) err(`${w}: facultad inexistente ${c.facultyId}`)
    if (!ROLES.includes(c.role)) err(`${w}: cargo inválido ${c.role}`)
    if (ROLE_BY_ORDER[c.order] !== c.role) err(`${w}: el orden ${c.order} no corresponde al cargo ${c.role}`)
    if (!c.name.trim()) err(`${w}: nombre vacío`)
    if (c.name.normalize('NFC') !== c.name) err(`${w}: nombre no normalizado en NFC`)
    if (!ISO.test(c.meta.importedAt) || !ISO.test(c.meta.lastReviewed)) err(`${w}: fechas de metadatos inválidas`)
    for (const [k, v] of Object.entries(c.verification)) {
      if (!statuses.has(v.status)) err(`${w}: estado inválido en verificación ${k}`)
      checkSources(`${w}.verification.${k}`, v.sourceIds)
    }
    for (const s of CLAIM_SECTIONS) {
      for (const claim of c.claims[s] ?? []) {
        if (!statuses.has(claim.status)) err(`${w}.${s}: estado inválido`)
        if (claim.sourceIds.length === 0) err(`${w}.${s}: afirmación sin fuente`)
        checkSources(`${w}.${s}`, claim.sourceIds)
      }
    }
    for (const corr of c.corrections) checkSources(`${w}.corrections`, corr.sourceIds)
    if (c.photo && (!c.photo.credit || !c.photo.license)) err(`${w}: foto sin crédito o licencia`)
  }

  for (const l of d.lists) {
    const members = d.candidates.filter((c) => c.listId === l.id)
    if (members.length !== 3) err(`lista ${l.id}: tiene ${members.length} integrantes (se esperan 3)`)
    for (const r of ROLES) {
      if (members.filter((m) => m.role === r).length !== 1) err(`lista ${l.id}: no tiene exactamente un ${r}`)
    }
    for (const id of l.members) if (!candidateIds.has(id)) err(`lista ${l.id}: miembro inexistente ${id}`)
    if (!planIds.has(l.planId)) err(`lista ${l.id}: plan inexistente ${l.planId}`)
    checkSources(`lista ${l.id}`, l.verification.sourceIds)
  }

  for (const s of d.sources) {
    if (!(s.type in SOURCE_TYPE_LABEL)) err(`fuente ${s.id}: tipo inválido ${s.type}`)
    if (!statuses.has(s.status)) err(`fuente ${s.id}: estado inválido`)
    if (!s.url && !s.landingUrl) err(`fuente ${s.id}: sin URL ni página de referencia`)
    for (const u of [s.url, s.landingUrl]) if (u && !/^https:\/\//.test(u)) err(`fuente ${s.id}: URL no https ${u}`)
    if (!ISO.test(s.consultedAt)) err(`fuente ${s.id}: fecha de consulta inválida`)
    for (const id of s.candidateIds) if (!candidateIds.has(id)) err(`fuente ${s.id}: candidato inexistente ${id}`)
  }

  for (const p of d.plans) {
    if (!listIds.has(p.listId)) err(`plan ${p.id}: lista inexistente`)
    if (p.status === 'publicado' && !p.url) err(`plan ${p.id}: publicado sin URL`)
  }

  for (const p of d.proposals) {
    if (!listIds.has(p.listId)) err(`propuesta ${p.id}: lista inexistente`)
    if (!planIds.has(p.planId)) err(`propuesta ${p.id}: plan inexistente`)
    if (!(PROPOSAL_CATEGORIES as readonly string[]).includes(p.category)) err(`propuesta ${p.id}: categoría inválida`)
    checkSources(`propuesta ${p.id}`, [p.sourceId])
    if (!['plan', 'debate', 'declaracion_publica'].includes(p.origin)) err(`propuesta ${p.id}: origen inválido`)
    if (p.candidateId && !candidateIds.has(p.candidateId)) err(`propuesta ${p.id}: candidato inexistente`)
    if (p.origin === 'plan' && d.plans.find((x) => x.id === p.planId)?.status !== 'publicado') err(`propuesta ${p.id}: origen plan sin plan publicado`)
  }

  const criterionIds = new Set(d.criteria.map((c) => c.id))
  for (const c of d.criteria) if (c.weight < 0) err(`criterio ${c.id}: peso negativo`)
  for (const e of d.evaluations) {
    if (!candidateIds.has(e.candidateId)) err(`evaluación: candidato inexistente ${e.candidateId}`)
    if (!criterionIds.has(e.criterionId)) err(`evaluación: criterio inexistente ${e.criterionId}`)
    if (typeof e.score === 'number' && (e.sourceIds.length === 0 || !e.justification.trim()))
      err(`evaluación ${e.candidateId}/${e.criterionId}: puntuación sin justificación o evidencia`)
    checkSources(`evaluación ${e.candidateId}`, e.sourceIds)
  }

  return errors
}

/** Valida referencias de site.json (resultados y cronograma) contra el catálogo. */
export function validateSite(site: { results?: { source: string | null; lists: { listId: string }[] }; calendar?: { sourceId: string }[] }, d: Pick<Dataset, 'sources' | 'lists'>): string[] {
  const errors: string[] = []
  const sourceIds = new Set(d.sources.map((s) => s.id))
  const listIds = new Set(d.lists.map((l) => l.id))
  if (site.results?.source && !sourceIds.has(site.results.source)) errors.push(`resultados: fuente inexistente ${site.results.source}`)
  for (const r of site.results?.lists ?? []) if (!listIds.has(r.listId)) errors.push(`resultados: lista inexistente ${r.listId}`)
  for (const e of site.calendar ?? []) if (!sourceIds.has(e.sourceId)) errors.push(`cronograma: fuente inexistente ${e.sourceId}`)
  return errors
}
