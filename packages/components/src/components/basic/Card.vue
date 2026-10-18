<script setup lang="ts">
import { computed } from 'vue';
import { subscribeErrorText, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

interface CardSubscribeData {
  title?: string;
  content?: string;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 是否带描边 */
    bordered?: boolean;
    /** 是否带悬浮阴影 */
    hoverable?: boolean;
    /** 订阅卡片数据：挂载时调用，resolve 出的 title/content 用于渲染，优先级高于 props */
    subscribe?: SubscribeHandler<CardSubscribeData>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    title: '',
    bordered: true,
    hoverable: false,
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<CardSubscribeData>(() => props.subscribe);

const effectiveTitle = computed<string>(() =>
  subState.value.status === 'success'
    ? (subState.value.data?.title ?? props.title ?? '')
    : (props.title ?? ''),
);
const effectiveContent = computed<string>(() =>
  subState.value.status === 'success' ? (subState.value.data?.content ?? '') : '',
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);
</script>

<template>
  <section
    class="cumquat-card"
    :class="[bordered ? 'cumquat-card--bordered' : '', hoverable ? 'cumquat-card--hoverable' : '']"
  >
    <header v-if="effectiveTitle || $slots.header" class="cumquat-card__header">
      <slot name="header">
        <h3 class="cumquat-card__title">{{ effectiveTitle }}</h3>
      </slot>
    </header>
    <div class="cumquat-card__body">
      <slot>{{ effectiveContent }}</slot>
    </div>
    <footer v-if="$slots.footer" class="cumquat-card__footer">
      <slot name="footer" />
    </footer>

    <p v-if="errorText" class="cumquat-card__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </section>
</template>
