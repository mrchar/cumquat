<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    closable?: boolean;
    /** 是否显示强调色左边条 */
    showIcon?: boolean;
  }>(),
  { type: 'info', title: '', closable: false, showIcon: true },
);

const visible = defineModel<boolean>({ default: true });

const typeClass: Record<string, string> = {
  info: 'bg-cumquat-info-soft text-cumquat-info',
  success: 'bg-cumquat-success-soft text-cumquat-success',
  warning: 'bg-cumquat-warning-soft text-cumquat-warning',
  danger: 'bg-cumquat-danger-soft text-cumquat-danger',
};

const iconPath: Record<string, string> = {
  info: 'M12 8h.01M11 12h1v4h1',
  success: 'm5 13 4 4L19 7',
  warning: 'M12 9v4m0 4h.01M12 3 2 20h20L12 3z',
  danger:
    'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
};
</script>

<template>
  <Transition name="cumquat-fade">
    <div
      v-if="visible"
      role="alert"
      class="cumquat-alert flex items-start gap-3 rounded-cumquat px-4 py-3"
      :class="typeClass[type]"
    >
      <svg
        v-if="showIcon"
        class="cumquat-alert__icon mt-0.5 size-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path :d="iconPath[type]" />
      </svg>
      <div class="cumquat-alert__body flex-1">
        <p v-if="title || $slots.title" class="cumquat-alert__title font-semibold">
          <slot name="title">{{ title }}</slot>
        </p>
        <div class="cumquat-alert__content text-sm opacity-90">
          <slot />
        </div>
      </div>
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-alert__close cursor-pointer opacity-60 transition-opacity hover:opacity-100"
        @click="visible = false"
      >
        <svg
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>
