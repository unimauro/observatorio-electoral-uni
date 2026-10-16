import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Github, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { site } from '../data'

const NAV = [
  ['/', 'Panel'],
  ['/listas', 'Listas'],
  ['/candidatos', 'Candidatos'],
  ['/planes', 'Planes'],
  ['/comparar', 'Comparar'],
  ['/matriz', 'Matriz'],
  ['/fuentes', 'Fuentes'],
  ['/metodologia', 'Metodología'],
] as const

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('oeu-theme', dark ? 'dark' : 'light')
    } catch {
      /* almacenamiento no disponible: el tema sólo dura la sesión */
    }
  }, [dark])
  return [dark, setDark] as const
}

export default function Layout() {
  const [dark, setDark] = useTheme()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()

  useEffect(() => {
    setOpen(false)
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/candidatos?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-signal focus:p-2 focus:text-[#111]">
        Saltar al contenido
      </a>
      <div className="bg-ink px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-paper">
        Proyecto ciudadano independiente · No oficial · Cada dato con su fuente
      </div>
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="Inicio: Observatorio Electoral Universitario">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={34} height={34} />
            <span className="leading-tight">
              <span className="block font-display text-sm uppercase sm:text-base">Observatorio Electoral</span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                Universitario · {site.period}
              </span>
            </span>
          </Link>
          <form onSubmit={onSearch} role="search" className="ml-auto hidden w-64 md:block">
            <label className="relative block">
              <span className="sr-only">Buscar candidato</span>
              <Search aria-hidden size={15} className="absolute left-2.5 top-2.5 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar candidato (sin tildes)…" className="input pl-8" />
            </label>
          </form>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="ml-auto rounded border border-line p-2 hover:border-ink md:ml-0"
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className="rounded border border-line p-2 hover:border-ink lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label="Menú"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
        <nav
          id="main-nav"
          aria-label="Principal"
          className={`${open ? 'block' : 'hidden'} border-t border-line lg:block`}
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-4 lg:flex-row lg:gap-1">
            {NAV.map(([to, label]) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `block border-b-4 px-2 py-2 text-sm font-semibold lg:py-2.5 ${isActive ? 'border-signal' : 'border-transparent text-muted hover:text-ink'}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
            <li className="md:hidden">
              <form onSubmit={onSearch} role="search" className="py-2">
                <label className="relative block">
                  <span className="sr-only">Buscar candidato</span>
                  <Search aria-hidden size={15} className="absolute left-2.5 top-2.5 text-muted" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar candidato…" className="input pl-8" />
                </label>
              </form>
            </li>
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="mt-12 border-t-4 border-ink">
        <div className="tape h-2" aria-hidden />
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
          <div>
            <p className="font-display uppercase">{site.name}</p>
            <p className="mt-2 text-muted">{site.independenceNote}</p>
          </div>
          <div>
            <p className="kicker mb-2">Rendición de cuentas</p>
            <ul className="space-y-1">
              <li><Link className="link" to="/metodologia">Metodología</Link></li>
              <li><Link className="link" to="/fuentes">Catálogo de fuentes</Link></li>
              <li><Link className="link" to="/privacidad">Privacidad y correcciones</Link></li>
            </ul>
          </div>
          <div>
            <p className="kicker mb-2">Datos abiertos</p>
            <a className="link inline-flex items-center gap-1" href={site.repoUrl} target="_blank" rel="noreferrer">
              <Github size={14} aria-hidden /> Repositorio y JSON
            </a>
            <p className="mt-2 text-muted">Actualizado: {site.updatedAt}</p>
            <p className="mt-1 text-muted">¿Un dato está mal? <a className="link" href={site.correctionsUrl} target="_blank" rel="noreferrer">Pide una corrección</a>.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
