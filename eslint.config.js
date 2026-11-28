import antfu from '@antfu/eslint-config'
import tailwindcss from 'eslint-plugin-tailwindcss'

export default antfu({
  ignores: [
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
    // Warn about unknown classes, such as references to removed theme tokens.
    'tailwindcss/no-custom-classname': 'warn',
  },
})
