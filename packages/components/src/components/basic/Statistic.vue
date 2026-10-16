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
  <div class="cumquat-statistic">
    <span v-if="title" class="cumquat-statistic__title">{{ title }}</span>
    <p class="cumquat-statistic__value">
      <span v-if="prefix" class="cumquat-statistic__prefix">{{ prefix }}</span>
      <span class="cumquat-statistic__number">
        <slot>{{ value }}</slot>
      </span>
      <span v-if="suffix" class="cumquat-statistic__suffix">{{ suffix }}</span>
    </p>
  </div>
</template>
