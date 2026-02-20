import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import yaml from '@modyfi/vite-plugin-yaml'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Find data-herbapedia directory - try both locations
function getDataDir() {
  const localDataDir = path.resolve(__dirname, '../data-herbapedia')
  const ciDataDir = path.resolve(__dirname, './data-herbapedia')
  return fs.existsSync(localDataDir) ? localDataDir : ciDataDir
}

// Plugin to serve media files from data-herbapedia in dev mode
// and copy them in build mode
function mediaPlugin() {
  const dataDir = getDataDir()
  const mediaDir = path.join(dataDir, 'media')

  return {
    name: 'serve-media',

    // In dev mode, serve media files directly
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/@herbapedia/data/')) {
          const filePath = path.join(dataDir, req.url.replace('/@herbapedia/data/', ''))

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            // Set correct content type based on extension
            const ext = path.extname(filePath).toLowerCase()
            const contentTypes = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon'
            }
            res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream')
            return fs.createReadStream(filePath).pipe(res)
          }
        }
        next()
      })
    },

    // In build mode, copy media files to dist
    closeBundle() {
      if (process.env.NODE_ENV === 'production' || process.env.VITE_SSG) {
        const mediaDest = path.join(__dirname, 'dist/@herbapedia/data/media')

        if (fs.existsSync(mediaDir)) {
          fs.mkdirSync(mediaDest, { recursive: true })

          function copyDir(src, dest) {
            fs.mkdirSync(dest, { recursive: true })
            const entries = fs.readdirSync(src, { withFileTypes: true })

            for (const entry of entries) {
              const srcPath = path.join(src, entry.name)
              const destPath = path.join(dest, entry.name)

              if (entry.isDirectory()) {
                copyDir(srcPath, destPath)
              } else {
                fs.copyFileSync(srcPath, destPath)
              }
            }
          }

          copyDir(mediaDir, mediaDest)
          console.log('✓ Copied media files to dist/@herbapedia/data/media')
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    yaml(),
    // JSON-LD support: treat .jsonld as JSON modules
    {
      name: 'jsonld-plugin',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.jsonld')) {
          return {
            code: `export default ${code}`,
            map: null
          }
        }
        return null
      }
    },
    mediaPlugin()
  ],
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@herbapedia/data': getDataDir()
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

      // Categories
      const categories = ['chinese-herbs', 'western-herbs', 'vitamins', 'minerals', 'nutrients']

      // Use JSON-LD data from data-herbapedia
      const dataDir = getDataDir()
      const plantsDir = path.join(dataDir, 'entities/plants')
      const tcmDir = path.join(dataDir, 'systems/tcm/herbs')

      // Map TCM profiles to their plants
      const tcmToPlantMap = new Map()

      if (fs.existsSync(tcmDir)) {
        const tcmSlugs = fs.readdirSync(tcmDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

        for (const tcmSlug of tcmSlugs) {
          const profilePath = path.join(tcmDir, tcmSlug, 'profile.jsonld')
          if (fs.existsSync(profilePath)) {
            try {
              const content = fs.readFileSync(profilePath, 'utf8')
              const profile = JSON.parse(content)
              if (profile.derivedFromPlant && profile.derivedFromPlant['@id']) {
                const plantRef = profile.derivedFromPlant['@id']
                  .replace('plant/', '')
                  .replace('#root', '')
                  .replace('#leaf', '')
                tcmToPlantMap.set(plantRef, tcmSlug)
              }
            } catch (e) {
              // Skip invalid profiles
            }
          }
        }
      }

      // Read plant entities and generate routes
      if (fs.existsSync(plantsDir)) {
        const plantSlugs = fs.readdirSync(plantsDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)

        for (const slug of plantSlugs) {
          // Determine category based on plant slug patterns
          let category = 'western-herbs'
          if (tcmToPlantMap.has(slug)) {
            category = 'chinese-herbs'
          } else if (slug.includes('vitamin-')) {
            category = 'vitamins'
          } else if (['calcium', 'copper', 'iodine', 'iron', 'magnesium', 'manganese', 'potassium', 'selenium', 'zinc'].includes(slug)) {
            category = 'minerals'
          } else if (['choline', 'chondroitin', 'glucosamine', 'inositol', 'lecithin', 'lysine', 'melatonin', 'methionine', 'capigen', 'ceramides', 'chitosan', 'cysteine', 'glycerin', 'glycine', 'linolenic'].some(n => slug.includes(n))) {
            category = 'nutrients'
          }

          // Add routes for each locale
          allRoutes.push(`/herbs/${category}/${slug}`)
          allRoutes.push(`/zh-Hant/herbs/${category}/${slug}`)
          allRoutes.push(`/zh-Hans/herbs/${category}/${slug}`)
        }
      }

      // Add category routes for each locale
      categories.forEach(cat => {
        allRoutes.push(`/herbs/${cat}`)
        allRoutes.push(`/zh-Hant/herbs/${cat}`)
        allRoutes.push(`/zh-Hans/herbs/${cat}`)
      })

      // Add locale-specific home and about pages
      allRoutes.push('/zh-Hant')
      allRoutes.push('/zh-Hant/about')
      allRoutes.push('/zh-Hans')
      allRoutes.push('/zh-Hans/about')

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
