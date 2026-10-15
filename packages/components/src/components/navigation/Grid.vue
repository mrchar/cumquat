<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 列数（1-4） */
    cols?: 1 | 2 | 3 | 4;
    gap?: 'none' | 'sm' | 'md' | 'lg';
  }>(),
  { cols: 2, gap: 'md' },
);

const colsClass = computed(
  () =>
    ({
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-4',
    })[props.cols],
);

const gapClass = computed(
  () =>
    ({
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    })[props.gap],
);
</script>

<template>
  <div class="cumquat-grid grid" :class="[colsClass, gapClass]">
    <slot />
  </div>
</template>
