<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 水印文字 */
    content: string;
    /** 旋转角度（deg） */
    rotate?: number;
    /** 平铺间隔（px） */
    gap?: number;
  }>(),
  { rotate: -22, gap: 96 },
);
</script>

<template>
  <div
    class="cumquat-watermark pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
    aria-hidden="true"
  >
    <div
      class="cumquat-watermark__grid absolute -inset-16 flex flex-wrap content-center"
      :style="{ gap: `${gap}px`, transform: `rotate(${rotate}deg)` }"
    >
      <span
        v-for="i in 24"
        :key="i"
        class="cumquat-watermark__item text-sm whitespace-nowrap text-cumquat-text/8"
      >
        {{ content }}
      </span>
    </div>
  </div>
</template>
