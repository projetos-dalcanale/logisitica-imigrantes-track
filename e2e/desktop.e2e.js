// Roteiros do uso no PC (tela larga): ficha com seções, painel lateral, tabela,
// Início e exportação. Compartilham o banco do emulador com app.e2e.js, que
// roda antes (ordem alfabética): aqui cada teste cria os próprios dados ou
// tolera o que já existe.
import { expect, test } from '@playwright/test'
import { USUARIO } from './dados.mjs'

const entrar = async (page) => {
  await page.goto('/')
  await page.locator('#auth-email').fill(USUARIO.email)
  await page.locator('#auth-password').fill(USUARIO.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
}

const irPara = (page, aba) => page.locator('aside').getByRole('button', { name: new RegExp(aba) }).click()

// Cria uma importação com o nome dado (um contêiner, armador MSC).
const criarImportacao = async (page, nome) => {
  await page.getByRole('button', { name: 'Novo processo', exact: true }).click()
  await page.locator('#np-importador').fill(nome)
  await page.getByRole('button', { name: 'Obrigatório' }).click()
  await page.getByRole('option', { name: 'MSC', exact: true }).click()
  await page.getByRole('button', { name: 'Criar' }).click()
  await expect(page.getByText(nome)).toBeVisible()
}

test('ficha: recolhe uma seção, lembra a escolha e o índice leva até o contêiner', async ({ page }) => {
  const nome = `Ficha E2E ${Date.now()}`
  await entrar(page)
  await criarImportacao(page, nome)

  await page.getByText(nome).click()
  const ficha = page.getByRole('dialog')
  const observacoes = ficha.locator('#ficha-observacoes h3 button')
  await expect(observacoes).toHaveAttribute('aria-expanded', 'true')
  await observacoes.click()
  await expect(observacoes).toHaveAttribute('aria-expanded', 'false')

  // O índice leva até o contêiner e rola até ele.
  const indice = ficha.getByRole('navigation', { name: 'Seções da ficha' })
  await indice.getByRole('button', { name: 'Contêiner 1' }).click()
  await expect(ficha.locator('[id^="ficha-conteiner-"] h3')).toBeInViewport()

  // A escolha fica guardada: recarrega, reabre e a seção continua recolhida.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
  await irPara(page, 'Importações')
  await page.getByText(nome).click()
  await expect(page.getByRole('dialog').locator('#ficha-observacoes h3 button')).toHaveAttribute('aria-expanded', 'false')
})

test.describe('painel lateral (tela larga)', () => {
  test.use({ viewport: { width: 1600, height: 900 } })

  test('abre o processo num painel ao lado da lista e troca de processo sem fechar', async ({ page }) => {
    const a = `Painel A ${Date.now()}`
    const b = `Painel B ${Date.now()}`
    await entrar(page)
    await criarImportacao(page, a)
    await criarImportacao(page, b)

    await page.getByText(a).click()
    const painel = page.getByRole('complementary', { name: 'Detalhes do processo' })
    await expect(painel.getByRole('heading', { name: a })).toBeVisible()
    // A lista continua visível e clicável; nada de janela por cima.
    await expect(page.getByText(b)).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByText(b).click()
    await expect(painel.getByRole('heading', { name: b })).toBeVisible()
    await expect(painel.getByRole('heading', { name: a })).toHaveCount(0)
  })

  test('o painel fecha sozinho quando o processo é arquivado, sem erro', async ({ page }) => {
    const erros = []
    page.on('pageerror', (e) => erros.push(e.message))
    const nome = `Painel arquivar ${Date.now()}`
    await entrar(page)
    await criarImportacao(page, nome)
    await page.getByText(nome).click()
    const painel = page.getByRole('complementary', { name: 'Detalhes do processo' })
    await painel.getByRole('button', { name: 'Arquivar', exact: true }).click()
    await page.getByRole('dialog', { name: 'Arquivar processo?' }).getByRole('button', { name: 'Arquivar' }).click()
    await expect(painel).toHaveCount(0)
    expect(erros).toEqual([])
  })

  test('atravessar 1400 px com um processo aberto troca painel e janela, nunca os dois', async ({ page }) => {
    const nome = `Painel largura ${Date.now()}`
    await entrar(page)
    await criarImportacao(page, nome)
    await page.getByText(nome).click()
    await expect(page.getByRole('complementary', { name: 'Detalhes do processo' })).toBeVisible()

    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Detalhes do processo' })).toHaveCount(0)

    await page.setViewportSize({ width: 1600, height: 900 })
    await expect(page.getByRole('complementary', { name: 'Detalhes do processo' })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test('em tela menor (1280) o processo continua abrindo em janela', async ({ page }) => {
  const nome = `Janela E2E ${Date.now()}`
  await entrar(page)
  await criarImportacao(page, nome)
  await page.getByText(nome).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Detalhes do processo' })).toHaveCount(0)
})

test.describe('lista em tabela', () => {
  test.use({ viewport: { width: 1600, height: 900 } })

  test('tabela: passar o mouse mostra a prévia do processo e tirar o mouse a esconde', async ({ page }) => {
    const nome = `Prévia Tabela ${Date.now()}`
    await entrar(page)
    await criarImportacao(page, nome)
    await page.getByRole('radio', { name: 'Tabela' }).click()

    await page.locator('tr[data-linha]').filter({ hasText: nome }).hover()
    const previa = page.locator('.previa-card')
    await expect(previa).toContainText(nome)
    await expect(previa).toContainText('Agendar carregamento')

    await page.mouse.move(5, 5)
    await expect(previa).toHaveCount(0)
  })

  test('tabela: alterna o modo, ordena por cliente, abre com Enter e lembra a escolha', async ({ page }) => {
    const alfa = `Alfa Tabela ${Date.now()}`
    const zeta = `Zeta Tabela ${Date.now()}`
    await entrar(page)
    await criarImportacao(page, zeta)
    await criarImportacao(page, alfa)

    await page.getByRole('radio', { name: 'Tabela' }).click()
    const linhas = page.locator('tr[data-linha]')
    await expect(linhas.filter({ hasText: alfa })).toBeVisible()
    const posicao = async (nome) => (await linhas.allInnerTexts()).findIndex((t) => t.includes(nome))

    // Um clique no título ordena de A a Z; outro, de Z a A.
    const cabecalho = page.getByRole('columnheader', { name: 'Cliente' })
    await cabecalho.getByRole('button').click()
    await expect(cabecalho).toHaveAttribute('aria-sort', 'ascending')
    expect(await posicao(alfa)).toBeLessThan(await posicao(zeta))
    await cabecalho.getByRole('button').click()
    await expect(cabecalho).toHaveAttribute('aria-sort', 'descending')
    expect(await posicao(zeta)).toBeLessThan(await posicao(alfa))

    // Teclado: foca a linha e abre com Enter (painel lateral nesta largura).
    await linhas.filter({ hasText: alfa }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('complementary', { name: 'Detalhes do processo' }).getByRole('heading', { name: alfa })).toBeVisible()

    // A escolha do modo fica guardada.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
    await irPara(page, 'Importações')
    await expect(page.getByRole('radio', { name: 'Tabela' })).toHaveAttribute('aria-checked', 'true')
  })
})

test.describe('Início em tela grande', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test('início: mostra a semana, cada dia é um botão e a página cabe sem rolar', async ({ page }) => {
    await entrar(page)
    await expect(page.getByRole('heading', { name: 'Próximos 7 dias' })).toBeVisible()
    // 7 dias, cada um com o total de compromissos no nome.
    const dias = page.getByRole('button', { name: /^\S{3} \d{2}\/\d{2}: \d+ compromissos?$/ })
    await expect(dias).toHaveCount(7)
    await expect(dias.first()).toHaveAttribute('aria-pressed', 'true')

    const rola = await page.locator('#conteudo').evaluate((el) => el.scrollHeight > el.clientHeight)
    expect(rola).toBe(false)
  })
})
