// ENSAIO DE RESTAURAÇÃO: prova que um backup pode ser restaurado, sem tocar
// nos dados reais. Grava cada coleção do backup numa cópia temporária
// ("ensaio_<coleção>"), lê de volta, compara documento por documento com o
// backup e, no fim (dando certo ou não), apaga as cópias temporárias.
//
// Uso: FIREBASE_SERVICE_ACCOUNT='{...}' node scripts/ensaio-restauracao.mjs backup.json
// Requer: npm ci --prefix scripts (instala o firebase-admin fixado em scripts/package-lock.json)
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { cert, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

const PREFIXO = 'ensaio_'
const arquivo = process.argv[2] || 'backup.json'
const credencial = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || 'null')
if (!credencial) {
  console.error('Defina FIREBASE_SERVICE_ACCOUNT com o JSON da conta de serviço.')
  process.exit(1)
}

initializeApp({ credential: cert(credencial) })
const db = getFirestore()
const backup = JSON.parse(readFileSync(arquivo, 'utf8'))

// Mesmas conversões do backup e da restauração.
const desserializar = (v) => {
  if (v === null || typeof v !== 'object') return v
  if (v.__tipo === 'timestamp') return Timestamp.fromDate(new Date(v.valor))
  if (v.__tipo === 'referencia') return db.doc(v.valor)
  if (Array.isArray(v)) return v.map(desserializar)
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, desserializar(x)]))
}
const serializar = (v) => {
  if (v === null || typeof v !== 'object') return v
  if (typeof v.toDate === 'function') return { __tipo: 'timestamp', valor: v.toDate().toISOString() }
  if (v.constructor?.name === 'DocumentReference') return { __tipo: 'referencia', valor: v.path }
  if (Array.isArray(v)) return v.map(serializar)
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, serializar(x)]))
}

const apagarColecao = async (ref) => {
  const snap = await ref.get()
  for (const d of snap.docs) {
    for (const sub of await d.ref.listCollections()) await apagarColecao(sub)
    await d.ref.delete()
  }
}

const colecoes = Object.entries(backup.colecoes)
let problemas = 0
console.log(`Backup de ${backup.geradoEm} (projeto ${backup.projeto})`)

try {
  for (const [nome, docs] of colecoes) {
    const destino = db.collection(PREFIXO + nome)
    const ids = Object.keys(docs)

    // 1. Restaura na cópia temporária
    for (const id of ids) await destino.doc(id).set(desserializar(docs[id].dados))

    // 2. Lê de volta e compara com o backup
    const snap = await destino.get()
    const divergentes = ids.filter((id) => {
      const lido = snap.docs.find((d) => d.id === id)
      return !lido || !isDeepStrictEqual(serializar(lido.data()), docs[id].dados)
    })
    const ok = snap.size === ids.length && divergentes.length === 0
    if (!ok) problemas++
    console.log(`${ok ? 'OK ' : 'ERRO'} ${nome}: ${ids.length} no backup, ${snap.size} restaurado(s), ${divergentes.length} diferente(s)`)
    if (divergentes.length) console.log(`     diferentes: ${divergentes.slice(0, 5).join(', ')}`)
  }
} finally {
  // 3. Apaga as cópias temporárias, sempre
  for (const [nome] of colecoes) await apagarColecao(db.collection(PREFIXO + nome))
  console.log('Cópias temporárias apagadas.')
}

if (problemas) {
  console.error(`Ensaio falhou em ${problemas} coleção(ões).`)
  process.exit(1)
}
console.log('Ensaio concluído: o backup restaura todos os documentos sem diferenças.')
