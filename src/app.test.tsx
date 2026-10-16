import { describe, expect, it, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './App'
import { candidates } from './data'

beforeAll(() => {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
  window.scrollTo = () => {}
})

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>)

describe('rutas', () => {
  it('panel principal', () => {
    at('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/votar a ciegas/i)
  })
  it('listas: 9 tarjetas', () => {
    at('/listas')
    expect(screen.getAllByRole('article')).toHaveLength(9)
  })
  it('cada perfil carga por su ruta', () => {
    for (const c of candidates) {
      const { unmount } = at(`/candidatos/${c.slug}`)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(c.name)
      unmount()
    }
  })
  it('segunda vuelta: dos fórmulas', () => {
    at('/segunda-vuelta')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Lista 1.*Lista 8/)
  })
  it('ruta inexistente muestra 404', () => {
    at('/no-existe')
    expect(screen.getByText('404')).toBeInTheDocument()
  })
  it('perfil inexistente muestra 404', () => {
    at('/candidatos/nadie')
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

describe('directorio', () => {
  it('busca sin tildes', () => {
    at('/candidatos?q=pauyac')
    const list = screen.getAllByRole('list').find((l) => l.tagName === 'UL' && l.className.includes('grid'))!
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByText('José Aníbal Páuyac Huamán')).toBeInTheDocument()
  })
  it('combina filtros', async () => {
    at('/candidatos')
    await userEvent.selectOptions(screen.getByLabelText('Cargo'), 'rector')
    expect(screen.getByRole('status')).toHaveTextContent('9 resultados')
    await userEvent.selectOptions(screen.getByLabelText('Facultad'), 'FIM')
    expect(screen.getByRole('status')).toHaveTextContent('2 resultados')
  })
})

describe('buscador global', () => {
  it('encuentra candidatos y datos sin tildes', () => {
    at('/buscar?q=ingemmet')
    expect(screen.getByRole('status')).not.toHaveTextContent(/^0 resultados/)
    expect(screen.getAllByText(/Chirif/).length).toBeGreaterThan(0)
  })
})

describe('comparador', () => {
  it('compara dos listas', () => {
    at('/comparar?modo=listas&ids=1,2')
    expect(screen.getByRole('table')).toHaveTextContent('Jorge Gustavo Butler Blacker')
    expect(screen.getByRole('table')).toHaveTextContent('Aurelio Marcelo Padilla Ríos')
  })
})
