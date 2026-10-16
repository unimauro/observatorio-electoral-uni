import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { candidateById, site, sources } from '../data'
import { SOURCE_TYPE_LABEL, STATUS_LABEL, VERIFICATION_STATUSES, type SourceType } from '../data/types'
import { PageHeader, Section, StatusBadge } from '../components/ui'

export function Sources() {
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const shown = sources.filter((s) => (!type || s.type === type) && (!status || s.status === status))
  return (
    <div>
      <PageHeader kicker="Catálogo" title="Fuentes">
        Cada afirmación del sitio apunta a uno de estos documentos. Enlace original, fecha de consulta, ubicación del dato y
        estado de revisión.
      </PageHeader>
      <div className="mb-4 grid max-w-xl grid-cols-2 gap-3">
        <label>
          <span className="kicker">Tipo</span>
          <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(SOURCE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          <span className="kicker">Estado</span>
          <select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
      </div>
      <ol className="space-y-4">
        {shown.map((s) => (
          <li key={s.id} id={s.id} className="card scroll-mt-28 p-4 target:border-2 target:border-ink">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{SOURCE_TYPE_LABEL[s.type as SourceType]}</span>
              <StatusBadge status={s.status} />
              <span className="font-mono text-[11px] text-muted">{s.id}</span>
            </div>
            <h2 className="mt-2 font-semibold">{s.title}</h2>
            <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div><dt className="inline text-muted">Responsable: </dt><dd className="inline">{s.author}</dd></div>
              <div><dt className="inline text-muted">Publicado: </dt><dd className="inline">{s.publishedAt ?? 'sin fecha registrada'}</dd></div>
              <div><dt className="inline text-muted">Consultado: </dt><dd className="inline">{s.consultedAt}</dd></div>
              {s.identifier && <div><dt className="inline text-muted">Identificador: </dt><dd className="inline">{s.identifier}</dd></div>}
              {s.locator && <div className="sm:col-span-2"><dt className="inline text-muted">Ubicación del dato: </dt><dd className="inline">{s.locator}</dd></div>}
              <div className="sm:col-span-2">
                <dt className="inline text-muted">Candidaturas vinculadas: </dt>
                <dd className="inline">
                  {s.candidateIds.length === 0
                    ? 'ninguna en particular'
                    : s.candidateIds.length === 27
                      ? 'las 27'
                      : s.candidateIds.map((id) => candidateById.get(id)?.name).join(', ')}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-muted">{s.notes}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {s.url && <a className="link inline-flex items-center gap-1" href={s.url} target="_blank" rel="noreferrer">Documento <ExternalLink size={12} aria-hidden /></a>}
              {s.landingUrl && <a className="link inline-flex items-center gap-1" href={s.landingUrl} target="_blank" rel="noreferrer">Página de referencia <ExternalLink size={12} aria-hidden /></a>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Methodology() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="Cómo trabajamos" title="Metodología">
        Si no podemos mostrar de dónde sale un dato, el dato no se publica.
      </PageHeader>
      <div className="space-y-4 text-[15px] leading-relaxed">
        <Section title="1. Qué es y qué no es">
          <p>
            Un observatorio ciudadano e independiente sobre la elección de rector y vicerrectores de la {site.university}. <strong>No es un portal oficial</strong> de la UNI
            ni del Comité Electoral Universitario (CEUNI), no está vinculado a ninguna lista y no hace encuestas, rankings de popularidad ni predicciones.
          </p>
        </Section>
        <Section title="2. Cargo por orden de lista">
          <p>
            Cada lista tiene tres integrantes y su posición determina el cargo: 1 = rector(a), 2 = vicerrector(a) académico(a), 3 = vicerrector(a) de investigación.
            Contrastamos esta regla con la <Link className="link" to="/fuentes#src-ceuni-listas-definitivas">publicación definitiva del CEUNI (30-09-2026)</Link>: coincide en las 27 candidaturas.
            Si una fuente oficial la contradijera, el sitio mostraría una advertencia y el cambio pasaría por revisión editorial antes de publicarse.
          </p>
        </Section>
        <Section title="3. Niveles de verificación">
          <ul className="space-y-2">
            {VERIFICATION_STATUSES.map((s) => (
              <li key={s} className="flex flex-wrap items-center gap-2"><StatusBadge status={s} /></li>
            ))}
          </ul>
          <p className="mt-3">
            Distinguimos <strong>hechos</strong> (con documento), <strong>hechos inferidos de un requisito</strong> (p. ej., el doctorado, exigido por el Art. 17 del reglamento para inscribirse),
            <strong> declaraciones</strong> (lo que el candidato afirma) y <strong>análisis editorial</strong>.
          </p>
        </Section>
        <Section title="4. Reglas que no negociamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>No encontrar algo no prueba que no exista. "Sin registro" nunca significa "sin experiencia".</li>
            <li>No atribuimos publicaciones sólo por coincidencia de nombres. Los perfiles bibliográficos son <em>pistas</em> hasta confirmarlos con ORCID, CTI Vitae o el propio candidato.</li>
            <li>Una denuncia, tacha o investigación no es culpabilidad probada; si se registra, se rotula así y con su fuente.</li>
            <li>No inventamos metas, presupuestos, plazos ni responsables de las propuestas.</li>
            <li>Las 9 listas tienen el mismo formato y se muestran en orden numérico.</li>
            <li>No usamos fotos sin fuente y autorización, ni imágenes generadas que parezcan retratos reales.</li>
          </ul>
        </Section>
        <Section title="5. Uso de inteligencia artificial">
          <p>
            Durante la preparación de datos se usan herramientas asistidas por IA para localizar documentos y redactar borradores de registros. Todo borrador
            se guarda con su fuente, pasa por validaciones automáticas (esquema, duplicados, relaciones, enlaces) y por revisión humana antes de publicarse.
            <strong> El sitio publicado no usa IA en tiempo real</strong> ni contiene claves de ningún proveedor.
          </p>
          <ol className="mt-2 list-decimal pl-5">
            <li>Localizar documentos públicos.</li>
            <li>Extraer información.</li>
            <li>Generar borradores estructurados (JSON).</li>
            <li>Guardar referencias.</li>
            <li>Validar (pruebas automáticas en cada cambio).</li>
            <li>Revisión humana.</li>
            <li>Publicar sólo lo aprobado (commit revisado → despliegue).</li>
          </ol>
        </Section>
        <Section title="6. Investigación realizada a la fecha">
          <ul className="list-disc space-y-1 pl-5">
            <li>Portal del CEUNI: listas definitivas, reglamento, índice de resoluciones (consultado el 15-10-2026).</li>
            <li>OpenAlex: búsqueda de perfiles con nombre completo y afiliación UNI. Se encontraron pistas para 25 de 27 candidatos; una fue descartada por mezclar homónimos.</li>
            <li>16-10-2026, candidatos a rector: prensa (RPP, Caretas, ProActivo), API pública de ORCID, documentos de la UNI (FIIS, planeamiento, acreditación) y agenda del Congreso. Lo que un candidato dice en un debate o carga en ORCID se rotula como <em>declaración</em>.</li>
            <li>No usamos reportes de empresas de datos personales (domicilio, teléfonos, deudas, familia, afiliación política), aunque se ofrezcan con autorización: no son pertinentes para evaluar la candidatura y su origen no es verificable.</li>
            <li>Pendiente: CTI Vitae/RENACYT, SUNEDU (grados), ORCID, ALICIA, portal de transparencia UNI, Contraloría y planes de gobierno.</li>
          </ul>
        </Section>
        <Section title="7. Matriz e índice">
          <p>
            La <Link className="link" to="/matriz">matriz</Link> usa criterios por cargo con pesos configurables y una escala de 0 a 5. Un dato desconocido no se convierte en cero, y cada
            puntuación exige evaluador, fecha, justificación y fuentes.
          </p>
        </Section>
        <Section title="8. Actualizaciones y correcciones">
          <p>
            Los datos son archivos JSON versionados en Git: cada cambio queda en el historial público del repositorio. Las correcciones se registran en el perfil
            ("Historial de correcciones") y no se borra información en silencio. <Link className="link" to="/privacidad">Cómo pedir una corrección</Link>.
          </p>
        </Section>
      </div>
    </div>
  )
}

export function Privacy() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="Datos personales" title="Privacidad y correcciones" />
      <div className="space-y-4 text-[15px] leading-relaxed">
        <Section title="Marco">
          <p>
            Este proyecto se desarrolla en Perú y se rige por la Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento vigente. Tratamos
            únicamente información pertinente para evaluar candidaturas a cargos de autoridad universitaria, publicada por fuentes institucionales o por los propios candidatos.
          </p>
        </Section>
        <Section title="Lo que no publicamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Domicilios, DNI, teléfonos o correos personales, datos bancarios, datos familiares ni datos sensibles.</li>
            <li>Códigos internos de docentes ni datos de estudiantes, aunque aparezcan en documentos oficiales.</li>
            <li>Fotografías sin fuente legítima y autorización.</li>
          </ul>
        </Section>
        <Section title="Este sitio no recolecta datos">
          <p>
            Es un sitio estático: no hay formularios que guarden información, ni cuentas, ni cookies de seguimiento. Tu navegador puede guardar localmente el tema
            (claro/oscuro) y los pesos que elijas en la matriz; nunca se envían a ningún servidor.
          </p>
        </Section>
        <Section title="Cómo pedir una corrección">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Abre una solicitud en el <a className="link" href={site.correctionsUrl} target="_blank" rel="noreferrer">repositorio público</a> indicando la página, el dato y la fuente que lo corrige.</li>
            <li>La revisamos contra la fuente. Si procede, se corrige y queda registrada en el historial del perfil con fecha y motivo.</li>
            <li>Si se trata de un dato personal que no debería estar publicado, lo retiramos de inmediato y dejamos constancia de que se retiró.</li>
          </ol>
          <p className="mt-2 text-sm text-muted">Las candidaturas pueden enviar por el mismo canal su plan de gobierno, su hoja de vida o los enlaces a sus perfiles académicos.</p>
        </Section>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <p className="kicker">404</p>
      <h1 className="h-display mt-2 text-4xl">Aquí no hay nada (todavía)</h1>
      <Link to="/" className="btn mt-6">Volver al panel</Link>
    </div>
  )
}
