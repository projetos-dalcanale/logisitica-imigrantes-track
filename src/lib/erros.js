// REGISTRO DE ERROS: falhas no navegador da equipe vão para a coleção
// "erros" do Firestore (Console do Firebase -> Firestore -> erros). Ninguém
// lê pelo app; a regra só permite criar. Limitado por sessão para um erro
// em loop não lotar o banco.
import { addDoc, collection } from 'firebase/firestore'
import { auth, db } from './firebase'

const MAX_POR_SESSAO = 10
const corta = (texto, max) => String(texto ?? '').slice(0, max)

// Erros que não valem registro (ruído do navegador, sem efeito no app).
const IGNORAR = [/ResizeObserver loop/i, /^Script error\.?$/i]

// Monta o documento gravado (os campos são os que a regra do Firestore aceita).
export const montarRegistro = (erro, origem, extra = {}) => {
  const message = corta(erro?.message || erro || 'Erro desconhecido', 500)
  return {
    message,
    stack: corta(erro?.stack, 4000),
    componentStack: corta(extra.componentStack, 4000),
    origem: corta(origem, 40),
    pagina: corta(typeof location !== 'undefined' ? location.pathname : '', 200),
    userAgent: corta(typeof navigator !== 'undefined' ? navigator.userAgent : '', 300),
    versao: corta(import.meta.env.VITE_VERSAO || 'local', 40),
    createdAt: new Date().toISOString(),
  }
}

export const deveIgnorar = (message) => IGNORAR.some((re) => re.test(message))

const enviados = new Set()

export const registrarErro = (erro, origem, extra) => {
  try {
    const usuario = auth.currentUser
    if (!usuario || enviados.size >= MAX_POR_SESSAO) return
    const registro = montarRegistro(erro, origem, extra)
    const chave = `${origem}|${registro.message}`
    if (deveIgnorar(registro.message) || enviados.has(chave)) return
    enviados.add(chave)
    addDoc(collection(db, 'erros'), { ...registro, userId: usuario.uid, email: corta(usuario.email, 200) }).catch(() => {})
  } catch {
    /* o registro de erros nunca pode causar outro erro */
  }
}

// Depois de uma atualização publicada, uma aba aberta há tempo pode pedir um
// pedaço do app que não existe mais. Nesse caso recarrega (uma vez só).
export const ehVersaoAntiga = (message) =>
  /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(message || '')

export const recarregarSeVersaoAntiga = (erro) => {
  if (!ehVersaoAntiga(erro?.message)) return false
  try {
    if (sessionStorage.getItem('logitrack-recarregou')) return false
    sessionStorage.setItem('logitrack-recarregou', '1')
  } catch {
    return false
  }
  location.reload()
  return true
}

export const instalarRegistroDeErros = () => {
  window.addEventListener('error', (e) => {
    if (!recarregarSeVersaoAntiga(e.error)) registrarErro(e.error || e.message, 'janela')
  })
  window.addEventListener('unhandledrejection', (e) => {
    if (!recarregarSeVersaoAntiga(e.reason)) registrarErro(e.reason, 'promessa')
  })
}
