import { Link, useSearchParams } from 'react-router-dom'
import PressFeed from '../components/PressFeed'
import { PageHeader } from '../components/ui'
import { press, site } from '../data'
import { PRESS_TOPICS, type PressTopic } from '../data/types'

export default function Press() {
  const [params] = useSearchParams()
  const tema = params.get('tema')
  const initial = (PRESS_TOPICS as readonly string[]).includes(tema ?? '') ? (tema as PressTopic) : null
  const last = press[0]?.date
  return (
    <div>
      <PageHeader kicker={`En los medios · ${press.length} notas · última: ${last ?? '—'}`} title={<>Lo que salió <span className="mark">en la prensa</span></>}>
        Notas de prensa, videos y comunicados oficiales sobre la elección de rector y vicerrectores UNI 2026: la disputa por el rectorado interino, el debate, la primera vuelta
        y la nulidad parcial de la segunda vuelta. Sólo registramos enlaces que abrimos y cuyo titular confirmamos; los resúmenes describen lo que dice cada medio, no lo que
        el observatorio verificó. Lo que es declaración de un actor se señala como tal.{' '}
        <Link className="link" to="/segunda-vuelta">Estado de la segunda vuelta</Link> · <Link className="link" to="/metodologia">Metodología</Link>
      </PageHeader>
      <PressFeed key={initial ?? 'all'} topic={initial} />
      <p className="mt-4 text-xs text-muted">
        Datos abiertos: <a className="link" href={`${import.meta.env.BASE_URL}press.json`}>press.json</a> (misma lista, formato JSON) ·{' '}
        <a className="link" href={`${site.repoUrl}/blob/main/src/data/press.json`} target="_blank" rel="noreferrer">fuente en el repositorio</a>. ¿Falta una nota?{' '}
        <a className="link" href={site.correctionsUrl} target="_blank" rel="noreferrer">Propónla</a>.
      </p>
    </div>
  )
}
