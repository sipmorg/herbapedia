<template>
  <router-link :to="to" class="herb-card">
    <div class="herb-card__image-wrapper">
      <img
        v-if="image"
        :src="image"
        :alt="title"
        class="herb-card__image"
        loading="lazy"
      />
      <div v-else class="herb-card__placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span class="herb-card__category">{{ categoryLabel }}</span>
    </div>
    <div class="herb-card__content">
      <h3 class="herb-card__title">{{ title }}</h3>
      <p v-if="scientificName" class="herb-card__scientific">{{ scientificName }}</p>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  to: { type: String, required: true },
  title: { type: String, required: true },
  scientificName: { type: String, default: '' },
  image: { type: String, default: '' },
  category: { type: String, default: '' }
})

const categoryLabels = {
  'chinese-herbs': 'Chinese Herb',
  'western-herbs': 'Western Herb',
  'vitamins': 'Vitamin',
  'minerals': 'Mineral',
  'nutrients': 'Nutrient'
}

const categoryLabel = computed(() => categoryLabels[props.category] || props.category)
</script>

<style scoped>
.herb-card {
  display: block;
  text-decoration: none;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Only apply hover effects on devices that support hover (not touch) */
@media (hover: hover) and (pointer: fine) {
  .herb-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
  }

  .herb-card:hover .herb-card__image {
    transform: scale(1.05);
  }
}

/* Active state for mobile tap feedback */
.herb-card:active {
  transform: scale(0.98);
}

.herb-card__image-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-background);
}

.herb-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.herb-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
}

.herb-card__placeholder svg {
  width: 48px;
  height: 48px;
}

.herb-card__category {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
}

.herb-card__content {
  padding: var(--spacing-md);
}

.herb-card__title {
  font-family: var(--font-serif);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xs);
}

.herb-card__scientific {
  font-size: var(--font-size-sm);
  font-style: italic;
  color: var(--color-text-light);
  margin: 0;
}
</style>
