// Carrega os dados fictícios no EMULADOR local do Firebase (nada vai para a
// nuvem). Serve para gravar o vídeo e para demonstrações na própria máquina.
//
//   1) npx firebase emulators:start --only auth,firestore --project demo-logitrack
//   2) npm run demo:emulador
//   3) npm run dev -- --mode demo      (abre o app ligado ao emulador)
//
// Entrar no app com o e-mail e a senha impressos no fim da carga.
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { CONFIG, FRETES, PEDAGIOS, USUARIO_EMULADOR, gerarArquivados, gerarProcessos } from './dados-demo.mjs'

// Só o emulador: sem estes endereços o firebase-admin tentaria a nuvem.
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'

initializeApp({ projectId: 'demo-logitrack' })
const auth = getAuth()
const db = getFirestore()

const uid = await auth
  .getUserByEmail(USUARIO_EMULADOR.email)
  .then((u) => u.uid)
  .catch(async () => (await auth.createUser({ email: USUARIO_EMULADOR.email, password: USUARIO_EMULADOR.senha })).uid)

await db.doc('config/armadores').set(CONFIG.armadores)
await db.doc('config/terminals').set(CONFIG.terminals)
await db.doc('config/tipos').set(CONFIG.tipos)

const agora = new Date()
const processos = [...gerarProcessos(uid, agora), ...gerarArquivados(uid, agora)]
for (const { id, ...dados } of processos) await db.doc(`processes/${id}`).set(dados)

const carimbo = agora.toISOString()
for (const [i, ficha] of FRETES.entries()) {
  await db.doc(`fretes/demo-frete-${i + 1}`).set({ ...ficha, createdAt: carimbo, updatedAt: carimbo, updatedBy: USUARIO_EMULADOR.email })
}
for (const [i, rota] of PEDAGIOS.entries()) {
  await db.doc(`pedagios/demo-pedagio-${i + 1}`).set({ ...rota, createdAt: carimbo, updatedAt: carimbo, updatedBy: USUARIO_EMULADOR.email })
}

console.log(`Carga no emulador concluída: ${processos.length} processos, ${FRETES.length} fretes, ${PEDAGIOS.length} rotas de pedágio.`)
console.log(`Entrar com  ${USUARIO_EMULADOR.email}  /  ${USUARIO_EMULADOR.senha}`)
