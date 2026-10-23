import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

const raiz = new URL('../../', import.meta.url)
const vercel = JSON.parse(readFileSync(new URL('vercel.json', raiz), 'utf8'))
// Quebras de linha como no build da Vercel (Linux): no Windows o Git pode
// gravar CRLF, o que mudaria o hash sem o site de produção mudar.
const html = readFileSync(new URL('index.html', raiz), 'utf8').replace(/\r\n/g, '\n')
const cabecalhos = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]))
const csp = cabecalhos['Content-Security-Policy']

describe('cabeçalhos de segurança (vercel.json)', () => {
  it('a CSP libera o script embutido do index.html (aplica o tema antes da tela aparecer)', () => {
    // Se este teste falhar: o script embutido do index.html mudou. Atualize o
    // hash "sha256-..." do script-src no vercel.json com o valor esperado abaixo.
    const embutidos = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
    for (const s of embutidos) {
      const hash = `'sha256-${createHash('sha256').update(s).digest('base64')}'`
      expect(csp, `adicione ${hash} ao script-src`).toContain(hash)
    }
  })

  it('a CSP permite o Firebase e bloqueia o que não é usado', () => {
    expect(csp).toContain("connect-src 'self' https://*.googleapis.com")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  })

  it('a política de referência continua compatível com a restrição da chave do Firebase', () => {
    // "no-referrer" quebraria o login: a chave só aceita pedidos com o endereço do site.
    expect(cabecalhos['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
  })

  it('workers só do próprio site: nada de blob: nem unsafe em worker-src', () => {
    // O blob: só foi liberado para o Excel (.xlsx) de listas grandes, que saiu do app.
    // Se voltar uma biblioteca que crie Workers por blob, ela precisa ser reavaliada.
    expect(csp).toMatch(/worker-src 'self';/)
    expect(csp).not.toMatch(/worker-src[^;]*(blob:|'unsafe)/)
  })
})

describe('regras do Firestore: pendências', () => {
  const regras = readFileSync(new URL('firestore_1.rules', raiz), 'utf8').replace(/\r\n/g, '\n')
  const bloco = regras.match(/match \/pendencias\/\{pendenciaId\} \{[\s\S]*?\n    \}/)?.[0] || ''

  it('tem o bloco da coleção, aberto só para quem está logado', () => {
    expect(bloco, 'faltou o bloco match /pendencias/{pendenciaId}').not.toBe('')
    expect(bloco).toContain('allow read, delete: if request.auth != null')
    expect(bloco).toContain('allow create, update: if request.auth != null')
  })

  it('exige título de 1 a 200 caracteres, dia AAAA-MM-DD e feito booleano', () => {
    expect(bloco).toContain('request.resource.data.titulo is string')
    expect(bloco).toContain('request.resource.data.titulo.size() > 0')
    expect(bloco).toContain('request.resource.data.titulo.size() <= 200')
    expect(bloco).toContain(String.raw`request.resource.data.data.matches('^\\d{4}-\\d{2}-\\d{2}$')`)
    expect(bloco).toContain('request.resource.data.feito is bool')
  })

  it('o fim do arquivo continua negando tudo o que não foi liberado', () => {
    expect(regras).toMatch(/match \/\{document=\*\*\} \{\s*allow read, write: if false;/)
  })
})
