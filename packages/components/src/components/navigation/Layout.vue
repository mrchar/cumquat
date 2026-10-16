<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 布局主轴方向 */
    direction?: 'vertical' | 'horizontal';
  }>(),
  { direction: 'vertical' },
);
</script>

<template>
  <div
    class="cumquat-layout"
    :class="direction === 'vertical' ? 'cumquat-layout--vertical' : 'cumquat-layout--horizontal'"
  >
    <slot />
  </div>
</template>
