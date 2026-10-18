<script setup lang="ts">
import { computed, ref } from 'vue';
import { subscribeErrorText, useImageState, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

interface AvatarSubscribeData {
  src?: string;
  text?: string;
}

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
    /** 订阅头像数据：挂载时调用，resolve 出的 src/text 用于渲染，优先级高于 props */
    subscribe?: SubscribeHandler<AvatarSubscribeData>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    src: '',
    alt: '',
    size: 'md',
    shape: 'circle',
    text: '',
    lazy: false,
    fallbackSrc: '',
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<AvatarSubscribeData>(() => props.subscribe);

const effectiveSrc = computed<string>(() =>
  subState.value.status === 'success'
    ? (subState.value.data?.src ?? props.src ?? '')
    : (props.src ?? ''),
);
const effectiveText = computed<string>(() =>
  subState.value.status === 'success'
    ? (subState.value.data?.text ?? props.text ?? '')
    : (props.text ?? ''),
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);

const hostRef = ref<HTMLElement | null>(null);

const image = useImageState(() => effectiveSrc.value, {
  lazy: props.lazy,
  target: hostRef,
});

/** 兜底图加载失败后最终回退到文字 */
const fallbackFailed = ref(false);

const fallbackText = computed(() => {
  const source = effectiveText.value || props.alt;
  return source ? (Array.from(source.trim())[0] ?? '') : '';
});

const showImage = computed(
  () => !!effectiveSrc.value && image.shouldLoad.value && !image.isError.value,
);
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
      :src="effectiveSrc"
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

    <p v-if="errorText" class="cumquat-avatar__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </span>
</template>
