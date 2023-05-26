import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
// https://vitejs.dev/config/
import mkcert from 'vite-plugin-mkcert'
export default defineConfig({
  base:"",

  plugins: [splitVendorChunkPlugin(),mkcert() ],
  server: {
    port: 4444,
    https: true,
    // Uncomment to allow access from network
    // (or use `npm run dev -- -- host=0.0.0.0`)
    //host: '0.0.0.0',
  },
})