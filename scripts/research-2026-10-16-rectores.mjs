// Ronda de investigación 16-10-2026: candidatos a rector, sólo fuentes públicas.
// Idempotente: reemplaza las fuentes y afirmaciones que esta ronda agrega, sin tocar el resto.
// Excluidos a propósito: reportes de brokers de datos (domicilio, teléfonos, deudas, familia, afiliación política).
import { readFileSync, writeFileSync } from 'node:fs'

const D = '2026-10-16'
const file = (f) => new URL(`../src/data/${f}`, import.meta.url)
const read = (f) => JSON.parse(readFileSync(file(f), 'utf8'))
const write = (f, d) => writeFileSync(file(f), JSON.stringify(d, null, 2) + '\n')

const candidates = read('candidates.json')
const sources = read('sources.json')
const site = read('site.json')
const C = (list) => candidates.find((c) => c.listId === `lista-${list}` && c.order === 1)

const NEW_SOURCES = [
  {
    id: 'src-rpp-debate-2026',
    title: 'Elecciones en la UNI: candidatos al rectorado debaten sobre modernización, presupuesto y el futuro de la universidad',
    author: 'RPP Noticias (Jair Zevallos Morón)',
    url: 'https://rpp.pe/lima/actualidad/elecciones-en-la-uni-candidatos-al-rectorado-debaten-sobre-modernizacion-presupuesto-y-el-futuro-de-la-universidad-noticia-1712562',
    publishedAt: '2026-10-15',
    type: 'prensa',
    locator: 'Nota completa; recoge a 8 candidatos a rector',
    status: 'verificado_primaria',
    lists: [1, 2, 3, 4, 6, 7, 8, 9],
    notes: 'Cobertura periodística de las exposiciones de los candidatos. Lo que dice cada candidato es una declaración, no un hecho verificado. Fecha = última actualización de la página. No menciona a la Lista 5.',
  },
  {
    id: 'src-caretas-humala-2026',
    title: '¿Quién es Ulises Humala Tasso, el nuevo candidato a rector de la UNI?',
    author: 'Caretas',
    url: 'https://caretas.pe/politica/ulises-humala-candidato-a-rector-de-la-uni-cuestiona-gestion-de-lopez-chau/',
    publishedAt: '2026-10-12',
    type: 'prensa',
    locator: 'Perfil y entrevista',
    status: 'verificado_primaria',
    lists: [4],
    notes: 'Los datos biográficos se presentan "de acuerdo con la información biográfica disponible". No se reproducen aquí las acusaciones contra terceros.',
  },
  {
    id: 'src-orcid-arnao',
    title: 'Registro ORCID 0000-0003-2420-430X (Raymundo Arnao Rondán)',
    author: 'ORCID; contenido declarado por el titular, salvo la calificación RENACYT, registrada por CONCYTEC',
    url: 'https://orcid.org/0000-0003-2420-430X',
    publishedAt: null,
    type: 'registro_publico',
    locator: 'Secciones Education, Employment, Qualifications',
    status: 'declarado',
    lists: [9],
    notes: 'ORCID es autodeclarado: lo cargado por el titular cuenta como declaración. La calificación RENACYT figura con fuente CONCYTEC.',
  },
  {
    id: 'src-proactivo-rodriguez-2026',
    title: 'Profesor de la UNI recibe el Premio Southern Perú',
    author: 'ProActivo',
    url: 'https://proactivo.com.pe/profesor-de-la-uni-recibe-el-premio-southern-peru/',
    publishedAt: '2026-02-10',
    type: 'prensa',
    locator: 'Nota completa',
    status: 'verificado_primaria',
    lists: [8],
    notes: 'Nota de prensa; no indica la facultad ni las fechas de los cargos.',
  },
  {
    id: 'src-congreso-ciencia-35',
    title: 'Sesión de la Comisión de Ciencia, Innovación y Tecnología – agenda N.º 35',
    author: 'Congreso de la República del Perú',
    url: 'https://comunicaciones.congreso.gob.pe/agenda/sesion-de-la-comision-de-ciencia-35',
    publishedAt: null,
    type: 'portal_institucional',
    locator: 'Invitados: "director ejecutivo del Programa Nacional de Investigación Científica y Estudios Avanzados – PROCIENCIA"',
    status: 'verificado_primaria',
    lists: [8],
    notes: 'La página indica "martes 6 de junio" sin año.',
  },
  {
    id: 'src-fiis-rd034-2021',
    title: 'Resolución Decanal N.º 034-21 – Facultad de Ingeniería Industrial y de Sistemas (UNI)',
    author: 'Decanato FIIS – UNI',
    url: 'https://www.fiis.uni.edu.pe/images/contenidos/decanato/documentos/comisiones/RD_034.pdf',
    publishedAt: '2021-04-05',
    type: 'documento_institucional',
    locator: 'Considerandos y Art. 2',
    status: 'verificado_primaria',
    lists: [7],
    notes: 'Cita la Resolución Rectoral N.º 0267 del 30-03-2021. Documento escaneado.',
  },
  {
    id: 'src-uni-acreditacion-fiee',
    title: 'College of Electrical and Electronics Engineering – portal de acreditación UNI',
    author: 'Universidad Nacional de Ingeniería',
    url: 'https://acreditacion.uni.edu.pe/ceee/',
    publishedAt: null,
    type: 'portal_institucional',
    locator: '"Dean: Jorge Butler PhD., P.E."',
    status: 'verificado_primaria',
    lists: [1],
    notes: 'La página no indica fecha de actualización ni periodo del cargo.',
  },
  {
    id: 'src-uni-plan-2006',
    title: 'Plan Funcional / Operativo UNI 2006',
    author: 'Oficina Central de Planificación – UNI',
    url: 'https://www.ocpla.uni.edu.pe/transparencia/file/uplanyprogeinv/PFUNI/PFUNI2006.pdf',
    publishedAt: '2006-01-01',
    type: 'documento_institucional',
    locator: 'Portadilla de autoridades: "ING. AURELIO PADILLA RIOS – PRIMER VICE-RECTOR"',
    status: 'verificado_primaria',
    lists: [2],
    notes: 'Fecha de publicación aproximada (año 2006).',
  },
  {
    id: 'src-rpp-2009-padilla',
    title: 'La universidad pública se repotencia hace 4 años',
    author: 'RPP Noticias',
    url: 'https://rpp.pe/lima/actualidad/la-universidad-publica-se-repotencia-hace-4-anos-noticia-180356',
    publishedAt: '2009-05-09',
    type: 'prensa',
    locator: '"Lo dijo el rector de la UNI, Aurelio Padilla…"',
    status: 'verificado_primaria',
    lists: [2],
    notes: 'Nombra a "Aurelio Padilla" sin segundo apellido.',
  },
  {
    id: 'src-silabos-alva',
    title: 'Sílabos de Elementos de Máquinas: UNI-FIM (MC401) y URP (Ingeniería Mecatrónica)',
    author: 'UNI (portal de acreditación) y Universidad Ricardo Palma',
    url: 'https://www.urp.edu.pe/pdf/id/5397/n/im0410',
    landingUrl: 'https://acreditacion.uni.edu.pe/wp-content/uploads/2016/10/MC401.pdf',
    publishedAt: null,
    type: 'documento_institucional',
    locator: 'Bibliografía: "Alva, F. (2014). Diseño de Elementos de Máquinas I y II. 3ra ed."; UNI MC401: "Tablas de diseño de elementos de máquinas: Autor Fortunato Alva"',
    status: 'verificado_primaria',
    lists: [6],
    notes: 'El sílabo de la URP consigna como docente a "Dr. Ing. Fortunato Alva Dávila". Se omite el correo personal que aparece en el documento.',
  },
]

// Afirmaciones por lista: [sección, texto, estado, fuentes, tipo]
const CLAIMS = {
  1: [
    ['gestion', 'Figura como decano de la Facultad de Ingeniería Eléctrica y Electrónica ("Dean: Jorge Butler PhD., P.E.") en el portal de acreditación de la UNI. La página no indica el periodo.', 'parcialmente_verificado', ['src-uni-acreditacion-fiee'], 'hecho'],
    ['declaraciones', 'Según RPP, propuso cambiar el modelo educativo tradicional ("cambiar el paradigma") y reemplazar el trabajo en papel por equipos tecnológicos para aplicar la teoría directamente.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
    ['declaraciones', 'Según RPP, sostuvo que el presupuesto del Estado sólo cubre sueldos y propuso alianzas con empresas y embajadas para renovar laboratorios de unos 50 años de antigüedad.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
  ],
  2: [
    ['gestion', 'Primer Vicerrector de la UNI en 2006, según la portadilla de autoridades del plan institucional de ese año.', 'verificado_primaria', ['src-uni-plan-2006'], 'hecho'],
    ['gestion', 'Rector de la UNI en mayo de 2009, según RPP ("el rector de la UNI, Aurelio Padilla"). La nota omite el segundo apellido y no indica el periodo.', 'parcialmente_verificado', ['src-rpp-2009-padilla'], 'hecho'],
    ['declaraciones', 'Según RPP, se propuso mejorar la posición de la UNI en rankings internacionales como QS, reforzar investigación, empleabilidad y vínculo con empresas, y usar Obras por Impuestos y proyectos de inversión ante el MEF.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
    ['declaraciones', 'Según RPP, advirtió que los problemas de gobernanza dañan la imagen de la UNI ante acreditadoras internacionales y pidió restablecer la transparencia.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
  ],
  3: [
    ['declaraciones', 'Según RPP, propuso una "reingeniería en lo académico" para orientar la investigación a problemas reales del país, y como primer paso "sincerar el presupuesto" para atender aulas saturadas y el comedor.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
  ],
  4: [
    ['formacion', 'Estudió Ingeniería Económica en la UNI, hizo un posgrado en la Universidad Sorbonne Nouvelle–París 3 y un doctorado en Ciencias Políticas y Relaciones Internacionales en la Universidad Ricardo Palma, según Caretas ("de acuerdo con la información biográfica disponible").', 'parcialmente_verificado', ['src-caretas-humala-2026'], 'hecho'],
    ['declaraciones', 'Según RPP, propuso un parque tecnológico orientado a "industrias como el gaming y los gemelos digitales", actualizar el currículo con machine learning y Python, y usar Obras por Impuestos y proyectos ante el MEF.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
    ['declaraciones', 'Según RPP, afirmó que la UNI pierde ingresos por no gestionar concesiones como la del metro.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
    ['declaraciones', 'En entrevista con Caretas calificó de "puerta cerrada" el debate organizado por el Comité Electoral, porque cada plancha sólo podía invitar a cinco personas.', 'declarado', ['src-caretas-humala-2026'], 'declaracion'],
  ],
  6: [
    ['investigacion', 'Autor de "Diseño de Elementos de Máquinas I y II" (3.ª ed., 2014, Grupo Universitario) y de tablas de diseño de elementos de máquinas, ambos citados en sílabos de la UNI (FIM, MC401) y de la URP.', 'parcialmente_verificado', ['src-silabos-alva'], 'hecho'],
    ['declaraciones', 'Según RPP: "Nuestros laboratorios están ya algo obsoletos, queremos modernizar los laboratorios". Prioriza la excelencia académica, la capacitación de docentes y personal, más raciones en el comedor y la atención médica y psicológica.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
  ],
  7: [
    ['gestion', 'Encargado del Vicerrectorado Académico de la UNI a partir del 30-03-2021 (Resolución Rectoral N.º 0267-2021), según la Resolución Decanal N.º 034-21 de la FIIS.', 'verificado_primaria', ['src-fiis-rd034-2021'], 'hecho'],
    ['gestion', 'Jefe (e) de la Oficina de Planificación y Presupuesto de la FIIS hasta abril de 2021, cuando dejó el cargo al asumir el encargo del Vicerrectorado.', 'verificado_primaria', ['src-fiis-rd034-2021'], 'hecho'],
    ['declaraciones', 'Según RPP, planteó cuatro prioridades (estudiantes, docentes, infraestructura y generación de recursos) y alianzas con instituciones, universidades y el sector privado ante un presupuesto estatal insuficiente.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
  ],
  8: [
    ['gestion', 'Director ejecutivo del Programa Nacional de Investigación Científica y Estudios Avanzados (PROCIENCIA), según la agenda de la Comisión de Ciencia del Congreso. La página no indica el año.', 'verificado_primaria', ['src-congreso-ciencia-35'], 'hecho'],
    ['investigacion', 'Según ProActivo (feb. 2026): profesor principal de la UNI, investigador distinguido RENACYT, miembro de la Academia Nacional de Ciencias, Premio Southern Perú y Medalla Cristóbal de Losada y Puga 2025. Trabaja en materiales avanzados y purificación de agua.', 'parcialmente_verificado', ['src-proactivo-rodriguez-2026'], 'hecho'],
    ['declaraciones', 'Según RPP, señaló que el 40 % de los estudiantes tarda más de seis años en egresar y propuso el doble grado ("Vamos a derribar las barreras que existen entre nuestras facultades y darles el doble grado"), servicios higiénicos 24 horas y extender a todas las facultades el horario 24 horas de la biblioteca central.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
  ],
  9: [
    ['formacion', 'Ingeniero economista (UNI, 1985), maestro en Planificación Nacional del Desarrollo (UNI, 1988), doctor en Ciencias Contables y Empresariales (UNMSM, 1999) y máster en Asesoría y Gestión Fiscal y de Inversiones (Universidad Politécnica de Madrid–CEPADE, 2007), según su registro ORCID.', 'declarado', ['src-orcid-arnao'], 'declaracion'],
    ['docencia', 'Docente principal de la Facultad de Ingeniería Económica, Estadística y Ciencias Sociales de la UNI desde 2009, según su registro ORCID.', 'declarado', ['src-orcid-arnao'], 'declaracion'],
    ['gestion', 'Decano de la FIEECS-UNI (nov. 2015 – nov. 2019); director (e) de la Dirección General de Administración de la UNI (ene.–jul. 2015); presidente de la Comisión de Gobierno y Organización Administrativa de la Asamblea Estatutaria (2014), según su registro ORCID.', 'declarado', ['src-orcid-arnao'], 'declaracion'],
    ['investigacion', 'Investigador RENACYT Nivel I, Grupo María Rostworowski (dic. 2020 – dic. 2023). Registrado en ORCID con fuente CONCYTEC.', 'corroborado', ['src-orcid-arnao'], 'hecho'],
    ['declaraciones', 'Según RPP, llamó a romper con el "continuismo" ("La UNI tiene que retomar ese camino hacia la excelencia") y afirmó que cerca del 20 % de estudiantes desaprueba al menos el 30 % de sus cursos y que se devolvieron más de S/ 60 millones por dificultades para ejecutar inversiones.', 'declarado', ['src-rpp-debate-2026'], 'declaracion'],
  ],
}

const ORCID_LEADS = {
  1: ['0000-0001-8473-704X', 'Jorge Butler', 'Registro ORCID con nombre abreviado y sin contenido público; confirmar que es el candidato.'],
  2: ['0009-0007-6270-6171', 'AURELIO MARCELO PADILLA RIOS', 'Registro ORCID con nombre completo y empleo en la UNI declarado por el titular; sin publicaciones listadas.'],
  3: ['0000-0003-0000-4768', 'Luis Humberto Chirif Rivera', 'Registro ORCID con nombre completo, sin contenido público.'],
  4: ['0000-0003-4313-663X', 'Ulises Humala', 'Registro ORCID con nombre abreviado y sin contenido público; confirmar que es el candidato.'],
  6: ['0009-0008-8168-661X', 'FORTUNATO ALVA DÁVILA', 'Registro ORCID con nombre completo, sin contenido público.'],
  7: ['0000-0003-2355-8958', 'Rodolfo Falconí', 'Registro ORCID con nombre abreviado y sin contenido público; confirmar que es el candidato.'],
}

const PENDING_EXTRA = {
  4: ['Cobertura de prensa de 2019 (Perú21) sobre su paso por la administración de la UNI: no se pudo acceder al texto completo; pendiente de revisión con la fuente original y la resolución que cerró el caso.'],
  5: ['No figura en la nota de RPP sobre las exposiciones de candidatos a rector (15-10-2026); sin otras fuentes públicas localizadas al 16-10-2026.'],
  8: ['Fechas de la gestión en PROCIENCIA (resoluciones de designación y cese).'],
  1: ['Periodo del decanato de la FIEE (resolución de elección o designación).'],
  2: ['Periodo exacto del rectorado (resoluciones o memoria institucional).'],
}

const newIds = new Set(NEW_SOURCES.map((s) => s.id))
const kept = sources.filter((s) => !newIds.has(s.id))
for (const s of NEW_SOURCES) {
  const { lists, ...rest } = s
  kept.push({
    landingUrl: null,
    identifier: s.url.includes('orcid.org') ? s.url.split('/').pop() : null,
    consultedAt: D,
    candidateIds: lists.map((l) => C(l).id),
    ...rest,
  })
}

for (const [list, claims] of Object.entries(CLAIMS)) {
  const c = C(Number(list))
  for (const sec of Object.keys(c.claims)) c.claims[sec] = c.claims[sec].filter((cl) => !cl.sourceIds.some((id) => newIds.has(id)))
  for (const [sec, text, status, sourceIds, kind] of claims) c.claims[sec].push({ text, status, sourceIds, kind })
  c.meta.lastReviewed = D
}
for (const [list, [oid, name, note]] of Object.entries(ORCID_LEADS)) {
  const c = C(Number(list))
  c.researchLeads = c.researchLeads.filter((l) => l.provider !== 'ORCID')
  c.researchLeads.push({ provider: 'ORCID', profileId: `https://orcid.org/${oid}`, displayName: name, orcid: `https://orcid.org/${oid}`, worksCount: 0, citedByCount: null, status: 'pendiente', note, consultedAt: D })
  c.meta.lastReviewed = D
}
for (const [list, items] of Object.entries(PENDING_EXTRA)) {
  const c = C(Number(list))
  c.pendingSources = [...new Set([...c.pendingSources, ...items])]
  c.meta.lastReviewed = D
}
C(5).meta.lastReviewed = D

site.electionDate = '2026-10-16'
site.electionDateNote = 'Según RPP (15-10-2026) y Caretas (12-10-2026). El cronograma oficial (Gaceta N.º 175-2026) no ha sido revisado por el observatorio.'
site.updatedAt = D

write('candidates.json', candidates)
write('sources.json', kept)
write('site.json', site)
console.log(`OK: ${NEW_SOURCES.length} fuentes, ${Object.values(CLAIMS).flat().length} afirmaciones, ${Object.keys(ORCID_LEADS).length} pistas ORCID`)
