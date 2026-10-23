import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv } from 'vite'
import { readFileSync } from 'node:fs'
import { EMPRESA_PADRAO } from './src/marca.js'

// Mesmos cabeçalhos de segurança da produção (vercel.json) no `npm run preview`,
// para testar a CSP localmente antes de publicar.
const cabecalhosProducao = Object.fromEntries(
  JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')).headers[0].headers.map((h) => [h.key, h.value])
)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Nome da empresa (ver src/marca.js): vale para o index.html e para o app instalado.
  const empresa = loadEnv(mode, process.cwd(), 'VITE_').VITE_EMPRESA_NOME?.trim() || EMPRESA_PADRAO
  return {
    // Versão (commit) gravada junto com os erros registrados; a Vercel informa o commit no build.
    define: { 'import.meta.env.VITE_VERSAO': JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)) },
    preview: { headers: cabecalhosProducao },
    // Os testes de datas rodam sempre no fuso da equipe (São Paulo), na máquina de quem
    // desenvolve e no GitHub (que usa UTC): sem isso, "dia local" e "dia em UTC" não se distinguem.
    test: { env: { TZ: 'America/Sao_Paulo' } },
    build: {
      // O Firestore passa de 500 kB, mas só é baixado depois do login (AreaLogada).
      chunkSizeWarningLimit: 600,
      rolldownOptions: {
        output: {
          // React em arquivo separado: muda pouco, então o
          // navegador reaproveita do cache entre uma versão e outra do app.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            ],
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      // O index.html não passa pelo React: troca o marcador da tela de abertura pelo nome da empresa.
      { name: 'marca-html', transformIndexHtml: (html) => html.replaceAll('__EMPRESA__', empresa) },
      // PWA: instalável no computador/celular. O service worker guarda só o
      // "shell" do app (tela/ícones); login e dados vêm sempre do Firebase.
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/apple-touch-icon.png'],
        manifest: {
          name: 'LogiTrack Pro - Gestão Logística',
          short_name: 'LogiTrack',
          description: `Controle de processos de importação e exportação da ${empresa}.`,
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#F5F5F7',
          theme_color: '#B10004',
          lang: 'pt-BR',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
      }),
    ],
  }
})
