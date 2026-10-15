<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  content?: string;
  /** 气泡出现位置 */
  placement?: 'top' | 'bottom';
}>();

const open = ref(false);

const placementClass: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
};
</script>

<template>
  <span
    class="cumquat-tooltip relative inline-flex"
    @mouseenter="open = true"
    @mouseleave="open = false"
  >
    <slot />
    <Transition name="cumquat-fade">
      <span
        v-if="open"
        role="tooltip"
        class="cumquat-tooltip__content pointer-events-none absolute z-20 whitespace-nowrap rounded-md bg-cumquat-text px-2.5 py-1.5 text-xs text-cumquat-text-inverse shadow-cumquat-overlay"
        :class="placementClass[placement ?? 'top']"
      >
        <slot name="content">{{ content }}</slot>
      </span>
    </Transition>
  </span>
</template>
