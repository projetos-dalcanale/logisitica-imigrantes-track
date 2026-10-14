import { describe, expect, it } from 'vitest'
import { montarConfigFirebase } from './firebaseConfig'

describe('configuração do Firebase', () => {
  it('sem variáveis vale o projeto da Imigrantes (produção não muda)', () => {
    const config = montarConfigFirebase({})
    expect(config.projectId).toBe('track-logistica')
    expect(config.authDomain).toBe('track-logistica.firebaseapp.com')
    expect(config.apiKey).toMatch(/^AIza/)
  })

  it('aceita env indefinido', () => {
    expect(montarConfigFirebase(undefined).projectId).toBe('track-logistica')
  })

  it('outra empresa troca o projeto pelas variáveis VITE_FIREBASE_*', () => {
    const config = montarConfigFirebase({
      VITE_FIREBASE_PROJECT_ID: 'logitrack-modelo',
      VITE_FIREBASE_AUTH_DOMAIN: 'logitrack-modelo.firebaseapp.com',
      VITE_FIREBASE_API_KEY: 'AIzaChaveDoModelo',
    })
    expect(config.projectId).toBe('logitrack-modelo')
    expect(config.authDomain).toBe('logitrack-modelo.firebaseapp.com')
    expect(config.apiKey).toBe('AIzaChaveDoModelo')
    // o que não foi informado não mistura com outro projeto por engano
    expect(config.appId).toBe(montarConfigFirebase({}).appId)
  })

  it('variável vazia ou só com espaços cai no padrão', () => {
    expect(montarConfigFirebase({ VITE_FIREBASE_PROJECT_ID: '   ' }).projectId).toBe('track-logistica')
  })

  it('o emulador sempre usa o projeto demo-, mesmo com variáveis definidas', () => {
    expect(montarConfigFirebase({ VITE_FIREBASE_PROJECT_ID: 'logitrack-modelo' }, true).projectId).toBe('demo-logitrack')
  })
})
