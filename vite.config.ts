import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'supabase/functions/_shared'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const match = id.match(/node_modules\/((?:@[^/]+\/[^/]+)|[^/]+)/)
          const pkg = match?.[1]
          if (!pkg) return

          if (
            pkg === 'react' ||
            pkg === 'react-dom' ||
            pkg === 'react-router' ||
            pkg === 'react-router-dom' ||
            pkg === 'scheduler'
          ) {
            return 'vendor-react'
          }
          if (pkg === '@supabase/supabase-js' || pkg.startsWith('@supabase/')) {
            return 'vendor-supabase'
          }
          if (pkg === '@vercel/analytics') {
            return 'vendor-vercel'
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/test/setup.ts'],
  },
})
