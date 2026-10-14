import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Segredo fixo só para testes (tokens assinados com AUTH_SECRET).
    env: { AUTH_SECRET: "segredo-de-teste" },
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
