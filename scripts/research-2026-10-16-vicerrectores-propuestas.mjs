// Ronda 16-10-2026 (2): propuestas expuestas en el debate (según RPP) y vicerrectores (ORCID + CV público).
// Idempotente. Nada de reportes de brokers de datos personales.
import { readFileSync, writeFileSync } from 'node:fs'

const D = '2026-10-16'
const file = (f) => new URL(`../src/data/${f}`, import.meta.url)
const read = (f) => JSON.parse(readFileSync(file(f), 'utf8'))
const write = (f, d) => writeFileSync(file(f), JSON.stringify(d, null, 2) + '\n')

const candidates = read('candidates.json')
const sources = read('sources.json')
const byId = new Map(candidates.map((c) => [c.id, c]))

// ---------- Propuestas del debate ----------
// [lista, categoría, título, descripción, problema declarado | null]
const P = [
  [1, 'Modernización curricular', 'Cambio del modelo educativo tradicional', 'Cambiar "el paradigma" de enseñanza y reemplazar el trabajo en papel por equipos tecnológicos para que el estudiante aplique la teoría directamente.', null],
  [1, 'Infraestructura y laboratorios', 'Renovación de laboratorios con alianzas externas', 'Alianzas con empresas y embajadas para renovar laboratorios.', 'Laboratorios de unos 50 años de antigüedad; el presupuesto del Estado sólo cubre sueldos.'],
  [2, 'Internacionalización', 'Mejorar la posición en rankings internacionales', 'Mejorar la ubicación de la UNI en rankings internacionales como QS.', null],
  [2, 'Empleabilidad', 'Investigación, empleabilidad y vínculo con empresas', 'Fortalecer la investigación, la empleabilidad y la relación con empresas privadas.', null],
  [2, 'Presupuesto y gestión institucional', 'Obras por Impuestos y proyectos ante el MEF', 'Usar Obras por Impuestos y presentar proyectos de inversión al MEF.', null],
  [2, 'Transparencia', 'Restablecer la transparencia en la gobernanza', 'Restablecer la transparencia institucional.', 'Los problemas de gobernanza dañan la imagen de la UNI ante acreditadoras internacionales.'],
  [3, 'Investigación científica', 'Reingeniería académica orientada a problemas del país', '"Reingeniería en lo académico" para orientar la investigación a problemas reales del Perú.', null],
  [3, 'Presupuesto y gestión institucional', 'Sincerar el presupuesto', '"Sincerar el presupuesto" como primer paso para atender aulas saturadas y problemas del comedor.', 'Aulas saturadas y problemas en el comedor.'],
  [4, 'Innovación y transferencia tecnológica', 'Parque tecnológico de gaming y gemelos digitales', 'Crear un parque tecnológico orientado a "industrias como el gaming y los gemelos digitales".', null],
  [4, 'Inteligencia artificial', 'Currículo con machine learning y Python', 'Actualizar el currículo con cursos de machine learning y Python.', null],
  [4, 'Presupuesto y gestión institucional', 'Obras por Impuestos, proyectos ante el MEF y concesiones', 'Usar Obras por Impuestos, proyectos ante el MEF y gestionar concesiones para generar ingresos.', 'Según el candidato, la UNI pierde ingresos por no gestionar concesiones como la del metro.'],
  [6, 'Infraestructura y laboratorios', 'Modernización de laboratorios', '"Nuestros laboratorios están ya algo obsoletos, queremos modernizar los laboratorios".', 'Laboratorios obsoletos.'],
  [6, 'Formación docente', 'Capacitación de docentes y personal', 'Capacitación de docentes y personal administrativo.', null],
  [6, 'Bienestar estudiantil', 'Comedor y atención médica y psicológica', 'Aumentar las raciones del comedor y reforzar la atención médica y psicológica de los estudiantes.', null],
  [7, 'Presupuesto y gestión institucional', 'Alianzas para generar recursos', 'Alianzas con instituciones, universidades y el sector privado. Prioridades: estudiantes, docentes, infraestructura y generación de recursos.', 'Presupuesto estatal insuficiente.'],
  [8, 'Modernización curricular', 'Doble grado entre facultades', '"Vamos a derribar las barreras que existen entre nuestras facultades y darles el doble grado."', 'Según el candidato, el 40 % de los estudiantes tarda más de seis años en terminar.'],
  [8, 'Bienestar estudiantil', 'Servicios 24 horas en todas las facultades', 'Servicios higiénicos 24 horas y extender a todas las facultades el horario 24 horas de la biblioteca central.', null],
  [8, 'Investigación científica', 'Investigación desde los primeros ciclos', 'Priorizar el aprendizaje e incorporar la investigación desde los primeros semestres.', null],
  [8, 'Transparencia', 'Gestión transparente', 'Gestión transparente.', null],
  [9, 'Transparencia', 'Administración central al servicio de la democracia y la transparencia', 'Una administración central que sirva a la democracia y la transparencia en lugar de operar como un ente independiente.', 'Según el candidato, se devolvieron más de S/ 60 millones por dificultades para ejecutar inversiones.'],
  [9, 'Calidad educativa', 'Retomar el camino hacia la excelencia', '"La UNI tiene que retomar ese camino hacia la excelencia", rompiendo con el "continuismo".', 'Según el candidato, cerca del 20 % de los estudiantes desaprueba al menos el 30 % de sus cursos.'],
]
const count = {}
const proposals = P.map(([list, category, title, description, problem]) => {
  count[list] = (count[list] ?? 0) + 1
  return {
    id: `prop-l${list}-debate-${count[list]}`,
    listId: `lista-${list}`,
    planId: `plan-lista-${list}`,
    origin: 'debate',
    candidateId: `c-${list}-1`,
    category,
    title,
    description,
    problem,
    objective: null,
    beneficiaries: null,
    indicator: null,
    baseline: null,
    target: null,
    targetDate: null,
    budget: null,
    responsibleUnit: null,
    sourceId: 'src-rpp-debate-2026',
    locator: 'Exposición del candidato a rector, según la nota',
    status: 'declarado',
  }
})
// Conserva propuestas de otros orígenes si las hubiera.
const prev = read('proposals.json').filter((p) => p.origin && p.origin !== 'debate')
write('proposals.json', [...prev, ...proposals])

// ---------- Vicerrectores ----------
const ORCID = {
  'c-2-3': ['0000-0002-2850-6420', 'Cesar Osorio'],
  'c-3-2': ['0000-0002-4952-1814', 'Jose Anibal Pauyac Huaman'],
  'c-3-3': ['0000-0002-3376-1872', 'Modesto Montoya'],
  'c-4-3': ['0000-0002-4299-8492', 'FERNANDO HUAMAN PEREZ'],
  'c-7-2': ['0000-0003-0798-8392', 'Luis Mosquera'],
  'c-8-2': ['0000-0001-5365-1518', 'RAFAEL SALINAS BASUALDO'],
  'c-8-3': ['0000-0002-3737-8694', 'Jimmy Rosales'],
  'c-9-3': ['0000-0003-0964-4489', 'ABEL FERNANDO VERGARA SOTOMAYOR'],
}
const NEW_SOURCES = Object.entries(ORCID).map(([cid, [oid, name]]) => ({
  id: `src-orcid-${cid}`,
  title: `Registro ORCID ${oid} (${name})`,
  author: 'ORCID; contenido declarado por el titular, salvo las calificaciones RENACYT, registradas por CONCYTEC',
  url: `https://orcid.org/${oid}`,
  landingUrl: null,
  publishedAt: null,
  consultedAt: D,
  type: 'registro_publico',
  identifier: oid,
  locator: 'Education, Employment, Qualifications, Biography',
  status: 'declarado',
  candidateIds: [cid],
  notes: 'ORCID es autodeclarado. La identidad se infiere por nombre, afiliación UNI y facultad coincidente.',
}))
NEW_SOURCES.push({
  id: 'src-cv-palma-gobpe',
  title: 'Resumen de hoja de vida – Modesto Tomás Palma García',
  author: 'Documento publicado en gob.pe (entidad no indicada en el resumen)',
  url: 'https://www.gob.pe/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTc1OTQ4LCJwdXIiOiJibG9iX2lkIn19--7b17e13a05d12e00134abcc6f5c57a8ebc4fea54/CV.pdf',
  landingUrl: null,
  publishedAt: '2023-10-10',
  consultedAt: D,
  type: 'documento_institucional',
  identifier: null,
  locator: 'Formación académica y experiencia laboral',
  status: 'declarado',
  candidateIds: ['c-6-2'],
  notes: 'Hoja de vida resumida publicada en la plataforma del Estado; su contenido es declarado por el titular. Fecha = creación del PDF.',
})

// [candidato, sección, texto, estado, fuentes, tipo]
const S = (cid) => [`src-orcid-${cid}`]
const CLAIMS = [
  ['c-2-3', 'formacion', 'Ingeniero químico (UNI), maestro en Ciencias con mención en Gestión Ambiental (UNI) y doctor en Medio Ambiente y Desarrollo Sostenible (UNFV, 2013), según su ORCID.', 'declarado', S('c-2-3'), 'declaracion'],
  ['c-2-3', 'docencia', 'Profesor principal de la Facultad de Ingeniería Química y Textil de la UNI desde 1992; docente de posgrado en otras universidades, según su ORCID.', 'declarado', S('c-2-3'), 'declaracion'],
  ['c-2-3', 'investigacion', 'Investigador RENACYT Nivel VI (desde nov. 2023), calificación registrada en ORCID por CONCYTEC.', 'corroborado', S('c-2-3'), 'hecho'],
  ['c-3-2', 'formacion', 'Ph.D. en Física Teórica (2005) y Master of Science en Radiofísica (1987) por la Universidad Rusa de la Amistad de los Pueblos, según su ORCID.', 'declarado', S('c-3-2'), 'declaracion'],
  ['c-3-2', 'docencia', 'Profesor de la Facultad de Ingeniería Eléctrica y Electrónica de la UNI desde 1993, según su ORCID.', 'declarado', S('c-3-2'), 'declaracion'],
  ['c-3-3', 'formacion', 'Docteur ès sciences por la Université Paris-Sud (1981), según su ORCID.', 'declarado', S('c-3-3'), 'declaracion'],
  ['c-3-3', 'docencia', 'Profesor de la Facultad de Ciencias de la UNI desde 1971, según su ORCID.', 'declarado', S('c-3-3'), 'declaracion'],
  ['c-3-3', 'investigacion', 'Investigador RENACYT Nivel II (calificaciones 2022 y 2024 registradas por CONCYTEC). Científico invitado en GSI (Alemania), IPN Orsay (Francia), Carnegie Mellon (EE. UU.) y Forschungszentrum Jülich entre 1983 y 1988, según su ORCID.', 'corroborado', S('c-3-3'), 'hecho'],
  ['c-4-3', 'formacion', 'Doctor en Administración, magíster en Ingeniería Aeronáutica y licenciado en Física, según la biografía de su ORCID (sin instituciones ni fechas).', 'declarado', S('c-4-3'), 'declaracion'],
  ['c-4-3', 'gestion', 'Director de la Sección de Posgrado de la FIQT-UNI (2009–2016 y 2021–2022) y presidente del Comité Electoral de la UNI en 2019, según la biografía de su ORCID.', 'declarado', S('c-4-3'), 'declaracion'],
  ['c-4-3', 'docencia', 'Docente principal de la UNI desde 1995, según su ORCID.', 'declarado', S('c-4-3'), 'declaracion'],
  ['c-6-2', 'formacion', 'Ingeniero electricista, maestro en Ciencias con mención en Sistemas de Potencia y doctor en Ciencias con mención en Energética, los tres por la UNI, según su hoja de vida publicada en gob.pe.', 'declarado', ['src-cv-palma-gobpe'], 'declaracion'],
  ['c-6-2', 'gestion', 'Director ejecutivo del INICTEL-UNI (2008–2014) y coordinador y profesor del Doctorado en Ciencias con mención en Energética de la UNI (2023), según su hoja de vida publicada en gob.pe.', 'declarado', ['src-cv-palma-gobpe'], 'declaracion'],
  ['c-7-2', 'investigacion', 'El registro ORCID a nombre de "Luis Mosquera" (investigador de la FIC-UNI desde 1995) tiene calificaciones RENACYT Nivel V (2022) y Nivel IV (2024) registradas por CONCYTEC. El nombre es abreviado, pero la facultad coincide con la del candidato.', 'parcialmente_verificado', S('c-7-2'), 'hecho'],
  ['c-8-2', 'formacion', 'Doctorado por la Universidad Nacional Autónoma de México (2010–2013), según su ORCID.', 'declarado', S('c-8-2'), 'declaracion'],
  ['c-8-2', 'docencia', 'Profesor de la Facultad de Ingeniería Civil de la UNI desde 1999, según su ORCID.', 'declarado', S('c-8-2'), 'declaracion'],
  ['c-8-3', 'formacion', 'Ingeniero (1991), magíster (2011) y doctor (2017) por la UNI, según su ORCID.', 'declarado', S('c-8-3'), 'declaracion'],
  ['c-8-3', 'docencia', 'Profesor de la UNI desde 1993; docente visitante en la Universidad de Alcalá desde 2023, según su ORCID.', 'declarado', S('c-8-3'), 'declaracion'],
  ['c-8-3', 'investigacion', 'Investigador RENACYT Nivel III (desde abr. 2024; antes Nivel IV, 2019–2021), calificaciones registradas en ORCID por CONCYTEC.', 'corroborado', S('c-8-3'), 'hecho'],
  ['c-9-3', 'formacion', 'Ingeniero químico (1989), maestro (FIQT, 2011) y doctor (Facultad de Ciencias, 2020), los tres por la UNI, según su ORCID.', 'declarado', S('c-9-3'), 'declaracion'],
  ['c-9-3', 'gestion', 'Declara en ORCID el cargo de "Docente - Decano" de la Facultad de Ingeniería Química y Textil de la UNI, sin fechas del decanato.', 'declarado', S('c-9-3'), 'declaracion'],
  ['c-9-3', 'investigacion', 'Investigador RENACYT Nivel III, Grupo María Rostworowski (ago. 2021 – ago. 2023), calificación registrada en ORCID por CONCYTEC.', 'corroborado', S('c-9-3'), 'hecho'],
]

const newIds = new Set(NEW_SOURCES.map((s) => s.id))
write('sources.json', [...sources.filter((s) => !newIds.has(s.id)), ...NEW_SOURCES])

for (const [cid] of Object.entries(ORCID).concat([['c-6-2']])) {
  const c = byId.get(cid)
  for (const sec of Object.keys(c.claims)) c.claims[sec] = c.claims[sec].filter((cl) => !cl.sourceIds.some((id) => newIds.has(id)))
}
for (const [cid, sec, text, status, sourceIds, kind] of CLAIMS) {
  const c = byId.get(cid)
  c.claims[sec].push({ text, status, sourceIds, kind })
  c.meta.lastReviewed = D
}

// Lastra: la pista OpenAlex enlazaba un ORCID de otra persona.
const lastra = byId.get('c-1-3')
for (const l of lastra.researchLeads) {
  if (l.provider === 'OpenAlex') {
    l.status = 'descartado'
    l.note = 'El ORCID asociado a este perfil de OpenAlex (0009-0005-8954-7153) pertenece a otra persona (Luis Jesús Montesdeoca Espinoza, Ecuador): el perfil mezcla identidades. Descartado.'
    l.consultedAt = D
  }
}
lastra.researchLeads = lastra.researchLeads.filter((l) => l.provider !== 'ORCID')
lastra.researchLeads.push({ provider: 'ORCID', profileId: 'https://orcid.org/0009-0005-5173-9213', displayName: 'Luis Lastra Espinoza', orcid: 'https://orcid.org/0009-0005-5173-9213', worksCount: 0, citedByCount: null, status: 'pendiente', note: 'Registro ORCID con empleo declarado en la FIM-UNI (coincide con la facultad del candidato); sin publicaciones listadas.', consultedAt: D })
lastra.meta.lastReviewed = D

for (const c of candidates) {
  if (c.order > 1 && !c.claims.formacion.some((x) => x.sourceIds.some((id) => id.startsWith('src-orcid') || id.startsWith('src-cv')))) {
    c.pendingSources = [...new Set([...c.pendingSources, 'Sin registro ORCID con contenido ni otra fuente pública localizada al 16-10-2026.'])]
    c.meta.lastReviewed = D
  }
}

write('candidates.json', candidates)
console.log(`OK: ${proposals.length} propuestas de debate, ${NEW_SOURCES.length} fuentes, ${CLAIMS.length} afirmaciones de vicerrectores`)
