import { initializeApp } from 'firebase/app'
import { browserSessionPersistence, connectAuthEmulator, initializeAuth } from 'firebase/auth'
import { montarConfigFirebase } from './firebaseConfig'

// Testes de tela (e2e/): o app conversa com o emulador local do Firebase,
// sem tocar nos dados reais. Só liga com VITE_EMULADOR=1.
export const EMULADOR = import.meta.env.VITE_EMULADOR === '1'

// Projeto Firebase da instância: ver src/lib/firebaseConfig.js (sem variáveis
// de ambiente, o de produção atual).
const firebaseConfig = montarConfigFirebase(import.meta.env, EMULADOR)

export const app = initializeApp(firebaseConfig)
// Login só vale enquanto a aba estiver aberta: abrir o site de novo (ou
// fechar sem querer e reabrir) sempre passa pela tela de login. Recarregar
// a página mantém o login. Decisão do dono do sistema, em 2026-10-07.
export const auth = initializeAuth(app, { persistence: browserSessionPersistence })

// O Firestore fica em lib/banco.js: só a área logada precisa dele, então ele
// não entra no carregamento da tela de login.
if (EMULADOR) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
