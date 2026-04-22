import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
// import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    server: {
        port: Number.parseInt(process.env.VITE_PORT || '3000', 10),
        // Bind IPv4 explicitly; the atproto OAuth loopback client requires
        // the literal host `127.0.0.1`, and vite's default `localhost` binds
        // IPv6 only on macOS, which breaks the /oauth/callback redirect.
        host: '127.0.0.1',
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
    ssr: {
        // noExternal: ['@prisma/client'],
        optimizeDeps: {
            include: ["src/generated/prisma/client"],
        },
    },
    build: {
        rollupOptions: {
            external: ['src/generated/prisma/client'],
        }
    },
    define: {
        'import.meta.url': '"file:///"',
        global: 'globalThis',
    },
    resolve: {
        alias: {
            '.prisma/client/edge': path.resolve(__dirname, 'node_modules/.pnpm/@prisma+client@6.16.3_prisma@6.16.3_magicast@0.3.5_typescript@5.9.3__typescript@5.9.3/node_modules/.prisma/client/edge'),
            '.prisma/client/default': path.resolve(__dirname, 'node_modules/.pnpm/@prisma+client@6.16.3_prisma@6.16.3_magicast@0.3.5_typescript@5.9.3__typescript@5.9.3/node_modules/.prisma/client/default'),
        }
    }
})

