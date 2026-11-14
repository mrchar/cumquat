<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** 图标尺寸 */
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md' },
);
</script>

<template>
  <svg
    class="cumquat-icon"
    :class="`cumquat-icon--${size}`"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <slot />
  </svg>
</template>
