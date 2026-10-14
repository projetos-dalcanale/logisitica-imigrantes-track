import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { EMPRESA, EMPRESA_PADRAO, PRODUTO } from './marca'

const pastaSrc = fileURLToPath(new URL('./', import.meta.url))
const raiz = new URL('../', import.meta.url)

const arquivos = (pasta) =>
  readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome)
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho]
  })

describe('marca da empresa (src/marca.js)', () => {
  it('sem VITE_EMPRESA_NOME vale o nome padrão', () => {
    expect(EMPRESA).toBe(EMPRESA_PADRAO)
    expect(PRODUTO).toBe('LogiTrack Pro')
  })

  it('o nome da empresa só é escrito em src/marca.js', () => {
    // Se este teste falhar: use EMPRESA (import { EMPRESA } from '../marca'),
    // senão a instância de outra empresa mostraria o nome errado.
    const fonte = arquivos(pastaSrc).filter((f) => /\.(jsx?|css)$/.test(f) && !/\.test\.js$/.test(f) && !f.endsWith('marca.js'))
    const comNome = fonte.filter((f) => readFileSync(f, 'utf8').includes('Imigrantes'))
    expect(comNome.map((f) => f.slice(pastaSrc.length))).toEqual([])
  })

  it('a tela de abertura estática do index.html usa o marcador, não o nome', () => {
    const html = readFileSync(new URL('index.html', raiz), 'utf8')
    expect(html).toContain('__EMPRESA__')
    expect(html).not.toContain('Imigrantes')
  })
})
