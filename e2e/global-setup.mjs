// Prepara o emulador antes dos testes: cria o usuário e os dados de exemplo.
// O `firebase emulators:exec` já define FIRESTORE_EMULATOR_HOST e
// FIREBASE_AUTH_EMULATOR_HOST, então o firebase-admin fala com o emulador.
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { USUARIO, processos } from './dados.mjs'

export default async function prepararEmulador() {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('Rode pelos emuladores: npx firebase emulators:exec --only auth,firestore --project demo-logitrack "npx playwright test -c e2e/playwright.config.js"')
  }
  initializeApp({ projectId: 'demo-logitrack' })
  const usuario = await getAuth().createUser({ email: USUARIO.email, password: USUARIO.senha })
  const db = getFirestore()
  await db.doc('config/armadores').set({ lista: ['MSC', 'Maersk'] })
  await db.doc('config/terminals').set({ cheio: ['Santos Brasil'], vazio: ['Depot Cubatão'] })
  await db.doc('config/tipos').set({ lista: ["40'HC", "20'DC"] })
  for (const { id, ...dados } of processos(usuario.uid)) await db.doc(`processes/${id}`).set(dados)
}
