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
  },
}, {
  files: ['src/routes/**/*.{ts,tsx}'],
  rules: {
    // TanStack route modules export route definitions alongside components.
    'react-refresh/only-export-components': 'off',
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
    // A class Tailwind doesn't know generates no CSS and fails silently — which is
    // how `text-paper` and `bg-accent/30` went on rendering as nothing after those
    // tokens left @theme. Warn, so a typo surfaces without blocking a build.
    'tailwindcss/no-custom-classname': 'warn',
  },
})
