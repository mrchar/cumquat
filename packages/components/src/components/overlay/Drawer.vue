<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    closable?: boolean;
  }>(),
  { title: '', closable: true },
);

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <Teleport to="body">
    <Transition name="cumquat-fade">
      <div v-if="open" class="cumquat-drawer fixed inset-0 z-50">
        <div class="cumquat-drawer__mask absolute inset-0 bg-black/40" @click="open = false" />
        <aside
          role="dialog"
          aria-modal="true"
          class="cumquat-drawer__panel absolute inset-y-0 right-0 flex w-80 max-w-full flex-col border-l border-cumquat-border bg-cumquat-surface shadow-cumquat-overlay"
        >
          <header
            v-if="title || closable"
            class="cumquat-drawer__header flex items-center justify-between border-b border-cumquat-border px-5 py-4"
          >
            <h3 class="text-base font-semibold text-cumquat-text">{{ title }}</h3>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-drawer__close cursor-pointer text-cumquat-text-muted transition-colors hover:text-cumquat-text"
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
          <div
            class="cumquat-drawer__body flex-1 overflow-y-auto px-5 py-4 text-sm text-cumquat-text"
          >
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="cumquat-drawer__footer flex justify-end gap-3 border-t border-cumquat-border px-5 py-4"
          >
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
