import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import yaml from '@modyfi/vite-plugin-yaml'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    yaml()
  ],
  base: '/herbapedia/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    dirStyle: 'nested',
    crittersOptions: {
      reduceInlineStyles: false
    },
    includedRoutes(paths, routes) {
      // Include all static routes
      const staticRoutes = paths.filter(p => !p.includes(':'))

      const allRoutes = [...staticRoutes]
      const herbsDir = path.resolve(__dirname, 'src/content/herbs')

      // Categories
      const categories = ['chinese-herbs', 'western-herbs', 'vitamins', 'minerals', 'nutrients']

      // Locales - English (default, no prefix) and other languages
      const locales = ['', '/zh-HK', '/zh-CN']

      if (fs.existsSync(herbsDir)) {
        // Get all herb directories
        const dirs = fs.readdirSync(herbsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

        dirs.forEach(slug => {
          // Read category from en.yaml
          const enPath = path.join(herbsDir, slug, 'en.yaml')
          if (fs.existsSync(enPath)) {
            const content = fs.readFileSync(enPath, 'utf8')
            const catMatch = content.match(/^category:\s*"([^"]+)"/m)
            if (catMatch) {
              const category = catMatch[1]

              // Check which locale files exist for this herb
              const hasEn = fs.existsSync(path.join(herbsDir, slug, 'en.yaml'))
              const hasZhHK = fs.existsSync(path.join(herbsDir, slug, 'zh-HK.yaml'))
              const hasZhCN = fs.existsSync(path.join(herbsDir, slug, 'zh-CN.yaml'))

              // Add route for each available locale
              if (hasEn) {
                allRoutes.push(`/herbs/${category}/${slug}`)
              }
              if (hasZhHK) {
                allRoutes.push(`/zh-HK/herbs/${category}/${slug}`)
              }
              if (hasZhCN) {
                allRoutes.push(`/zh-CN/herbs/${category}/${slug}`)
              }
            }
          }
        })

        // Add category routes for each locale
        categories.forEach(cat => {
          // English (no prefix)
          allRoutes.push(`/herbs/${cat}`)
          // zh-HK
          allRoutes.push(`/zh-HK/herbs/${cat}`)
          // zh-CN
          allRoutes.push(`/zh-CN/herbs/${cat}`)
        })

        // Add locale-specific home and about pages
        allRoutes.push('/zh-HK')
        allRoutes.push('/zh-HK/about')
        allRoutes.push('/zh-CN')
        allRoutes.push('/zh-CN/about')
      }

      return allRoutes
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
