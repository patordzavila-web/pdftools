import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = process.env.PORT ? Number(process.env.PORT) : 5173;

export default defineConfig({
  // Mantenemos los plugins para que no se rompa el diseño (Tailwind) ni React
  plugins: [react(), tailwindcss()],
  
  // Esta es la pieza que le faltaba a Vercel para entender el @
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: port,
    host: "0.0.0.0",
  },

  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  },
});