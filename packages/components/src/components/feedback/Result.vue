<script setup lang="ts">
withDefaults(
  defineProps<{
    status?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    subTitle?: string;
  }>(),
  { status: 'success', title: '', subTitle: '' },
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
      <slot name="title">{{ title }}</slot>
    </h3>
    <p v-if="subTitle || $slots.subTitle" class="cumquat-result__subtitle">
      <slot name="subTitle">{{ subTitle }}</slot>
    </p>
    <div v-if="$slots.default" class="cumquat-result__extra">
      <slot />
    </div>
  </div>
</template>
