import { cloudflare } from '@cloudflare/vite-plugin'
// import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { builtinModules } from 'node:module'
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
    // This seems to break prisma for some reason https://github.com/prisma/prisma/issues/26880#issuecomment-3049293050
    // tsConfigPaths({
    //   projects: ['./tsconfig.json'],
    // }),
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
