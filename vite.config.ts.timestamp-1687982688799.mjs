// vite.config.ts
import { defineConfig } from "file:///X:/work/SBU/LS/lsnew/LabSafety/node_modules/vite/dist/node/index.js";
import { splitVendorChunkPlugin } from "file:///X:/work/SBU/LS/lsnew/LabSafety/node_modules/vite/dist/node/index.js";
import mkcert from "file:///X:/work/SBU/LS/lsnew/LabSafety/node_modules/vite-plugin-mkcert/dist/mkcert.mjs";
var vite_config_default = defineConfig({
  base: "",
  plugins: [splitVendorChunkPlugin(), mkcert()],
  server: {
    port: 8081,
    https: true
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      define: {
        global: "globalThis"
      },
      supported: {
        bigint: true
      }
    }
  },
  build: {
    target: ["esnext"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJYOlxcXFx3b3JrXFxcXFNCVVxcXFxMU1xcXFxsc25ld1xcXFxMYWJTYWZldHlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIlg6XFxcXHdvcmtcXFxcU0JVXFxcXExTXFxcXGxzbmV3XFxcXExhYlNhZmV0eVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vWDovd29yay9TQlUvTFMvbHNuZXcvTGFiU2FmZXR5L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IHNwbGl0VmVuZG9yQ2h1bmtQbHVnaW4gfSBmcm9tICd2aXRlJ1xuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmltcG9ydCBta2NlcnQgZnJvbSAndml0ZS1wbHVnaW4tbWtjZXJ0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOlwiXCIsXG5cbiAgcGx1Z2luczogW3NwbGl0VmVuZG9yQ2h1bmtQbHVnaW4oKSxta2NlcnQoKSBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA4MDgxLFxuICAgIGh0dHBzOiB0cnVlLFxuICAgIC8vIFVuY29tbWVudCB0byBhbGxvdyBhY2Nlc3MgZnJvbSBuZXR3b3JrXG4gICAgLy8gKG9yIHVzZSBgbnBtIHJ1biBkZXYgLS0gLS0gaG9zdD0wLjAuMC4wYClcbiAgICAvL2hvc3Q6ICcwLjAuMC4wJyxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7IC8vIFx1RDgzRFx1REM0OCBvcHRpbWl6ZWRlcHNcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgdGFyZ2V0OiBcImVzbmV4dFwiLCBcbiAgICAgIC8vIE5vZGUuanMgZ2xvYmFsIHRvIGJyb3dzZXIgZ2xvYmFsVGhpc1xuICAgICAgZGVmaW5lOiB7XG4gICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnXG4gICAgICB9LFxuICAgICAgc3VwcG9ydGVkOiB7IFxuICAgICAgICBiaWdpbnQ6IHRydWUgXG4gICAgICB9LFxuICAgIH1cbiAgfSwgXG5cbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6IFtcImVzbmV4dFwiXSwgLy8gXHVEODNEXHVEQzQ4IGJ1aWxkLnRhcmdldFxuICB9LCAgXG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1IsU0FBUyxvQkFBb0I7QUFDclQsU0FBUyw4QkFBOEI7QUFFdkMsT0FBTyxZQUFZO0FBRW5CLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQUs7QUFBQSxFQUVMLFNBQVMsQ0FBQyx1QkFBdUIsR0FBRSxPQUFPLENBQUU7QUFBQSxFQUM1QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsRUFJVDtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osZ0JBQWdCO0FBQUEsTUFDZCxRQUFRO0FBQUEsTUFFUixRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsTUFDVjtBQUFBLE1BQ0EsV0FBVztBQUFBLFFBQ1QsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsT0FBTztBQUFBLElBQ0wsUUFBUSxDQUFDLFFBQVE7QUFBQSxFQUNuQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
