<template>
  <div class="herbs-view">
    <div class="container">
      <header class="herbs-view__header">
        <h1>Herbapedia</h1>
        <p class="herbs-view__subtitle">
          Browse our collection of medicinal plants, herbs, vitamins, minerals, and nutrients
        </p>
      </header>

      <div class="herbs-view__categories">
        <router-link
          v-for="cat in categories"
          :key="cat.slug"
          :to="`/herbs/${cat.slug}`"
          class="category-chip"
          :class="{ 'category-chip--active': false }"
        >
          {{ cat.title }} ({{ cat.count }})
        </router-link>
      </div>

      <div class="herbs-view__grid">
        <HerbCard
          v-for="herb in herbs"
          :key="herb.slug"
          :to="`/herbs/${herb.category}/${herb.slug}`"
          :title="herb.title"
          :scientific-name="herb.scientific_name"
          :image="herb.resolvedImage"
          :category="herb.category"
        />
      </div>

      <div v-if="herbs.length === 0" class="herbs-view__empty">
        <p>No herbs found. Run the scraper to populate data.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import HerbCard from '@/components/ui/HerbCard.vue'

// Import all herb data using Vite glob (new structure: herbs/{slug}/en.yaml)
const herbsModules = import.meta.glob('/src/content/herbs/*/en.yaml', { eager: true })

// Import all images
const imageModules = import.meta.glob('/src/content/herbs/*/images/*.jpg', { eager: true, as: 'url' })

// Parse herb data
const herbs = ref([])
const categories = ref([
  { slug: 'chinese-herbs', title: 'Chinese Herbs', count: 0 },
  { slug: 'western-herbs', title: 'Western Herbs', count: 0 },
  { slug: 'vitamins', title: 'Vitamins', count: 0 },
  { slug: 'minerals', title: 'Minerals', count: 0 },
  { slug: 'nutrients', title: 'Nutrients', count: 0 }
])

// Process imported modules
Object.entries(herbsModules).forEach(([path, module]) => {
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

    herbs.value.push(data)

    // Update category count
    const cat = categories.value.find(c => c.slug === data.category)
    if (cat) cat.count++
  }
})
</script>

<style scoped>
.herbs-view {
  padding: var(--spacing-2xl) 0;
  min-height: calc(100vh - var(--header-height));
}

.herbs-view__header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.herbs-view__subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-light);
  max-width: 600px;
  margin: 0 auto;
}

.herbs-view__categories {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-2xl);
}

.category-chip {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.category-chip:hover {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.category-chip--active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.herbs-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.herbs-view__empty {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-light);
}
</style>
