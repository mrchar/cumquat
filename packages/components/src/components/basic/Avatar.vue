<script setup lang="ts">
import { computed, ref } from 'vue';
import { useImageState } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
    shape?: 'circle' | 'square';
    /** 无图片时显示的文字（如姓名；仅取首字回退） */
    text?: string;
    /** 图片进入视口再加载 */
    lazy?: boolean;
    /** 图片加载失败时的兜底地址 */
    fallbackSrc?: string;
  }>(),
  {
    src: '',
    alt: '',
    size: 'md',
    shape: 'circle',
    text: '',
    lazy: false,
    fallbackSrc: '',
  },
);

const hostRef = ref<HTMLElement | null>(null);

const image = useImageState(() => props.src, {
  lazy: props.lazy,
  target: hostRef,
});

/** 兜底图加载失败后最终回退到文字 */
const fallbackFailed = ref(false);

const fallbackText = computed(() => {
  const source = props.text || props.alt;
  return source ? (Array.from(source.trim())[0] ?? '') : '';
});

const showImage = computed(() => !!props.src && image.shouldLoad.value && !image.isError.value);
const showFallback = computed(
  () => !!props.fallbackSrc && image.isError.value && !fallbackFailed.value,
);

function onFallbackError() {
  fallbackFailed.value = true;
}
</script>

<template>
  <span
    ref="hostRef"
    class="cumquat-avatar"
    :class="[
      `cumquat-avatar--${size}`,
      `cumquat-avatar--${shape}`,
      image.isLoading.value ? 'cumquat-avatar--loading' : '',
    ]"
  >
    <img
      v-if="showImage"
      :src="src"
      :alt="alt"
      class="cumquat-avatar__img"
      @load="image.onLoad"
      @error="image.onError"
    />
    <img
      v-else-if="showFallback"
      :src="fallbackSrc"
      :alt="alt"
      class="cumquat-avatar__img"
      @error="onFallbackError"
    />
    <slot v-else>{{ fallbackText }}</slot>
  </span>
</template>
