<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    /** 数值展示（字符串或数字） */
    value: string | number;
    prefix?: string;
    suffix?: string;
  }>(),
  { title: '', prefix: '', suffix: '' },
);
</script>

<template>
  <div class="cumquat-statistic flex flex-col gap-1">
    <span v-if="title" class="cumquat-statistic__title text-sm text-cumquat-text-muted">{{
      title
    }}</span>
    <p class="cumquat-statistic__value flex items-baseline gap-0.5 font-semibold text-cumquat-text">
      <span v-if="prefix" class="cumquat-statistic__prefix text-base">{{ prefix }}</span>
      <span class="cumquat-statistic__number text-3xl tabular-nums tracking-tight">
        <slot>{{ value }}</slot>
      </span>
      <span v-if="suffix" class="cumquat-statistic__suffix text-base text-cumquat-text-muted">{{
        suffix
      }}</span>
    </p>
  </div>
</template>
