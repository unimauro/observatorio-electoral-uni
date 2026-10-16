# Observatorio Electoral Universitario · UNI 2026

Sitio estático, independiente y no oficial para conocer y comparar las **9 listas y 27 candidaturas** a rector y vicerrectores de la Universidad Nacional de Ingeniería (elección de autoridades 2026). Cada dato lleva su fuente; lo no verificado se rotula como tal.

**En vivo:** https://unimauro.github.io/observatorio-electoral-uni/

## Stack
Vite + React 18 + TypeScript + Tailwind 3 + Recharts + Lucide. Pruebas con Vitest + Testing Library. Rutas hash (`#/candidatos/...`), así que funciona en GitHub Pages sin backend ni reescrituras, incluso al recargar o abrir un enlace directo.

## Datos (`src/data/`)
| Archivo | Contenido |
|---|---|
| `candidates.json` | 27 perfiles: cargo, verificación por campo, afirmaciones con fuente, pistas de investigación, correcciones |
| `electoral-lists.json` | 9 listas y sus integrantes |
| `faculties.json` | Facultades (nombres pendientes de verificación oficial) |
| `sources.json` | Catálogo de fuentes con URL, fechas, ubicación y estado |
| `government-plans.json` | Estado de los planes de gobierno por lista |
| `proposals.json` | Propuestas extraídas (vacío hasta localizar planes) |
| `evaluation-criteria.json` / `evaluations.json` | Matriz de evaluación por cargo y puntuaciones (vacío: nada evaluado) |
| `site.json` | Universidad, periodo, fechas, URL del repo |

Esquema: `src/data/types.ts`. Validación (ids estables, duplicados, relaciones, regla orden→cargo, 3 cargos por lista, fuentes existentes, sin códigos ni DNI): `src/data/validate.ts`, ejecutada por `npm run validate` y en CI.

`scripts/seed.mjs` regeneró la carga inicial; desde la primera publicación, **los cambios se hacen editando los JSON por pull request revisado** y se registran en `corrections` del perfil.

## Desarrollo
```bash
npm ci
npm run dev        # http://localhost:5173/observatorio-electoral-uni/
npm run lint && npm run validate && npm test
npm run build      # genera dist/
npm run og         # regenera public/og.png desde scripts/og.svg (requiere rsvg-convert)
```

## Despliegue en GitHub Pages (desde cero)
1. Crea el repositorio y sube la rama `main`.
2. En **Settings → Pages → Build and deployment → Source**, elige **GitHub Actions**.
3. Cada push a `main` ejecuta `.github/workflows/deploy.yml`: instalación (`npm ci`), lint, validación de datos, pruebas, build, revisión de secretos en `dist/` y publicación con las acciones oficiales (`configure-pages`, `upload-pages-artifact`, `deploy-pages`).
4. Si el repositorio tiene otro nombre o usas un dominio propio, define `BASE_PATH` (p. ej. `BASE_PATH=/` para un dominio propio) o edita `base` en `vite.config.ts`, y actualiza las URL `og:` de `index.html`.

Los pull requests corren todo menos el despliegue.

## Principios
Ver la página **Metodología** del sitio. En resumen: no se inventan datos, lo desconocido no cuenta como cero, no se atribuyen publicaciones por homonimia, una tacha no es culpabilidad, no hay rankings de popularidad ni predicciones, y se cumple la Ley N.º 29733.
