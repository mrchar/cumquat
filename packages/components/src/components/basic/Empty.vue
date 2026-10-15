<script setup lang="ts">
withDefaults(
  defineProps<{
    description?: string;
  }>(),
  { description: '暂无数据' },
);
</script>

<template>
  <div class="cumquat-empty flex flex-col items-center justify-center gap-3 px-6 py-12">
    <svg
      class="cumquat-empty__image size-16 text-cumquat-border-strong"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <rect x="10" y="14" width="44" height="36" rx="4" />
      <path d="M10 26h44" />
      <path d="M22 40h20" stroke-linecap="round" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="24" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
    <p class="cumquat-empty__description text-sm text-cumquat-text-muted">
      <slot>{{ description }}</slot>
    </p>
    <div v-if="$slots.default" class="cumquat-empty__extra">
      <slot />
    </div>
  </div>
</template>
