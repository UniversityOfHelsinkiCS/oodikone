/* eslint-disable import-x/no-extraneous-dependencies */
/* eslint-disable no-console */
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

const inStaging = process.env.REACT_APP_STAGING === 'true'

// https://vitejs.dev/config/
// eslint-disable-next-line import-x/no-unused-modules, import-x/no-default-export
export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [
        reactCompilerPreset({
          logger: {
            logEvent(filename, event) {
              if (event.kind === 'CompileError') {
                console.error(`\nCompilation failed: ${filename}`)
                console.error(`Reason: ${event.detail.reason}`)

                if (event.detail.description) {
                  console.error(`Details: ${event.detail.description}`)
                }

                if ('loc' in event.detail && !!event.detail.loc) {
                  const { line, column } = event.detail.loc[Symbol('start')]
                  console.error(`Location: Line ${line}, Column ${column}`)
                }

                if (event.detail.suggestions) {
                  console.error('Suggestions:', event.detail.suggestions)
                }
              }
            },
          },
          target: '18',
          compilationMode: 'annotation',
        }),
      ],
    }),
  ],
  base: inStaging ? '/oodikone' : '/',
  server: {
    proxy: {
      '/api/': {
        target: 'http://backend:8080',
      },
    },
    host: true,
    port: 3000,
  },
  preview: {
    proxy: {
      '/api/': {
        target: 'http://localhost:8080',
      },
    },
    port: 4173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: 'hidden',
  },
  define: {
    'process.env': process.env,
  },
})
