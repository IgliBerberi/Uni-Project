import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Proxies /api and /uploads → XAMPP Apache (backend copied to htdocs/e-commerce)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendOrigin = env.VITE_PROXY_TARGET || 'http://localhost/e-commerce'

  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/uploads': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
