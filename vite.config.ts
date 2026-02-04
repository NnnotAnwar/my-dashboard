import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Магия: обновляется само в реальном времени
      manifest: {
        name: 'My Smart ToDo',
        short_name: 'ToDo AI',
        description: 'Умный список задач с AI и админкой',
        theme_color: '#F7F7F5',
        background_color: '#F7F7F5',
        display: 'standalone', // Запускается без рамок браузера
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})