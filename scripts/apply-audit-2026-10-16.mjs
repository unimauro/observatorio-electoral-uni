// Aplica las correcciones de la auditoría adversarial del 16-10-2026 (research/agent-auditor.json).
// Cada cambio falla en voz alta si el texto a corregir no existe, para no "corregir" en silencio.
import { readFileSync, writeFileSync } from 'node:fs'

const D = '2026-10-16'
const file = (f) => new URL(`../src/data/${f}`, import.meta.url)
const read = (f) => JSON.parse(readFileSync(file(f), 'utf8'))
const write = (f, d) => writeFileSync(file(f), JSON.stringify(d, null, 2) + '\n')
const candidates = read('candidates.json')
const sources = read('sources.json')
const proposals = read('proposals.json')
const faculties = read('faculties.json')
const C = new Map(candidates.map((c) => [c.id, c]))
const S = new Map(sources.map((s) => [s.id, s]))
const log = []

function claim(cid, section, startsWith) {
  const c = C.get(cid)
  const cl = c.claims[section].find((x) => x.text.startsWith(startsWith))
  if (!cl) throw new Error(`No encontrado: ${cid}.${section} "${startsWith}"`)
  c.meta.lastReviewed = D
  return cl
}
function edit(cid, section, startsWith, patch) {
  Object.assign(claim(cid, section, startsWith), patch)
  log.push(`${cid}.${section}: ${startsWith.slice(0, 40)}`)
}
function remove(cid, section, startsWith) {
  const c = C.get(cid)
  const cl = claim(cid, section, startsWith)
  c.claims[section] = c.claims[section].filter((x) => x !== cl)
  log.push(`eliminada ${cid}.${section}: ${startsWith.slice(0, 40)}`)
}
function add(cid, section, text, status, sourceIds, kind) {
  const c = C.get(cid)
  for (const id of sourceIds) if (!S.has(id)) throw new Error(`Fuente inexistente ${id}`)
  if (!c.claims[section].some((x) => x.text === text)) c.claims[section].push({ text, status, sourceIds, kind })
  for (const id of sourceIds) if (!S.get(id).candidateIds.includes(cid)) S.get(id).candidateIds.push(cid)
  c.meta.lastReviewed = D
  log.push(`agregada ${cid}.${section}`)
}

// 1. Facultades: la publicación provisional del CEUNI (22-09-2026) es pública y trae la columna FACULTAD.
Object.assign(S.get('src-ceuni-tabla-facultades'), {
  title: 'Publicación provisional de candidaturas – I. Rector y vicerrectores (con columna FACULTAD)',
  url: 'https://uniedupe93141-my.sharepoint.com/:f:/g/personal/inscripcionceuni_uni_edu_pe/IgDacJ_9ird3R5txnoKINFjFAXh7bpd-RO0rXJLEfCORqMg?e=OA0dI1',
  landingUrl: 'https://www.ceuni.uni.edu.pe/eleccion-de-autoridades-y-elecciones-generales-2026/',
  publishedAt: '2026-09-22',
  consultedAt: D,
  identifier: 'Listas provicionales 22.09 publicación[R].pdf (carpeta LISTAS PROVISIONALES)',
  status: 'verificado_primaria',
  notes: 'Carpeta pública del CEUNI (botón "Publicación provisional de listas"). Las 27 facultades coinciden con las registradas. Consigna "CHIRIF" y el orden "RAYMUNDO ARNAO RONDAN ILDEFONZO". Contiene códigos de docentes que el observatorio no reproduce.',
})
for (const c of candidates) {
  c.verification.faculty = { status: 'verificado_primaria', sourceIds: ['src-ceuni-tabla-facultades'], note: 'Columna FACULTAD de la publicación provisional del CEUNI (22-09-2026).' }
}
for (const f of faculties) f.nameStatus = 'verificado_primaria'

// 2. Prensa: fuente secundaria, no primaria.
for (const s of sources) if (s.type === 'prensa' && s.status === 'verificado_primaria') s.status = 'parcialmente_verificado'

// 3. Perú21: la URL original da 403; se usa la copia archivada.
for (const s of sources) {
  if (s.url?.includes('peru21.pe') && s.landingUrl?.includes('web.archive.org')) {
    ;[s.url, s.landingUrl] = [s.landingUrl, s.url]
    s.notes = `${s.notes ?? ''} URL principal: copia en Internet Archive (la original responde 403).`.trim()
  }
}

// 4. Afirmaciones.
edit('c-1-1', 'declaraciones', 'Según RPP, propuso cambiar el modelo', { text: 'Según RPP, propuso "cambiar el paradigma" educativo tradicional y eliminar las carpetas (pupitres) para reemplazarlas por equipos tecnológicos que permitan aplicar la teoría de manera directa.' })
edit('c-1-1', 'declaraciones', 'Según RPP, sostuvo que el presupuesto', { text: 'Según RPP, sostuvo que el presupuesto del Estado sólo cubre sueldos y propuso alianzas con empresas y embajadas para renovar laboratorios que, según dijo, tienen 50 años de antigüedad.' })
remove('c-1-1', 'gestion', 'Figura como decano de la Facultad de Ingeniería Eléctrica y Electrónica ("Dean')
const padillaRector = claim('c-2-1', 'gestion', 'Figura como rector de la UNI en documentos institucionales')
padillaRector.sourceIds.push('src-rpp-2009-padilla')
remove('c-2-1', 'gestion', 'Rector de la UNI en mayo de 2009')
edit('c-2-3', 'docencia', 'Profesor principal de la Facultad de Ingeniería Química', { text: 'Profesor de la Facultad de Ingeniería Química y Textil de la UNI desde 1992; su ORCID lo registra como profesor principal. Declara además docencia de posgrado en otras universidades.' })
edit('c-4-3', 'docencia', 'Docente principal de la UNI desde 1995', { text: 'Docente de la UNI desde 1995; su ORCID lo registra en la categoría principal.' })
edit('c-9-1', 'docencia', 'Docente principal de la Facultad', { text: 'Docente de la Facultad de Ingeniería Económica, Estadística y Ciencias Sociales de la UNI desde 2009; su ORCID lo registra como docente principal.' })
{
  const cl = claim('c-2-3', 'formacion', 'Ingeniero químico (UNI)')
  cl.text += ' Registro ORCID a nombre de "Cesar Osorio" (FIQT-UNI), que OpenAlex enlaza al nombre completo.'
}
{
  const cl = claim('c-3-3', 'formacion', 'Docteur ès sciences')
  cl.text += ' Registro ORCID a nombre de "Modesto Montoya" (FC-UNI), que OpenAlex enlaza al nombre completo.'
}
edit('c-3-3', 'investigacion', 'Investigador RENACYT Nivel II', { text: 'Investigador RENACYT Nivel II (calificaciones 2022 y 2024 registradas por CONCYTEC en su ORCID).', status: 'corroborado', kind: 'hecho' })
add('c-3-3', 'investigacion', 'Declara en ORCID estancias como científico invitado en GSI (Alemania), IPN Orsay (Francia), Carnegie Mellon (EE. UU.) y Forschungszentrum Jülich entre 1983 y 1988.', 'declarado', ['src-orcid-c-3-3'], 'declaracion')
edit('c-4-1', 'declaraciones', 'En entrevista con Caretas', { text: 'En entrevista con Caretas calificó de "puerta cerrada" el debate organizado por el Comité Electoral porque, según él, cada plancha sólo habría podido invitar a cinco personas.' })
edit('c-4-1', 'formacion', 'Estudió Ingeniería Económica', { text: 'Estudió Ingeniería Económica en la UNI, realizó estudios de posgrado en la Universidad Sorbonne Nouvelle–París 3 y un doctorado en Ciencias Políticas y Relaciones Internacionales en la Universidad Ricardo Palma, según Caretas ("de acuerdo con la información biográfica disponible").', kind: 'hecho_inferido' })
edit('c-4-1', 'declaraciones', 'Según RPP, afirmó que la UNI pierde ingresos', { text: 'Según RPP, afirmó que la UNI pierde ingresos al no gestionar adecuadamente concesiones como la del metro.' })
edit('c-4-1', 'gestion', 'Decano de la Facultad de Ingeniería Económica', { text: 'Figura como decano de la FIECS en la portadilla de la Memoria Institucional 2012 y en el Plan Operativo Institucional 2014; los documentos no indican el periodo (la lista de la Asamblea Universitaria 2012-II de la misma Memoria consigna a otro decano a. i.).', status: 'parcialmente_verificado' })
edit('c-4-2', 'investigacion', 'OpenAlex indexa al menos cuatro', { status: 'parcialmente_verificado', text: 'OpenAlex indexa ponencias IEEE ANDESCON (2016 y 2018) sobre modelado de máquinas de inducción y generadores de doble alimentación con su nombre y afiliación UNI. La consulta también devuelve obras de otra persona ("G. Caceres"), por lo que falta confirmar obra por obra.' })
edit('c-4-3', 'gestion', 'Director de la Sección de Posgrado', { text: 'Director de Posgrado (FIQT-UNI, 2009–2016 y 2021–2022) y presidente del Comité Electoral de la UNI en 2019, según la biografía de su ORCID.' })
edit('c-6-1', 'investigacion', 'Autor de "Diseño de Elementos', { text: 'Autor de "Diseño de Elementos de Máquinas I y II" (3.ª ed., 2014), citado en un sílabo de la URP donde él figura como docente, y de "Tablas de diseño de elementos de máquinas", citado en el sílabo UNI-FIM MC401. Las bibliografías consignan sólo "Alva, F." / "Fortunato Alva".' })
edit('c-8-1', 'gestion', 'Director ejecutivo del Programa Nacional', { text: 'Se desempeñó como director ejecutivo de PROCIENCIA; así figura en una agenda de la Comisión de Ciencia del Congreso (la página no indica el año) y ProActivo (feb. 2026) lo refiere en pasado.', sourceIds: ['src-congreso-ciencia-35', 'src-proactivo-rodriguez-2026'] })
edit('c-2-2', 'docencia', 'La ficha de la plana docente FIIS', { text: 'La ficha de la plana docente FIIS lo registra como profesor nombrado, categoría principal, a tiempo completo. La ficha consigna título de Ingeniero de Sistemas y grado de maestro; el Repositorio UNI registra título de Ingeniero Industrial (1993) y doctorado (2021): hay una discrepancia sin aclarar.', status: 'parcialmente_verificado' })
{
  const cl = claim('c-5-3', 'formacion', 'Declara en ORCID maestría en Física')
  cl.text = 'Declara en ORCID maestría en Física (Universidade Federal de Mato Grosso, 2006–2009) y doctorado (Universidade Federal de Goiás, 2009–2014). El VRI-UNI lo describe como "Doctor en Ciencias, especialidad Física. Universidad Nacional de Ingeniería", lo que no coincide con la institución declarada en ORCID.'
  cl.status = 'parcialmente_verificado'
  log.push('c-5-3.formacion: discrepancia explícita')
}
edit('c-3-1', 'formacion', 'Ingeniero geólogo por la UNI', { status: 'parcialmente_verificado' })
for (const c of candidates) {
  for (const sec of Object.keys(c.claims)) {
    for (const cl of c.claims[sec]) {
      if (cl.sourceIds.some((id) => id.startsWith('src-vr-repouni')) && cl.text.startsWith('En el Repositorio UNI figura')) {
        cl.text = cl.text.replace('En el Repositorio UNI figura', 'Según una búsqueda en el Repositorio UNI (16-10-2026), figura')
        log.push(`${c.id}.${sec}: conteo fechado`)
      }
    }
  }
}
const mosq = claim('c-7-2', 'investigacion', 'El registro ORCID a nombre de "Luis Mosquera"')
mosq.text = 'Investigador RENACYT Nivel V (2022) y Nivel IV (2024), calificaciones registradas por CONCYTEC en su ORCID (a nombre de "Luis Mosquera", FIC-UNI), que OpenAlex enlaza a "Luis Alberto Mosquera Leiva".'
mosq.status = 'corroborado'
add('c-7-2', 'gestion', 'Presidente del Tribunal de Honor Universitario, según el acta del Consejo Universitario N.º 11 (02-08-2023).', 'verificado_primaria', ['src-vr-acta-cu-11-2023'], 'hecho')
add('c-9-3', 'proceso', 'Fue candidato a rector en la elección UNI de 2021 y obtuvo 645 votos en la primera vuelta, según ProActivo.', 'parcialmente_verificado', ['src-rx-proactivo-uni-2021-resultados'], 'hecho')
add('c-8-3', 'proceso', 'Fue candidato a vicerrector de investigación en la elección UNI de 2021, según ProActivo.', 'parcialmente_verificado', ['src-rx-proactivo-uni-2021-resultados'], 'hecho')

// 5. Propuestas.
const P = new Map(proposals.map((p) => [p.id, p]))
const pe = (id, patch) => { if (!P.has(id)) throw new Error(`Propuesta ${id}`); Object.assign(P.get(id), patch); log.push(`propuesta ${id}`) }
pe('prop-l1-debate-1', { description: 'Cambiar "el paradigma" educativo tradicional y eliminar las carpetas (pupitres) para reemplazarlas por equipos tecnológicos que permitan aplicar la teoría de manera directa.' })
pe('prop-l1-debate-2', { problem: 'Según el candidato, los laboratorios tienen 50 años de antigüedad y el presupuesto del Estado sólo cubre sueldos.' })
pe('prop-l6-debate-1', { problem: 'Según el candidato, los laboratorios están "algo obsoletos".' })
pe('prop-l6-debate-2', { description: 'Capacitación de docentes y trabajadores.', title: 'Capacitación de docentes y trabajadores' })
pe('prop-l4-debate-3', { problem: 'Según el candidato, la UNI pierde ingresos al no gestionar adecuadamente concesiones como la del metro.' })
for (const p of proposals) {
  if (p.origin === 'declaracion_publica' && p.sourceId === 'src-rs-montoya-propuestas-2026') {
    p.planId = null
    if (p.title.startsWith('Metas a cinco años en rankings')) p.category = 'Internacionalización'
    p.locator = (p.locator ?? '').replace('16-08-2026', '17-08-2026')
  }
}

// 6. Pistas.
for (const c of candidates) {
  const used = new Set(Object.values(c.claims).flat().flatMap((cl) => cl.sourceIds).map((id) => S.get(id)?.url))
  for (const l of c.researchLeads) {
    if (l.profileId === 'https://openalex.org/A5100639200') { l.status = 'descartado'; l.note = 'Otra persona: ORCID 0000-0002-3497-9929, Universidad Autónoma de Madrid, sin afiliación UNI.' }
    if (l.status === 'pendiente' && used.has(l.profileId)) { l.status = 'confirmado'; l.note = `${l.note} Confirmado: el registro se usa como fuente de afirmaciones del perfil.` }
    if (/openalex\.org\/A50(88904355|52985123)/.test(l.profileId)) l.note = `${l.note} Atención: el perfil probablemente mezcla homónimos; no usar su conteo de obras.`
  }
}

write('candidates.json', candidates)
write('sources.json', sources)
write('proposals.json', proposals)
write('faculties.json', faculties)
console.log(log.join('\n'))
console.log(`OK: ${log.length} cambios`)
