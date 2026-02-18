<template>
  <div class="category-view">
    <div class="container">
      <nav class="breadcrumbs">
        <router-link to="/herbs">Herbs</router-link>
        <span>/</span>
        <span>{{ categoryTitle }}</span>
      </nav>

      <header class="category-view__header">
        <h1>{{ categoryTitle }}</h1>
        <p class="category-view__count">{{ filteredHerbs.length }} items</p>
      </header>

      <div class="category-view__grid">
        <HerbCard
          v-for="herb in filteredHerbs"
          :key="herb.slug"
          :to="`/herbs/${herb.category}/${herb.slug}`"
          :title="herb.title"
          :scientific-name="herb.scientific_name"
          :image="herb.resolvedImage"
          :category="herb.category"
        />
      </div>

      <div v-if="filteredHerbs.length === 0" class="category-view__empty">
        <p>No herbs found in this category.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HerbCard from '@/components/ui/HerbCard.vue'

const route = useRoute()
const category = computed(() => route.params.category)

const categoryTitles = {
  'chinese-herbs': 'Chinese Herbs',
  'western-herbs': 'Western Herbs',
  'vitamins': 'Vitamins',
  'minerals': 'Minerals',
  'nutrients': 'Nutrients'
}

const categoryTitle = computed(() => categoryTitles[category.value] || category.value)

// Import all herb data (new structure: herbs/{slug}/en.yaml)
const herbsModules = import.meta.glob('/src/content/herbs/*/en.yaml', { eager: true })

// Import all images
const imageModules = import.meta.glob('/src/content/herbs/*/images/*.jpg', { eager: true, as: 'url' })

const allHerbs = Object.entries(herbsModules)
  .map(([path, module]) => {
    const data = module?.default || module
    if (data && data.title) {
      // Extract slug from path
      const slugMatch = path.match(/\/([^/]+)\/en\.yaml$/)
      if (slugMatch) {
        data.slug = data.slug || slugMatch[1]

        // Resolve image URL
        const imagePath = `/src/content/herbs/${data.slug}/images/${data.slug}.jpg`
        if (imageModules[imagePath]) {
          data.resolvedImage = imageModules[imagePath]
        }
      }
      return data
    }
    return null
  })
  .filter(data => data !== null)

const filteredHerbs = computed(() =>
  allHerbs.filter(herb => herb.category === category.value)
)
</script>

<style scoped>
.category-view {
  padding: var(--spacing-2xl) 0;
  min-height: calc(100vh - var(--header-height));
}

.breadcrumbs {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  margin-bottom: var(--spacing-xl);
}

.breadcrumbs a {
  color: var(--color-primary);
  text-decoration: none;
}

.breadcrumbs a:hover {
  text-decoration: underline;
}

.category-view__header {
  margin-bottom: var(--spacing-2xl);
}

.category-view__count {
  color: var(--color-text-light);
}

.category-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.category-view__empty {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-light);
}
</style>
