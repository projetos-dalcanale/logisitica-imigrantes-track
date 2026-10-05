// Roteiros principais do dia a dia, clicando como uma pessoa. Rodam em
// ordem (o 3º arquiva o processo que o 1º confere).
import { expect, test } from '@playwright/test'
import { USUARIO } from './dados.mjs'

const entrar = async (page) => {
  await page.goto('/')
  await page.locator('#auth-email').fill(USUARIO.email)
  await page.locator('#auth-password').fill(USUARIO.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Importações' })).toBeVisible()
}

const irPara = (page, aba) => page.locator('aside').getByRole('button', { name: new RegExp(aba) }).click()

test('entra e vê os ativos; os arquivados carregam ao abrir a aba', async ({ page }) => {
  await entrar(page)
  await expect(page.getByText('Importadora Teste')).toBeVisible()
  await expect(page.getByText('Arquivado Antigo')).toHaveCount(0)

  await irPara(page, 'Arquivados')
  await expect(page.getByText('Arquivado Antigo')).toBeVisible()
})

test('cria um processo de importação', async ({ page }) => {
  await entrar(page)
  await page.getByRole('button', { name: 'Novo processo' }).click()
  await page.locator('#np-importador').fill('Nova Importação E2E')
  await page.getByRole('button', { name: 'Obrigatório' }).click()
  await page.getByRole('option', { name: 'MSC', exact: true }).click()
  await page.getByRole('button', { name: 'Criar' }).click()
  await expect(page.getByText('Nova Importação E2E')).toBeVisible()
})

test('marca uma etapa e arquiva o processo', async ({ page }) => {
  await entrar(page)
  await page.getByText('Importadora Teste').click()
  const ficha = page.getByRole('dialog')
  await ficha.getByText('Carregamento concluído', { exact: true }).click()
  await expect(ficha.getByText('1 de 6 etapas concluídas')).toBeVisible()

  await ficha.getByRole('button', { name: 'Arquivar', exact: true }).click()
  await page.getByRole('dialog', { name: 'Arquivar processo?' }).getByRole('button', { name: 'Arquivar' }).click()
  await expect(page.getByText('Processo arquivado.')).toBeVisible()

  await irPara(page, 'Arquivados')
  await expect(page.getByText('Importadora Teste')).toBeVisible()
})

test('gera a imagem de status com os dados do contêiner', async ({ page }) => {
  await entrar(page)
  await irPara(page, 'Status para clientes')
  await page.getByRole('button', { name: /Selecione o processo/ }).click()
  await page.getByRole('option', { name: /Exportadora Teste/ }).click()
  await page.getByRole('button', { name: 'Dados do contêiner' }).click()

  await expect(page.locator('#status-detalhes')).toHaveValue(/Segue abaixo dados do container/)
  const imagem = page.locator('canvas')
  await expect(imagem).toBeVisible()
  await expect(imagem).toHaveAttribute('width', '1440')
  await expect(page.getByRole('button', { name: 'Copiar imagem' })).toBeEnabled()
})
