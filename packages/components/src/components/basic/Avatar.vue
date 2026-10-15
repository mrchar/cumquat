<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
    shape?: 'circle' | 'square';
    /** 无图片时显示的文字（如姓名首字） */
    text?: string;
  }>(),
  { src: '', alt: '', size: 'md', shape: 'circle', text: '' },
);

const sizeClass: Record<string, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
};

const displayText = computed(() => props.text || props.alt?.charAt(0) || '');
</script>

<template>
  <span
    class="cumquat-avatar inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-cumquat-surface-3 font-medium text-cumquat-text-muted"
    :class="[sizeClass[size], shape === 'circle' ? 'rounded-full' : 'rounded-cumquat']"
  >
    <img v-if="src" :src="src" :alt="alt" class="cumquat-avatar__img size-full object-cover" />
    <slot v-else>{{ displayText }}</slot>
  </span>
</template>
