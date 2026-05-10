import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// GitHub Pages 等子路径部署：构建时设置环境变量 VITE_BASE=/仓库名/
const base = process.env.VITE_BASE || './'

export default defineConfig({
  base,
  server: {
    host: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },
  plugins: [
    react(),
    {
      name: 'strip-asset-crossorigin',
      transformIndexHtml(html) {
        // file:// 下带 crossorigin 的本地 script/css 在部分环境异常；字体外链的 crossorigin 保留
        return html
          .replace(
            /<script type="module" crossorigin src="\.\/assets\//g,
            '<script type="module" src="./assets/'
          )
          .replace(
            /<link rel="stylesheet" crossorigin href="\.\/assets\//g,
            '<link rel="stylesheet" href="./assets/'
          );
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
