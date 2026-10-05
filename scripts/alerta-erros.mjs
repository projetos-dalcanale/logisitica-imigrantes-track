// Conta os erros registrados pelo app (coleção "erros") nas últimas horas.
// Usado pelo workflow "Alerta de erros": sai com código 1 quando há erros
// novos, para o GitHub avisar por e-mail. Só imprime quantidades (os
// registros do GitHub são públicos); os detalhes ficam no Console do Firebase.
//
// Uso: FIREBASE_SERVICE_ACCOUNT='{...}' node scripts/alerta-erros.mjs [horas]
import { appendFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const credencial = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || 'null')
if (!credencial) {
  console.log('::warning::Alerta de erros não configurado: falta o segredo FIREBASE_SERVICE_ACCOUNT.')
  process.exit(0)
}

const horas = Number(process.argv[2] || 24)
const desde = new Date(Date.now() - horas * 3600_000).toISOString()

initializeApp({ credential: cert(credencial) })
const snap = await getFirestore().collection('erros').where('createdAt', '>=', desde).get()

const erros = snap.docs.map((d) => d.data())
const mensagens = new Set(erros.map((e) => e.message)).size
const pessoas = new Set(erros.map((e) => e.userId)).size
const versoes = [...new Set(erros.map((e) => e.versao).filter(Boolean))].join(', ')

const resumo = erros.length
  ? `${erros.length} erro(s) nas últimas ${horas} h: ${mensagens} tipo(s) diferente(s), ${pessoas} pessoa(s) afetada(s)${versoes ? `, versão ${versoes}` : ''}. Detalhes: Console do Firebase → Firestore → coleção "erros".`
  : `Nenhum erro nas últimas ${horas} h.`

console.log(resumo)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Alerta de erros\n\n${resumo}\n`)
if (erros.length) {
  console.log(`::error::${resumo}`)
  process.exit(1)
}
