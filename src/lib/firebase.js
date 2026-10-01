import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Mesmo projeto Firebase do app original. A chave é pública por natureza;
// a proteção real está nas regras do Firestore e na restrição por domínio.
const firebaseConfig = {
  apiKey: 'AIzaSyAKGjOftcyDZ-5yPA-5NK55GohtGlrfbeQ',
  authDomain: 'track-logistica.firebaseapp.com',
  projectId: 'track-logistica',
  storageBucket: 'track-logistica.firebasestorage.app',
  messagingSenderId: '986198520521',
  appId: '1:986198520521:web:a4c088bc7c4e773156d318',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
