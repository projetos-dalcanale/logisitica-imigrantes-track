// COR DE DESTAQUE (opcional, fica salva no navegador de cada pessoa, como o
// modo escuro). Os tons de cada cor ficam no index.css; aqui só a lista, para
// o menu e para validar o que vem do localStorage. O vermelho é o padrão e não
// usa atributo. PDFs e imagens de status continuam sempre vermelhos.
export const CHAVE_COR = 'logitrack-accent'
export const COR_PADRAO = 'vermelho'

// `claro`/`escuro`: o tom 500 de cada modo (bolinha do menu).
// `barra`: cor da barra do navegador no celular (meta theme-color).
export const CORES = [
  { id: 'vermelho', nome: 'Vermelho', claro: 'rgb(206 17 30)', escuro: 'rgb(255 69 58)', barra: '#B10004' },
  { id: 'azul', nome: 'Azul', claro: 'rgb(29 78 216)', escuro: 'rgb(10 132 255)', barra: '#1A45BE' },
  { id: 'petroleo', nome: 'Petróleo', claro: 'rgb(15 118 110)', escuro: 'rgb(30 158 143)', barra: '#0D6861' },
  { id: 'laranja', nome: 'Laranja', claro: 'rgb(194 65 12)', escuro: 'rgb(232 104 28)', barra: '#AB390B' },
  { id: 'grafite', nome: 'Grafite', claro: 'rgb(55 65 81)', escuro: 'rgb(138 145 158)', barra: '#303947' },
]

export function normalizarCor(valor) {
  return CORES.some((c) => c.id === valor) ? valor : COR_PADRAO
}

// Aplica a cor na tag <html> (ou em qualquer objeto com setAttribute/removeAttribute).
export function aplicarCor(root, valor) {
  const cor = normalizarCor(valor)
  if (cor === COR_PADRAO) root.removeAttribute('data-accent')
  else root.setAttribute('data-accent', cor)
  return cor
}

export function corDaBarra(valor) {
  return CORES.find((c) => c.id === normalizarCor(valor)).barra
}
