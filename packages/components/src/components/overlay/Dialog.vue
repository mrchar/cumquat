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
      <div
        v-if="open"
        class="cumquat-dialog fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="cumquat-dialog__mask absolute inset-0 bg-black/40" @click="open = false" />
        <div
          role="dialog"
          aria-modal="true"
          class="cumquat-dialog__panel relative flex max-h-[85vh] w-full flex-col rounded-cumquat border border-cumquat-border bg-cumquat-surface shadow-cumquat-overlay"
          :style="{ maxWidth: width }"
        >
          <header
            v-if="title || closable || $slots.title"
            class="cumquat-dialog__header flex items-center justify-between border-b border-cumquat-border px-6 py-4"
          >
            <slot name="title">
              <h3 class="text-base font-semibold text-cumquat-text">{{ title }}</h3>
            </slot>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-dialog__close cursor-pointer text-cumquat-text-muted transition-colors hover:text-cumquat-text"
              @click="open = false"
            >
              <svg
                class="size-5"
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

          <div class="cumquat-dialog__body overflow-y-auto px-6 py-4 text-sm text-cumquat-text">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="cumquat-dialog__footer flex justify-end gap-3 border-t border-cumquat-border px-6 py-4"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
