import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['uiohook-napi', 'active-win', 'googlethis'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
    }),
  ],
  // Suppress build warnings
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Ignore inlineDynamicImports deprecation warning from vite-plugin-electron
        if (warning.message && warning.message.includes('inlineDynamicImports')) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
})
