<script setup lang="ts">
import { computed } from 'vue';
import { subscribeErrorText, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

type ProgressStatus = 'normal' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    /** 进度 0-100 */
    value?: number;
    status?: ProgressStatus;
    /** 线形 / 环形 */
    type?: 'line' | 'circle';
    /** 是否显示百分比 */
    showText?: boolean;
    /** 环形直径（px） */
    size?: number;
    /** 环的描边宽度（px） */
    strokeWidth?: number;
    /** 条形高度（px） */
    lineHeight?: number;
    /** 订阅进度数据：挂载时调用，resolve 出的进度值用于渲染，优先级高于 value */
    subscribe?: SubscribeHandler<number>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    value: 0,
    status: 'normal',
    type: 'line',
    showText: true,
    size: 80,
    strokeWidth: 6,
    lineHeight: 8,
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<number>(() => props.subscribe);

const effectiveValue = computed<number>(() =>
  subState.value.status === 'success' ? (subState.value.data as number) : props.value,
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);

const clamped = computed(() => Math.min(100, Math.max(0, effectiveValue.value)));

/** 状态推导：normal 且满格自动转 success */
const resolvedStatus = computed<ProgressStatus>(() => {
  if (props.status !== 'normal') return props.status;
  return clamped.value >= 100 ? 'success' : 'normal';
});

const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => circumference.value * (1 - clamped.value / 100));
const center = computed(() => props.size / 2);
</script>

<template>
  <div
    class="cumquat-progress"
    :class="[`cumquat-progress--${type}`, `cumquat-progress--${resolvedStatus}`]"
  >
    <template v-if="type === 'line'">
      <div class="cumquat-progress__track" :style="{ height: `${lineHeight}px` }">
        <div
          class="cumquat-progress__bar"
          :class="`cumquat-progress__bar--${resolvedStatus}`"
          :style="{ width: `${clamped}%` }"
          role="progressbar"
          :aria-valuenow="clamped"
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      <span v-if="showText" class="cumquat-progress__text">{{ clamped }}%</span>
    </template>

    <template v-else>
      <span
        class="cumquat-progress__circle-wrap"
        :style="{ width: `${size}px`, height: `${size}px` }"
      >
        <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
          <circle
            class="cumquat-progress__circle-track"
            :cx="center"
            :cy="center"
            :r="radius"
            :stroke-width="strokeWidth"
            fill="none"
          />
          <circle
            class="cumquat-progress__circle"
            :class="`cumquat-progress__circle--${resolvedStatus}`"
            :cx="center"
            :cy="center"
            :r="radius"
            :stroke-width="strokeWidth"
            fill="none"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
            :transform="`rotate(-90 ${center} ${center})`"
          />
        </svg>
        <span v-if="showText" class="cumquat-progress__text">{{ clamped }}%</span>
      </span>
    </template>

    <p v-if="errorText" class="cumquat-progress__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </div>
</template>
