import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Il sito è pubblicato su https://andrea8643.github.io/spese/
export default defineConfig({
  base: '/spese/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Le mie spese',
        short_name: 'Spese',
        description: 'Spese, budget e risparmi personali',
        lang: 'it',
        theme_color: '#0b0b0d',
        background_color: '#0b0b0d',
        display: 'standalone',
        start_url: '/spese/',
        scope: '/spese/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallback: '/spese/index.html', globPatterns: ['**/*.{js,css,html,svg,png}'] },
    }),
  ],
})
