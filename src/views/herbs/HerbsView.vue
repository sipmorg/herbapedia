<template>
  <div class="herbs-view">
    <!-- Hero Banner -->
    <section class="herbs-hero">
      <div class="herbs-hero__background">
        <img
          :src="heroImage"
          alt=""
          class="herbs-hero__bg-image"
          @error="handleImageError"
        />
        <div class="herbs-hero__overlay"></div>
      </div>
      <div class="container herbs-hero__content">
        <h1 class="herbs-hero__title">{{ t('nav.herbs') }}</h1>
        <p class="herbs-hero__subtitle">{{ t('common.browseCollection') }}</p>
      </div>
    </section>

    <div class="container">
      <div class="herbs-view__categories">
        <router-link
          v-for="cat in categories"
          :key="cat.slug"
          :to="localePath(`/herbs/${cat.slug}`)"
          class="category-chip"
          :class="{ 'category-chip--active': false }"
        >
          {{ localizer.getCategoryLabel(cat.slug) }} ({{ cat.count }})
        </router-link>
      </div>

      <div class="herbs-view__grid">
        <HerbCard
          v-for="herb in herbs"
          :key="herb.slug"
          :to="localePath(`/herbs/${herb.category}/${herb.slug}`)"
          :title="localizer.getName(herb)"
          :english-title="localizer.getCommonName(herb)"
          :scientific-name="herb.scientificName"
          :image="herb.image"
          :category="herb.category"
        />
      </div>

      <div v-if="herbs.length === 0" class="herbs-view__empty">
        <p>{{ t('common.noHerbsFound') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import HerbCard from '@/components/ui/HerbCard.vue'
import { DEFAULT_LOCALE } from '@/i18n/locales'
import { useAllHerbs, useCategories, useHerbLocalizer } from '@/composables/useHerbData'

const { t, locale } = useI18n()
const route = useRoute()

const localizer = useHerbLocalizer()

// Hero image path - dynamic to avoid static analysis
const heroImage = '/@herbapedia/data/media/images/banners/tcm-banner.jpg'

// Get all herbs
const allHerbs = useAllHerbs()

// Get categories with counts
const allCategories = useCategories()

// Helper to generate localized paths
const localePath = (path) => {
  if (locale.value === DEFAULT_LOCALE) {
    return path
  }
  return `/${locale.value}${path}`
}

// Filter herbs by category from route
const herbs = computed(() => {
  const category = route.params.category
  if (!category) return allHerbs.value

  return allHerbs.value.filter(h => h.category === category)
})

// Update categories with localized titles and filtered counts
const categories = computed(() => {
  return allCategories.value.map(cat => ({
    ...cat,
    title: localizer.getCategoryLabel(cat.slug),
    count: herbs.value.filter(h => h.category === cat.slug).length
  }))
})

// Handle hero image error - fall back to gradient
function handleImageError(event) {
  event.target.style.display = 'none'
}
</script>

<style scoped>
.herbs-view {
  min-height: calc(100vh - var(--header-height));
}

/* Hero Banner */
.herbs-hero {
  position: relative;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: var(--spacing-2xl);
}

.herbs-hero__background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.herbs-hero__bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.herbs-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(34, 139, 34, 0.85), rgba(0, 100, 0, 0.75));
}

.herbs-hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: var(--color-text-inverse);
}

.herbs-hero__title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-inverse);
}

.herbs-hero__subtitle {
  font-size: var(--font-size-lg);
  opacity: 0.9;
  max-width: 500px;
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
