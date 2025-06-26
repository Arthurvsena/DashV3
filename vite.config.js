import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // …outras configs…
  preview: {
    host: '0.0.0.0',          // já necessário para o Render
    port: Number(process.env.PORT) || 4173,
    allowedHosts: ['dashv3.onrender.com']
  }
})
