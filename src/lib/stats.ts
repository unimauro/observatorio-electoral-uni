import { CLAIM_SECTIONS, ROLES, type Candidate, type ClaimSection, type Source } from '../data/types'

const VERIFIED = new Set(['verificado_primaria', 'corroborado'])

export function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const it of items) out[key(it)] = (out[key(it)] ?? 0) + 1
  return out
}

/** Un perfil está "verificado" sólo si identidad y cargo tienen fuente primaria y tiene al menos un dato verificado propio. */
export function isProfileVerified(c: Candidate): boolean {
  const idOk = VERIFIED.has(c.verification.name.status) && VERIFIED.has(c.verification.role.status)
  const anyOwn = CLAIM_SECTIONS.some((s) => c.claims[s].some((cl) => VERIFIED.has(cl.status)))
  return idOk && anyOwn
}

export function hasVerifiedIn(c: Candidate, section: ClaimSection): boolean {
  return c.claims[section].some((cl) => VERIFIED.has(cl.status))
}

export function hasAnyIn(c: Candidate, section: ClaimSection): boolean {
  return c.claims[section].length > 0
}

/** Registros con algún campo o afirmación pendiente/controvertido. */
export function pendingCount(cands: Candidate[]): number {
  return cands.filter(
    (c) =>
      Object.values(c.verification).some((v) => !VERIFIED.has(v.status)) ||
      CLAIM_SECTIONS.some((s) => c.claims[s].some((cl) => !VERIFIED.has(cl.status))),
  ).length
}

export function roleCounts(cands: Candidate[]) {
  return ROLES.map((r) => ({ role: r, count: cands.filter((c) => c.role === r).length }))
}

export function sourcesForList(sources: Source[], memberIds: string[]): Source[] {
  return sources.filter((s) => s.candidateIds.some((id) => memberIds.includes(id)))
}
