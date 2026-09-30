import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare global {
  interface ImportMeta {
    readonly url: string;
  }
}

const src = decodeURIComponent(import.meta.url)
  .replace(/^file:\/\//, "")
  .replace(/\/vite\.config\.ts$/, "/src");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: `${src}/` }],
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
