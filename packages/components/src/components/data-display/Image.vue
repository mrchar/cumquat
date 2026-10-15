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
  <span
    class="cumquat-image relative inline-block overflow-hidden bg-cumquat-surface-2"
    :class="rounded ? 'rounded-cumquat' : ''"
  >
    <img
      v-if="!failed"
      :src="src"
      :alt="alt"
      class="cumquat-image__img block size-full object-cover"
      @error="onError"
    />
    <span
      v-else
      class="cumquat-image__fallback flex size-full min-h-32 min-w-32 flex-col items-center justify-center gap-1.5 text-cumquat-text-muted"
    >
      <svg
        class="size-8"
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
      <span class="text-xs">加载失败</span>
    </span>
  </span>
</template>
