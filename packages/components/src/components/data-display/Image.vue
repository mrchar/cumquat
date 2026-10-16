<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    /** 圆角 */
    rounded?: boolean;
  }>(),
  { alt: '', rounded: false },
);

const failed = ref(false);

function onError() {
  failed.value = true;
}
</script>

<template>
  <span class="cumquat-image" :class="rounded ? 'cumquat-image--rounded' : ''">
    <img v-if="!failed" :src="src" :alt="alt" class="cumquat-image__img" @error="onError" />
    <span v-else class="cumquat-image__fallback">
      <svg
        class="cumquat-image__fallback-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-4-4L5 23" />
      </svg>
      <span class="cumquat-image__fallback-text">加载失败</span>
    </span>
  </span>
</template>
