import { defineConfig } from 'vite'
import { splitVendorChunkPlugin } from 'vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [splitVendorChunkPlugin()],
  server: {
    port: 3443
   
    // Uncomment to allow access from network
    // (or use `npm run dev -- -- host=0.0.0.0`)
    //host: '0.0.0.0',
  },
})