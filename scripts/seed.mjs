// Genera los JSON iniciales de src/data a partir de la tabla de carga.
// Uso: node scripts/seed.mjs   (sobrescribe candidates, electoral-lists, sources,
// government-plans y research/openalex-leads; NO toca proposals ni evaluations).
// Tras la primera publicación, los cambios deben hacerse por PR revisado sobre los JSON.
import { readFileSync, writeFileSync } from 'node:fs'

const IMPORT_DATE = '2026-10-15'
const REVIEW_DATE = '2026-10-15'

// [lista, orden, nombre a mostrar, nombre en publicación definitiva CEUNI, facultad]
const ROWS = [
  [1, 1, 'Jorge Gustavo Butler Blacker', 'JORGE GUSTAVO BUTLER BLACKER', 'FIEE'],
  [1, 2, 'Rocío Margarita Cacho Cruz', 'ROCIO MARGARITA CACHO CRUZ', 'FAUA'],
  [1, 3, 'Luis Antonio Lastra Espinoza', 'LUIS ANTONIO LASTRA ESPINOZA', 'FIM'],
  [2, 1, 'Aurelio Marcelo Padilla Ríos', 'AURELIO MARCELO PADILLA RIOS', 'FIM'],
  [2, 2, 'Javier Concepción Sánchez Espinoza', 'JAVIER CONCEPCIÓN SANCHEZ ESPINOZA', 'FIIS'],
  [2, 3, 'César Javier Osorio Carrera', 'CESAR JAVIER OSORIO CARRERA', 'FIQT'],
  [3, 1, 'Luis Humberto Chirif Rivera', 'LUIS HUMBERTO CHIRIF RIVERA', 'FIGMM'],
  [3, 2, 'José Aníbal Páuyac Huamán', 'JOSÉ ANIBAL PÁUYAC HUAMÁN', 'FIEE'],
  [3, 3, 'Modesto Edilberto Montoya Zavaleta', 'MODESTO EDILBERTO MONTOYA ZAVALETA', 'FC'],
  [4, 1, 'Ulises Humala Tasso', 'ULISES HUMALA TASSO', 'FIEECS'],
  [4, 2, 'Félix Víctor Cáceres Cárdenas', 'FÉLIX VICTOR CÁCERES CÁRDENAS', 'FIEE'],
  [4, 3, 'Fernando Huamán Pérez', 'FERNANDO HUAMÁN PEREZ', 'FIQT'],
  [5, 1, 'Alejandro Apolinario Huamán Sánchez', 'ALEJANDRO APOLINARIO HUAMAN SANCHEZ', 'FIIS'],
  [5, 2, 'Hugo Eliseo Gamarra Chinchay', 'HUGO ELISEO GAMARRA CHINCHAY', 'FIM'],
  [5, 3, 'Antonio Nolberto Lazo Jara', 'ANTONIO NOLBERTO LAZO JARA', 'FIGMM'],
  [6, 1, 'Fortunato Alva Dávila', 'FORTUNATO ALVA DÁVILA', 'FIM'],
  [6, 2, 'Modesto Tomás Palma García', 'MODESTO TOMAS PALMA GARCÍA', 'FIEE'],
  [6, 3, 'Héctor Carlos Guimaray Huerta', 'HÉCTOR CARLOS GUIMARAY HUERTA', 'FC'],
  [7, 1, 'Rodolfo Elías Falconí Vásquez', 'RODOLFO ELÍAS FALCONÍ VASQUEZ', 'FIIS'],
  [7, 2, 'Luis Alberto Mosquera Leiva', 'LUIS ALBERTO MOSQUERA LEIVA', 'FIC'],
  [7, 3, 'Manuel Augusto Villavicencio Chávez', 'MANUEL AUGUSTO VILLAVICENCIO CHAVEZ', 'FIM'],
  [8, 1, 'Juan Martín Rodríguez Rodríguez', 'JUAN MARTIN RODRÍGUEZ RODRÍGUEZ', 'FC'],
  [8, 2, 'Rafael Rolando Salinas Basualdo', 'RAFAEL ROLANDO SALINAS BASUALDO', 'FIC'],
  [8, 3, 'Jimmy Aurelio Rosales Huamaní', 'JIMMY AURELIO ROSALES HUAMANI', 'FIGMM'],
  [9, 1, 'Raymundo Ildefonzo Arnao Rondán', 'RAYMUNDO ILDEFONZO ARNAO RONDAN', 'FIEECS'],
  [9, 2, 'Agustín Adalberto Gutiérrez Paucar', 'AGUSTIN ADALBERTO GUTIERREZ PAUCAR', 'FIEE'],
  [9, 3, 'Abel Fernando Vergara Sotomayor', 'ABEL FERNANDO VERGARA SOTOMAYOR', 'FIQT'],
]

// Texto exacto del campo CARGO en la publicación definitiva (difiere sólo en género).
const OFFICIAL_ROLE_TEXT = { 'Rocío Margarita Cacho Cruz': 'VICERRECTORA ACADÉMICA' }
const ROLE_BY_ORDER = { 1: 'rector', 2: 'vicerrector_academico', 3: 'vicerrector_investigacion' }
const ROLE_TEXT = { 1: 'RECTOR', 2: 'VICERRECTOR ACADÉMICO', 3: 'VICERRECTOR INVESTIGACIÓN' }

const slugify = (s) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Correcciones detectadas al contrastar la carga inicial con los documentos del CEUNI.
const CORRECTIONS = {
  'Luis Humberto Chirif Rivera': [
    {
      date: IMPORT_DATE,
      field: 'nombre',
      before: 'Luis Humberto Chirich Rivera',
      after: 'Luis Humberto Chirif Rivera',
      reason:
        'Error de transcripción en la carga inicial. La publicación definitiva del CEUNI y la tabla con facultades consignan "CHIRIF".',
      sourceIds: ['src-ceuni-listas-definitivas', 'src-ceuni-tabla-facultades'],
    },
  ],
  'Ulises Humala Tasso': [
    {
      date: IMPORT_DATE,
      field: 'facultad',
      before: 'FIECS',
      after: 'FIEECS',
      reason: 'La tabla del CEUNI usa la sigla "FIEECS" (Facultad de Ingeniería Económica, Estadística y Ciencias Sociales).',
      sourceIds: ['src-ceuni-tabla-facultades'],
    },
  ],
  'Raymundo Ildefonzo Arnao Rondán': [
    {
      date: IMPORT_DATE,
      field: 'nombre',
      before: 'Raymundo Arnao Rondán Ildefonzo',
      after: 'Raymundo Ildefonzo Arnao Rondán',
      reason:
        'Los documentos del CEUNI difieren en el orden: la publicación definitiva (30-09-2026) dice "RAYMUNDO ILDEFONZO ARNAO RONDAN" y la tabla con facultades dice "RAYMUNDO ARNAO RONDAN ILDEFONZO". Se muestra el orden de la publicación definitiva. Requiere revisión editorial.',
      sourceIds: ['src-ceuni-listas-definitivas', 'src-ceuni-tabla-facultades'],
    },
    {
      date: IMPORT_DATE,
      field: 'facultad',
      before: 'FIECS',
      after: 'FIEECS',
      reason: 'La tabla del CEUNI usa la sigla "FIEECS".',
      sourceIds: ['src-ceuni-tabla-facultades'],
    },
  ],
}

const NAME_VARIANTS = {
  'Raymundo Ildefonzo Arnao Rondán': ['RAYMUNDO ARNAO RONDAN ILDEFONZO'],
}

// Pistas OpenAlex (búsqueda filtrada por afiliación UNI I62520931). NO son atribuciones.
const raw = JSON.parse(readFileSync(new URL('./.openalex-raw.json', import.meta.url), 'utf8'))
const LEAD_WARNINGS = {
  'Juan Martín Rodríguez Rodríguez':
    'El perfil devuelto ("Juan Jose Rodriguez") tiene otro segundo nombre y cientos de trabajos: muy probablemente agrupa homónimos. Descartado como pista hasta revisión.',
  'Modesto Edilberto Montoya Zavaleta':
    'El perfil registra el nombre completo entre sus variantes, pero el nombre visible es abreviado ("M. Montoya"); confirmar con ORCID.',
  'Luis Alberto Mosquera Leiva':
    'Nombre visible abreviado ("Luis Mosquera"); confirmar con ORCID antes de atribuir.',
}

const sharedPending = [
  'Ficha CTI Vitae / RENACYT (CONCYTEC)',
  'Perfil ORCID (si existe) y su vínculo explícito con la UNI',
  'Registro Nacional de Grados y Títulos (SUNEDU) para especialidad y universidad del doctorado',
  'Hoja de vida o plan de trabajo difundido por la lista',
  'Resoluciones del CEUNI sobre impugnaciones y tachas (carpeta oficial con acceso restringido)',
  'Portal de transparencia UNI: cargos de gestión desempeñados',
]

const candidates = ROWS.map(([list, order, name, official, faculty]) => {
  const id = `c-${list}-${order}`
  const leads = (raw[name] || []).map((h) => ({
    provider: 'OpenAlex',
    profileId: h.openalex,
    displayName: h.display_name,
    orcid: h.orcid,
    worksCount: h.works_count,
    citedByCount: h.cited_by_count,
    status: LEAD_WARNINGS[name]?.startsWith('El perfil devuelto') ? 'descartado' : 'pendiente',
    note: LEAD_WARNINGS[name] ?? 'Coincidencia por nombre completo y afiliación UNI en OpenAlex. No atribuida: falta confirmación humana.',
    consultedAt: IMPORT_DATE,
  }))
  return {
    id,
    slug: slugify(name),
    listId: `lista-${list}`,
    order,
    role: ROLE_BY_ORDER[order],
    name,
    officialName: official,
    nameVariants: NAME_VARIANTS[name] ?? [],
    facultyId: faculty,
    photo: null,
    verification: {
      role: {
        status: 'verificado_primaria',
        officialText: OFFICIAL_ROLE_TEXT[name] ?? ROLE_TEXT[order],
        sourceIds: ['src-ceuni-listas-definitivas'],
        note: 'El orden en la lista coincide con el cargo publicado por el CEUNI.',
      },
      name: {
        status: name === 'Raymundo Ildefonzo Arnao Rondán' ? 'pendiente_revision' : 'verificado_primaria',
        sourceIds: ['src-ceuni-listas-definitivas'],
      },
      faculty: {
        status: 'parcialmente_verificado',
        sourceIds: ['src-ceuni-tabla-facultades'],
        note: 'Tomada de la tabla del CEUNI con columna FACULTAD (copia provista); el enlace original requiere inicio de sesión.',
      },
    },
    summary: null,
    claims: {
      formacion: [
        {
          text: 'Grado académico de doctor obtenido con estudios presenciales: requisito para postular (Art. 17 c del Reglamento General de Elecciones). Su inscripción figura en la publicación definitiva. Especialidad e institución no publicadas.',
          status: 'parcialmente_verificado',
          sourceIds: ['src-reglamento-elecciones', 'src-ceuni-listas-definitivas'],
          kind: 'hecho_inferido',
        },
      ],
      docencia: [
        {
          text: 'Docente ordinario principal con no menos de cinco años en la categoría: requisito declarado bajo declaración jurada (Art. 17 d1). Su inscripción figura en la publicación definitiva.',
          status: 'declarado',
          sourceIds: ['src-reglamento-elecciones', 'src-ceuni-listas-definitivas'],
          kind: 'declaracion',
        },
      ],
      investigacion: [],
      gestion: [],
      proyectos: [],
      propuestas: [],
      declaraciones: [],
    },
    researchLeads: leads,
    pendingSources: sharedPending,
    corrections: CORRECTIONS[name] ?? [],
    meta: {
      importedFrom: 'Tabla de carga inicial (imagen CEUNI con facultades) contrastada con la publicación definitiva del CEUNI',
      importedAt: IMPORT_DATE,
      lastReviewed: REVIEW_DATE,
    },
  }
})

const lists = Array.from({ length: 9 }, (_, i) => ({
  id: `lista-${i + 1}`,
  number: i + 1,
  members: candidates.filter((c) => c.listId === `lista-${i + 1}`).map((c) => c.id),
  verification: { status: 'verificado_primaria', sourceIds: ['src-ceuni-listas-definitivas'] },
  planId: `plan-lista-${i + 1}`,
  meta: { importedAt: IMPORT_DATE, lastReviewed: REVIEW_DATE },
}))

const plans = lists.map((l) => ({
  id: l.planId,
  listId: l.id,
  status: 'no_localizado',
  title: null,
  url: null,
  publishedAt: null,
  textFile: null,
  note: 'El Reglamento no exige presentar el plan con la inscripción; prevé una etapa de "debate de propuestas y planes de trabajo". Al 15-10-2026 el observatorio no ha localizado un plan publicado por esta lista.',
  searched: [
    { where: 'Portal del CEUNI (ceuni.uni.edu.pe)', at: IMPORT_DATE, result: 'Sin planes publicados' },
  ],
  nextSteps: ['Redes y canales oficiales de la lista', 'Grabación del debate organizado por el CEUNI', 'Solicitud a la lista o pedido por Ley N.º 27806'],
}))

const sources = [
  {
    id: 'src-ceuni-listas-definitivas',
    title: 'Publicación definitiva de candidaturas para la elección de autoridades universitarias y miembros de órganos de gobierno',
    author: 'Comité Electoral Universitario (CEUNI) – UNI',
    url: 'https://uniedupe93141-my.sharepoint.com/:b:/g/personal/inscripcionceuni_uni_edu_pe/IQBRw9W2xYWUTZg6mpLG_sGOAVQe74SZriNxHssGNuYc_ro?e=dah4ex',
    landingUrl: 'https://www.ceuni.uni.edu.pe/eleccion-de-autoridades-y-elecciones-generales-2026/',
    publishedAt: '2026-09-30',
    consultedAt: IMPORT_DATE,
    type: 'documento_electoral',
    identifier: 'Listas Definitivas 30.09 (PDF, 8 págs.)',
    locator: 'Sección I. Rector y vicerrectores, pág. 2',
    status: 'verificado_primaria',
    candidateIds: candidates.map((c) => c.id),
    notes: 'Confirma integrantes, orden y cargo de las 9 listas. No consigna facultad. Contiene códigos de docentes y datos de estudiantes que el observatorio no reproduce.',
  },
  {
    id: 'src-ceuni-tabla-facultades',
    title: 'Tabla "I. Rector y vicerrectores" con columna FACULTAD (CEUNI)',
    author: 'Comité Electoral Universitario (CEUNI) – UNI',
    url: null,
    landingUrl: 'https://acortar.link/oEwqKV',
    publishedAt: null,
    consultedAt: IMPORT_DATE,
    type: 'documento_electoral',
    identifier: 'Captura provista por el equipo editorial',
    locator: 'Sección I. Rector y vicerrectores',
    status: 'pendiente_revision',
    candidateIds: candidates.map((c) => c.id),
    notes: 'Probablemente la publicación provisional de listas; la carpeta del CEUNI enlazada requiere inicio de sesión de Microsoft. Única fuente para la facultad de cada candidato.',
  },
  {
    id: 'src-ceuni-portal-2026',
    title: 'Elección de autoridades y elecciones generales 2026',
    author: 'Comité Electoral Universitario (CEUNI) – UNI',
    url: 'https://www.ceuni.uni.edu.pe/eleccion-de-autoridades-y-elecciones-generales-2026/',
    landingUrl: null,
    publishedAt: null,
    consultedAt: IMPORT_DATE,
    type: 'portal_institucional',
    identifier: null,
    locator: null,
    status: 'verificado_primaria',
    candidateIds: [],
    notes: 'Índice de padrones, listas provisionales y definitivas, resultados y proclamación.',
  },
  {
    id: 'src-reglamento-elecciones',
    title: 'Reglamento General de Elecciones de Autoridades y Representantes ante los Órganos de Gobierno de la UNI (RE-033/CEU-001)',
    author: 'Consejo Universitario – UNI (Resolución N.º 0650-2026-UNI)',
    url: 'https://fieecs.uni.edu.pe/wp-content/uploads/2026/06/RCU-650-2026-EXP.-0031859-2026-REGLAMENTO-GENERAL-DE-ELECCIONES-DE-AUTORIDADES-Y-REPRESENTANTES-ANTE-ORGANOS-DE-GOBIERNO-DE-LA-UNI-Y-ANEXO.1RRRRRR-1.pdf',
    landingUrl: null,
    publishedAt: '2026-05-01',
    consultedAt: IMPORT_DATE,
    type: 'normativa',
    identifier: 'RCU N.º 0650-2026-UNI',
    locator: 'Art. 17 (requisitos de autoridades); etapas del proceso, lit. s (debate de planes)',
    status: 'verificado_primaria',
    candidateIds: [],
    notes: 'Fecha de publicación aproximada (mayo de 2026, Gaceta N.º 092). Alojado en el sitio de la FIEECS.',
  },
  {
    id: 'src-openalex',
    title: 'OpenAlex – índice abierto de autores y publicaciones',
    author: 'OurResearch',
    url: 'https://openalex.org/',
    landingUrl: null,
    publishedAt: null,
    consultedAt: IMPORT_DATE,
    type: 'base_bibliografica',
    identifier: 'Institución UNI: I62520931',
    locator: null,
    status: 'pendiente_revision',
    candidateIds: candidates.filter((c) => c.researchLeads.length).map((c) => c.id),
    notes: 'Usado sólo para generar pistas de investigación; ninguna publicación se atribuye sin confirmación.',
  },
  {
    id: 'src-ceuni-tachas',
    title: 'Resoluciones de impugnaciones y tachas a candidaturas – Elección de autoridades 2026',
    author: 'Comité Electoral Universitario (CEUNI) – UNI',
    url: 'https://www.ceuni.uni.edu.pe/resoluciones-ceuni-2026/',
    landingUrl: null,
    publishedAt: null,
    consultedAt: IMPORT_DATE,
    type: 'documento_electoral',
    identifier: null,
    locator: null,
    status: 'pendiente_revision',
    candidateIds: [],
    notes: 'Las carpetas enlazadas no se han revisado. Una tacha presentada no implica irregularidad.',
  },
]

const w = (f, d) => writeFileSync(new URL(`../src/data/${f}`, import.meta.url), JSON.stringify(d, null, 2) + '\n')
w('candidates.json', candidates)
w('electoral-lists.json', lists)
w('government-plans.json', plans)
w('sources.json', sources)
console.log(`OK: ${candidates.length} candidatos, ${lists.length} listas, ${sources.length} fuentes`)
