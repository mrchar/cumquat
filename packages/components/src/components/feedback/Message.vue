<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'danger';
    closable?: boolean;
  }>(),
  { type: 'info', closable: false },
);

const visible = defineModel<boolean>({ default: true });

const typeClass: Record<string, string> = {
  info: 'bg-cumquat-info-soft text-cumquat-info',
  success: 'bg-cumquat-success-soft text-cumquat-success',
  warning: 'bg-cumquat-warning-soft text-cumquat-warning',
  danger: 'bg-cumquat-danger-soft text-cumquat-danger',
};

const dotClass: Record<string, string> = {
  info: 'bg-cumquat-info',
  success: 'bg-cumquat-success',
  warning: 'bg-cumquat-warning',
  danger: 'bg-cumquat-danger',
};
</script>

<template>
  <Transition name="cumquat-fade">
    <div
      v-if="visible"
      role="status"
      class="cumquat-message flex items-center gap-2.5 rounded-cumquat px-4 py-2.5 text-sm shadow-cumquat-overlay"
      :class="typeClass[type]"
    >
      <span class="cumquat-message__dot size-2 shrink-0 rounded-full" :class="dotClass[type]" />
      <span class="cumquat-message__body flex-1">
        <slot />
      </span>
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-message__close cursor-pointer opacity-60 transition-opacity hover:opacity-100"
        @click="visible = false"
      >
        <svg
          class="size-3.5"
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
