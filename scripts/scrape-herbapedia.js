#!/usr/bin/env node

/**
 * Herbapedia Scraper v3
 * Extracts herb data from vitaherbapedia.com with multilingual support
 *
 * Directory structure: src/content/herbs/{slug}/{en|zh-HK|zh-CN}.yaml
 * Images: src/content/herbs/{slug}/images/{slug}.jpg
 *
 * Usage:
 *   node scripts/scrape-herbapedia.js                    # Scrape English (default)
 *   node scripts/scrape-herbapedia.js --lang zh-HK       # Scrape Traditional Chinese
 *   node scripts/scrape-herbapedia.js --lang zh-CN       # Scrape Simplified Chinese
 *   node scripts/scrape-herbapedia.js --all-languages    # Scrape all languages
 *   node scripts/scrape-herbapedia.js --dry-run          # Show what would be scraped
 *   node scripts/scrape-herbapedia.js --skip-images      # Skip image downloads
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT_DIR, 'src/content/herbs')

// Configuration
const CONFIG = {
  baseUrl: 'https://www.vitaherbapedia.com',
  languages: {
    'en': { code: 'en', path: 'en', file: 'en' },
    'zh-HK': { code: 'zh-HK', path: 'zh', file: 'zh-HK' },
    'zh-CN': { code: 'zh-CN', path: 'cn', file: 'zh-CN' }
  },
  categories: {
    'chinese-herbs': { en: 'chiherbs-en', 'zh-HK': 'chiherbs', 'zh-CN': 'chiherbs-cn' },
    'western-herbs': { en: 'westherbs-en', 'zh-HK': 'westherbs', 'zh-CN': 'westherbs-cn' },
    'vitamins': { en: 'vitamins-en', 'zh-HK': 'vitamins', 'zh-CN': 'vitamins-cn' },
    'minerals': { en: 'minerals-en', 'zh-HK': 'minerals', 'zh-CN': 'minerals-cn' },
    'nutrients': { en: 'nutrients-en', 'zh-HK': 'nutrients', 'zh-CN': 'nutrients-cn' }
  },
  delay: 300
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function safeFilename(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Extract English slug from og:image URL
function extractSlugFromImageUrl(imageUrl) {
  if (!imageUrl) return ''
  try {
    const urlObj = new URL(imageUrl)
    const filename = path.basename(urlObj.pathname)
    const name = filename.replace(/\.[^.]+$/, '').replace(/-\d+$/, '')
    return safeFilename(name)
  } catch {
    return ''
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HerbapediaBot/1.0; +https://sipm.org)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } catch (error) {
    console.error(`  Error fetching ${url}:`, error.message)
    return null
  }
}

async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const buffer = await response.arrayBuffer()
    fs.writeFileSync(outputPath, Buffer.from(buffer))
    console.log(`    Downloaded image: ${path.basename(outputPath)}`)
    return true
  } catch (error) {
    console.error(`    Failed to download ${url}:`, error.message)
    return false
  }
}

function extractHerbUrls(html, baseUrl) {
  const urls = []
  const linkPattern = /href="([^"]*\/shop\/[^"]+)"/g
  let match
  while ((match = linkPattern.exec(html)) !== null) {
    const url = match[1]
    if (url.includes('/shop/') && !urls.includes(url)) {
      const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
      urls.push(absoluteUrl)
    }
  }
  return urls
}

function cleanText(text) {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract structured content sections from the page
function extractContentSections(html) {
  const sections = {}

  // Match all desc_containter divs with their titles and content
  const containerPattern = /<div class="desc_containter[^"]*"[^>]*>[\s\S]*?<div class="inner">([^<]+)<\/div>[\s\S]*?<div class="desc_content_container[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi

  let match
  while ((match = containerPattern.exec(html)) !== null) {
    const title = cleanText(match[1]).toLowerCase()
    const content = cleanText(match[2])

    // Normalize section names
    let sectionKey = title
    if (title.includes('history')) sectionKey = 'history'
    else if (title.includes('introduction')) sectionKey = 'introduction'
    else if (title.includes('traditional') || title.includes('用法') || title.includes('傳統')) sectionKey = 'traditional_usage'
    else if (title.includes('modern') || title.includes('research') || title.includes('研究')) sectionKey = 'modern_research'
    else if (title.includes('botanical') || title.includes('來源')) sectionKey = 'botanical_source'
    else if (title.includes('function') || title.includes('功能')) sectionKey = 'functions'
    else if (title.includes('food source') || title.includes('食物來源')) sectionKey = 'food_sources'
    else if (title.includes('importance') || title.includes('重要性')) sectionKey = 'importance'
    else if (title.includes('precaution') || title.includes('注意')) sectionKey = 'precautions'
    else if (title.includes('dosage') || title.includes('劑量')) sectionKey = 'dosage'

    if (content) {
      sections[sectionKey] = content
    }
  }

  // Also try to extract from woocommerce tabs (alternative format)
  const tabPattern = /<div[^>]*class="[^"]*woocommerce-Tabs-panel[^"]*"[^>]*id="[^"]*tab-([^"]+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi
  while ((match = tabPattern.exec(html)) !== null) {
    const tabId = match[1].toLowerCase()
    const content = cleanText(match[2])

    if (content && !sections[tabId]) {
      sections[tabId] = content
    }
  }

  return sections
}

function parseHerbPage(html, url) {
  const data = {
    url,
    title: '',
    scientificName: '',
    imageUrl: null,
    slug: null,
    category: '',
    sections: {}
  }

  // Extract title from og:title or product title
  const ogTitleMatch = html.match(/property="og:title"\s+content="([^"]+)"/)
  if (ogTitleMatch) {
    data.title = ogTitleMatch[1]
      .replace(/\s*-\s*維特草本百科$/, '')
      .replace(/\s*-\s* Vita Herbapedia$/, '')
      .trim()
  }

  if (!data.title) {
    const titleMatch = html.match(/<div[^>]*class="product_title[^"]*"[^>]*>\s*([^<]+)/)
    if (titleMatch) data.title = cleanText(titleMatch[1])
  }

  // Extract scientific name (in <h4><i>...</i></h4> after title)
  const sciMatch = html.match(/<h4[^>]*class="product_academic_title"[^>]*><i>([^<]+)<\/i><\/h4>/)
  if (sciMatch) {
    data.scientificName = cleanText(sciMatch[1])
  }

  if (!data.scientificName) {
    const sciMatch2 = html.match(/<h4[^>]*><em>([^<]+)<\/em><\/h4>/)
    if (sciMatch2) data.scientificName = cleanText(sciMatch2[1])
  }

  // Extract image URL and slug from it
  const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/)
  if (ogImageMatch) {
    data.imageUrl = ogImageMatch[1]
    data.slug = extractSlugFromImageUrl(data.imageUrl)
  }

  // Also try to get image from woocommerce-main-image
  if (!data.imageUrl) {
    const imgMatch = html.match(/<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/)
    if (imgMatch) {
      data.imageUrl = imgMatch[1]
      data.slug = extractSlugFromImageUrl(data.imageUrl)
    }
  }

  // Extract category
  if (url.includes('chiherbs')) data.category = 'chinese-herbs'
  else if (url.includes('westherbs')) data.category = 'western-herbs'
  else if (url.includes('vitamins')) data.category = 'vitamins'
  else if (url.includes('minerals')) data.category = 'minerals'
  else if (url.includes('nutrients')) data.category = 'nutrients'

  // Extract structured content sections
  data.sections = extractContentSections(html)

  return data
}

function generateYaml(data, language = 'en', slug) {
  const lines = [
    `# ${data.title}`,
    `# Source: ${data.url}`,
    `# Language: ${language}`,
    '',
    `id: "${slug}"`,
    `slug: "${slug}"`,
    `category: "${data.category}"`,
    `title: "${data.title.replace(/"/g, '\\"')}"`,
  ]

  if (data.scientificName) {
    lines.push(`scientific_name: "${data.scientificName.replace(/"/g, '\\"')}"`)
  }

  // Image is stored in the images subdirectory
  lines.push(`image: "images/${slug}.jpg"`)

  lines.push('')

  // Add all extracted sections
  const sectionOrder = ['history', 'introduction', 'botanical_source', 'traditional_usage',
                       'modern_research', 'functions', 'importance', 'food_sources',
                       'precautions', 'dosage']

  // First output known sections in order
  for (const section of sectionOrder) {
    if (data.sections[section]) {
      const yamlKey = section.replace(/_/g, '_') // Keep underscores
      lines.push(`${yamlKey}: |`)
      lines.push(`  ${data.sections[section].replace(/\n/g, '\n  ')}`)
      lines.push('')
    }
  }

  // Then output any other sections
  for (const [key, value] of Object.entries(data.sections)) {
    if (!sectionOrder.includes(key)) {
      lines.push(`${key}: |`)
      lines.push(`  ${value.replace(/\n/g, '\n  ')}`)
      lines.push('')
    }
  }

  lines.push('metadata:')
  lines.push('  source: "vitaherbapedia.com"')
  lines.push(`  source_url: "${data.url}"`)
  lines.push(`  scraped_at: "${new Date().toISOString()}"`)
  lines.push(`  language: "${language}"`)

  return lines.join('\n')
}

async function scrapeLanguage(langCode, options = {}) {
  const { dryRun = false, skipImages = false } = options
  const langConfig = CONFIG.languages[langCode]
  const allHerbs = new Map()

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Scraping language: ${langCode}`)
  console.log(`${'='.repeat(50)}\n`)

  for (const [categorySlug, categoryPaths] of Object.entries(CONFIG.categories)) {
    const categoryPath = categoryPaths[langCode]
    const categoryUrl = `${CONFIG.baseUrl}/${langConfig.path}/product-category/${categoryPath}/`

    console.log(`\nCategory: ${categorySlug}`)
    console.log(`  URL: ${categoryUrl}`)

    if (dryRun) {
      console.log('  [DRY RUN] Would scrape this category')
      continue
    }

    const firstPageHtml = await fetchPage(categoryUrl)
    if (!firstPageHtml) {
      console.log('  Failed to fetch category page')
      continue
    }

    let herbUrls = extractHerbUrls(firstPageHtml, CONFIG.baseUrl)

    // Check for pagination - handle different formats including Chinese
    // English: "Showing 1–9 of 100 results"
    // zh-HK: "顯示 100 筆結果中的 1&ndash;9 筆" (Showing 1-9 of 100 results)
    // zh-CN: Similar to zh-HK or uses "条"
    let totalItems = herbUrls.length

    // Try English format first
    let pageCountMatch = firstPageHtml.match(/Showing\s+\d+(?:–|–|-|&ndash;)\s*\d+\s+of\s+(\d+)/i)

    // Try zh-HK/zh-CN format: 顯示 100 筆結果中的 1&ndash;9 筆
    if (!pageCountMatch) {
      pageCountMatch = firstPageHtml.match(/顯示\s+(\d+)\s+筆結果/)
    }

    // Alternative Chinese format
    if (!pageCountMatch) {
      pageCountMatch = firstPageHtml.match(/显示\s+(\d+)\s+条/)
    }

    if (pageCountMatch) {
      totalItems = parseInt(pageCountMatch[1])
    }

    console.log(`  Found ${totalItems} items (first page: ${herbUrls.length})`)

    // Fetch additional pages
    let pageNum = 2
    const maxPages = 20
    while (herbUrls.length < totalItems && pageNum <= maxPages) {
      const pageUrl = `${CONFIG.baseUrl}/${langConfig.path}/product-category/${categoryPath}/page/${pageNum}/`
      console.log(`  Fetching page ${pageNum}...`)
      const pageHtml = await fetchPage(pageUrl)
      if (!pageHtml) break

      const pageUrls = extractHerbUrls(pageHtml, CONFIG.baseUrl)
      if (pageUrls.length === 0) break

      herbUrls = [...new Set([...herbUrls, ...pageUrls])]
      pageNum++
      await sleep(CONFIG.delay)
    }

    console.log(`  Total URLs collected: ${herbUrls.length}`)

    for (const herbUrl of herbUrls) {
      console.log(`\n  Scraping: ${herbUrl}`)

      const herbHtml = await fetchPage(herbUrl)
      if (!herbHtml) continue

      const herbData = parseHerbPage(herbHtml, herbUrl)

      if (!herbData.title) {
        console.log('    Skipping - no title found')
        continue
      }

      if (!herbData.slug) {
        console.log('    Skipping - could not extract slug from image URL')
        continue
      }

      const slug = herbData.slug
      console.log(`    Title: ${herbData.title}`)
      console.log(`    Slug: ${slug}`)
      console.log(`    Sections: ${Object.keys(herbData.sections).join(', ') || 'none'}`)

      // Create herb directory structure
      const herbDir = path.join(CONTENT_DIR, slug)
      const imagesDir = path.join(herbDir, 'images')
      ensureDir(herbDir)
      ensureDir(imagesDir)

      // Download image (only for English)
      if (herbData.imageUrl && !skipImages && langCode === 'en') {
        const ext = path.extname(new URL(herbData.imageUrl).pathname) || '.jpg'
        const imageFilename = `${slug}${ext}`
        const imagePath = path.join(imagesDir, imageFilename)
        if (!fs.existsSync(imagePath)) {
          await downloadImage(herbData.imageUrl, imagePath)
        } else {
          console.log(`    Image exists: ${imageFilename}`)
        }
      }

      allHerbs.set(slug, herbData)

      // Generate and save YAML in herb directory
      const yamlContent = generateYaml(herbData, langCode, slug)
      const yamlPath = path.join(herbDir, `${langConfig.file}.yaml`)
      fs.writeFileSync(yamlPath, yamlContent)
      console.log(`    Saved: ${yamlPath}`)

      await sleep(CONFIG.delay)
    }
  }

  return allHerbs
}

async function scrapeHerbapedia(options = {}) {
  const { dryRun = false, skipImages = false, allLanguages = false, language = 'en' } = options

  console.log('Herbapedia Scraper v3')
  console.log('====================')
  console.log('Directory structure: src/content/herbs/{slug}/{lang}.yaml')
  console.log('Images: src/content/herbs/{slug}/images/{slug}.jpg')

  ensureDir(CONTENT_DIR)

  const languagesToScrape = allLanguages
    ? Object.keys(CONFIG.languages)
    : [language]

  let totalHerbs = 0

  for (const lang of languagesToScrape) {
    const herbs = await scrapeLanguage(lang, { dryRun, skipImages })
    totalHerbs += herbs.size
  }

  // Generate/update index
  if (!dryRun) {
    console.log('\n\nGenerating index...')
    const herbDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    const indexData = {
      total: herbDirs.length,
      categories: {},
      herbs: []
    }

    for (const slug of herbDirs) {
      const enPath = path.join(CONTENT_DIR, slug, 'en.yaml')
      if (fs.existsSync(enPath)) {
        const content = fs.readFileSync(enPath, 'utf8')
        const categoryMatch = content.match(/^category:\s*"([^"]+)"/m)
        const titleMatch = content.match(/^title:\s*"([^"]+)"/m)
        const sciMatch = content.match(/^scientific_name:\s*"([^"]+)"/m)

        if (categoryMatch) {
          const cat = categoryMatch[1]
          indexData.categories[cat] = (indexData.categories[cat] || 0) + 1

          indexData.herbs.push({
            slug,
            title: titleMatch ? titleMatch[1] : '',
            category: cat,
            scientific_name: sciMatch ? sciMatch[1] : null
          })
        }
      }
    }

    const indexPath = path.join(CONTENT_DIR, 'index.yaml')
    const indexYaml = `# Herbapedia Index\n# Auto-generated at ${new Date().toISOString()}\n\ntotal: ${indexData.total}\n\ncategories:\n${Object.entries(indexData.categories).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`
    fs.writeFileSync(indexPath, indexYaml)
    console.log(`Saved index with ${indexData.total} herbs`)
  }

  console.log('\n\nScraping complete!')
  console.log(`Total entries: ${totalHerbs}`)
}

// Parse arguments
const args = process.argv.slice(2)
const options = {
  dryRun: args.includes('--dry-run'),
  skipImages: args.includes('--skip-images'),
  allLanguages: args.includes('--all-languages'),
  language: 'en'
}

const langIndex = args.indexOf('--lang')
if (langIndex !== -1 && args[langIndex + 1]) {
  options.language = args[langIndex + 1]
}

scrapeHerbapedia(options).catch(console.error)
