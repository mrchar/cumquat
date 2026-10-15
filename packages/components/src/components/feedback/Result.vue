<script setup lang="ts">
withDefaults(
  defineProps<{
    status?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    subTitle?: string;
  }>(),
  { status: 'success', title: '', subTitle: '' },
);

const iconBoxClass: Record<string, string> = {
  success: 'bg-cumquat-success-soft text-cumquat-success',
  error: 'bg-cumquat-danger-soft text-cumquat-danger',
  warning: 'bg-cumquat-warning-soft text-cumquat-warning',
  info: 'bg-cumquat-info-soft text-cumquat-info',
};

const iconPath: Record<string, string> = {
  success: 'm5 13 4 4L19 7',
  error: 'M18 6 6 18M6 6l12 12',
  warning: 'M12 9v4m0 4h.01',
  info: 'M12 8h.01M11 12h1v4h1',
};
</script>

<template>
  <div class="cumquat-result flex flex-col items-center gap-3 px-6 py-10 text-center">
    <span
      class="cumquat-result__icon flex size-16 items-center justify-center rounded-full"
      :class="iconBoxClass[status]"
    >
      <svg
        class="size-8"
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
    <h3 class="cumquat-result__title text-lg font-semibold text-cumquat-text">
      <slot name="title">{{ title }}</slot>
    </h3>
    <p
      v-if="subTitle || $slots.subTitle"
      class="cumquat-result__subtitle text-sm text-cumquat-text-muted"
    >
      <slot name="subTitle">{{ subTitle }}</slot>
    </p>
    <div v-if="$slots.default" class="cumquat-result__extra mt-2 flex gap-3">
      <slot />
    </div>
  </div>
</template>
