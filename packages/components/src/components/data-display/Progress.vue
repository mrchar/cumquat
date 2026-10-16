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
</script>

<template>
  <div class="cumquat-progress">
    <div class="cumquat-progress__track">
      <div
        class="cumquat-progress__bar"
        :class="`cumquat-progress__bar--${status}`"
        :style="{ width: `${clamped}%` }"
        role="progressbar"
        :aria-valuenow="clamped"
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
    <span v-if="showText" class="cumquat-progress__text"> {{ clamped }}% </span>
  </div>
</template>
