<template>
  <div class="herb-detail-view">
    <div class="container container-narrow">
      <nav class="breadcrumbs">
        <router-link to="/herbs">Herbs</router-link>
        <span>/</span>
        <router-link :to="`/herbs/${herb?.category}`">{{ categoryTitle }}</router-link>
        <span>/</span>
        <span>{{ herb?.title }}</span>
      </nav>

      <article v-if="herb" class="herb-detail">
        <header class="herb-detail__header">
          <div class="herb-detail__image-wrapper">
            <img
              v-if="herb.resolvedImage"
              :src="herb.resolvedImage"
              :alt="herb.title"
              class="herb-detail__image"
            />
            <div v-else class="herb-detail__placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          <div class="herb-detail__meta">
            <span class="herb-detail__category">{{ categoryTitle }}</span>
            <h1 class="herb-detail__title">{{ herb.title }}</h1>
            <p v-if="herb.scientific_name" class="herb-detail__scientific">
              {{ herb.scientific_name }}
            </p>
          </div>
        </header>

        <div class="herb-detail__content">
          <section v-if="herb.history" class="herb-detail__section">
            <h2>History</h2>
            <p>{{ herb.history }}</p>
          </section>

          <section v-if="herb.introduction" class="herb-detail__section">
            <h2>Introduction</h2>
            <p>{{ herb.introduction }}</p>
          </section>

          <section v-if="herb.botanical_source" class="herb-detail__section">
            <h2>Botanical Source</h2>
            <p>{{ herb.botanical_source }}</p>
          </section>

          <section v-if="herb.traditional_usage" class="herb-detail__section">
            <h2>Traditional Usage</h2>
            <p>{{ herb.traditional_usage }}</p>
          </section>

          <section v-if="herb.modern_research" class="herb-detail__section">
            <h2>Modern Research</h2>
            <p>{{ herb.modern_research }}</p>
          </section>

          <section v-if="herb.functions" class="herb-detail__section">
            <h2>Functions</h2>
            <p>{{ herb.functions }}</p>
          </section>

          <section v-if="herb.importance" class="herb-detail__section">
            <h2>Importance</h2>
            <p>{{ herb.importance }}</p>
          </section>

          <section v-if="herb.food_sources" class="herb-detail__section">
            <h2>Food Sources</h2>
            <p>{{ herb.food_sources }}</p>
          </section>

          <aside class="herb-detail__disclaimer">
            <p>
              <strong>Disclaimer:</strong> The content is not intended to be a substitute for
              professional medical advice, diagnosis, or treatment. Please always seek the
              advice of your physician or other qualified health provider with any questions
              you may have regarding a medical condition.
            </p>
          </aside>
        </div>
      </article>

      <div v-else class="herb-detail__not-found">
        <h1>Herb Not Found</h1>
        <p>The requested herb could not be found in our database.</p>
        <router-link to="/herbs" class="herb-detail__back-link">
          &larr; Back to Herbs
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = computed(() => route.params.slug)

const categoryTitles = {
  'chinese-herbs': 'Chinese Herbs',
  'western-herbs': 'Western Herbs',
  'vitamins': 'Vitamins',
  'minerals': 'Minerals',
  'nutrients': 'Nutrients'
}

const categoryTitle = computed(() => categoryTitles[route.params.category] || route.params.category)

// Import all herb data (new structure: herbs/{slug}/en.yaml)
const herbsModules = import.meta.glob('/src/content/herbs/*/en.yaml', { eager: true })

// Import all images
const imageModules = import.meta.glob('/src/content/herbs/*/images/*.jpg', { eager: true, as: 'url' })

const herb = computed(() => {
  // Find the module matching the slug
  const path = `/src/content/herbs/${slug.value}/en.yaml`
  const module = herbsModules[path]
  const data = module?.default || module || null

  if (data) {
    // Resolve image URL
    const imagePath = `/src/content/herbs/${slug.value}/images/${slug.value}.jpg`
    if (imageModules[imagePath]) {
      data.resolvedImage = imageModules[imagePath]
    }
  }

  return data
})
</script>

<style scoped>
.herb-detail-view {
  padding: var(--spacing-2xl) 0;
  min-height: calc(100vh - var(--header-height));
}

.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
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

.herb-detail__header {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.herb-detail__image-wrapper {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-background);
}

.herb-detail__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.herb-detail__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
}

.herb-detail__placeholder svg {
  width: 64px;
  height: 64px;
}

.herb-detail__meta {
  flex: 1;
}

.herb-detail__category {
  display: inline-block;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-md);
}

.herb-detail__title {
  margin-bottom: var(--spacing-sm);
}

.herb-detail__scientific {
  font-style: italic;
  color: var(--color-text-light);
  margin: 0;
}

.herb-detail__content {
  background: var(--color-surface);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.herb-detail__section {
  margin-bottom: var(--spacing-xl);
}

.herb-detail__section:last-of-type {
  margin-bottom: 0;
}

.herb-detail__section h2 {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-accent);
}

.herb-detail__section p {
  line-height: var(--line-height-relaxed);
}

.herb-detail__disclaimer {
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-lg);
  background: var(--color-background);
  border-left: 4px solid var(--color-accent);
  border-radius: var(--radius-sm);
}

.herb-detail__disclaimer p {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  margin: 0;
}

.herb-detail__not-found {
  text-align: center;
  padding: var(--spacing-3xl);
}

.herb-detail__back-link {
  display: inline-block;
  margin-top: var(--spacing-lg);
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .herb-detail__header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .herb-detail__image-wrapper {
    width: 150px;
    height: 150px;
  }
}
</style>
