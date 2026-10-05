import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { deveIgnorar, ehVersaoAntiga, montarRegistro } from './erros'

const regras = readFileSync(new URL('../../firestore_1.rules', import.meta.url), 'utf8')

describe('registro de erros', () => {
  it('monta o registro com mensagem e pilha, cortando textos longos', () => {
    const erro = new Error('x'.repeat(900))
    const r = montarRegistro(erro, 'tela', { componentStack: 'em <ProcessModal>' })
    expect(r.message).toHaveLength(500)
    expect(r.stack.length).toBeLessThanOrEqual(4000)
    expect(r.componentStack).toBe('em <ProcessModal>')
    expect(r.origem).toBe('tela')
  })

  it('aceita texto solto e valores vazios', () => {
    expect(montarRegistro('falhou', 'promessa').message).toBe('falhou')
    expect(montarRegistro(undefined, 'janela').message).toBe('Erro desconhecido')
  })

  it('grava só campos que a regra do Firestore aceita', () => {
    const permitidos = regras.match(/match \/erros\/[\s\S]*?hasOnly\(\[([^\]]*)\]\)/)[1].match(/'([^']+)'/g).map((c) => c.slice(1, -1))
    const gravados = [...Object.keys(montarRegistro(new Error('a'), 'tela')), 'userId', 'email']
    expect(permitidos.sort()).toEqual(gravados.sort())
  })

  it('ignora ruído do navegador', () => {
    expect(deveIgnorar('ResizeObserver loop completed with undelivered notifications.')).toBe(true)
    expect(deveIgnorar('Cannot read properties of undefined')).toBe(false)
  })

  it('reconhece a falha de uma aba aberta com a versão antiga do app', () => {
    expect(ehVersaoAntiga('Failed to fetch dynamically imported module: https://x/assets/ProcessModal-abc.js')).toBe(true)
    expect(ehVersaoAntiga('Importing a module script failed.')).toBe(true)
    expect(ehVersaoAntiga('Network error')).toBe(false)
  })
})

describe('regras do Firestore', () => {
  it('o dono não consegue trocar o userId de um processo', () => {
    const processos = regras.match(/match \/processes\/[\s\S]*?\n {4}\}/)[0]
    expect(processos).toContain('request.resource.data.userId == resource.data.userId')
    expect(processos).not.toMatch(/allow read, update, delete/)
  })

  it('erros: só criar, nunca ler pelo app', () => {
    const erros = regras.match(/match \/erros\/[\s\S]*?\n {4}\}/)[0]
    expect(erros).toContain('allow read, update, delete: if false')
  })
})
