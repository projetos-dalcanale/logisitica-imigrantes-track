// CONTRASTE DAS CORES (WCAG 2.x), para o teste que confere os tokens do
// index.css em cada tema e cor de destaque. Só serve ao teste; não vai para o app.

const luminancia = ([r, g, b]) => {
  const canal = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}

// Razão entre duas cores [r, g, b]: de 1 (iguais) a 21 (preto e branco).
export const razaoContraste = (a, b) => {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (escuro + 0.05)
}

const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Tokens "--nome: R G B;" do bloco do seletor dado ({} se o bloco não existe).
export const lerTokens = (css, seletor) => {
  const bloco = new RegExp(`(?:^|\\n)${escapar(seletor)}\\s*\\{([^}]*)\\}`).exec(css)
  const tokens = {}
  if (!bloco) return tokens
  for (const m of bloco[1].matchAll(/--([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) tokens[m[1]] = [+m[2], +m[3], +m[4]]
  return tokens
}

// Valores que valem num tema ('light' | 'dark') com uma cor de destaque, na
// mesma ordem em que o CSS se sobrepõe: base, tema escuro, destaque, destaque no escuro.
export const tokensDoTema = (css, tema, cor) => {
  const escuro = tema === 'dark'
  const destaque = cor && cor !== 'vermelho'
  return {
    ...lerTokens(css, ':root'),
    ...(escuro ? lerTokens(css, ':root[data-theme="dark"]') : {}),
    ...(destaque ? lerTokens(css, `:root[data-accent="${cor}"]`) : {}),
    ...(destaque && escuro ? lerTokens(css, `:root[data-theme="dark"][data-accent="${cor}"]`) : {}),
  }
}

// Cor com transparência `t` (0 a 1) sobre um fundo opaco: o que o olho vê, por
// exemplo, num campo com "navy-700 / 55%".
export const misturar = (cor, fundo, t) => cor.map((c, i) => Math.round(c * t + fundo[i] * (1 - t)))
