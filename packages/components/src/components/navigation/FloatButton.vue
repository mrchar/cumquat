<script setup lang="ts">
import { ref } from 'vue';

export interface FloatAction {
  key: string;
  label: string;
}

withDefaults(
  defineProps<{
    actions?: FloatAction[];
  }>(),
  { actions: () => [] },
);

const open = ref(false);

const emit = defineEmits<{
  select: [key: string];
}>();

function select(key: string) {
  emit('select', key);
  open.value = false;
}
</script>

<template>
  <div class="cumquat-float-button fixed right-6 bottom-6 z-40 flex flex-col items-center gap-2.5">
    <Transition name="cumquat-fade">
      <div
        v-if="open && actions.length > 0"
        class="cumquat-float-button__actions flex flex-col items-center gap-2.5"
      >
        <button
          v-for="action in actions"
          :key="action.key"
          type="button"
          class="cumquat-float-button__action flex size-10 cursor-pointer items-center justify-center rounded-full border border-cumquat-border bg-cumquat-surface text-xs text-cumquat-text shadow-cumquat-overlay transition-transform hover:scale-105"
          @click="select(action.key)"
        >
          {{ action.label }}
        </button>
      </div>
    </Transition>

    <button
      type="button"
      :aria-expanded="open"
      aria-label="展开操作"
      class="cumquat-float-button__trigger flex size-12 cursor-pointer items-center justify-center rounded-full bg-cumquat-accent text-cumquat-text-inverse shadow-cumquat-overlay transition-colors hover:bg-cumquat-accent-hover"
      @click="open = !open"
    >
      <svg
        class="size-5 transition-transform"
        :class="open ? 'rotate-45' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</template>
