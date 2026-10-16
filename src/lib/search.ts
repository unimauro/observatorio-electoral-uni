/** Quita tildes y diacríticos, pasa a minúsculas y colapsa espacios. "Páuyac" → "pauyac". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Coincidencia por palabras: cada término de la consulta debe aparecer en el texto.
 * Sólo compara texto; nunca une registros: dos personas con nombres parecidos siguen siendo dos resultados.
 */
export function matches(haystack: string, query: string): boolean {
  const q = fold(query)
  if (!q) return true
  const h = fold(haystack)
  return q.split(' ').every((t) => h.includes(t))
}
