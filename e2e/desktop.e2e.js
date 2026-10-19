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
