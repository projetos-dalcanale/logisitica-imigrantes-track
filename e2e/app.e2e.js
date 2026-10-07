// Roteiros principais do dia a dia, clicando como uma pessoa. Rodam em
// ordem (o 4º arquiva o processo que o 2º confere).
import { expect, test } from '@playwright/test'
import { USUARIO } from './dados.mjs'

const entrar = async (page) => {
  await page.goto('/')
  await page.locator('#auth-email').fill(USUARIO.email)
  await page.locator('#auth-password').fill(USUARIO.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Abre na página inicial (saudação no título).
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
}

const irPara = (page, aba) => page.locator('aside').getByRole('button', { name: new RegExp(aba) }).click()

test('abre no Início com os indicadores e os atalhos', async ({ page }) => {
  await entrar(page)
  await expect(page.getByRole('button', { name: /Importações em andamento/ })).toContainText('1')
  await expect(page.getByRole('button', { name: /Exportações em andamento/ })).toContainText('1')
  await page.getByRole('button', { name: /Rotas e Valores de Pedágio Pedágio por rota/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Rotas e Valores de Pedágio' })).toBeVisible()
  await page.locator('aside').getByRole('button', { name: 'Início' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
})

test('o login vale só para a aba: recarregar mantém, aba nova pede de novo', async ({ page, context }) => {
  await entrar(page)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()

  const novaAba = await context.newPage()
  await novaAba.goto('/')
  await expect(novaAba.locator('#auth-email')).toBeVisible()
})

test('entra e vê os ativos; os arquivados carregam ao abrir a aba', async ({ page }) => {
  await entrar(page)
  await irPara(page, 'Importações')
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

test('cria uma importação de carga solta', async ({ page }) => {
  await entrar(page)
  await page.getByRole('button', { name: 'Novo processo' }).click()
  await page.locator('#np-importador').fill('Carga Solta E2E')
  await page.getByRole('radio', { name: 'Carga solta' }).click()
  // Sem contêiner, sem destino do vazio: só a descrição da carga.
  await expect(page.getByRole('button', { name: 'Adicionar contêiner' })).toHaveCount(0)
  await expect(page.getByRole('radio', { name: 'Devolução' })).toHaveCount(0)
  await page.locator('#np-carga').fill('104 caixas')
  await page.getByRole('button', { name: 'Obrigatório' }).click()
  await page.getByRole('option', { name: 'MSC', exact: true }).click()
  await page.getByRole('button', { name: 'Criar' }).click()

  // O card mostra a carga no lugar do número do contêiner.
  await expect(page.getByText('104 caixas')).toBeVisible()
  await page.getByText('Carga Solta E2E').click()
  const ficha = page.getByRole('dialog')
  await expect(ficha.getByPlaceholder('Ex.: 104 caixas')).toHaveValue('104 caixas')
  await expect(ficha.getByText('Carga entregue', { exact: true })).toBeVisible()
  await expect(ficha.getByText('0 de 6 etapas concluídas')).toBeVisible()
  await expect(ficha.getByRole('button', { name: 'Adicionar contêiner' })).toHaveCount(0)
})

test('marca uma etapa e arquiva o processo', async ({ page }) => {
  await entrar(page)
  await irPara(page, 'Importações')
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
