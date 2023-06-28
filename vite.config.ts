import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
// https://vitejs.dev/config/
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  base:"",

  plugins: [splitVendorChunkPlugin(),mkcert() ],
  server: {
    port: 8081,
    https: true,
    // Uncomment to allow access from network
    // (or use `npm run dev -- -- host=0.0.0.0`)
    //host: '0.0.0.0',
  },
  optimizeDeps: { // 👈 optimizedeps
    esbuildOptions: {
      target: "esnext", 
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      supported: { 
        bigint: true 
      },
    }
  }, 

  build: {
    target: ["esnext"], // 👈 build.target
  },  
})