<template>
  <div class="home-view">
    <section class="hero">
      <div class="hero__background">
        <img
          :src="heroImage"
          alt=""
          class="hero__bg-image"
          @error="handleHeroError"
        />
        <div class="hero__overlay"></div>
      </div>
      <div class="container hero__container">
        <div class="hero__content">
          <h1 class="hero__title">{{ t('home.heroTitle') }}</h1>
          <p class="hero__subtitle">{{ t('home.heroSubtitle') }}</p>
          <p class="hero__description">
            {{ t('home.heroDescription') }}
          </p>
          <router-link :to="localePath('/herbs')" class="hero__cta">
            {{ t('home.exploreHerbs') }}
          </router-link>
        </div>
      </div>
    </section>

    <section class="categories">
      <div class="container">
        <h2 class="categories__title">{{ t('home.categoriesTitle') }}</h2>
        <div class="categories__grid">
          <GlassCard
            v-for="category in categories"
            :key="category.slug"
            hoverable
            padding="lg"
            class="categories__card"
          >
            <router-link :to="localePath(`/herbs/${category.slug}`)" class="category-card">
              <div class="category-card__icon" v-html="category.icon"></div>
              <h3 class="category-card__title">{{ category.title }}</h3>
              <p class="category-card__count">{{ category.count }} {{ t('common.items') }}</p>
            </router-link>
          </GlassCard>
        </div>
      </div>
    </section>

    <section class="about">
      <div class="container container-narrow">
        <GlassCard padding="xl">
          <h2>{{ t('home.aboutTitle') }}</h2>
          <p>{{ t('home.aboutP1') }}</p>
          <p>{{ t('home.aboutP2') }}</p>
          <router-link :to="localePath('/about')" class="about__link">{{ t('home.learnMore') }}</router-link>
        </GlassCard>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GlassCard from '@/components/ui/GlassCard.vue'
import { useCategories } from '@/composables/useHerbData'
import { DEFAULT_LOCALE } from '@/i18n/locales'

const { t, locale } = useI18n()

// Hero image path - dynamic to avoid static analysis
const heroImage = '/@herbapedia/data/media/images/banners/tcm-banner.jpg'

// Get categories with localized titles
const categoriesData = useCategories()

// Helper to get localized value from language map
const getLocalizedValue = (langMap, loc) => {
  if (!langMap || typeof langMap === 'string') return langMap
  return langMap[loc] || langMap['en'] || langMap
}

const categories = computed(() =>
  categoriesData.value.map(cat => ({
    slug: cat.slug,
    title: getLocalizedValue(cat.title, locale.value),
    count: cat.count,
    icon: getCategoryIcon(cat.slug)
  }))
)

// Helper to generate localized paths
const localePath = (path) => {
  if (locale.value === DEFAULT_LOCALE) {
    return path
  }
  return `/${locale.value}${path}`
}

// Category icons with distinctive SVG designs
function getCategoryIcon(slug) {
  const icons = {
    'chinese-herbs': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3 12h18"/><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" opacity="0.2"/></svg>',
    'western-herbs': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c-4 4-6 8-6 12 0 4 2.5 6 6 6s6-2 6-6c0-4-2-8-6-12z"/><path d="M12 8v8"/><path d="M9 12h6"/></svg>',
    'vitamins': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 6v4"/><path d="M10 8h4"/></svg>',
    'minerals': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l8 6v8l-8 6-8-6V8l8-6z"/><path d="M12 22V10"/><path d="M4 8l8 2 8-2"/></svg>',
    'nutrients': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="12" cy="16" r="3"/><path d="M10 10l2 4"/><path d="M14 10l-2 4"/></svg>'
  }
  return icons[slug] || icons['nutrients']
}

// Handle hero image error - fall back to gradient
function handleHeroError(event) {
  event.target.style.display = 'none'
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
}

/* Hero Section */
.hero {
  position: relative;
  color: var(--color-text-inverse);
  padding: var(--spacing-3xl) 0;
  overflow: hidden;
}

.hero__background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero__bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(45, 98, 99, 0.9), rgba(59, 126, 128, 0.85));
}

.hero__container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 400px;
}

.hero__content {
  max-width: 600px;
}

.hero__title {
  font-size: var(--font-size-5xl);
  color: var(--color-text-inverse);
  margin-bottom: var(--spacing-sm);
}

.hero__subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-accent);
  margin-bottom: var(--spacing-lg);
}

.hero__description {
  font-size: var(--font-size-lg);
  opacity: 0.9;
  margin-bottom: var(--spacing-xl);
}

.hero__cta {
  display: inline-block;
  background: var(--color-accent);
  color: var(--color-text);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
}

.hero__cta:hover {
  background: var(--color-accent-light);
  transform: translateY(-2px);
}

/* Categories Section */
.categories {
  padding: var(--spacing-3xl) 0;
  background: var(--color-background);
}

.categories__title {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.categories__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.category-card {
  display: block;
  text-align: center;
  text-decoration: none;
  color: inherit;
}

.category-card__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--spacing-md);
  color: var(--color-primary);
}

.category-card__icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.category-card__title {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
}

.category-card__count {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  margin: 0;
}

/* About Section */
.about {
  padding: var(--spacing-3xl) 0;
  background: linear-gradient(180deg, var(--color-background), var(--color-surface));
}

.about h2 {
  margin-bottom: var(--spacing-lg);
}

.about p {
  margin-bottom: var(--spacing-md);
}

.about__link {
  display: inline-block;
  margin-top: var(--spacing-md);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}
</style>
