<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 距视口顶部吸附距离（px） */
    top?: number;
    /** 距视口左侧吸附距离（px） */
    left?: number;
  }>(),
  { top: 0, left: 0 },
);
</script>

<template>
  <div class="cumquat-affix" :style="{ position: 'sticky', top: `${top}px`, left: `${left}px` }">
    <slot />
  </div>
</template>
