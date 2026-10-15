<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    closable?: boolean;
  }>(),
  { type: 'default', closable: false },
);

const visible = defineModel<boolean>({ default: true });

const typeClass: Record<string, string> = {
  default: 'bg-cumquat-surface-3 text-cumquat-text',
  primary: 'bg-cumquat-accent-soft text-cumquat-accent',
  success: 'bg-cumquat-success-soft text-cumquat-success',
  warning: 'bg-cumquat-warning-soft text-cumquat-warning',
  danger: 'bg-cumquat-danger-soft text-cumquat-danger',
};
</script>

<template>
  <Transition name="cumquat-fade">
    <span
      v-if="visible"
      class="cumquat-tag inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
      :class="typeClass[type]"
    >
      <slot />
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-tag__close cursor-pointer opacity-60 transition-opacity hover:opacity-100"
        @click="visible = false"
      >
        <svg
          class="size-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  </Transition>
</template>
