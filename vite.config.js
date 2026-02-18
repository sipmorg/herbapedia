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
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    crittersOptions: {
      reduceInlineStyles: false
    },
    includedRoutes(paths, routes) {
      // Include all static routes
      const staticRoutes = paths.filter(p => !p.includes(':'))

      // Add dynamic herb routes by reading content
      const herbRoutes = []

      // Categories
      const categories = ['chinese-herbs', 'western-herbs', 'vitamins', 'minerals', 'nutrients']
      categories.forEach(cat => {
        herbRoutes.push(`/herbs/${cat}`)
      })

      // Individual herbs - will be populated from content directories
      // This runs at build time, so we read from the content directory
      const herbsDir = path.resolve(__dirname, 'src/content/herbs')

      if (fs.existsSync(herbsDir)) {
        // New structure: herbs/{slug}/en.yaml
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
              herbRoutes.push(`/herbs/${catMatch[1]}/${slug}`)
            }
          }
        })
      }

      return [...staticRoutes, ...herbRoutes]
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
