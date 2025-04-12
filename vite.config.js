import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8443,
    https: false, // set to true if you plan to use HTTPS with a cert
  },
})