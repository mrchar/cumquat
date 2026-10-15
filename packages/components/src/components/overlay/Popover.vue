<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: '' },
);

const open = ref(false);

function close() {
  open.value = false;
}

defineExpose({ close });
</script>

<template>
  <span class="cumquat-popover relative inline-block">
    <span class="cumquat-popover__trigger inline-flex" @click="open = !open">
      <slot name="trigger" />
    </span>
    <Transition name="cumquat-fade">
      <div
        v-if="open"
        class="cumquat-popover__content absolute left-1/2 bottom-full z-20 mb-2 w-64 -translate-x-1/2 rounded-cumquat border border-cumquat-border bg-cumquat-surface p-4 text-sm shadow-cumquat-overlay"
      >
        <span
          class="cumquat-popover__arrow absolute left-1/2 -bottom-1.5 size-3 -translate-x-1/2 rotate-45 border-r border-b border-cumquat-border bg-cumquat-surface"
        />
        <h4 v-if="title" class="cumquat-popover__title mb-1.5 font-semibold text-cumquat-text">
          {{ title }}
        </h4>
        <div class="cumquat-popover__body text-cumquat-text-muted">
          <slot />
        </div>
        <div v-if="$slots.footer" class="cumquat-popover__footer mt-3 flex justify-end gap-2">
          <slot name="footer" :close="close" />
        </div>
      </div>
    </Transition>
  </span>
</template>
