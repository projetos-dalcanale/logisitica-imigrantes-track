// Pendências: criar pelo campo rápido, marcar como feita, aparecer e concluir pelo
// Início, atrasadas, editar, excluir, vincular a um processo e atalhos. Compartilha
// o banco do emulador com os outros arquivos (ordem alfabética): cada teste cria os
// próprios dados (título com a hora) e termina marcando a pendência como feita, para
// não deixar nada aberto em "Hoje" (o Início mostra poucas linhas por seção).
import { expect, test } from '@playwright/test'
import { USUARIO } from './dados.mjs'

const entrar = async (page) => {
  await page.goto('/')
  await page.locator('#auth-email').fill(USUARIO.email)
  await page.locator('#auth-password').fill(USUARIO.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
}

// A seção da barra lateral também se chama "Pendências": o item é achado pelo título ("Pendências (4)").
const itemPendencias = (page) => page.locator('aside button[title^="Pendências"]')
const irParaPendencias = (page) => itemPendencias(page).click()
const caixa = (page, titulo) => page.getByRole('checkbox', { name: `Marcar “${titulo}” como feita` })
const grupo = (page, nome) => page.locator('section', { has: page.getByRole('heading', { name: nome, exact: true }) })

const criar = async (page, titulo) => {
  await page.getByLabel('Nova pendência').fill(titulo)
  await page.getByLabel('Nova pendência').press('Enter')
  await expect(page.getByText(titulo)).toBeVisible()
}

// Dia de ontem no fuso do navegador (o mesmo que o app usa).
const ontem = (page) =>
  page.evaluate(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

test('cria pelo campo rápido e aparece em Hoje; título só com espaços não cria', async ({ page }) => {
  const titulo = `Encerrar MDFE ${Date.now()}`
  await entrar(page)
  await irParaPendencias(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Pendências' })).toBeVisible()

  await criar(page, titulo)
  await expect(grupo(page, 'Hoje').getByText(titulo)).toBeVisible()
  // o campo fica limpo e com o cursor, pronto para a próxima
  await expect(page.getByLabel('Nova pendência')).toHaveValue('')

  const campo = page.getByLabel('Nova pendência')
  await campo.fill('   ')
  await campo.press('Enter')
  await expect(campo).toHaveValue('   ') // não criou e não limpou

  await caixa(page, titulo).click() // deixa nada aberto
  await expect(grupo(page, 'Feitas recentemente').getByText(titulo)).toBeVisible()
})

test('marca como feita, vai para "Feitas recentemente" e volta ao desmarcar', async ({ page }) => {
  const titulo = `Verificar terminal ${Date.now()}`
  await entrar(page)
  await irParaPendencias(page)
  await criar(page, titulo)

  await caixa(page, titulo).click()
  await expect(grupo(page, 'Feitas recentemente').getByText(titulo)).toBeVisible()
  await expect(caixa(page, titulo)).toHaveAttribute('aria-checked', 'true')

  await caixa(page, titulo).click()
  await expect(grupo(page, 'Hoje').getByText(titulo)).toBeVisible()
  await caixa(page, titulo).click() // deixa nada aberto
  await expect(grupo(page, 'Feitas recentemente').getByText(titulo)).toBeVisible()
})

test('aparece no Início, acima dos compromissos, e se conclui por lá', async ({ page }) => {
  const titulo = `Checar devolução ${Date.now()}`
  await entrar(page)
  await irParaPendencias(page)
  await criar(page, titulo)

  await page.locator('aside').getByRole('button', { name: 'Início' }).click()
  const hoje = page.locator('#agenda-hoje')
  await expect(hoje.getByText(titulo)).toBeVisible()
  await expect(hoje.getByText('Pendência', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Compromissos hoje/ })).not.toContainText(/^\s*0\b/)

  await caixa(page, titulo).click()
  await expect(page.getByText(titulo)).toHaveCount(0)
})

test('com o dia de ontem fica em Atrasadas e conta no Início', async ({ page }) => {
  const titulo = `Pendência atrasada ${Date.now()}`
  await entrar(page)
  await irParaPendencias(page)
  await page.getByLabel('Dia da pendência').fill(await ontem(page))
  await criar(page, titulo)
  await expect(grupo(page, 'Atrasadas').getByText(titulo)).toBeVisible()
  await expect(grupo(page, 'Atrasadas').getByText('ontem')).toBeVisible()

  await page.locator('aside').getByRole('button', { name: 'Início' }).click()
  await expect(page.locator('#agenda-atrasados').getByText(titulo)).toBeVisible()
  await caixa(page, titulo).click() // conclui pelo Início
  await expect(page.getByText(titulo)).toHaveCount(0)
})

test('edita título e dia, e exclui com confirmação', async ({ page }) => {
  const titulo = `Pendência original ${Date.now()}`
  const novo = `Pendência editada ${Date.now()}`
  await entrar(page)
  await irParaPendencias(page)
  await criar(page, titulo)

  await page.getByText(titulo).click()
  const janela = page.getByRole('dialog')
  await janela.locator('#pend-titulo').fill(novo)
  await janela.locator('#pend-dia').fill(await page.evaluate(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }))
  await janela.getByRole('button', { name: 'Salvar' }).click()
  await expect(grupo(page, 'Amanhã').getByText(novo)).toBeVisible()
  await expect(page.getByText(titulo)).toHaveCount(0)

  await page.getByText(novo).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir pendência' }).click()
  await page.getByRole('dialog', { name: 'Excluir esta pendência?' }).getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(page.getByText(novo)).toHaveCount(0)
})

test('vincula a um processo, abre a ficha pelo chip e continua abrindo depois de arquivado', async ({ page }) => {
  const processo = `Vinculo ${Date.now()}`
  const titulo = `Pendência com processo ${Date.now()}`
  await entrar(page)
  // processo ativo para vincular (criado no Início, onde o botão ainda é "Novo processo")
  await page.getByRole('button', { name: 'Novo processo', exact: true }).click()
  await page.locator('#np-importador').fill(processo)
  await page.getByRole('button', { name: 'Obrigatório' }).click()
  await page.getByRole('option', { name: 'MSC', exact: true }).click()
  await page.getByRole('button', { name: 'Criar' }).click()
  await expect(page.getByText(processo)).toBeVisible()

  await irParaPendencias(page)
  await criar(page, titulo)
  await page.getByText(titulo).click()
  const janela = page.getByRole('dialog')
  await janela.getByRole('button', { name: 'Nenhum' }).click()
  await page.getByRole('option', { name: new RegExp(processo) }).click()
  await janela.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0) // a janela terminou de fechar

  const chip = page.getByRole('button', { name: new RegExp(processo) })
  await expect(chip).toBeVisible()
  await chip.click()
  const ficha = page.getByRole('dialog')
  await expect(ficha.getByRole('heading', { name: processo }).last()).toBeVisible() // o título visível da ficha

  // arquiva o processo: o chip continua e o clique carrega os arquivados e abre a ficha
  await ficha.getByRole('button', { name: 'Arquivar', exact: true }).click()
  await page.getByRole('dialog', { name: 'Arquivar processo?' }).getByRole('button', { name: 'Arquivar' }).click()
  await expect(page.getByText('Processo arquivado.')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(chip).toBeVisible()
  await chip.click()
  const arquivada = page.getByRole('dialog')
  await expect(arquivada.getByRole('heading', { name: processo }).last()).toBeVisible()
  await expect(arquivada.getByText('Arquivado', { exact: true })).toBeVisible()
  await expect(page.getByText(/Este processo não está na sua lista/)).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await caixa(page, titulo).click() // deixa nada aberto
})

test('Enter duas vezes seguidas no campo rápido cria uma pendência só', async ({ page }) => {
  const titulo = `Pendência sem duplicar ${Date.now()}`
  await entrar(page)
  await irParaPendencias(page)
  const campo = page.getByLabel('Nova pendência')
  await campo.fill(titulo)
  // os dois envios no mesmo instante: o pior caso, sem esperar a primeira gravação
  await campo.evaluate((el) => {
    el.form.requestSubmit()
    el.form.requestSubmit()
  })
  await expect(grupo(page, 'Hoje').getByText(titulo)).toBeVisible()
  await expect(campo).toHaveValue('')
  await page.waitForTimeout(1000) // dá tempo de uma segunda gravação chegar, se houvesse
  await expect(page.getByText(titulo)).toHaveCount(1)

  await caixa(page, titulo).click() // deixa nada aberto
  await expect(grupo(page, 'Feitas recentemente').getByText(titulo)).toBeVisible()
})

test('atalhos: a tecla 4 abre Pendências, N foca o campo rápido e a barra mostra o 4', async ({ page }) => {
  await entrar(page)
  await expect(itemPendencias(page)).toHaveAttribute('title', 'Pendências (4)')
  await page.keyboard.press('4')
  await expect(page.getByRole('heading', { level: 1, name: 'Pendências' })).toBeVisible()
  await expect(page.getByLabel('Nova pendência')).toBeVisible() // a lista aparece depois da transição de aba
  await page.keyboard.press('n')
  await expect(page.getByLabel('Nova pendência')).toBeFocused()
})
