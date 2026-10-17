import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // Same contract as nginx in production: /api/* goes to the backend without the /api prefix.
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET ?? 'http://localhost:8000',
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
