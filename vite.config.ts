import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
// import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'


export default defineConfig({
    server: {
        port: Number.parseInt(process.env.VITE_PORT || '3000', 10),
    },
    plugins: [
        // This seems to break prisma for some reason https://github.com/prisma/prisma/issues/26880#issuecomment-3049293050
        // tsConfigPaths({
        //   projects: ['./tsconfig.json'],
        // }),
        tanstackStart(),
        nitro({
            config: {
                preset: 'vercel'
            }
        }),
        viteReact(),
        tailwindcss(),
    ],
})
