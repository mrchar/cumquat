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
  <div class="cumquat-watermark" aria-hidden="true">
    <div
      class="cumquat-watermark__grid"
      :style="{ gap: `${gap}px`, transform: `rotate(${rotate}deg)` }"
    >
      <span v-for="i in 24" :key="i" class="cumquat-watermark__item">
        {{ content }}
      </span>
    </div>
  </div>
</template>
