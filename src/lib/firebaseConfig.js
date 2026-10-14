// CONFIGURAÇÃO DO FIREBASE de cada instância. Sem variáveis de ambiente vale o
// projeto de produção atual, então nada muda para ele. Outra empresa
// define VITE_FIREBASE_* no build (veja o README, "Instância para outra empresa").
//
// A chave de API é pública por natureza; a proteção real está nas regras do
// Firestore e na restrição da chave por domínio.
const PADRAO = {
  apiKey: 'AIzaSyAKGjOftcyDZ-5yPA-5NK55GohtGlrfbeQ',
  authDomain: 'track-logistica.firebaseapp.com',
  projectId: 'track-logistica',
  storageBucket: 'track-logistica.firebasestorage.app',
  messagingSenderId: '986198520521',
  appId: '1:986198520521:web:a4c088bc7c4e773156d318',
}

const valor = (env, nome, padrao) => env?.[nome]?.trim() || padrao

// `emulador`: testes de tela (e2e/) e demonstração local usam o emulador, com
// um projeto "demo-" que nunca toca em dados reais.
export const montarConfigFirebase = (env, emulador = false) => ({
  apiKey: valor(env, 'VITE_FIREBASE_API_KEY', PADRAO.apiKey),
  authDomain: valor(env, 'VITE_FIREBASE_AUTH_DOMAIN', PADRAO.authDomain),
  projectId: emulador ? 'demo-logitrack' : valor(env, 'VITE_FIREBASE_PROJECT_ID', PADRAO.projectId),
  storageBucket: valor(env, 'VITE_FIREBASE_STORAGE_BUCKET', PADRAO.storageBucket),
  messagingSenderId: valor(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID', PADRAO.messagingSenderId),
  appId: valor(env, 'VITE_FIREBASE_APP_ID', PADRAO.appId),
})
