import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";

// Plugin to move popup.html to root after build
const movePopupHtml = () => {
  return {
    name: "move-popup-html",
    closeBundle() {
      const htmlPath = resolve(__dirname, "dist/src/popup/index.html");
      const targetPath = resolve(__dirname, "dist/popup.html");
      const srcDir = resolve(__dirname, "dist/src");
      if (existsSync(htmlPath)) {
        let content = readFileSync(htmlPath, "utf-8");
        // Fix asset paths to be relative
        content = content.replace(/src="\/popup\//g, 'src="./popup/');
        content = content.replace(/href="\/popup\//g, 'href="./popup/');
        writeFileSync(targetPath, content);
        // Clean up the src directory
        if (existsSync(srcDir)) {
          rmSync(srcDir, { recursive: true, force: true });
        }
      }
    },
  };
};

export default defineConfig({
  plugins: [
    react(),
    movePopupHtml(),
    viteStaticCopy({
      targets: [
        {
          src: "manifest.json",
          dest: ".",
        },
        {
          src: "public/icons/*",
          dest: "icons",
        },
      ],
    }),
  ],
  build: {
    outDir: "dist",
    base: "./",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background" || chunkInfo.name === "content") {
            return "[name].js";
          }
          return "popup/[name].js";
        },
        chunkFileNames: "popup/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "popup/[name]-[hash].[ext]";
          }
          return "[name]-[hash].[ext]";
        },
      },
    },
  },
});
