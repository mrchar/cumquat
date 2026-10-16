<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    width?: string;
    closable?: boolean;
  }>(),
  { title: '', width: '32rem', closable: true },
);

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <Teleport to="body">
    <Transition name="cumquat-fade">
      <div v-if="open" class="cumquat-dialog">
        <div class="cumquat-dialog__mask" @click="open = false" />
        <div
          role="dialog"
          aria-modal="true"
          class="cumquat-dialog__panel"
          :style="{ maxWidth: width }"
        >
          <header v-if="title || closable || $slots.title" class="cumquat-dialog__header">
            <slot name="title">
              <h3 class="cumquat-dialog__title">{{ title }}</h3>
            </slot>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-dialog__close"
              @click="open = false"
            >
              <svg
                class="cumquat-dialog__close-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="cumquat-dialog__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="cumquat-dialog__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
