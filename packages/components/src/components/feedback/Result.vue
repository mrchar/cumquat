<script setup lang="ts">
import { computed } from 'vue';
import { subscribeErrorText, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

interface ResultSubscribeData {
  title?: string;
  subTitle?: string;
}

const props = withDefaults(
  defineProps<{
    status?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    subTitle?: string;
    /** 订阅结果数据：挂载时调用，resolve 出的 title/subTitle 用于渲染，优先级高于 props */
    subscribe?: SubscribeHandler<ResultSubscribeData>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    status: 'success',
    title: '',
    subTitle: '',
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<ResultSubscribeData>(() => props.subscribe);

const effectiveTitle = computed<string>(() =>
  subState.value.status === 'success'
    ? (subState.value.data?.title ?? props.title ?? '')
    : (props.title ?? ''),
);
const effectiveSubTitle = computed<string>(() =>
  subState.value.status === 'success'
    ? (subState.value.data?.subTitle ?? props.subTitle ?? '')
    : (props.subTitle ?? ''),
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);

const iconPath: Record<string, string> = {
  success: 'm5 13 4 4L19 7',
  error: 'M18 6 6 18M6 6l12 12',
  warning: 'M12 9v4m0 4h.01',
  info: 'M12 8h.01M11 12h1v4h1',
};
</script>

<template>
  <div class="cumquat-result" :class="`cumquat-result--${status}`">
    <span class="cumquat-result__icon">
      <svg
        class="cumquat-result__icon-svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path :d="iconPath[status]" />
      </svg>
    </span>
    <h3 class="cumquat-result__title">
      <slot name="title">{{ effectiveTitle }}</slot>
    </h3>
    <p v-if="effectiveSubTitle || $slots.subTitle" class="cumquat-result__subtitle">
      <slot name="subTitle">{{ effectiveSubTitle }}</slot>
    </p>
    <div v-if="$slots.default" class="cumquat-result__extra">
      <slot />
    </div>

    <p v-if="errorText" class="cumquat-result__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </div>
</template>
