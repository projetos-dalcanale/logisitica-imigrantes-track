import { describe, expect, it } from 'vitest'
import { mensagemDeLogin } from './loginErros'

describe('mensagens do login', () => {
  it('traduz os erros mais comuns', () => {
    expect(mensagemDeLogin('auth/invalid-credential')).toMatch(/senha incorretos/)
    expect(mensagemDeLogin('auth/too-many-requests')).toMatch(/Muitas tentativas/)
    expect(mensagemDeLogin('auth/network-request-failed')).toMatch(/Sem conexão/)
    expect(mensagemDeLogin('auth/user-disabled')).toMatch(/desativada/)
  })

  it('nunca mostra o texto técnico do Firebase', () => {
    expect(mensagemDeLogin('auth/algo-novo')).toBe('Não foi possível concluir agora. Tente de novo em instantes.')
    expect(mensagemDeLogin(undefined)).not.toMatch(/auth\/|Firebase/)
  })
})
