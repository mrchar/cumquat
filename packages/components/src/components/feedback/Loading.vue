<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    text?: string;
  }>(),
  { size: 'md', text: '' },
);

const sizeClass: Record<string, string> = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-9 border-4',
};
</script>

<template>
  <div class="cumquat-loading inline-flex items-center gap-2.5" role="status" aria-label="加载中">
    <span
      class="cumquat-loading__spinner inline-block animate-spin rounded-full border-cumquat-border border-t-cumquat-accent"
      :class="sizeClass[size]"
    />
    <span v-if="text" class="cumquat-loading__text text-sm text-cumquat-text-muted">{{
      text
    }}</span>
  </div>
</template>
