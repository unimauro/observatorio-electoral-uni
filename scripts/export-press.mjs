// Copia src/data/press.json a public/press.json para que el build lo sirva en /press.json
// y otros proyectos (p. ej. el Observatorio UNI) puedan consumirlo. Se ejecuta antes de cada build.
import { copyFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src/data/press.json')
JSON.parse(readFileSync(src, 'utf8')) // falla si el JSON está roto
copyFileSync(src, join(root, 'public/press.json'))
console.log('public/press.json actualizado')
