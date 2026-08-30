import antfu from '@antfu/eslint-config'
import tailwindcss from 'eslint-plugin-tailwindcss'

export default antfu({
  ignores: [
    'prisma/contract.d.ts',
    'src/routeTree.gen.ts',
    'worker-configuration.d.ts',
  ],
  formatters: true,
  typescript: true,
  react: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  rules: {
    'perfectionist/sort-imports': ['error', {
      type: 'natural',
    }],
    'node/prefer-global/process': 'off',
  },
}, {
  files: ['src/routes/**/*.{ts,tsx}'],
  rules: {
    // TanStack route modules export route definitions alongside components.
    'react-refresh/only-export-components': 'off',
  },
}, {
  files: ['src/utils/loggingMiddleware.tsx', 'src/utils/posts.tsx'],
  rules: {
    // These logs are part of the server/client middleware diagnostics.
    'no-console': 'off',
  },
}, {
  plugins: {
    tailwindcss,
  },
  settings: {
    tailwindcss: {
      cssConfigPath: './src/styles/app.css',
      functions: ['tv', 'cn'],
    },
  },
  rules: {
    'tailwindcss/classnames-order': 'error',
  },
})
