// Carrega os dados fictícios no projeto MODELO na nuvem (logitrack-modelo),
// entrando com a conta de demonstração. Quem roda é o dono, no próprio
// terminal: a senha só existe na variável de ambiente da sessão dele.
//
//   PowerShell:
//     $env:DEMO_EMAIL = 'conta-de-demonstracao@exemplo.com'
//     $env:DEMO_SENHA = 'a-senha-da-conta'
//     npm run demo:nuvem
//
// Sem as duas variáveis, ou apontando para um projeto que não seja de
// demonstração, o script se recusa a rodar. Rodar de novo atualiza os mesmos
// documentos (ids fixos "demo-..."), sem duplicar.
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getFirestore, setDoc, updateDoc } from 'firebase/firestore'
import { montarConfigFirebase } from '../../src/lib/firebaseConfig.js'
import { CONFIG, FRETES, PEDAGIOS, gerarArquivados, gerarProcessos } from './dados-demo.mjs'

// Variáveis do projeto modelo (as mesmas do `npm run dev -- --mode modelo`).
try {
  process.loadEnvFile(new URL('../../.env.modelo', import.meta.url))
} catch {
  // sem .env.modelo, valem as variáveis já definidas no ambiente
}

const config = montarConfigFirebase(process.env)

// Trava: nunca gravar em produção. Só projetos com "modelo" ou "demo" no id.
if (!/modelo|demo/i.test(config.projectId)) {
  console.error(`Recusado: "${config.projectId}" não parece um projeto de demonstração.`)
  process.exit(1)
}

const email = process.env.DEMO_EMAIL?.trim()
const senha = process.env.DEMO_SENHA
if (!email || !senha) {
  console.error('Defina DEMO_EMAIL e DEMO_SENHA na sessão do terminal (veja o topo deste arquivo).')
  process.exit(1)
}

const app = initializeApp(config)
const auth = getAuth(app)
const db = getFirestore(app)

const { user } = await signInWithEmailAndPassword(auth, email, senha)
console.log(`Conectado ao projeto ${config.projectId} como ${user.email}.`)

await setDoc(doc(db, 'config/armadores'), CONFIG.armadores)
await setDoc(doc(db, 'config/terminals'), CONFIG.terminals)
await setDoc(doc(db, 'config/tipos'), CONFIG.tipos)

const agora = new Date()
const ativos = gerarProcessos(user.uid, agora)
const arquivados = gerarArquivados(user.uid, agora)
// A regra do Firestore só deixa um processo nascer "active": os arquivados
// são gravados ativos e depois atualizados.
for (const { id, ...dados } of [...ativos, ...arquivados]) {
  await setDoc(doc(db, 'processes', id), { ...dados, status: 'active' })
}
for (const { id } of arquivados) await updateDoc(doc(db, 'processes', id), { status: 'archived' })

const carimbo = agora.toISOString()
for (const [i, ficha] of FRETES.entries()) {
  await setDoc(doc(db, 'fretes', `demo-frete-${i + 1}`), { ...ficha, createdAt: carimbo, updatedAt: carimbo, updatedBy: user.email })
}
for (const [i, rota] of PEDAGIOS.entries()) {
  await setDoc(doc(db, 'pedagios', `demo-pedagio-${i + 1}`), { ...rota, createdAt: carimbo, updatedAt: carimbo, updatedBy: user.email })
}

console.log(`Carga concluída: ${ativos.length + arquivados.length} processos, ${FRETES.length} fretes, ${PEDAGIOS.length} rotas de pedágio.`)
process.exit(0)
