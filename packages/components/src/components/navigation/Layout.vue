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
    class="cumquat-layout w-full"
    :class="direction === 'vertical' ? 'flex flex-col' : 'flex flex-row'"
  >
    <slot />
  </div>
</template>
