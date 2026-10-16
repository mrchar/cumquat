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
      <div v-if="open" class="cumquat-drawer">
        <div class="cumquat-drawer__mask" @click="open = false" />
        <aside role="dialog" aria-modal="true" class="cumquat-drawer__panel">
          <header v-if="title || closable" class="cumquat-drawer__header">
            <h3 class="cumquat-drawer__title">{{ title }}</h3>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-drawer__close"
              @click="open = false"
            >
              <svg
                class="cumquat-drawer__close-icon"
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
          <div class="cumquat-drawer__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="cumquat-drawer__footer">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
