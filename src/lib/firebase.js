import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

// Testes de tela (e2e/): o app conversa com o emulador local do Firebase,
// sem tocar nos dados reais. Só liga com VITE_EMULADOR=1.
const EMULADOR = import.meta.env.VITE_EMULADOR === '1'

// Mesmo projeto Firebase do app original. A chave é pública por natureza;
// a proteção real está nas regras do Firestore e na restrição por domínio.
const firebaseConfig = {
  apiKey: 'AIzaSyAKGjOftcyDZ-5yPA-5NK55GohtGlrfbeQ',
  authDomain: 'track-logistica.firebaseapp.com',
  projectId: EMULADOR ? 'demo-logitrack' : 'track-logistica',
  storageBucket: 'track-logistica.firebasestorage.app',
  messagingSenderId: '986198520521',
  appId: '1:986198520521:web:a4c088bc7c4e773156d318',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

if (EMULADOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
