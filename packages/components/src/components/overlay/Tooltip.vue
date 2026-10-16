<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  content?: string;
  /** 气泡出现位置 */
  placement?: 'top' | 'bottom';
}>();

const open = ref(false);
</script>

<template>
  <span class="cumquat-tooltip" @mouseenter="open = true" @mouseleave="open = false">
    <slot />
    <Transition name="cumquat-fade">
      <span
        v-if="open"
        role="tooltip"
        class="cumquat-tooltip__content"
        :class="`cumquat-tooltip__content--${placement ?? 'top'}`"
      >
        <slot name="content">{{ content }}</slot>
      </span>
    </Transition>
  </span>
</template>
