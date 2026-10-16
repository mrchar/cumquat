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
</script>

<template>
  <Transition name="cumquat-fade">
    <div v-if="visible" role="status" class="cumquat-notification">
      <div class="cumquat-notification__inner">
        <span class="cumquat-notification__dot" :class="`cumquat-notification__dot--${type}`" />
        <div class="cumquat-notification__body">
          <p v-if="title" class="cumquat-notification__title">
            {{ title }}
          </p>
          <div class="cumquat-notification__content">
            <slot />
          </div>
        </div>
        <button
          v-if="closable"
          type="button"
          aria-label="关闭"
          class="cumquat-notification__close"
          @click="visible = false"
        >
          <svg
            class="cumquat-notification__close-icon"
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
