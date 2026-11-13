import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const envDir = fileURLToPath(new URL("../../", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "API_");
  const proxy = {
    "/trpc": {
      target: `http://127.0.0.1:${env.API_PORT ?? "3001"}`,
      changeOrigin: true,
    },
  };

  return {
    envDir,
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
    ],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, strictPort: true, proxy },
  };
});
