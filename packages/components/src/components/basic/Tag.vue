<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    closable?: boolean;
  }>(),
  { type: 'default', closable: false },
);

const visible = defineModel<boolean>({ default: true });
</script>

<template>
  <Transition name="cumquat-fade">
    <span v-if="visible" class="cumquat-tag" :class="`cumquat-tag--${type}`">
      <slot />
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-tag__close"
        @click="visible = false"
      >
        <svg
          class="cumquat-tag__close-icon"
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
