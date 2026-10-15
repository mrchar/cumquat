<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    closable?: boolean;
  }>(),
  { title: '', type: 'info', closable: true },
);

const visible = defineModel<boolean>('visible', { default: true });

const typeClass: Record<string, string> = {
  info: 'text-cumquat-info',
  success: 'text-cumquat-success',
  warning: 'text-cumquat-warning',
  danger: 'text-cumquat-danger',
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
      class="cumquat-notification w-80 rounded-cumquat border border-cumquat-border bg-cumquat-surface p-4 shadow-cumquat-overlay"
    >
      <div class="flex items-start gap-3">
        <span
          class="cumquat-notification__dot mt-1.5 size-2 shrink-0 rounded-full"
          :class="dotClass[type]"
        />
        <div class="cumquat-notification__body flex-1">
          <p
            v-if="title"
            class="cumquat-notification__title text-sm font-semibold text-cumquat-text"
          >
            {{ title }}
          </p>
          <div class="cumquat-notification__content mt-0.5 text-sm text-cumquat-text-muted">
            <slot />
          </div>
        </div>
        <button
          v-if="closable"
          type="button"
          aria-label="关闭"
          class="cumquat-notification__close cursor-pointer text-cumquat-text-muted transition-colors hover:text-cumquat-text"
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
    </div>
  </Transition>
</template>
