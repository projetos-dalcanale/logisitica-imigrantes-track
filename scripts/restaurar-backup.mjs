// Restaura um backup gerado por backup-firestore.mjs.
//
// 1. Baixe o arquivo .json.enc na aba Actions e descriptografe:
//      openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in logitrack-backup-AAAA-MM-DD.json.enc -out backup.json
// 2. Rode (sobrescreve os documentos com o conteúdo do backup):
//      FIREBASE_SERVICE_ACCOUNT='{...}' node scripts/restaurar-backup.mjs backup.json --confirmar
//    Para restaurar só uma coleção:  ... --colecao fretes --confirmar
//
// Documentos criados depois do backup NÃO são apagados.
// Requer: npm ci --prefix scripts (instala o firebase-admin fixado em scripts/package-lock.json)
import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

const [arquivo, ...flags] = process.argv.slice(2)
const apenas = flags.includes('--colecao') ? flags[flags.indexOf('--colecao') + 1] : null
const credencial = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || 'null')

if (!arquivo || !credencial) {
  console.error('Uso: FIREBASE_SERVICE_ACCOUNT=... node scripts/restaurar-backup.mjs backup.json [--colecao nome] --confirmar')
  process.exit(1)
}

const backup = JSON.parse(readFileSync(arquivo, 'utf8'))
const colecoes = Object.entries(backup.colecoes).filter(([nome]) => !apenas || nome === apenas)
const total = colecoes.reduce((n, [, docs]) => n + Object.keys(docs).length, 0)

console.log(`Backup de ${backup.geradoEm} (projeto ${backup.projeto})`)
colecoes.forEach(([nome, docs]) => console.log(`  ${nome}: ${Object.keys(docs).length} documento(s)`))

if (!flags.includes('--confirmar')) {
  console.log(`\nNada foi alterado. Para gravar ${total} documento(s) no Firestore, rode de novo com --confirmar.`)
  process.exit(0)
}

initializeApp({ credential: cert(credencial) })
const db = getFirestore()

const desserializar = (valor) => {
  if (valor === null || typeof valor !== 'object') return valor
  if (valor.__tipo === 'timestamp') return Timestamp.fromDate(new Date(valor.valor))
  if (valor.__tipo === 'referencia') return db.doc(valor.valor)
  if (Array.isArray(valor)) return valor.map(desserializar)
  return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, desserializar(v)]))
}

const restaurar = async (ref, docs) => {
  for (const [id, { dados, subcolecoes }] of Object.entries(docs)) {
    await ref.doc(id).set(desserializar(dados))
    for (const [sub, subDocs] of Object.entries(subcolecoes || {})) await restaurar(ref.doc(id).collection(sub), subDocs)
  }
}

for (const [nome, docs] of colecoes) {
  await restaurar(db.collection(nome), docs)
  console.log(`${nome}: restaurada`)
}
console.log('Restauração concluída.')
