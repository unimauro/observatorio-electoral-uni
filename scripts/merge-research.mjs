// Integra los borradores research/agent-*.json en src/data (tras revisión humana).
// Uso: node scripts/merge-research.mjs research/agent-x.json [...]
// - No sobrescribe fuentes ni afirmaciones existentes: agrega sólo lo nuevo (por id / texto).
// - Rechaza afirmaciones sin fuente, con candidato o sección inválidos, o con patrones de datos personales.
import { readFileSync, writeFileSync } from 'node:fs'

const file = (f) => new URL(`../src/data/${f}`, import.meta.url)
const read = (f) => JSON.parse(readFileSync(file(f), 'utf8'))
const write = (f, d) => writeFileSync(file(f), JSON.stringify(d, null, 2) + '\n')

const candidates = read('candidates.json')
const sources = read('sources.json')
const proposals = read('proposals.json')
const plans = read('government-plans.json')
const site = read('site.json')
for (const c of candidates) { c.claims.proceso ??= []; c.claims.control ??= [] }
const byId = new Map(candidates.map((c) => [c.id, c]))
const SECTIONS = ['formacion', 'docencia', 'investigacion', 'gestion', 'proyectos', 'propuestas', 'declaraciones', 'proceso', 'control']
const PII = /(linkedin\.com|facebook\.com\/[a-z]|\bDNI\b|\b\d{8}\b(?!-)|@[a-z0-9-]+\.[a-z]|\b9\d{8}\b|domicilio|afiliad[oa] a|partido pol[ií]tico)/i

const report = { added: {}, rejected: [] }
const bump = (k) => (report.added[k] = (report.added[k] ?? 0) + 1)
const reject = (why, x) => report.rejected.push(`${why}: ${JSON.stringify(x).slice(0, 140)}`)

for (const path of process.argv.slice(2)) {
  const r = JSON.parse(readFileSync(path, 'utf8'))
  const D = r.consultedAt ?? new Date().toISOString().slice(0, 10)

  for (const s of r.sources ?? []) {
    if (sources.some((x) => x.id === s.id)) continue
    if (!s.url?.startsWith('https://') && !s.landingUrl?.startsWith('https://')) { reject('fuente sin https', s); continue }
    if (PII.test(`${s.title} ${s.notes} ${s.locator}`)) { reject('fuente con posible PII', s); continue }
    sources.push({ landingUrl: null, identifier: null, publishedAt: null, consultedAt: D, candidateIds: [], notes: '', ...s })
    bump('sources')
  }
  const srcIds = new Set(sources.map((s) => s.id))

  for (const cl of r.claims ?? []) {
    const c = byId.get(cl.candidateId)
    if (!c || !SECTIONS.includes(cl.section)) { reject('candidato/sección inválidos', cl); continue }
    if (!cl.sourceIds?.length || cl.sourceIds.some((id) => !srcIds.has(id))) { reject('fuente inexistente', cl); continue }
    if (PII.test(cl.text)) { reject('posible PII', cl); continue }
    if (c.claims[cl.section].some((x) => x.text === cl.text)) continue
    c.claims[cl.section].push({ text: cl.text, status: cl.status, sourceIds: cl.sourceIds, kind: cl.kind ?? 'hecho' })
    c.meta.lastReviewed = D
    for (const id of cl.sourceIds) {
      const s = sources.find((x) => x.id === id)
      if (s && !s.candidateIds.includes(c.id)) s.candidateIds.push(c.id)
    }
    bump('claims')
  }

  for (const p of r.proposals ?? []) {
    if (!srcIds.has(p.sourceId)) { reject('propuesta sin fuente', p); continue }
    const listN = p.listId.split('-')[1]
    const n = proposals.filter((x) => x.listId === p.listId && x.origin === p.origin).length + 1
    if (proposals.some((x) => x.listId === p.listId && x.title === p.title)) continue
    proposals.push({ id: `prop-l${listN}-${p.origin}-${n}`, planId: `plan-lista-${listN}`, candidateId: null, ...p })
    bump('proposals')
  }

  for (const l of r.leads ?? []) {
    const c = byId.get(l.candidateId)
    if (!c) continue
    if (c.researchLeads.some((x) => x.profileId === l.profileId)) continue
    if (PII.test(l.profileId)) { reject("pista de red social/PII", l); continue }
    c.researchLeads.push({ citedByCount: null, consultedAt: D, orcid: null, worksCount: null, ...l })
    bump('leads')
  }

  for (const p of r.pending ?? []) {
    const c = byId.get(p.candidateId)
    if (!c || c.pendingSources.includes(p.text)) continue
    c.pendingSources.push(p.text)
    bump('pending')
  }

  const su = r.siteUpdates ?? {}
  if (su.results) { site.results = su.results; bump('results') }
  if (su.calendar?.length) { site.calendar = su.calendar; bump('calendar') }
  for (const pl of su.plans ?? []) {
    const plan = plans.find((x) => x.listId === pl.listId)
    if (plan && pl.url?.startsWith('https://')) { Object.assign(plan, pl); bump('plans') }
  }
}

write('candidates.json', candidates)
write('sources.json', sources)
write('proposals.json', proposals)
write('government-plans.json', plans)
write('site.json', site)
console.log(JSON.stringify(report, null, 2))
