import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
// import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // This seems to break prisma for some reason https://github.com/prisma/prisma/issues/26880#issuecomment-3049293050
    // tsConfigPaths({
    //   projects: ['./tsconfig.json'],
    // }),
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
  ],
})
