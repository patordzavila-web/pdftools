import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Usamos el puerto 5173 por defecto, o el de Replit si existe
const port = process.env.PORT ? Number(process.env.PORT) : 5173;
// Usamos '/' por defecto para la ruta base
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  build: {
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
})