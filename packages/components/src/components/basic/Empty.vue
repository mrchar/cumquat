<script setup lang="ts">
import { computed } from 'vue';
import { subscribeErrorText, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    description?: string;
    /** 订阅空状态描述：挂载时调用，resolve 出的字符串用于渲染，优先级高于 description */
    subscribe?: SubscribeHandler<string>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    description: '暂无数据',
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<string>(() => props.subscribe);

const effectiveDescription = computed<string>(() =>
  subState.value.status === 'success'
    ? (subState.value.data as string)
    : (props.description ?? '暂无数据'),
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);
</script>

<template>
  <div class="cumquat-empty">
    <svg
      class="cumquat-empty__image"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <rect x="10" y="14" width="44" height="36" rx="4" />
      <path d="M10 26h44" />
      <path d="M22 40h20" stroke-linecap="round" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="24" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
    <p class="cumquat-empty__description">
      <slot>{{ effectiveDescription }}</slot>
    </p>
    <div v-if="$slots.default" class="cumquat-empty__extra">
      <slot />
    </div>

    <p v-if="errorText" class="cumquat-empty__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </div>
</template>
