import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, RotateCcw } from 'lucide-react'
import { candidates, criteria } from '../data'
import { ROLE_LABEL, ROLES, type Candidate, type Role, type ScoreValue } from '../data/types'
import { computeIndex, SCORE_LABEL } from '../lib/score'
import { EVIDENCE } from '../lib/evidence'
import { PageHeader, Section, StatusBadge } from '../components/ui'

type Scores = Record<string, Record<string, ScoreValue>> // candidateId -> criterionId -> score

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* sin almacenamiento: la evaluación vive sólo en esta pestaña */
  }
}

const OPTIONS: [string, string][] = [
  ['', '—'],
  ['0', '0'],
  ['1', '1'],
  ['2', '2'],
  ['3', '3'],
  ['4', '4'],
  ['5', '5'],
  ['insuficiente', 'Insuf.'],
  ['no_aplica', 'N/A'],
]

export default function Matrix() {
  const [role, setRole] = useState<Role>('rector')
  const [weights, setWeights] = useState<Record<string, number>>(() => load('oeu-weights', {}))
  const [scores, setScores] = useState<Scores>(() => load('oeu-scores', {}))
  const [open, setOpen] = useState<{ c: string; k: string } | null>(null)
  useEffect(() => save('oeu-weights', weights), [weights])
  useEffect(() => save('oeu-scores', scores), [scores])

  const crit = criteria.filter((c) => c.role === role)
  const pool = candidates.filter((c) => c.role === role)
  const totalW = crit.reduce((s, c) => s + (weights[c.id] ?? c.weight), 0)
  const scoreOf = (cid: string) => (k: string): ScoreValue => scores[cid]?.[k] ?? 'no_evaluado'
  const setScore = (cid: string, k: string, v: string) =>
    setScores((s) => {
      const row = { ...(s[cid] ?? {}) }
      if (!v) delete row[k]
      else row[k] = (/^\d$/.test(v) ? Number(v) : v) as ScoreValue
      return { ...s, [cid]: row }
    })

  const evidence = useMemo(() => {
    const m: Record<string, Record<string, ReturnType<(typeof EVIDENCE)[string]>>> = {}
    for (const c of pool) {
      m[c.id] = {}
      for (const k of crit) m[c.id][k.id] = EVIDENCE[k.id]?.(c) ?? []
    }
    return m
  }, [pool, crit])

  const csv = () => {
    const head = ['candidato', 'lista', ...crit.map((k) => k.name), 'indice', 'cobertura']
    const rows = pool.map((c) => {
      const r = computeIndex(crit, scoreOf(c.id), weights)
      return [c.name, c.listId.split('-')[1], ...crit.map((k) => String(scoreOf(c.id)(k.id))), r.index == null ? '' : r.index.toFixed(1), (r.coverage * 100).toFixed(0) + '%']
    })
    const text = [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }))
    a.download = `mi-evaluacion-${role}.csv`
    a.click()
  }

  const openCand: Candidate | undefined = open ? pool.find((c) => c.id === open.c) : undefined
  const openCrit = open ? crit.find((k) => k.id === open.k) : undefined

  return (
    <div>
      <PageHeader kicker="Matriz de evaluación" title="Tu evaluación, con evidencia a la vista">
        El observatorio <strong>no publica puntajes</strong> de candidatos: sería una opinión presentada como dato. Esta matriz es tuya. Puntúa cada criterio de 0
        a 5 mirando la evidencia registrada (el número en cada celda; haz clic para verla), ajusta los pesos y mira cómo cambia tu índice. Se guarda sólo en tu
        navegador y puedes descargarla.
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Cargo">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={role === r}
            onClick={() => { setRole(r); setOpen(null) }}
            className={`rounded border-2 px-3 py-1.5 text-sm font-semibold ${role === r ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
        <button type="button" onClick={csv} className="btn ml-auto text-xs"><Download size={14} aria-hidden /> Descargar CSV</button>
        <button
          type="button"
          onClick={() => setScores((s) => Object.fromEntries(Object.entries(s).filter(([cid]) => !pool.some((c) => c.id === cid))))}
          className="btn text-xs"
        >
          <RotateCcw size={14} aria-hidden /> Limpiar puntajes
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="border-collapse text-xs" style={{ minWidth: 260 + crit.length * 92 }}>
          <thead>
            <tr className="border-b-2 border-ink align-bottom">
              <th className="sticky left-0 z-10 w-52 bg-paper py-2 pr-2 text-left">Candidatura</th>
              {crit.map((k) => (
                <th key={k.id} className="w-[88px] px-1 py-2 text-left font-semibold leading-tight" title={`${k.name}: ${k.description} Evidencia: ${k.evidenceRequired}`}>
                  {k.name}
                  <span className="block font-mono font-normal text-muted">peso {weights[k.id] ?? k.weight}</span>
                </th>
              ))}
              <th className="px-2 py-2 text-right">Tu índice</th>
            </tr>
          </thead>
          <tbody>
            {pool.map((c) => {
              const r = computeIndex(crit, scoreOf(c.id), weights)
              return (
                <tr key={c.id} className="border-b border-line">
                  <th scope="row" className="sticky left-0 z-10 bg-paper py-2 pr-2 text-left font-normal">
                    <Link className="link font-semibold" to={`/candidatos/${c.slug}`}>{c.name}</Link>
                    <span className="block text-muted">Lista {c.listId.split('-')[1]}</span>
                  </th>
                  {crit.map((k) => {
                    const ev = evidence[c.id]?.[k.id] ?? []
                    const isOpen = open?.c === c.id && open?.k === k.id
                    const v = scores[c.id]?.[k.id]
                    return (
                      <td key={k.id} className={`px-1 py-1.5 ${isOpen ? 'bg-signal/30' : ''}`}>
                        <div className="flex items-center gap-1">
                          <select
                            aria-label={`Puntaje de ${c.name} en ${k.name}`}
                            className="w-14 rounded border border-line bg-card px-1 py-0.5 text-xs"
                            value={v === undefined ? '' : String(v)}
                            onChange={(e) => setScore(c.id, k.id, e.target.value)}
                          >
                            {OPTIONS.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : { c: c.id, k: k.id })}
                            aria-expanded={isOpen}
                            aria-label={`${ev.length} evidencias de ${c.name} para ${k.name}`}
                            className={`min-w-6 rounded-full border px-1.5 font-mono text-[11px] ${ev.length ? 'border-ink' : 'border-line text-muted'}`}
                          >
                            {ev.length}
                          </button>
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-2 py-2 text-right">
                    {r.index == null ? <span className="italic text-muted">Sin puntuar</span> : <span className="font-mono text-sm font-semibold">{r.index.toFixed(0)}</span>}
                    <span className="block text-[10px] text-muted">{r.scored}/{r.applicable} · {(r.coverage * 100).toFixed(0)}%</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {open && openCand && openCrit && (
        <section className="card mt-3 border-ink p-4" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="kicker">Evidencia registrada · {openCrit.name}</p>
              <p className="font-semibold">{openCand.name}</p>
              <p className="text-xs text-muted">{openCrit.description} Evidencia esperada: {openCrit.evidenceRequired}.</p>
            </div>
            <button type="button" className="link text-xs" onClick={() => setOpen(null)}>Cerrar</button>
          </div>
          {evidence[openCand.id][openCrit.id].length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {evidence[openCand.id][openCrit.id].map((e, i) => (
                <li key={i} className="border-l-4 border-line pl-3">
                  {e.text} <StatusBadge status={e.status as never} short />
                  {e.sourceIds.slice(0, 2).map((id) => <Link key={id} to={`/fuentes#${id}`} className="ml-1 text-[11px] text-muted underline decoration-dotted">fuente</Link>)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm italic text-muted">
              No hay evidencia registrada para este criterio. Eso no significa que no exista: considera "Insuf." (información insuficiente) en lugar de 0.
            </p>
          )}
          <p className="mt-3 text-[11px] text-muted">
            Evidencia reunida automáticamente desde datos con fuente del perfil (cargos, grados, investigación, propuestas). No es un puntaje. <Link className="underline" to={`/candidatos/${openCand.slug}`}>Ver perfil completo</Link>
          </p>
        </section>
      )}

      <Section title="Pesos de los criterios">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Cuánto pesa cada criterio en tu índice ({ROLE_LABEL[role]}).</p>
            <button type="button" className="link text-xs" onClick={() => setWeights({})}>Restablecer pesos</button>
          </div>
          <ul className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
            {crit.map((c) => {
              const w = weights[c.id] ?? c.weight
              return (
                <li key={c.id}>
                  <label className="block text-sm">
                    <span className="flex justify-between gap-2">
                      <span className="font-medium">{c.name}</span>
                      <span className="font-mono text-xs">peso {w} · {totalW ? Math.round((w / totalW) * 100) : 0}%</span>
                    </span>
                    <input type="range" min={0} max={5} step={1} value={w} onChange={(e) => setWeights({ ...weights, [c.id]: Number(e.target.value) })} className="mt-1 w-full accent-[rgb(var(--ink))]" />
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      </Section>

      <Section title="Fórmula">
        <div className="card p-4 text-sm">
          <p className="font-mono">Índice = Σ (peso × puntaje) ÷ (5 × Σ peso de criterios puntuados) × 100</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            <li>Sólo entran los criterios con puntaje numérico (0–5). "—" (sin puntuar) e "Insuf." no cuentan como 0: se excluyen.</li>
            <li>La <strong>cobertura</strong> (debajo del índice) dice qué parte del peso total puntuaste. Un índice con poca cobertura dice poco.</li>
            <li>"N/A" (no aplica) sale también del cálculo de cobertura.</li>
          </ul>
          <p className="mt-3 font-semibold">Escala</p>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {Object.entries(SCORE_LABEL).map(([k, v]) => <li key={k}><span className="font-mono">{k.replace('_', ' ')}</span>: {v}</li>)}
          </ul>
        </div>
      </Section>
    </div>
  )
}
