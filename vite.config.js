import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

// Mesmos cabeçalhos de segurança da produção (vercel.json) no `npm run preview`,
// para testar a CSP localmente antes de publicar.
const cabecalhosProducao = Object.fromEntries(
  JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')).headers[0].headers.map((h) => [h.key, h.value])
)

// https://vite.dev/config/
export default defineConfig({
  preview: { headers: cabecalhosProducao },
  build: {
    // O Firebase sozinho passa de 500 kB; fica num arquivo próprio, em cache.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Bibliotecas grandes em arquivos separados: mudam pouco, então o
        // navegador reaproveita do cache entre uma versão e outra do app.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    // PWA: instalável no computador/celular. O service worker guarda só o
    // "shell" do app (tela/ícones); login e dados vêm sempre do Firebase.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'LogiTrack Pro - Gestão Logística',
        short_name: 'LogiTrack',
        description: 'Controle de processos de importação e exportação da Transportes Imigrantes.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F4F2EE',
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
})
