// Placa cavalo e placa carreta: criar com placas separadas (no processo e em cada
// contêiner) e a transição do texto antigo. Compartilha o banco do emulador com os
// outros arquivos (ordem alfabética): cada teste cria os próprios dados. O processo
// com o texto antigo (`placas`) é gravado direto no emulador, porque a tela não cria mais esse campo.
import { expect, test } from '@playwright/test'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { USUARIO } from './dados.mjs'

const entrar = async (page) => {
  await page.goto('/')
  await page.locator('#auth-email').fill(USUARIO.email)
  await page.locator('#auth-password').fill(USUARIO.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible()
}

const irPara = (page, aba) => page.locator('aside').getByRole('button', { name: new RegExp(aba) }).click()

const novoProcesso = async (page, nome) => {
  await page.getByRole('button', { name: 'Novo processo', exact: true }).click()
  await page.locator('#np-importador').fill(nome)
  await page.getByRole('button', { name: 'Obrigatório' }).click()
  await page.getByRole('option', { name: 'MSC', exact: true }).click()
}

// Texto de todos os campos de entrada de um trecho da ficha.
const valoresDosCampos = (trecho) => trecho.locator('input').evaluateAll((els) => els.map((e) => e.value))

test('processo com um contêiner: cavalo e carreta saem juntos no card e ficam em campos separados na ficha', async ({ page }) => {
  const nome = `Placas Um ${Date.now()}`
  await entrar(page)
  await novoProcesso(page, nome)
  await page.locator('#np-placaCavalo').fill('AAA1A11')
  await page.locator('#np-placaCarreta').fill('BBB2B22')
  await page.getByRole('button', { name: 'Criar' }).click()
  await expect(page.getByText(nome)).toBeVisible()
  await expect(page.getByText('AAA-1A11 / BBB-2B22').first()).toBeVisible()

  await page.getByText(nome).click()
  const ficha = page.getByRole('dialog')
  await expect(ficha.getByText('Placa carreta', { exact: true })).toBeVisible()
  const valores = await valoresDosCampos(ficha)
  expect(valores).toContain('AAA1A11')
  expect(valores).toContain('BBB2B22')
})

test('processo com 2 contêineres: cada contêiner guarda as suas placas', async ({ page }) => {
  const nome = `Placas Dois ${Date.now()}`
  await entrar(page)
  await novoProcesso(page, nome)
  await page.getByRole('button', { name: 'Adicionar contêiner' }).click()
  await page.getByLabel('Placa cavalo do contêiner 1').fill('AAA1A11')
  await page.getByLabel('Placa carreta do contêiner 1').fill('BBB2B22')
  await page.getByLabel('Placa cavalo do contêiner 2').fill('CCC3C33')
  await page.getByLabel('Placa carreta do contêiner 2').fill('DDD4D44')
  await page.getByRole('button', { name: 'Criar' }).click()
  await expect(page.getByText(nome)).toBeVisible()

  await page.getByText(nome).click()
  const ficha = page.getByRole('dialog')
  const secoes = ficha.locator('section[data-secao^="conteiner-"]')
  await expect(secoes).toHaveCount(2)
  const primeiro = await valoresDosCampos(secoes.nth(0))
  const segundo = await valoresDosCampos(secoes.nth(1))
  expect(primeiro).toEqual(expect.arrayContaining(['AAA1A11', 'BBB2B22']))
  expect(segundo).toEqual(expect.arrayContaining(['CCC3C33', 'DDD4D44']))
  expect(primeiro).not.toContain('CCC3C33')
})

test('texto antigo de placas continua aparecendo e some da tela quando o cavalo é preenchido', async ({ page }) => {
  const nome = `Placas Antigo ${Date.now()}`
  // Processo "de antes": só o texto livre `placas`, sem cavalo nem carreta.
  initializeApp({ projectId: 'demo-logitrack' })
  const { uid } = await getAuth().getUserByEmail(USUARIO.email)
  await getFirestore().doc(`processes/placas-antigo-${Date.now()}`).set({
    userId: uid, type: 'import', status: 'active', createdAt: new Date().toISOString(),
    importador: nome, armador: 'MSC', finalizacaoVazio: 'devolucao', motorista: 'João', placas: 'ABC1D23',
    containers: [{ id: 'cp1', numero: '', tipo: '', motorista: '', placas: '', checklist: {} }],
  })

  await entrar(page)
  await irPara(page, 'Importações')
  await page.getByText(nome).click()
  const ficha = page.getByRole('dialog')
  await expect(ficha.getByText('Placas (antigo)', { exact: true })).toBeVisible()
  expect(await valoresDosCampos(ficha)).toContain('ABC1D23')

  // cavalo e carreta são os dois primeiros campos de 20 caracteres (seção Transporte)
  const cavalo = ficha.locator('input[maxlength="20"]').first()
  await cavalo.fill('EEE5E55')
  await cavalo.press('Tab')
  await expect(ficha.getByText('Placas (antigo)', { exact: true })).toHaveCount(0)
  await expect(cavalo).toHaveValue('EEE5E55')
})
