<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 进度 0-100 */
    value?: number;
    status?: 'normal' | 'success' | 'warning' | 'danger';
    /** 是否在条内右侧显示百分比 */
    showText?: boolean;
  }>(),
  { value: 0, status: 'normal', showText: true },
);

const clamped = computed(() => Math.min(100, Math.max(0, props.value)));

const barClass: Record<string, string> = {
  normal: 'bg-cumquat-accent',
  success: 'bg-cumquat-success',
  warning: 'bg-cumquat-warning',
  danger: 'bg-cumquat-danger',
};
</script>

<template>
  <div class="cumquat-progress flex w-full items-center gap-3">
    <div
      class="cumquat-progress__track h-2 flex-1 overflow-hidden rounded-full bg-cumquat-surface-3"
    >
      <div
        class="cumquat-progress__bar h-full rounded-full transition-[width] duration-300"
        :class="barClass[status]"
        :style="{ width: `${clamped}%` }"
        role="progressbar"
        :aria-valuenow="clamped"
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
    <span
      v-if="showText"
      class="cumquat-progress__text w-10 text-right text-xs text-cumquat-text-muted"
    >
      {{ clamped }}%
    </span>
  </div>
</template>
