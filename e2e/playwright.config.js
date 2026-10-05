// Testes de tela: o Playwright abre o app num Chromium de verdade, ligado ao
// emulador do Firebase. Rodam no GitHub dentro de "Lint, testes e build".
// Localmente (precisa de Java 21): veja o comando em global-setup.mjs.
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.e2e.js',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  globalSetup: './global-setup.mjs',
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:5180',
    viewport: { width: 1280, height: 800 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx vite --port 5180 --strictPort --host 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:5180',
    env: { ...process.env, VITE_EMULADOR: '1' },
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
