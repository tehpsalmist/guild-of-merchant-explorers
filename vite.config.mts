import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  plugins: [
    react(),
    imagetools(),
    nodePolyfills({
      include: ['buffer', 'stream', 'string_decoder', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
})
