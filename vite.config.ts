import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { builtinModules } from 'node:module'
import process from 'node:process'
import { defineConfig, esmExternalRequirePlugin } from 'vite'

export default defineConfig({
  server: {
    port: Number.parseInt(process.env.VITE_PORT || '3000', 10),
  },
  ssr: {
    target: 'webworker',
    optimizeDeps: {
      rolldownOptions: {
        plugins: [
          esmExternalRequirePlugin({
            external: [...builtinModules],
          }),
        ],
      },
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
  define: {
    'import.meta.url': '"file:///"',
    'global': 'globalThis',
  },
})
