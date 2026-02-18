# Herbapedia

A comprehensive multilingual encyclopedia of medicinal plants, herbs, vitamins, minerals, and nutrients - part of the SIPM (International Society of Phytomedicine) ecosystem.

## Overview

Herbapedia provides evidence-based information in **three languages**:

- 🇬🇧 **English** (default)
- 🇭🇰 **Traditional Chinese** (zh-HK)
- 🇨🇳 **Simplified Chinese** (zh-CN)

Content categories:

- **Chinese Herbs** - Traditional Chinese medicinal plants and fungi
- **Western Herbs** - European and North American herbal medicines
- **Vitamins** - Essential vitamins for human health
- **Minerals** - Important dietary minerals and trace elements
- **Nutrients** - Beneficial compounds and supplements

## Architecture

This project is designed to work both as:

1. A **standalone Vue.js application**
2. An integrated section of the main SIPM website

### Tech Stack

- Vue 3 + Composition API
- Vite 6 + vite-ssg (Static Site Generation)
- Vue Router 4 with locale prefixes
- vue-i18n for UI translations
- YAML for content storage
- Glass morphism design system (shared with SIPM)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Content Management

### Directory Structure

```
src/content/herbs/
├── index.yaml              # Index file with totals
├── ginseng/                # Each herb in its own directory
│   ├── en.yaml            # English content
│   ├── zh-HK.yaml         # Traditional Chinese content
│   ├── zh-CN.yaml         # Simplified Chinese content
│   └── images/
│       └── ginseng.jpg    # Herb image
├── lingzhi-reishi/
│   ├── en.yaml
│   ├── zh-HK.yaml
│   ├── zh-CN.yaml
│   └── images/
│       └── lingzhi-reishi.jpg
└── ...
```

### YAML Schema

Each herb entry follows this schema:

```yaml
# Ginseng
# Source: https://www.vitaherbapedia.com/en/shop/chiherbs-en/ginseng/
# Language: en

id: "ginseng"
slug: "ginseng"
category: "chinese-herbs"
title: "Ginseng"
scientific_name: "Panax Ginseng C. A. Mey"  # Optional
image: "images/ginseng.jpg"

history: |
  Historical background of the herb.

introduction: |
  Brief introduction to the herb.

traditional_usage: |
  Traditional and historical usage.

modern_usage: |
  Modern applications and usage.

functions: |
  Functions and benefits.

metadata:
  source: "vitaherbapedia.com"
  source_url: "https://www.vitaherbapedia.com/en/shop/chiherbs-en/ginseng/"
  scraped_at: "2026-02-18T08:38:57.865Z"
  language: "en"
```

### Content Fields

The following content fields are supported (based on source website availability):

| Field | Description | Availability |
|-------|-------------|--------------|
| `history` | Historical background | Most herbs |
| `introduction` | Brief introduction | Most herbs |
| `traditional_usage` | Traditional usage | All herbs |
| `modern_usage` | Modern applications | Some herbs |
| `functions` | Functions and benefits | Some herbs |

## Content Verification

### Overview

The verification script checks all herb entries for:

1. **Language completeness** - All three languages (en, zh-HK, zh-CN) present
2. **Content completeness** - All available content sections populated

### Usage

```bash
# Pretty console output with colors and emojis
node scripts/verify-content.js

# Output as JSON (for programmatic use)
node scripts/verify-content.js --json

# Generate markdown report and JSON report
node scripts/verify-content.js --report
```

### Output

The script produces:

1. **Console output** - Color-coded summary with:
   - Overall statistics
   - Language coverage percentages
   - List of problematic entries with source URLs
   - Missing languages and content fields

2. **Markdown report** (`CONTENT_REPORT.md`) - Contains:
   - Summary table
   - Language coverage table
   - GitHub issue checklists for each problematic entry

3. **JSON report** (`content-report.json`) - Machine-readable data

### Example Console Output

```
======================================================================
🌿 HERBAPEDIA CONTENT VERIFICATION REPORT 🌿
======================================================================
Generated: 2026-02-18T09:42:57.588Z

📊 OVERALL SUMMARY
──────────────────────────────────────────────────
  📁 Total entries: 178
  ✅ Complete (all languages): 175
  ❌ Incomplete: 3

🌐 LANGUAGE COVERAGE
──────────────────────────────────────────────────
  🇬🇧 English              178/178 (100%) ✅
  🇭🇰 Traditional Chinese  178/178 (100%) ✅
  🇨🇳 Simplified Chinese   175/178 (98%) ⚠️

🚨 ENTRIES WITH ISSUES (3)
──────────────────────────────────────────────────

🌿 Garlic
   Slug: garlic
   🔗 https://www.vitaherbapedia.com/en/shop/westherbs-en/garlic/
   ❌ Missing languages: 🇨🇳 zh-CN
   ⚠️ 🇬🇧 en missing content: functions
   ⚠️ 🇭🇰 zh-HK missing content: modern_usage, functions
```

### Example Markdown Checklist

The report generates copy-pasteable checklists for GitHub issues:

```markdown
## Garlic

**Source:** https://www.vitaherbapedia.com/en/shop/westherbs-en/garlic/

### Tasks

- [ ] Add Simplified Chinese (zh-CN) translation
- [ ] Add `functions` to English (en)
- [ ] Add `modern_usage` to Traditional Chinese (zh-HK)
- [ ] Add `functions` to Traditional Chinese (zh-HK)
```

## Scraping

### Scrape All Content

To scrape content from vitaherbapedia.com:

```bash
# Scrape all content (English + Chinese)
node scripts/scrape-herbapedia.js
```

The scraper uses multiple matching strategies:

1. **Scientific name matching** - Exact match on normalized scientific names
2. **Partial scientific name match** - For variations in naming
3. **Image filename matching** - Matches herbs by og:image filename
4. **Title matching** - Falls back to English title in Chinese title

### Manual Chinese Content

For herbs that can't be auto-matched, create a manual mapping in the fetcher script:

```javascript
const MANUAL_MAPPINGS = {
  'herb-slug': {
    'zh-HK': 'https://www.vitaherbapedia.com/zh/shop/...',
    'zh-CN': 'https://www.vitaherbapedia.com/cn/shop/...'
  }
}
```

## URL Structure

### English (default)

- Home: `/`
- Herbs index: `/herbs`
- Category: `/herbs/chinese-herbs`
- Herb detail: `/herbs/chinese-herbs/ginseng`

### Traditional Chinese (zh-HK)

- Home: `/zh-HK`
- Herbs index: `/zh-HK/herbs`
- Category: `/zh-HK/herbs/chinese-herbs`
- Herb detail: `/zh-HK/herbs/chinese-herbs/ginseng`

### Simplified Chinese (zh-CN)

- Home: `/zh-CN`
- Herbs index: `/zh-CN/herbs`
- Category: `/zh-CN/herbs/chinese-herbs`
- Herb detail: `/zh-CN/herbs/chinese-herbs/ginseng`

## Integration with SIPM

To integrate Herbapedia into the main SIPM site:

1. Copy the `src/content/herbs/` directory to SIPM's `src/content/`
2. Copy `src/i18n/` to SIPM's source tree
3. Copy the routes from `src/router/index.js` to SIPM's router
4. Copy the views and components to SIPM's source tree
5. Update navigation in SIPM's TheHeader component
6. Merge `package.json` dependencies

## License

Content sourced from vitaherbapedia.com (Vita Green Products Co Ltd).
Website code is proprietary to SIPM.
