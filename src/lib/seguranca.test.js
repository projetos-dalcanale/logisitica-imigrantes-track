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
})
