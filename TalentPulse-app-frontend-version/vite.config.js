import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/mic-audio': 'http://localhost:5000',
      '/snapshot': 'http://localhost:5000',
      '/log_event': 'http://localhost:5000',
    },
  },
});

