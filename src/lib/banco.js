import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { app, EMULADOR } from './firebase'

// Banco de dados (Firestore). Importado só pela área logada e pelo registro
// de erros (sob demanda), nunca pela tela de login.
export const db = getFirestore(app)

if (EMULADOR) connectFirestoreEmulator(db, '127.0.0.1', 8080)
