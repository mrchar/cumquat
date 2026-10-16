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

const displayText = computed(() => props.text || props.alt?.charAt(0) || '');
</script>

<template>
  <span class="cumquat-avatar" :class="[`cumquat-avatar--${size}`, `cumquat-avatar--${shape}`]">
    <img v-if="src" :src="src" :alt="alt" class="cumquat-avatar__img" />
    <slot v-else>{{ displayText }}</slot>
  </span>
</template>
