import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// CARREGAMENTO INICIAL: a tela de login só precisa do Auth. O Firestore (a
// maior parte do Firebase) vem junto com a área logada, que é carregada sob
// demanda. Este teste segue só os imports estáticos a partir de main.jsx:
// import() dinâmico não conta, porque não entra no carregamento inicial.
const src = dirname(fileURLToPath(import.meta.url))

const resolverArquivo = (de, alvo) => {
  const base = resolve(dirname(de), alvo)
  return [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`, `${base}/index.jsx`].find((c) => existsSync(c) && /\.jsx?$/.test(c) && !c.endsWith('/'))
}

const importsEstaticos = (arquivo) => {
  const codigo = readFileSync(arquivo, 'utf8')
  return [...codigo.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm)].map((m) => m[1] || m[2])
}

const alcancados = () => {
  const vistos = new Set()
  const pacotes = new Set()
  const fila = [resolve(src, 'main.jsx')]
  while (fila.length) {
    const arquivo = fila.pop()
    if (vistos.has(arquivo)) continue
    vistos.add(arquivo)
    for (const alvo of importsEstaticos(arquivo)) {
      if (alvo.startsWith('.')) {
        const resolvido = resolverArquivo(arquivo, alvo)
        if (resolvido) fila.push(resolvido)
      } else {
        pacotes.add(alvo)
      }
    }
  }
  return { arquivos: [...vistos].map((a) => a.slice(src.length + 1).replaceAll('\\', '/')), pacotes }
}

describe('carregamento inicial', () => {
  it('o código de entrada não importa o Firestore', () => {
    const { arquivos, pacotes } = alcancados()
    expect([...pacotes].filter((p) => p.startsWith('firebase/firestore'))).toEqual([])
    expect(arquivos).not.toContain('lib/banco.js')
  })

  it('o código de entrada ainda importa o Auth (o login precisa dele)', () => {
    expect([...alcancados().pacotes]).toContain('firebase/auth')
  })
})
