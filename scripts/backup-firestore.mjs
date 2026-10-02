// Exporta todas as coleções do Firestore (incluindo subcoleções) para um
// arquivo JSON. Usado pelo workflow "Backup do Firestore".
//
// Uso: FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}' node scripts/backup-firestore.mjs saida.json
// Requer: npm install --no-save firebase-admin
import { writeFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const saida = process.argv[2] || 'backup.json'
const credencial = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || 'null')
if (!credencial) {
  console.error('Defina FIREBASE_SERVICE_ACCOUNT com o JSON da conta de serviço.')
  process.exit(1)
}

initializeApp({ credential: cert(credencial) })
const db = getFirestore()

// Converte tipos especiais do Firestore em algo que cabe em JSON.
const serializar = (valor) => {
  if (valor === null || typeof valor !== 'object') return valor
  if (typeof valor.toDate === 'function') return { __tipo: 'timestamp', valor: valor.toDate().toISOString() }
  if (valor.constructor?.name === 'DocumentReference') return { __tipo: 'referencia', valor: valor.path }
  if (Array.isArray(valor)) return valor.map(serializar)
  return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, serializar(v)]))
}

const exportarColecao = async (colecao) => {
  const snap = await colecao.get()
  const docs = {}
  for (const doc of snap.docs) {
    const sub = await doc.ref.listCollections()
    docs[doc.id] = {
      dados: serializar(doc.data()),
      ...(sub.length && { subcolecoes: Object.fromEntries(await Promise.all(sub.map(async (c) => [c.id, await exportarColecao(c)]))) }),
    }
  }
  return docs
}

const colecoes = await db.listCollections()
const backup = {
  projeto: credencial.project_id,
  geradoEm: new Date().toISOString(),
  colecoes: {},
}
for (const c of colecoes) {
  backup.colecoes[c.id] = await exportarColecao(c)
  console.log(`${c.id}: ${Object.keys(backup.colecoes[c.id]).length} documento(s)`)
}

writeFileSync(saida, JSON.stringify(backup, null, 2))
console.log(`Backup salvo em ${saida}`)
