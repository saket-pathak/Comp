import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' assert { type: 'json' }

// CRXJS reads manifest.json, resolves all the src/* entry points referenced in it
// (background service worker, content scripts, popup), and rebuilds them with HMR
// during `npm run dev`. Output goes to dist/, which is what you load as an
// "unpacked extension" in chrome://extensions during development, and what
// scripts/build_executable equivalents would zip up for store submission.
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // keep chunk names stable/readable for easier debugging in the
        // extension's service worker and content script consoles
        chunkFileNames: 'chunks/[name]-[hash].js'
      }
    }
  },
  server: {
    // CRXJS needs a fixed port for the dev server it injects into the
    // unpacked extension's HMR client
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  }
})
