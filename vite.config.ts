import { defineConfig, splitVendorChunkPlugin } from 'vite';
// https://vitejs.dev/config/
import mkcert from 'vite-plugin-mkcert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  base:"/LabSafety/",

  plugins: [splitVendorChunkPlugin(), mkcert(),
    {
      name: 'local-logging-server',
      configureServer(server) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const logFile = path.resolve(__dirname, 'app.log');

        server.middlewares.use('/api/log', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
              try {
                const log = JSON.parse(body);
                // 👇 MODIFIED: Add the location to the log message format
                const logMessage = `[${log.timestamp}] [${log.level}] [${log.location}]: ${log.message}\n`;
                
                fs.appendFileSync(logFile, logMessage);
                res.statusCode = 200;
                res.end('Log received');
              } catch (e) {
                res.statusCode = 400;
                res.end('Invalid log format');
              }
            });
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    port: 8081,
    https: true,
    // Uncomment to allow access from network
    // (or use `npm run dev -- -- host=0.0.0.0`)
    // host: '0.0.0.0',
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
});
