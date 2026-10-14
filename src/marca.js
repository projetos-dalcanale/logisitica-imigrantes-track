// MARCA — nome da empresa que usa o sistema, num só lugar. Login, menu,
// abertura, PDF do processo, imagem de status e o app instalado leem daqui.
//
// Para outra empresa, defina VITE_EMPRESA_NOME no build (Vercel > Settings >
// Environment Variables, ou num .env local). Sem a variável vale o padrão.
// Não escreva o nome da empresa direto nos componentes: marca.test.js barra.
export const EMPRESA_PADRAO = 'Transportes Imigrantes'

export const PRODUTO = 'LogiTrack Pro'

// import.meta.env não existe quando o vite.config.js importa este arquivo.
export const EMPRESA = import.meta.env?.VITE_EMPRESA_NOME?.trim() || EMPRESA_PADRAO
