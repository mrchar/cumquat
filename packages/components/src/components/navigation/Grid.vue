<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** 列数（1-4） */
    cols?: 1 | 2 | 3 | 4;
    gap?: 'none' | 'sm' | 'md' | 'lg';
  }>(),
  { cols: 2, gap: 'md' },
);
</script>

<template>
  <div
    class="cumquat-grid"
    :class="[`cumquat-grid--cols-${props.cols}`, `cumquat-grid--gap-${props.gap}`]"
  >
    <slot />
  </div>
</template>
