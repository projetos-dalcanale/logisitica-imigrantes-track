// Status para clientes com vários contêineres: o tipo aparece ao lado do número e dá para
// escolher de quais contêineres falar (nunca fica sem nenhum). Compartilha o banco do
// emulador com os outros arquivos (ordem alfabética): o teste cria o próprio processo, com números
// de contêiner que não existem nos dados de exemplo (senão aparece o aviso de contêiner já em uso).
import { expect, test } from '@playwright/test'
import { USUARIO } from './dados.mjs'

const entrar = async (page) => {
  await page.goto('/')
  await page.locator('#auth-email').fill(USUARIO.email)
  await page.locator('#auth-password').fill(USUARIO.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
}

test('escolhe de quais contêineres falar e o tipo aparece ao lado do número', async ({ page }) => {
  const nome = `Status Varios ${Date.now()}`
  await entrar(page)

  // processo de importação com 2 contêineres de tipos diferentes
  await page.getByRole('button', { name: 'Novo processo', exact: true }).click()
  await page.locator('#np-importador').fill(nome)
  await page.getByRole('button', { name: 'Obrigatório' }).click()
  await page.getByRole('option', { name: 'MSC', exact: true }).click()
  await page.getByRole('button', { name: 'Adicionar contêiner' }).click()
  const numeros = page.getByPlaceholder('ABCD 123.456-7')
  await numeros.nth(0).fill('STAT 100.001-0')
  await numeros.nth(1).fill('STAT 100.002-0')
  await page.getByRole('button', { name: 'Tipo', exact: true }).first().click()
  await page.getByRole('option', { name: "40'HC", exact: true }).click()
  await page.getByRole('button', { name: 'Tipo', exact: true }).first().click()
  await page.getByRole('option', { name: "20'DC", exact: true }).click()
  await page.getByRole('button', { name: 'Criar' }).click()
  await expect(page.getByText(nome)).toBeVisible()

  await page.locator('aside').getByRole('button', { name: /Status para clientes/ }).click()
  await page.getByRole('button', { name: /Selecione o processo/ }).click()
  await page.getByRole('option', { name: new RegExp(nome) }).click()

  // um botão por contêiner, com o tipo ao lado do número, todos marcados no começo
  const primeiro = page.getByRole('checkbox', { name: "STAT 100.001-0 (40'HC)" })
  const segundo = page.getByRole('checkbox', { name: "STAT 100.002-0 (20'DC)" })
  await expect(primeiro).toHaveAttribute('aria-checked', 'true')
  await expect(segundo).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('button', { name: 'Marcar todos' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Outro', exact: true }).click()
  await expect(page.locator('canvas')).toBeVisible()

  // desmarca o segundo: só o primeiro fica; "Marcar todos" aparece
  await segundo.click()
  await expect(segundo).toHaveAttribute('aria-checked', 'false')
  await expect(primeiro).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('button', { name: 'Marcar todos' })).toBeVisible()

  // o último marcado não se desmarca: o status sempre fala de pelo menos um contêiner
  await primeiro.click()
  await expect(primeiro).toHaveAttribute('aria-checked', 'true')

  // a escolha continua depois de recarregar a página (fica no rascunho)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
  await page.locator('aside').getByRole('button', { name: /Status para clientes/ }).click()
  await expect(page.getByRole('checkbox', { name: "STAT 100.002-0 (20'DC)" })).toHaveAttribute('aria-checked', 'false')

  await page.getByRole('button', { name: 'Marcar todos' }).click()
  await expect(page.getByRole('checkbox', { name: "STAT 100.002-0 (20'DC)" })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('button', { name: 'Marcar todos' })).toHaveCount(0)
})
