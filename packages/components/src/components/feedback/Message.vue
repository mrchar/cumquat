<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'danger';
    closable?: boolean;
  }>(),
  { type: 'info', closable: false },
);

const visible = defineModel<boolean>({ default: true });
</script>

<template>
  <Transition name="cumquat-fade">
    <div v-if="visible" role="status" class="cumquat-message" :class="`cumquat-message--${type}`">
      <span class="cumquat-message__dot" :class="`cumquat-message__dot--${type}`" />
      <span class="cumquat-message__body">
        <slot />
      </span>
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-message__close"
        @click="visible = false"
      >
        <svg
          class="cumquat-message__close-icon"
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
