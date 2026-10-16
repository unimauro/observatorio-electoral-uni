export type Role = 'rector' | 'vicerrector_academico' | 'vicerrector_investigacion'

export const ROLES: Role[] = ['rector', 'vicerrector_academico', 'vicerrector_investigacion']

/** Regla del proyecto: el orden dentro de la lista determina el cargo. */
export const ROLE_BY_ORDER: Record<number, Role> = {
  1: 'rector',
  2: 'vicerrector_academico',
  3: 'vicerrector_investigacion',
}

export const ROLE_LABEL: Record<Role, string> = {
  rector: 'Rector(a)',
  vicerrector_academico: 'Vicerrector(a) académico(a)',
  vicerrector_investigacion: 'Vicerrector(a) de investigación',
}

export const ROLE_SHORT: Record<Role, string> = {
  rector: 'Rectorado',
  vicerrector_academico: 'VR Académico',
  vicerrector_investigacion: 'VR Investigación',
}

export type VerificationStatus =
  | 'verificado_primaria'
  | 'corroborado'
  | 'declarado'
  | 'parcialmente_verificado'
  | 'pendiente_revision'
  | 'controvertido'
  | 'no_encontrado'

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'verificado_primaria',
  'corroborado',
  'declarado',
  'parcialmente_verificado',
  'pendiente_revision',
  'controvertido',
  'no_encontrado',
]

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  verificado_primaria: 'Verificado con fuente primaria',
  corroborado: 'Corroborado por varias fuentes',
  declarado: 'Declarado por el candidato',
  parcialmente_verificado: 'Parcialmente verificado',
  pendiente_revision: 'Pendiente de revisión',
  controvertido: 'Controvertido',
  no_encontrado: 'No encontrado en las fuentes consultadas',
}

export type ClaimKind = 'hecho' | 'hecho_inferido' | 'declaracion' | 'analisis'

export const CLAIM_KIND_LABEL: Record<ClaimKind, string> = {
  hecho: 'Hecho',
  hecho_inferido: 'Hecho inferido de un requisito',
  declaracion: 'Declaración',
  analisis: 'Análisis editorial',
}

export interface Claim {
  text: string
  status: VerificationStatus
  sourceIds: string[]
  kind: ClaimKind
}

export const CLAIM_SECTIONS = [
  'formacion',
  'docencia',
  'investigacion',
  'gestion',
  'proyectos',
  'propuestas',
  'declaraciones',
] as const
export type ClaimSection = (typeof CLAIM_SECTIONS)[number]

export const SECTION_LABEL: Record<ClaimSection, string> = {
  formacion: 'Formación académica',
  docencia: 'Experiencia docente',
  investigacion: 'Investigación y publicaciones',
  gestion: 'Experiencia de gestión',
  proyectos: 'Proyectos y logros documentados',
  propuestas: 'Propuestas relacionadas con su cargo',
  declaraciones: 'Declaraciones públicas relevantes',
}

export interface FieldVerification {
  status: VerificationStatus
  sourceIds: string[]
  note?: string
  officialText?: string
}

export interface ResearchLead {
  provider: string
  profileId: string
  displayName: string
  orcid: string | null
  worksCount: number | null
  citedByCount: number | null
  status: 'pendiente' | 'confirmado' | 'descartado'
  note: string
  consultedAt: string
}

export interface Correction {
  date: string
  field: string
  before: string
  after: string
  reason: string
  sourceIds: string[]
}

export interface Candidate {
  id: string
  slug: string
  listId: string
  order: number
  role: Role
  name: string
  officialName: string
  nameVariants: string[]
  facultyId: string
  photo: { url: string; credit: string; license: string } | null
  verification: { role: FieldVerification; name: FieldVerification; faculty: FieldVerification }
  summary: Claim | null
  claims: Record<ClaimSection, Claim[]>
  researchLeads: ResearchLead[]
  pendingSources: string[]
  corrections: Correction[]
  meta: { importedFrom: string; importedAt: string; lastReviewed: string }
}

export interface ElectoralList {
  id: string
  number: number
  members: string[]
  verification: FieldVerification
  planId: string
  meta: { importedAt: string; lastReviewed: string }
}

export interface Faculty {
  id: string
  name: string
  area: string
  nameStatus: VerificationStatus
}

export type SourceType =
  | 'documento_electoral'
  | 'documento_institucional'
  | 'portal_institucional'
  | 'normativa'
  | 'base_bibliografica'
  | 'registro_publico'
  | 'prensa'
  | 'plan_de_gobierno'
  | 'declaracion_publica'

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  documento_electoral: 'Documento electoral',
  documento_institucional: 'Documento institucional',
  portal_institucional: 'Portal institucional',
  normativa: 'Normativa',
  base_bibliografica: 'Base bibliográfica',
  registro_publico: 'Registro público',
  prensa: 'Prensa',
  plan_de_gobierno: 'Plan de gobierno',
  declaracion_publica: 'Declaración pública',
}

export interface Source {
  id: string
  title: string
  author: string
  url: string | null
  landingUrl: string | null
  publishedAt: string | null
  consultedAt: string
  type: SourceType
  identifier: string | null
  locator: string | null
  status: VerificationStatus
  candidateIds: string[]
  notes: string
}

export type PlanStatus = 'publicado' | 'no_localizado' | 'en_revision'

export interface GovernmentPlan {
  id: string
  listId: string
  status: PlanStatus
  title: string | null
  url: string | null
  publishedAt: string | null
  textFile: string | null
  note: string
  searched: { where: string; at: string; result: string }[]
  nextSteps: string[]
}

export const PROPOSAL_CATEGORIES = [
  'Calidad educativa',
  'Modernización curricular',
  'Investigación científica',
  'Innovación y transferencia tecnológica',
  'Transformación digital',
  'Inteligencia artificial',
  'Infraestructura y laboratorios',
  'Formación docente',
  'Bienestar estudiantil',
  'Presupuesto y gestión institucional',
  'Transparencia',
  'Internacionalización',
  'Empleabilidad',
  'Sostenibilidad',
  'Inclusión y accesibilidad',
] as const
export type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number]

/** null = el plan no lo especifica. Nunca se completa con supuestos. */
export interface Proposal {
  id: string
  listId: string
  planId: string
  category: ProposalCategory
  title: string
  description: string
  problem: string | null
  objective: string | null
  beneficiaries: string | null
  indicator: string | null
  baseline: string | null
  target: string | null
  targetDate: string | null
  budget: string | null
  responsibleUnit: string | null
  sourceId: string
  locator: string | null
  status: VerificationStatus
}

export interface Criterion {
  id: string
  role: Role
  name: string
  description: string
  weight: number
  scale: '0-5'
  evidenceRequired: string
}

export type ScoreValue = 0 | 1 | 2 | 3 | 4 | 5 | 'no_evaluado' | 'insuficiente' | 'no_aplica'

export interface Evaluation {
  candidateId: string
  criterionId: string
  score: ScoreValue
  justification: string
  sourceIds: string[]
  evaluator: string
  reviewedAt: string
}

export interface SiteConfig {
  name: string
  tagline: string
  university: string
  period: string
  electionDate: string | null
  electionDateNote: string
  updatedAt: string
  repoUrl: string
  correctionsUrl: string
  independenceNote: string
}
