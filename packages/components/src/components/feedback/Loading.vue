<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    text?: string;
  }>(),
  { size: 'md', text: '' },
);
</script>

<template>
  <div class="cumquat-loading" role="status" aria-label="加载中">
    <span class="cumquat-loading__spinner" :class="`cumquat-loading__spinner--${size}`" />
    <span v-if="text" class="cumquat-loading__text">{{ text }}</span>
  </div>
</template>
